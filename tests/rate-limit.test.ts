import { beforeEach, expect, test } from "vitest";
import { rateLimit, resetRateLimits } from "../src/lib/rate-limit";

beforeEach(() => resetRateLimits());

test("rateLimit autorise jusqu'à la limite puis bloque", () => {
  const key = "test:login";
  for (let i = 0; i < 5; i++) {
    expect(rateLimit(key, 5, 60_000).ok).toBe(true);
  }
  const bloque = rateLimit(key, 5, 60_000);
  expect(bloque.ok).toBe(false);
  expect(bloque.retryAfter).toBeGreaterThan(0);
  expect(bloque.retryAfter).toBeLessThanOrEqual(60);
});

test("rateLimit a distinctes par clé", () => {
  for (let i = 0; i < 5; i++) rateLimit("a", 5, 60_000);
  expect(rateLimit("a", 5, 60_000).ok).toBe(false);
  expect(rateLimit("b", 5, 60_000).ok).toBe(true);
});

test("rateLimit se réinitialise après la fenêtre", () => {
  const key = "test:reset";
  for (let i = 0; i < 3; i++) rateLimit(key, 3, 50);
  expect(rateLimit(key, 3, 50).ok).toBe(false);
  // Fenêtre écoulée (50 ms) — on attend 60 ms pour éviter les races.
  return new Promise((resolve) =>
    setTimeout(() => {
      expect(rateLimit(key, 3, 50).ok).toBe(true);
      resolve(undefined);
    }, 60),
  );
});

test("rateLimitAsync retombe sur la mémoire sans Redis", async () => {
  const { rateLimitAsync, resetRateLimits: reset } = await import("../src/lib/rate-limit");
  reset();
  const r1 = await rateLimitAsync("async:key", 2, 1000);
  const r2 = await rateLimitAsync("async:key", 2, 1000);
  const r3 = await rateLimitAsync("async:key", 2, 1000);
  expect(r1.ok).toBe(true);
  expect(r2.ok).toBe(true);
  expect(r3.ok).toBe(false);
});
