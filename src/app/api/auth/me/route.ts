import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  currentUser,
  revokeSession,
} from "@/lib/auth";

/**
 * Session courante.
 *
 * Historiquement ce handler ne faisait que tester la *présence* du cookie et
 * renvoyait toujours le même utilisateur en dur — n'importe quelle valeur de
 * cookie donnait l'accès au compte démo (avec son passwordHash).
 * Maintenant : lookup réel de la session par hash de jeton.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await currentUser(req);
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({ user });
  } catch (e) {
    logger.route("Me error", e);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

/** Déconnexion : révoque la session *côté serveur* puis vide le cookie. */
export async function DELETE(req: NextRequest) {
  try {
    await revokeSession(req.cookies.get(SESSION_COOKIE)?.value);
  } catch (e) {
    logger.route("Logout error", e);
  }
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
