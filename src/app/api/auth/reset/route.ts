import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { resetSchema } from "@/lib/validate";
import { completePasswordReset } from "@/lib/reset";
import { AUTH_POLICY, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/auth";

/**
 * POST /api/auth/reset — confirme la réinitialisation (B7).
 *
 * Le jeton est à usage unique : `completePasswordReset` le
 * purge et révoque toutes les sessions du compte (un changement
 * de mot de passe déconnecte partout, au cas où le compte
 * aurait été compromis).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid reset payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { token, password } = parsed.data;

    // Le reset forçait un PBKDF2 (100k) + un UPDATE + une révocation de
    // sessions par appel, sans aucune limite : chaque tentative coûte du
    // CPU serveur et les codes 400/410 révélaient l'état du jeton. On
    // limite par IP — même politique que le login/forgot/resend.
    const limited = rateLimit(
      `reset:ip:${clientIp(req) ?? "unknown"}`,
      AUTH_POLICY.limit,
      AUTH_POLICY.windowMs
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please retry later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const outcome = await completePasswordReset(token, password);
    if (outcome === "invalid") {
      return NextResponse.json(
        { error: "Invalid or already-used reset link" },
        { status: 400 }
      );
    }
    if (outcome === "expired") {
      return NextResponse.json(
        { error: "Reset link expired. Request a new one." },
        { status: 410 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.route("Reset password error", e);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
