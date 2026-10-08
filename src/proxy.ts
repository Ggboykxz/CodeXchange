import { NextRequest, NextResponse } from "next/server";
import { rateLimit, AUTH_POLICY, WRITE_POLICY } from "@/lib/rate-limit";

/**
 * Proxy Next.js 16 (ex-`middleware.ts` — renommé dans Next 16).
 *
 * Deux responsabilités ici :
 *   1. rate limiting des endpoints sensibles (auth, écriture) ;
 *   2. en-têtes de sécurité posés sur toutes les réponses.
 *
 * On ne fait PAS de gestion de session ici : le proxy tourne sur chaque requête
 * et n'est pas le bon endroit pour un lookup BDD (voir `src/lib/auth.ts`).
 */

const AUTH_PATHS = /^\/api\/auth\/(login|register)$/;
const WRITE_PATHS = /^\/api\/(threads|posts|votes|mentors|profiles)/;

function ipOf(req: NextRequest): string {
  // Voir lib/auth.ts#clientIp : on n'honore les en-têtes de proxy que
  // derrière un reverse-proxy de confiance. `TRUST_PROXY=false` ignore
  // les en-têtes forgeables et retombe sur "unknown" (bucket partagé —
  // moins granulaire, mais non contournable).
  if (process.env.TRUST_PROXY !== "false") {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]!.trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real;
  }
  return "unknown";
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "X-DNS-Prefetch-Control": "off",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
};

/**
 * CSP : `frame-src` autorise Jitsi (visio mentorat), `img-src` les data:/blob:
 * utilisés par les avatars, `connect-src 'self'` empête l'exfil vers un domaine tiers.
 * Les scripts inline sont tolérés car Next en injecte (nonce non disponible côté proxy).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob:",
  "frame-src 'self' https://meet.jit.si https://*.meet.jit.si",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuth = AUTH_PATHS.test(pathname);
  const isWrite = WRITE_PATHS.test(request.method === "GET" ? "" : pathname);

  if (isAuth || isWrite) {
    const ip = ipOf(request);
    const policy = isAuth ? AUTH_POLICY : WRITE_POLICY;
    // Clé distincte par route pour qu'un flood sur /login ne bloque pas /register
    // indéfiniment, tout en gardant une limite globale par IP.
    const result = rateLimit(`${request.method}:${pathname}:${ip}`, policy.limit, policy.windowMs);

    if (!result.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please retry later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSec),
            "X-RateLimit-Limit": String(policy.limit),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set("Content-Security-Policy", CSP);
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
  return response;
}

export const config = {
  // On ne proxyise pas les assets statiques (perf) mais bien tout /api.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|css|js|woff2?)$).*)"],
};
