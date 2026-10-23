"use client";

/**
 * Utilitaires CSRF côté client.
 * Le token est récupéré depuis une balise `<meta name="csrf-token">` injectée par le layout.
 */

let csrfTokenCache: string | null = null;

export function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  if (csrfTokenCache) return csrfTokenCache;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
  if (meta) {
    csrfTokenCache = meta.content;
    return csrfTokenCache;
  }
  return null;
}

export function clearCsrfTokenCache() {
  csrfTokenCache = null;
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