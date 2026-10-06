/**
 * Authentification CodeXchange — sessions serveur.
 *
 * Modèle mental :
 *   1. au login on génère un jeton aléatoire (32 octets) ;
 *   2. seul son SHA-256 est persisté (`Session.tokenHash`, unique) ;
 *   3. le jeton brut part dans un cookie `httpOnly` — **jamais** dans le body JSON ;
 *   4. `getSessionUser()` re-hache le cookie et fait un lookup exact.
 *
 * Conséquence : une session est révocable côté serveur. Supprimer la ligne
 * `Session` invalide le cookie instantanément (logout, révocation, expiration).
 *
 * Précédemment, `/api/auth/me` ne testait que la *présence* du cookie et
 * renvoyait un utilisateur en dur : n'importe quelle valeur donnait accès au
 * compte démo — avec son `passwordHash`.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { authUserSelect, type AuthUser } from "@/lib/selects";
import { burnPasswordTime, hashPassword, sha256, verifyPassword } from "@/lib/password";

// Ré-export : les routes importent tout depuis `@/lib/auth`.
export { burnPasswordTime, hashPassword, verifyPassword, sha256 };

export const SESSION_COOKIE = "cx_session";
export const SESSION_TTL_MS = 60 * 60 * 24 * 30; // 30 jours
export const SESSION_TTL_S = SESSION_TTL_MS / 1000;

/** Un jeton est toujours 32 octets hexadécimaux. */
const TOKEN_RE = /^[0-9a-f]{64}$/i;

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

/** Crée une session et retourne le jeton **brut** à mettre dans le cookie. */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {}
): Promise<string> {
  const jwt = randomBytes(32).toString("hex");
  await db.session.create({
    data: {
      tokenHash: sha256(jwt),
      userId,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ip: meta.ip ?? null,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return jwt;
}

/** Résout le jeton brut en utilisateur courant, ou `null`. */
export async function getSessionUser(token: string | undefined): Promise<AuthUser | null> {
  if (!token || !TOKEN_RE.test(token)) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: authUserSelect } },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

/** Supprime la session associée au jeton (logout). Idempotent. */
export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token || !TOKEN_RE.test(token)) return;
  await db.session
    .deleteMany({ where: { tokenHash: sha256(token) } })
    .catch(() => undefined);
}

/** Supprime toutes les sessions d'un utilisateur. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } }).catch(() => undefined);
}

/** Purge les sessions expirées — appelée au login. */
export async function pruneExpiredSessions(): Promise<void> {
  await db.session
    .deleteMany({ where: { expiresAt: { lte: new Date() } } })
    .catch(() => undefined);
}

/* ------------------------------------------------------------------ */
/* Helpers request/response                                           */
/* ------------------------------------------------------------------ */

/** Utilisateur courant déduit des cookies de la requête. */
export async function currentUser(req: NextRequest): Promise<AuthUser | null> {
  return getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
}

/**
 * Pose le cookie de session : `httpOnly`, `sameSite=lax`, `path=/`, et `secure`
 * piloté par `COOKIE_SECURE` (à `true` derrière Caddy/HTTPS).
 */
export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: SESSION_TTL_S,
    path: "/",
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 0,
    path: "/",
  });
}

/** IP cliente, en tenant compte des proxys de confiance. */
export function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip");
}

/** 401 normalisé pour les endpoints protégés. */
export function unauthorized(message = "Authentication required"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}
