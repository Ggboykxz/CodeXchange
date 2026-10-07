import { sha256 } from "@/lib/password";

/**
 * Digests salés — une seule source de vérité pour le sel serveur.
 *
 * `SESSION_SECRET` sert ici à deux usages distincts : il ne peut donc pas
 * rester en dur dans `auth.ts`. On garde la sortie de `sessionDigest`
 * strictement identique à avant (`sha256(SECRET:jeton)`) — changer
 * d'implémentation invaliderait les sessions en base pour rien.
 *
 * Le préfixe de portée (`verify:`) empêche qu'un jeton émis dans un
 * contexte en soit valable dans l'autre : même si un jeton de
 * vérification fuitait dans une table de sessions, il ne s'y
 * retrouverait jamais (préimage différente).
 */
const SECRET = process.env.SESSION_SECRET || "codexchange-dev-session-secret";

/** Jeton de session (cookie `cx_session`) → `Session.tokenHash`. */
export function sessionDigest(token: string): string {
  return sha256(`${SECRET}:${token}`);
}

/** Jeton de vérification d'e-mail → `User.verificationTokenHash`. */
export function verificationDigest(token: string): string {
  return sha256(`${SECRET}:verify:${token}`);
}

/** Jeton de réinitialisation de mot de passe → `User.resetTokenHash`. */
export function resetDigest(token: string): string {
  return sha256(`${SECRET}:reset:${token}`);
}
