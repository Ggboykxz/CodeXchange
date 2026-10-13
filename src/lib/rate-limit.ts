/**
 * Rate-limiting en mémoire (fenêtre glissante simple).
 *
 * Suffisant pour la démo et les petits trafics. Pour la production, utiliser
 * Redis/Upstash. La clé est fournie par l'appelant (ex. `login:<email>`).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Vide toutes les clés (utilisé par les tests). */
export function resetRateLimits(): void {
  buckets.clear();
}
