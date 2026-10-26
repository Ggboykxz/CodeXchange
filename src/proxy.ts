import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Création du cookie CSRF `cx_csrf` (double-submit cookie, pattern de
 * `src/lib/csrf.ts`).
 *
 * Next 16 : `cookies().set()` n'est autorisé que dans les Server Functions
 * et Route Handlers — le layout (Server Component) ne peut plus écrire le
 * cookie pendant le rendu (erreur « Cookies can only be modified in a Server
 * Action or Route Handler »). Le cookie est donc créé ici, au proxy, avant
 * le rendu : si la requête ne le porte pas, il est posé sur la réponse.
 *
 * Le layout lit ensuite ce cookie via `getCsrfToken()` (meta csrf-token) ;
 * les routes mutantes le vérifient via `verifyCsrf()`.
 */

const COOKIE_CSRF = "cx_csrf";
const DUREE_JOURS = 14;

function genererToken(): string {
  const octets = new Uint8Array(32);
  crypto.getRandomValues(octets);
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.has(COOKIE_CSRF)) {
    response.cookies.set(COOKIE_CSRF, genererToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * DUREE_JOURS,
    });
  }
  return response;
}

export const config = {
  matcher: [
    /* Requêtes de pages : exclure l'API et les assets statiques. */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
