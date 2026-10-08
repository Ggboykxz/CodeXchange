import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, AUTH_EMAIL_POLICY } from "@/lib/rate-limit";
import { verifyResendSchema } from "@/lib/validate";
import { clientIp, currentUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";
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

    // Renvoi UNIQUEMENT vers la propre adresse du appelant connecté. Un
    // e-mail fourni dans le body sans session (ou pour un autre compte)
    // est ignoré : sinon l'endpoint servait à bombarder une boîte tierce
    // depuis un domaine de confiance ET à invalider le lien de
    // vérification en cours de la victime. Réponse identique dans les
    // deux cas (`sent: true`), pour ne pas révéler si un mail est parti.
    const user = await currentUser(req);
    const bodyEmail = parsed.success ? parsed.data.email : undefined;
    const email = user && (!bodyEmail || bodyEmail === user.email) ? user.email : undefined;

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

    const issued = await issueVerificationForEmail(email);
    if (issued) {
      const url = verificationUrl(issued.token);
      if (exposesVerificationLink()) {
        // En dev, le lien part aussi dans le journal du serveur pour
        // éviter d'ouvrir la boîte à chaque test.
        console.info(`[verify] ${email} → ${url}`);
      }
      // En production c'est l'e-mail qui porte le lien : c'est lui qui
      // prouve la possession de la boîte. L'envoi ne bloque pas la
      // réponse (`sent: true` reste identique quelle que soit l'adresse).
      void sendVerificationEmail({
        name: issued.name,
        email,
        verifyUrl: url,
      }).catch((e) => logger.route("Verify email error", e, { email }));
    }

    return NextResponse.json({ sent: true });
  } catch (e) {
    logger.route("Verify resend error", e);
    return NextResponse.json({ error: "Failed to resend link" }, { status: 500 });
  }
}
