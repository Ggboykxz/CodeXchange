import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { db } from "@/lib/db";
import { nlDigest } from "@/lib/newsletter";

/**
 * GET /api/newsletter/unsubscribe?token=… — désinscription en un clic (I5).
 *
 * C'est un GET qui écrit : c'est la convention du « one-click
 * unsubscribe » (RFC 8058) — les clients e-mail et les filtres préfèrent
 * le lien cliquable à un formulaire. Le jeton (64 hex, dérivé du secret)
 * est la seule autorisation : il ne donne accès qu'à cette ligne, et
 * l'opération est idempotente.
 *
 * Réponses = redirections `/?nl=…` lues au montage de l'application
 * (toast, puis nettoyage de l'URL), comme pour OAuth.
 */
export async function GET(req: NextRequest) {
  const goto = (code: string): NextResponse => {
    const url = new URL("/", req.nextUrl.origin);
    url.searchParams.set("nl", code);
    return NextResponse.redirect(url, 302);
  };

  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return goto("error");

    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { tokenHash: nlDigest(token) },
      select: { id: true, unsubscribedAt: true },
    });
    if (!subscriber) return goto("error");

    if (!subscriber.unsubscribedAt) {
      await db.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { unsubscribedAt: new Date() },
      });
    }
    return goto("unsubscribed");
  } catch (e) {
    logger.route("Newsletter unsubscribe error", e);
    return goto("error");
  }
}
