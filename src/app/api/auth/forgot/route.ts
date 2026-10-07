import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/auth";
import { AUTH_EMAIL_POLICY, AUTH_POLICY, rateLimit } from "@/lib/rate-limit";
import { forgotSchema } from "@/lib/validate";
import {
  issuePasswordResetForEmail,
  passwordResetUrl,
} from "@/lib/reset";
import { sendPasswordResetEmail } from "@/lib/mailer";

/**
 * POST /api/auth/forgot — demande de réinitialisation (B7).
 *
 * Répond **toujours** 200 avec le même message, que l'adresse
 * existe ou non : un écart de réponse permettrait d'énumérer
 * les comptes. Le jeton n'est émis (et l'e-mail envoyé) que
 * si le compte existe.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid forgot-password payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { email } = parsed.data;

    // Double limite : par IP (botnet) et par email (ciblage).
    const ip = clientIp(req) ?? "unknown";
    const byIp = rateLimit(`forgot:ip:${ip}`, AUTH_POLICY.limit, AUTH_POLICY.windowMs);
    const byEmail = rateLimit(`forgot:email:${email}`, AUTH_EMAIL_POLICY.limit, AUTH_EMAIL_POLICY.windowMs);
    if (!byIp.ok || !byEmail.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please retry later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              (byIp.ok ? byEmail : byIp).retryAfterSec
            ),
          },
        }
      );
    }

    const issued = await issuePasswordResetForEmail(email);
    if (issued) {
      // L'envoi ne bloque pas la réponse ; un échec SMTP est
      // journalisé mais ne fait pas échouer la requête.
      void sendPasswordResetEmail({
        name: issued.name,
        email,
        resetUrl: passwordResetUrl(issued.token),
      }).catch((e) =>
        logger.route("Reset email error", e, { email })
      );
    }

    return NextResponse.json({
      ok: true,
      message: "If an account matches this address, a reset link was sent.",
    });
  } catch (e) {
    logger.route("Forgot password error", e);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
