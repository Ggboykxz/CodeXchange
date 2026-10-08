import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { AUTH_POLICY, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/auth";
import { newsletterSchema } from "@/lib/validate";
import { nlDigest, nlToken, unsubscribeUrl } from "@/lib/newsletter";
import { sendNewsletterWelcomeEmail } from "@/lib/mailer";

/**
 * POST /api/newsletter — abonnement au digest mensuel (I5).
 *
 * La réponse est **la même** dans tous les cas de succès (`200 { ok }`) :
 * nouveau, déjà abonné, ou réabonnement après désinscription — ni le
 * formulaire ni un bot ne peuvent sonder une liste d'adresses. Le
 * jeton de désinscription est dérivé de l'e-mail, jamais renvoyé ici.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const limited = rateLimit(
      `newsletter:${clientIp(req)}`,
      AUTH_POLICY.limit,
      AUTH_POLICY.windowMs
    );
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const { email } = parsed.data;
    const tokenHash = nlDigest(nlToken(email));

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true, unsubscribedAt: true },
    });

    if (existing) {
      // Réabonnement : on rouvre l'abonnement, on garde le même jeton.
      if (existing.unsubscribedAt) {
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { unsubscribedAt: null },
        });
      }
      return NextResponse.json({ ok: true });
    }

    try {
      await db.newsletterSubscriber.create({ data: { email, tokenHash } });
    } catch (e) {
      // Course possible (deux POST simultanés) : l'un des deux crée,
      // l'autre retombe ici — réponse identique, pas d'erreur.
      if ((e as { code?: string })?.code !== "P2002") throw e;
      return NextResponse.json({ ok: true });
    }

    // Confirmation + lien de désinscription, jamais bloquante (régime
    // aperçu en dev/CI, envoi réel dès que SMTP est posé — I4).
    void sendNewsletterWelcomeEmail({
      email,
      unsubscribeUrl: unsubscribeUrl(req.nextUrl.origin, nlToken(email)),
    }).catch(() => undefined);

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Newsletter subscribe error", e);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }
}
