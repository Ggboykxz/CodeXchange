import { afterEach, describe, expect, it } from "vitest";
import { AUTH_POLICY, rateLimit, resetRateLimit } from "@/lib/rate-limit";

/**
 * La fenêtre glissante vit en mémoire (`src/lib/rate-limit.ts`). Chaque
 * test part d'une clé unique : le store est global, et les suites ne
 * doivent pas pouvoir se brouiller entre elles ni avec une exécution
 * parallèle.
 */
const clés: string[] = [];
const unique = (prefix: string) => {
  const k = `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  clés.push(k);
  return k;
};

afterEach(() => {
  for (const k of clés) resetRateLimit(k);
  clés.length = 0;
});

describe("rateLimit", () => {
  it("laisse passer `limit` appels puis bloque avec Retry-After", () => {
    const key = unique("rl");
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      expect(rateLimit(key, limit, 60_000).ok).toBe(true);
    }
    const bloqué = rateLimit(key, limit, 60_000);
    expect(bloqué.ok).toBe(false);
    expect(bloqué.retryAfterSec).toBeGreaterThan(0);
    expect(bloqué.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("resetRateLimit remet le compteur à zéro (utilisé après un login réussi)", () => {
    const key = unique("reset");
    expect(rateLimit(key, 1, 60_000).ok).toBe(true);
    expect(rateLimit(key, 1, 60_000).ok).toBe(false);
    resetRateLimit(key);
    expect(rateLimit(key, 1, 60_000).ok).toBe(true);
  });

  it("ne mélange jamais deux clés — bloquer un IP ne bloque pas les autres", () => {
    const a = unique("ip-a");
    const b = unique("ip-b");
    expect(rateLimit(a, 1, 60_000).ok).toBe(true);
    expect(rateLimit(a, 1, 60_000).ok).toBe(false);
    expect(rateLimit(b, 1, 60_000).ok).toBe(true);
  });

  it("expire à la fin de la fenêtre (fenêtre glissante, pas un compteur permanent)", async () => {
    const key = unique("fenetre");
    expect(rateLimit(key, 1, 30).ok).toBe(true);
    expect(rateLimit(key, 1, 30).ok).toBe(false);
    await new Promise((r) => setTimeout(r, 45));
    expect(rateLimit(key, 1, 30).ok).toBe(true);
  });

  it("bloque aussi à la limite exacte, sans off-by-one", () => {
    const key = unique("offbyone");
    const limit = 5;
    let passés = 0;
    for (let i = 0; i < limit + 2; i++) {
      if (rateLimit(key, limit, 60_000).ok) passés++;
    }
    expect(passés).toBe(limit);
  });
});

describe("politique d'authentification", () => {
  it("est publiée et raisonnable (une volée de mots de passe reste bornée)", () => {
    expect(AUTH_POLICY.limit).toBeGreaterThan(0);
    expect(AUTH_POLICY.windowMs).toBeGreaterThan(0);
    // 10 tentatives par minute puis 429 : un brute-force sur un compte
    // aurait 600 essais/heure au lieu de milliers.
    expect(AUTH_POLICY.limit).toBeLessThanOrEqual(20);
  });
});
