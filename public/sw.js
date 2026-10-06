/*
 * CodeXchange — service worker écrit à la main (aucune dépendance type workbox).
 *
 * Stratégies :
 *   - Stale-while-revalidate pour les assets statiques same-origin en GET
 *     (/_next/static/*, images, polices, CSS/JS) ;
 *   - Network-first avec fallback cache pour les navigations : les pages déjà
 *     visitées restent accessibles hors ligne (sinon /offline.html) ;
 *   - /api/* n'est JAMAIS mis en cache — toujours réseau (données fraîches,
 *     sessions, tokens).
 *
 * Versionner VERSION à chaque changement de ce fichier (les anciens caches
 * sont purgés à l'activation).
 */

const VERSION = "v1";
const STATIC_CACHE = `codexchange-static-${VERSION}`;
const PAGES_CACHE = `codexchange-pages-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE_ASSETS = [OFFLINE_URL, "/logo.svg", "/manifest.webmanifest"];

// Assets statiques : extensions classiques d'images, polices, CSS et JS
const STATIC_EXTENSION =
  /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|woff2?|ttf|otf|eot|css|js|mjs|map|txt|webmanifest)$/i;

function isStaticAsset(pathname) {
  if (pathname.startsWith("/_next/static/")) return true;
  if (pathname === "/_next/image") return true;
  if (pathname === OFFLINE_URL) return true;
  return STATIC_EXTENSION.test(pathname);
}

/* ---------------------------------------------------------------- install */

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch(() => undefined) // le precache est best-effort
      .then(() => self.skipWaiting())
  );
});

/* -------------------------------------------------------------- activate */

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------------------------------------------------------------- fetch */

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Seules les requêtes GET same-origin sont éligibles au cache
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API : toujours le réseau, jamais de cache
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  // Navigations (documents HTML) : network-first → pages déjà visitées
  // accessibles hors ligne
  if (request.mode === "navigate") {
    handleNavigation(event);
    return;
  }

  // Assets statiques : stale-while-revalidate
  if (isStaticAsset(url.pathname)) {
    handleStaticAsset(event);
  }
});

/* --------------------------------------------------- network-first (HTML) */

function handleNavigation(event) {
  const { request } = event;

  const network = fetch(request)
    .then((response) => {
      if (!response || !response.ok) return { response, written: undefined };

      // Clone AVANT toute lecture du corps : une copie part au cache,
      // l'autre est renvoyée au navigateur.
      const copy = response.clone();
      const written = caches
        .open(PAGES_CACHE)
        .then((cache) => cache.put(request, copy))
        .catch(() => undefined);

      return { response, written };
    })
    .catch(() => null);

  // waitUntil appelé de façon synchrone dans le handler : le SW reste en vie
  // le temps d'écrire la réponse dans le cache de pages.
  event.waitUntil(
    network.then((result) => (result ? result.written : undefined))
  );

  event.respondWith(
    network.then((result) => {
      if (result && result.response) return result.response;
      return offlineFallback(request);
    })
  );
}

async function offlineFallback(request) {
  // Page déjà visitée ?
  const cached = await caches.match(request);
  if (cached) return cached;

  // Sinon : page hors ligne minimale, mise en cache à l'installation
  const offline = await caches.match(OFFLINE_URL);
  if (offline) return offline;

  return new Response("Connexion requise — CodeXchange est hors ligne.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/* -------------------------------------- stale-while-revalidate (statiques) */

function handleStaticAsset(event) {
  const { request } = event;

  const cachePromise = caches.open(STATIC_CACHE);

  // Revalidation en arrière-plan : réponse réseau mise en cache dès qu'elle
  // arrive (best-effort, en parallèle de la réponse servie depuis le cache).
  const refreshPromise = cachePromise
    .then((cache) =>
      fetch(request).then((response) => {
        if (response && response.ok) {
          return cache
            .put(request, response.clone())
            .then(() => response)
            .catch(() => response);
        }
        return response;
      })
    )
    .catch(() => null);

  // waitUntil synchrone : garantit que la revalidation se termine
  event.waitUntil(refreshPromise);

  event.respondWith(
    cachePromise
      .then((cache) => cache.match(request))
      .then((cached) => {
        // Serveur d'abord (réponse périmée immédiatement servie, refresh en fond)
        if (cached) return cached;
        return refreshPromise.then(
          (response) =>
            response ||
            new Response("Connexion requise — asset indisponible.", {
              status: 504,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
        );
      })
  );
}
