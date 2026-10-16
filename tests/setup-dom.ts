// Polyfills pour les tests DOM (jsdom) — Base UI s'appuie sur `ResizeObserver`
// (positionnement ancré) et `matchMedia` (préférences de mouvement). Les tests
// d'analyse statique tournent en environnement `node` : ici on ne touche à rien.

if (typeof window !== "undefined") {
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
