import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { AppError } from "./errors";

/**
 * Protection CSRF par double-submit cookie (pattern standard, sans session state).
 *
 * - Le cookie `cx_csrf` (HttpOnly, SameSite=Lax) contient un token aléatoire.
 * - Le client doit envoyer ce token dans l'en-tête `X-CSRF-Token` ou le champ `csrfToken`.
 * - Vérification : token cookie === token request.
 * - Rotation : nouveau token à chaque réponse mutante (POST/PUT/PATCH/DELETE).
 *
 * Note : SameSite=Lax protège déjà la plupart des navigateurs modernes, mais cette
 * couche ajoute une défense en profondeur pour les anciens navigateurs et les
 * attaques cross-origin complexes.
 */

const COOKIE_CSRF = "cx_csrf";
const HEADER_CSRF = "x-csrf-token";

function genererToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Récupère le token CSRF depuis le cookie.
 * À appeler dans les Server Components / layouts pour injecter le token dans le DOM.
 *
 * Next 16 : l'écriture du cookie est interdite dans les Server Components
 * (`cookies().set()` → Server Functions / Route Handlers uniquement). Le
 * cookie est créé par `src/proxy.ts` avant le rendu ; cette fonction reste
 * en lecture seule. Si le cookie est absent (contexte hors requête, tests),
 * un token frais est retourné sans écriture.
 */
export async function getCsrfToken(): Promise<string> {
  const stockage = await cookies();
  const token = stockage.get(COOKIE_CSRF)?.value;
  if (token) return token;
  return genererToken();
}

/**
 * Vérifie la validité du token CSRF dans la requête.
 * Lance une AppError si invalide ou absent.
 */
export async function verifyCsrf(request: Request): Promise<void> {
  // Seules les méthodes mutantes nécessitent CSRF
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return;
  }

  const stockage = await cookies();
  const cookieToken = stockage.get(COOKIE_CSRF)?.value;

  // Récupérer le token depuis l'en-tête ou le body (form-data / JSON)
  let requestToken: string | null = null;
  const headerToken = request.headers.get(HEADER_CSRF);
  if (headerToken) {
    requestToken = headerToken;
  } else {
    // Pour les FormData / JSON, on tente de lire le body
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const clone = request.clone();
        const body = (await clone.json().catch(() => null)) as { csrfToken?: string } | null;
        requestToken = body?.csrfToken ?? null;
      } catch {
        // Ignore
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      try {
        const clone = request.clone();
        const formData = await clone.formData().catch(() => null);
        requestToken = (formData?.get("csrfToken") as string) ?? null;
      } catch {
        // Ignore
      }
    }
  }

  if (!cookieToken || !requestToken || cookieToken !== requestToken) {
    throw new AppError("CSRF_INVALID");
  }
}

/**
 * Génère un nouveau token CSRF et le définit dans les cookies de réponse.
 * À appeler après une mutation réussie pour rotation.
 */
export async function rotateCsrfToken(response: Response): Promise<void> {
  const newToken = genererToken();
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_CSRF}=${newToken}; HttpOnly; SameSite=Lax; Secure=${process.env.NODE_ENV === "production" ? "true" : "false"}; Path=/; Max-Age=${60 * 60 * 24 * 14}`,
  );
}

/**
 * Helper pour injecter le token CSRF dans les formulaires côté client.
 * Retourne un objet `{ csrfToken, csrfHeader }` utilisable dans les fetch.
 */
export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await getCsrfToken();
  return { [HEADER_CSRF]: token };
}