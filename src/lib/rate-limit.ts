/**
 * Rate-limiting avec backend interchangeable.
 *
 * - **Mémoire** (défaut) : fonctionne partout, mais par instance — insuffisant
 *   si l'app tourne sur plusieurs conteneurs.
 * - **Redis distribué** : si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
 *   sont définis (Upstash gratuit), la limite devient globale via leur API REST
 *   (aucune dépendance npm).
 *
 * API principale : `rateLimitAsync` (async, choisit le backend).
 * `rateLimit` reste en version synchrone pour les appels simples (démo/tests).
 */

type Bucket = { count: number; resetAt: number };
type Result = { ok: boolean; retryAfter: number };

const buckets = new Map<string, Bucket>();

/** Limite en mémoire (fenêtre fixe) — repli et implémentation de tests. */
export function rateLimit(key: string, limit: number, windowMs: number): Result {
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

/** Vide toutes les clés mémoire (utilisé par les tests). */
export function resetRateLimits(): void {
  buckets.clear();
}

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
export const rateLimitDistribue = () => Boolean(UPSTASH_URL && UPSTASH_TOKEN);

/** Exécute un pipeline Redis via l'API REST Upstash. */
async function redisPipeline(commandes: Array<Array<string | number>>): Promise<Array<{ result: unknown }>> {
  const reponse = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commandes.map((commande) => [String(commande[0]), ...commande.slice(1).map(String)])),
  });
  if (!reponse.ok) throw new Error(`Redis ${reponse.status}`);
  return (await reponse.json()) as Array<{ result: unknown }>;
}

/**
 * Limite distribuée : `INCR` + `EXPIRE` dans un pipeline.
 * Sur erreur réseau, on retombe sur la mémoire (fail-open mesuré) pour ne
 * jamais bloquer un utilisateur légitime à cause d'un incident Redis.
 */
export async function rateLimitAsync(key: string, limit: number, windowMs: number): Promise<Result> {
  if (!rateLimitDistribue()) return rateLimit(key, limit, windowMs);

  const ttlSecondes = Math.max(1, Math.ceil(windowMs / 1000));
  try {
    const [incr, expire] = await redisPipeline([
      ["INCR", `ratelimit:${key}`],
      ["EXPIRE", `ratelimit:${key}`, ttlSecondes],
      ["TTL", `ratelimit:${key}`],
    ]);
    const compte = Number(incr.result ?? 0);
    const ttl = Number(expire.result ?? ttlSecondes);
    if (compte === 1) {
      await redisPipeline([["EXPIRE", `ratelimit:${key}`, ttlSecondes]]);
    }
    if (compte > limit) {
      return { ok: false, retryAfter: Math.max(1, ttl > 0 ? ttl : ttlSecondes) };
    }
    return { ok: true, retryAfter: 0 };
  } catch {
    return rateLimit(key, limit, windowMs);
  }
}

/** Raccourci : limite uniforme pour les endpoints d'écriture. */
export async function limiteEcriture(cle: string, max = 10): Promise<Result> {
  return rateLimitAsync(cle, max, 60 * 1000);
}
