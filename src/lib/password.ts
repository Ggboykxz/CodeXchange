/**
 * Mots de passe et digests — module pur, sans dépendance Next.js,
 * pour être réutilisable par `scripts/seed.ts` autant que par les routes.
 *
 * Format stocké : `sel_hex:hash_hex`, PBKDF2-SHA512, 100k itérations.
 */
import { createHash, pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";

/** Hash SHA-256 en hex — utilisé pour les jetons de session (jamais stocker le brut). */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Hash **asynchrone** : `pbkdf2Sync` bloquait l'event loop (~80 ms/requête),
 * ce qui transformait `/api/auth/login` en vecteur de DoS CPU.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await pbkdf2Async(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
  return `${salt}:${derived.toString("hex")}`;
}

/** Vérification constant-time ; `false` sur format invalide plutôt qu'une exception. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;

  const expectedBuf = Buffer.from(expected, "hex");
  if (expectedBuf.length !== PBKDF2_KEYLEN) return false;

  const derived = await pbkdf2Async(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
  return timingSafeEqual(derived, expectedBuf);
}

/**
 * Exécute un PBKDF2 « factice » sur un compte inexistant : sans ça, un email
 * inconnu répond ~80 ms plus vite qu'un email valide et devient détectable
 * par mesure de temps.
 */
export async function burnPasswordTime(password: string): Promise<void> {
  await pbkdf2Async(
    password,
    "0000000000000000",
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
}
