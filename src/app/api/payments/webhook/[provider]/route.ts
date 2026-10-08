import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/log";

/**
 * POST /api/payments/webhook/[provider] — retour du prestataire (M3).
 *
 * SEULE voie de règlement fiable. La route `confirm` existe pour la démo
 * `mock` (sans prestataire réel) ; en production, c'est le prestataire qui
 * POSTe ici, avec une signature HMAC-SHA256 sur le corps BRUT. Sans secret
 * configuré (`<PROVIDER>_WEBHOOK_SECRET`), on refuse tout rappel.
 *
 * Propriétés :
 *  - signature vérifiée sur les octets bruts, comparée en temps constant ;
 *  - idempotent (on ne touche que les `pending`, par `providerTxId`) ;
 *  - le statut écrit est celui du prestataire, jamais un état auto-attesté.
 */
type Ctx = { params: Promise<{ provider: string }> };

function webhookSecret(provider: string): string | null {
  return process.env[`${provider.toUpperCase()}_WEBHOOK_SECRET`] || null;
}

function verifySignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Statut prestataire → statut persisté. Inconnu = échec (fail-closed). */
function mapStatus(s: string | undefined): "completed" | "failed" | "cancelled" {
  const v = (s ?? "").toUpperCase();
  if (v === "SUCCESS" || v === "COMPLETED" || v === "PAID") return "completed";
  if (v === "CANCELLED" || v === "CANCELED") return "cancelled";
  return "failed";
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { provider } = await params;

    const secret = webhookSecret(provider);
    if (!secret) {
      // Pas de secret pour ce prestataire (c'est le cas du `mock` en dev) :
      // on n'ouvre jamais un point d'entrée de règlement non authentifié.
      return NextResponse.json({ error: "Webhook not configured" }, { status: 404 });
    }

    // IMPORTANT : on signe les octets BRUTS, avant tout JSON.parse.
    const raw = await req.text();
    const sig = req.headers.get("x-signature") ?? req.headers.get("x-pay-signature");
    if (!verifySignature(raw, sig, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let body: { providerTxId?: unknown; status?: unknown };
    try {
      body = JSON.parse(raw) as { providerTxId?: unknown; status?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const providerTxId = typeof body.providerTxId === "string" ? body.providerTxId : null;
    if (!providerTxId) {
      return NextResponse.json({ error: "Missing providerTxId" }, { status: 400 });
    }

    const status = mapStatus(typeof body.status === "string" ? body.status : undefined);

    // Idempotent : ne règle que les transactions encore `pending` de CETTE
    // référence prestataire. Un double appel ne change rien.
    const result = await db.transaction.updateMany({
      where: { provider, providerTxId, status: "pending" },
      data: { status },
    });

    return NextResponse.json({ ok: true, updated: result.count });
  } catch (e) {
    logger.route("Payment webhook error", e);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
