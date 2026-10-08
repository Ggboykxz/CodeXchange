import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { AUTH_POLICY, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/auth";
import {
  buildAuthorizeUrl,
  callbackUrl,
  credentials,
  isOAuthProvider,
  randomState,
} from "@/lib/oauth";

/** Aller-retour : 10 minutes — assez pour choisir un compte, pas assez 
 *  pour réutiliser un `state` abandonné. */
const OAUTH_TTL_S = 600;
const STATE_COOKIE = "cx_oauth_state";
const NEXT_COOKIE = "cx_oauth_next";

/**
 * GET /api/oauth/[provider] — départ vers le fournisseur (B6).
 *
 * Pose le `state` (aller) en cookie `httpOnly` et renvoie 302 vers
 * GitHub/Google avec le même `state` en query : au retour, la route
 * callback exige que les deux coïncident. `?next=#section` optionnel
 * mémorise l'ancre pour y revenir après connexion.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: raw } = await params;
    if (!isOAuthProvider(raw)) {
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
    }

    const creds = credentials(raw, process.env);
    if (!creds) {
      return NextResponse.json({ error: "Provider not configured" }, { status: 404 });
    }

    const limited = rateLimit(`oauth:${clientIp(req)}`, AUTH_POLICY.limit, AUTH_POLICY.windowMs);
    if (!limited.ok) {
      const url = new URL("/", req.nextUrl.origin);
      url.searchParams.set("oauth_error", "rate");
      return NextResponse.redirect(url, 302);
    }

    // Un seul `state` pour les deux : celui qui part en query doit être
    // exactement celui qui dort en cookie — c'est toute la vérification
    // du retour.
    const state = randomState();
    const authorizeUrl = buildAuthorizeUrl(raw, {
      clientId: creds.clientId,
      redirectUri: callbackUrl(raw, req.nextUrl.origin),
      state,
    });

    const res = NextResponse.redirect(authorizeUrl, 302);
    const opts = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: OAUTH_TTL_S,
    };
    res.cookies.set(STATE_COOKIE, state, opts);

    // Page d'origine, filtrée : ancre `#section/…` ou chemin `/section/…`.
    // On refuse explicitement les valeurs à slash initial doublé
    // (`//hôte.com`) : elles survivent au filtre de caractères pourtant et
    // `new URL("//hôte.com", origin)` repartirait vers un domaine tiers.
    const rawNext = req.nextUrl.searchParams.get("next") ?? "";
    const next = rawNext.replace(/[^a-zA-Z0-9#/_\-.]/g, "").slice(0, 200);
    const safeNext =
      (next.startsWith("#") && next.length > 1) ||
      (next.startsWith("/") && !next.startsWith("//") && next.length > 1)
        ? next
        : "";
    res.cookies.set(NEXT_COOKIE, safeNext, opts);

    return res;
  } catch (e) {
    logger.route("OAuth authorize error", e);
    return NextResponse.json({ error: "OAuth error" }, { status: 500 });
  }
}
