// Polyfills pour les tests DOM (jsdom) — Base UI s'appuie sur `ResizeObserver`
// (positionnement ancré) et `matchMedia` (préférences de mouvement). Les tests
// d'analyse statique tournent en environnement `node` : ici on ne touche à rien.

if (typeof window !== "undefined") {
  // Node 22 expose un `localStorage` expérimental qui peut masquer celui de
  // jsdom (undefined sans --localstorage-file). On garantit un stockage
  // fonctionnel pour les composants qui lisent les préférences locales.
  try {
    window.localStorage.setItem("__cx_test__", "1");
    window.localStorage.removeItem("__cx_test__");
  } catch {
    const donnees = new Map<string, string>();
    const stockage: Storage = {
      get length() {
        return donnees.size;
      },
      clear() {
        donnees.clear();
      },
      getItem(cle: string) {
        return donnees.get(cle) ?? null;
      },
      key(index: number) {
        return Array.from(donnees.keys())[index] ?? null;
      },
      removeItem(cle: string) {
        donnees.delete(cle);
      },
      setItem(cle: string, valeur: string) {
        donnees.set(cle, String(valeur));
      },
    };
    Object.defineProperty(window, "localStorage", { value: stockage, configurable: true });
    Object.defineProperty(globalThis, "localStorage", { value: stockage, configurable: true });
  }

  // Selon la version de Node, le global `localStorage` peut être absent alors
  // que celui de jsdom fonctionne : on aligne les deux.
  if (typeof globalThis.localStorage === "undefined" && window.localStorage) {
    Object.defineProperty(globalThis, "localStorage", {
      value: window.localStorage,
      configurable: true,
    });
  }

  if (!("ResizeObserver" in window)) {
    class ObservateurTaille {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = ObservateurTaille;
  }

  if (typeof window.matchMedia !== "function") {
    window.matchMedia = (requete: string) =>
      ({
        matches: false,
        media: requete,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
}
