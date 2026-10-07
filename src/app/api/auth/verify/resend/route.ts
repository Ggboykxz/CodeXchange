import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, AUTH_EMAIL_POLICY } from "@/lib/rate-limit";
import { verifyResendSchema } from "@/lib/validate";
import { clientIp, currentUser } from "@/lib/auth";
import {
  exposesVerificationLink,
  issueVerificationForEmail,
  verificationUrl,
} from "@/lib/verify";

/**
 * POST /api/auth/verify/resend — réémet un lien de vérification.
 *
 * Le jeton précédent est écrasé : un seul lien valide à la fois, donc
 * l'ancien cesse de fonctionner dès qu'on en demande un autre.
 *
 * **Toujours `200 { sent: true }`**, que l'adresse existe ou non. Répondre
 * « adresse inconnue » permettrait de sonder quelqu'un possède un compte
 * sur la plateforme — c'est le piège que le login évite déjà avec son
 * hash factice. L'appelant connecté n'a pas besoin de passer `email`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = verifyResendSchema.safeParse(body);

    let email: string | undefined = parsed.success ? parsed.data.email : undefined;
    if (!email) {
      const user = await currentUser(req);
      email = user?.email;
    }

    // Sans adresse : on répond comme si le mail était parti, sinon
    // « pas connecté » deviendrait un signal d'existence de compte.
    if (!email) {
      return NextResponse.json({ sent: true });
    }

    const ip = clientIp(req) ?? "unknown";
    const limited = rateLimit(
      `verify:email:${email}`,
      AUTH_EMAIL_POLICY.limit,
      AUTH_EMAIL_POLICY.windowMs
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests for this address. Please retry later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }
    const byIp = rateLimit(`verify:ip:${ip}`, 10, 60_000);
    if (!byIp.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please retry later." },
        { status: 429, headers: { "Retry-After": String(byIp.retryAfterSec) } }
      );
    }

    const token = await issueVerificationForEmail(email);
    if (token && exposesVerificationLink()) {
      // Pas d'envoi d'e-mail dans le projet (B7) : en dev, le lien part
      // dans le journal du serveur.
      console.info(`[verify] ${email} → ${verificationUrl(token)}`);
    }

    return NextResponse.json({ sent: true });
  } catch (e) {
    logger.route("Verify resend error", e);
    return NextResponse.json({ error: "Failed to resend link" }, { status: 500 });
  }
}
