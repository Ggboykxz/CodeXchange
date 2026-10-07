import { NextResponse } from "next/server";

/**
 * API response helpers.
 *
 * Public payloads must never leak credentials: `passwordHash` is always
 * stripped, and `email` is only kept on the authenticated user's own
 * endpoints (`/api/auth/*`).
 */

const SENSITIVE_KEYS = new Set(["passwordHash"]);

function sanitize(value: unknown, keepEmail: boolean): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitize(item, keepEmail));
  if (value instanceof Date) return value;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      if (key === "email" && !keepEmail) continue;
      out[key] = sanitize(val, keepEmail);
    }
    return out;
  }
  return value;
}

/** Public JSON response — strips `passwordHash` and every `email`. */
export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(sanitize(data, false), init);
}

/** Auth JSON response — strips `passwordHash` but keeps the user's `email`. */
export function authJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(sanitize(data, true), init);
}

/**
 * 400 — `details` reprend `zod.flatten().fieldErrors` : le client sait
 * quel champ corrigé, sans jamais recevoir le payload complet rejeté.
 */
export function badRequest(error: string, details?: unknown) {
  return NextResponse.json(details === undefined ? { error } : { error, details }, {
    status: 400,
  });
}

/** 429 — `Retry-After` obligatoire, sinon le client réessaie en boucle. */
export function rateLimited(error: string, retryAfterSec: number) {
  return NextResponse.json(
    { error },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
  );
}
