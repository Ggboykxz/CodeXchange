// Échelle partagée de design : z-index, rayons et durées.
// Consommée par les composants UI de la refonte (tailwind classes, durées CSS).

export const Z = { base: 0, raised: 10, header: 20, overlay: 30, drawer: 40, toast: 50 } as const;

export const RAYON = { sm: "rounded-md", md: "rounded-lg", lg: "rounded-xl", pill: "rounded-full" } as const;

export const DUREE = { interaction: 150, retour: 200 } as const; // ms, utilisé en CSS et en documentation
