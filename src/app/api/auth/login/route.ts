import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  AUTH_EMAIL_POLICY,
  rateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validate";
import { authUserSelect } from "@/lib/selects";
import {
  burnPasswordTime,
  clientIp,
  createSession,
  pruneExpiredSessions,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials payload", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password } = parsed.data;

    // Limite par email en plus de la limite par IP du proxy : bloque le
    // ciblage d'un seul compte depuis un botnet.
    const emailKey = `login:email:${email}`;
    const limited = rateLimit(emailKey, AUTH_EMAIL_POLICY.limit, AUTH_EMAIL_POLICY.windowMs);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts for this account. Please retry later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user?.passwordHash) {
      // Égalise le temps de réponse : sinon un email inconnu répond ~80 ms
      // plus vite qu'un email valide et devient détectable.
      await burnPasswordTime(password);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Connexion réussie : on repart d'une pile de sessions propre.
    resetRateLimit(emailKey);
    await pruneExpiredSessions();

    const token = await createSession(user.id, {
      userAgent: req.headers.get("user-agent"),
      ip: clientIp(req),
    });

    const response = NextResponse.json({
      user: await db.user.findUnique({
        where: { id: user.id },
        select: authUserSelect,
      }),
    });
    setSessionCookie(response, token);
    return response;
  } catch (e) {
    logger.route("Login error", e);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
