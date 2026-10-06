/**
 * Rate limiting — fenêtre glissante en mémoire.
 *
 * Suffisant pour une instance unique (hackathon / beta). Pour scaler horizontalement,
 * brancher Redis (Upstash) ici sans changer les appelsants : l'interface reste la même.
 */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/** Purge périodique pour éviter une croissance non bornée de la Map. */
let lastSweep = Date.now();
function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

/**
 * @param key    identifiant du sujet (IP, email, user…)
 * @param limit  requêtes autorisées
 * @param windowMs fenêtre en ms
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  sweep(windowMs);
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]!;
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSec: 0 };
}

/** Efface l'historique d'une clé — utile après un login réussi. */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Deux politiques distinctes sur l'auth :
 *  - par IP : anti-bruteforce distribué sur plusieurs comptes ;
 *  - par email : anti-ciblage d'un seul compte depuis plusieurs IP.
 */
export const AUTH_POLICY = { limit: 10, windowMs: 60_000 } as const;
export const AUTH_EMAIL_POLICY = { limit: 5, windowMs: 5 * 60_000 } as const;
export const WRITE_POLICY = { limit: 30, windowMs: 60_000 } as const;
