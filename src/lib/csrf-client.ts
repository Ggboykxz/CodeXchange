"use client";

/**
 * Utilitaires CSRF côté client.
 * Le token est récupéré depuis une balise `<meta name="csrf-token">` injectée par le layout.
 *
 * ⚠️ Le serveur fait TOURNER le token à chaque mutation réussie (`rotateCsrfToken`,
 * `src/lib/csrf.ts`) et le layout met à jour la balise `<meta>` via `router.refresh()`
 * après chaque mutation. Le token est donc relu depuis le `<meta>` à CHAQUE mutation :
 * une mise en cache le rendrait obsolète dès la 1re mutation et provoquerait des
 * `CSRF_INVALID` (403) sur toutes les suivantes, sans rechargement de la page.
 */

export function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  return meta ? meta.content : null;
}

/**
 * Conserve la compatibilité d'API (export historiquement utilisé pour invalider le
 * cache). Sans effet aujourd'hui : le token n'est plus mis en cache, il est relu
 * depuis le `<meta>` à chaque appel de `getCsrfToken()` / `fetchWithCsrf()`.
 */
export function clearCsrfTokenCache(): void {
  /* Rien à invalider : le token est relu depuis le <meta> à chaque mutation. */
}

/**
 * Headers standards pour les requêtes mutantes (POST/PUT/PATCH/DELETE).
 * Inclut le token CSRF si disponible.
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "X-CSRF-Token": token } : {};
}

/**
 * Wrapper fetch qui ajoute automatiquement le token CSRF pour les méthodes mutantes.
 */
export async function fetchWithCsrf(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = getCsrfToken();
    if (token) headers.set("X-CSRF-Token", token);
  }
  return fetch(url, { ...init, headers });
}
