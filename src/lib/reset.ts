import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { resetDigest } from "@/lib/digest";
import { absoluteUrl } from "@/lib/site";
import { hashPassword } from "@/lib/password";
import { revokeAllSessions } from "@/lib/auth";

/**
 * Réinitialisation du mot de passe (B7) — même régime que la
 * vérification d'e-mail (B1), mais avec deux différences de
 * sécurité :
 *
 *  • le jeton **est** purgé à la consommation (un lien de reset
 *    est à usage unique, contrairement au lien de vérification
 *    qui reste idempotent) ;
 *  • la réussite **révoque toutes les sessions** : changer de
 *    mot de passe déconnecte partout, au cas où le compte
 *    aurait été compromis.
 */

/** Durée de validité du lien de réinitialisation : 30 minutes. */
export const RESET_TTL_MS = 30 * 60 * 1000;

const TOKEN_RE = /^[0-9a-f]{64}$/i;

export type ResetOutcome = "ok" | "expired" | "invalid";

/** Émet un jeton pour `userId`, en remplaçant le précédent. */
export async function issuePasswordReset(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.user.update({
    where: { id: userId },
    data: {
      resetTokenHash: resetDigest(token),
      resetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  return token;
}

/** URL à ouvrir pour choisir un nouveau mot de passe. */
export function passwordResetUrl(token: string): string {
  return `${absoluteUrl("/reset")}?token=${token}`;
}

/**
 * Valide un jeton brut. La forme est contrôlée **avant** tout
 * hash en base (un bot ne doit pas faire tourner sha256 sur des
 * chaînes arbitraires).
 */
export async function validateResetToken(
  token: string
): Promise<{ outcome: ResetOutcome; userId: string | null }> {
  if (!TOKEN_RE.test(token)) return { outcome: "invalid", userId: null };

  const user = await db.user.findUnique({
    where: { resetTokenHash: resetDigest(token) },
    select: { id: true, resetExpiresAt: true },
  });
  if (!user) return { outcome: "invalid", userId: null };

  if (user.resetExpiresAt && user.resetExpiresAt.getTime() <= Date.now()) {
    return { outcome: "expired", userId: user.id };
  }
  return { outcome: "ok", userId: user.id };
}

/**
 * Consomme le jeton : change le mot de passe, purge le jeton et
 * révoque les sessions. Renvoie `"invalid"` / `"expired"` sans
 * écrire si le jeton n'est pas usable.
 */
export async function completePasswordReset(
  token: string,
  newPassword: string
): Promise<ResetOutcome> {
  const { outcome, userId } = await validateResetToken(token);
  if (outcome !== "ok" || !userId) return outcome;

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetExpiresAt: null,
    },
  });
  await revokeAllSessions(userId);
  return "ok";
}

/**
 * Émet un lien si l'adresse existe, `null` sinon.
 *
 * L'appelant répond de façon **identique** dans les deux cas :
 * distinguer « adresse inconnue » rendrait possible l'énumération
 * des comptes (même piège que le login).
 *
 * Renvoie aussi le `name` du destinataire : l'e-mail de
 * réinitialisation l'utilise pour saluer.
 */
export async function issuePasswordResetForEmail(
  email: string
): Promise<{ token: string; name: string } | null> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (!user) return null;
  return { token: await issuePasswordReset(user.id), name: user.name };
}
