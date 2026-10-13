import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

/**
 * Session par cookie `cx_session` (spec) : jeton aléatoire de 32 octets stocké
 * en table `Session`, expiration à 14 jours, détruite à la déconnexion.
 * `getSessionUserId()` retourne `null` (jamais une exception) sans session,
 * avec un cookie forgé ou avec une session expirée — Review Focus n°2.
 */

const COOKIE_SESSION = "cx_session";
const DUREE_SESSION_JOURS = 14;

export async function createSession(userId: number): Promise<string> {
  const jeton = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DUREE_SESSION_JOURS * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { id: jeton, userId, expiresAt } });

  (await cookies()).set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return jeton;
}

export async function getSessionUserId(): Promise<number | null> {
  const jeton = (await cookies()).get(COOKIE_SESSION)?.value;
  if (!jeton) return null;

  const session = await prisma.session.findUnique({ where: { id: jeton } });
  if (!session) return null; // cookie forgé ou déjà détruit

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id: jeton } });
    return null;
  }

  return session.userId;
}

export async function destroySession(): Promise<void> {
  const stockage = await cookies();
  const jeton = stockage.get(COOKIE_SESSION)?.value;
  stockage.delete(COOKIE_SESSION);
  if (jeton) {
    await prisma.session.deleteMany({ where: { id: jeton } });
  }
}
