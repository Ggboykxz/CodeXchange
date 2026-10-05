import crypto from "crypto";

/**
 * Stateless session tokens: `<uid>.<expiry>.<hmac>`.
 *
 * The signature is keyed with SESSION_SECRET so a token issued on one
 * instance cannot be forged or replayed past its expiry.
 */

const DEFAULT_SECRET = "codexchange-dev-secret";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createSessionToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiresAt, signature] = parts;
  const payload = `${userId}.${expiresAt}`;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  if (Number(expiresAt) * 1000 < Date.now()) return null;
  return userId;
}

/**
 * Author id for a write request, taken from the session cookie.
 * Returns `null` when the caller is anonymous, so routes can 401 instead of
 * trusting an `authorId` supplied in the request body.
 */
export function sessionUserId(req: { cookies: { get(name: string): { value?: string } | undefined } }): string | null {
  return verifySessionToken(req.cookies.get("cx_session")?.value);
}

