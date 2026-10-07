import { logger } from "@/lib/log";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, AUTH_POLICY } from "@/lib/rate-limit";
import { verifySchema } from "@/lib/validate";
import { clientIp } from "@/lib/auth";
import { consumeVerification } from "@/lib/verify";

/**
 * POST /api/auth/verify — valide une adresse e-mail à partir du jeton du lien.
 *
 * Le jeton arrive du corps de la requête, jamais d'un identifiant client :
 * il **est** la preuve de possession de la boîte mail. Stocké hashé en base
 * (cf. `lib/digest.ts`), usage unique, expiré au bout de 24 h.
 *
 * Trois issues, trois codes : `200` validé, `410` lien périmé (on peut
 * demander un nouveau), `400` jeton inconnu ou déjà consommé. Les deux
 * derniers sont volontairement distincts : le détenteur du lien a besoin
 * de savoir s'il doit le redemander, et un jeton inconnu n'apprend rien
 * sur l'existence d'un compte.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req) ?? "unknown";
    const limited = rateLimit(`verify:${ip}`, AUTH_POLICY.limit, AUTH_POLICY.windowMs);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please retry later." },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
      );
    }

    const parsed = verifySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid verification payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const outcome = await consumeVerification(parsed.data.token);

    if (outcome === "ok") {
      return NextResponse.json({ verified: true });
    }
    if (outcome === "expired") {
      return NextResponse.json(
        { error: "This link has expired. Request a new one." },
        { status: 410 }
      );
    }
    return NextResponse.json(
      { error: "Invalid or already used link." },
      { status: 400 }
    );
  } catch (e) {
    logger.route("Verify error", e);
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 });
  }
}
