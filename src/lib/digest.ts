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
/**
 * Sel serveur commun (sessions, vérification d'e-mail, reset, newsletter).
 *
 * En production il est OBLIGATOIRE et long (>= 32 caractères) : le
 * fallback de dev est public, donc l'utiliser en prod rendrait chaque
 * digest calculable par n'importe qui — le « tourner le secret pour
 * révoquer toutes les sessions » n'aurait plus d'effet, et le jeton de
 * désinscription newsletter deviendrait forgeable. On échoue donc au
 * chargement du module (fail-closed) plutôt que de retomber en silence.
 */
function loadSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error(
      "SESSION_SECRET must be set to a value of at least 32 characters in production (see .env.example)"
    );
  }
  return secret && secret.length > 0 ? secret : "codexchange-dev-session-secret";
}

/** Sel partagé — réutilisé par `lib/newsletter.ts` (même base, portées distinctes). */
export const SERVER_SECRET = loadSecret();

const SECRET = SERVER_SECRET;

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
