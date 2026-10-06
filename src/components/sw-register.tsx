"use client";

import { useEffect } from "react";

// Garantit une seule inscription même si le composant est monté plusieurs fois
// (StrictMode, re-rendus du layout racine…)
let registerOnce = false;

/**
 * Inscrit le service worker `public/sw.js` — uniquement en production :
 * en dev, un SW perturbe le HMR de Next.js et masque les mises à jour.
 */
export function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (registerOnce) return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    registerOnce = true;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      // `skipWaiting` est appelé dans l'activation du SW lui-même :
      // la nouvelle version prend le contrôle sans intervention.
      .catch((error) => {
        // Non bloquant : la reste de l'app fonctionne sans PWA.
        console.error("Échec de l'enregistrement du service worker:", error);
      });
  }, []);

  return null;
}
