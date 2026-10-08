import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, unauthorized } from "@/lib/auth";
import { getProvider } from "@/lib/payments/mock";
import { logger } from "@/lib/log";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/[id]/confirm — vérifie auprès du provider si le
 * paiement a été confirmé (mock : after 3 s) et met à jour la
 * transaction. Le client appelle cette route après avoir affiché les
 * instructions de paiement.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const user = await currentUser(req);
    if (!user) return unauthorized();

    const { id } = await params;
    const tx = await db.transaction.findUnique({ where: { id } });
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    if (tx.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (tx.status !== "pending") {
      // Idempotent : retourne l'état actuel sans re-vérifier.
      return NextResponse.json({ status: tx.status });
    }

    const provider = getProvider(tx.provider);
    if (!provider) {
      return NextResponse.json({ error: "Provider not available" }, { status: 500 });
    }

    let status: string;
    if (tx.provider === "mock") {
      // Le mock provider est serverless-incompatible (Map en mémoire
      // perdue à chaque invocation). On simule ici directement :
      // le paiement est confirmé après 3 secondes.
      const ageMs = Date.now() - tx.createdAt.getTime();
      status = ageMs > 3000 ? "completed" : "pending";
    } else {
      status = await provider.verify(tx.providerTxId ?? "");
    }

    if (status !== "pending") {
      await db.transaction.update({
        where: { id: tx.id },
        data: { status },
      });
    }

    return NextResponse.json({ status });
  } catch (e) {
    logger.route("Confirm payment error", e);
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
