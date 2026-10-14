/**
 * Gamification légère : niveaux dérivés du karma (somme des votes reçus sur
 * les sujets d'un membre). Déterministe et sans état persisté — le niveau est
 * recalculé à la volée, ce qui évite toute migration de données.
 */

export type Palier = {
  niveau: number;
  titre: string;
  seuil: number; // karma minimal pour atteindre ce niveau
};

/** Paliers de progression, ordre croissant. */
export const PALIERS: Palier[] = [
  { niveau: 1, titre: "Débutant", seuil: 0 },
  { niveau: 2, titre: "Membre", seuil: 10 },
  { niveau: 3, titre: "Contributeur", seuil: 50 },
  { niveau: 4, titre: "Régulier", seuil: 150 },
  { niveau: 5, titre: "Expert", seuil: 400 },
  { niveau: 6, titre: "Légende", seuil: 1000 },
];

export type Niveau = {
  niveau: number;
  titre: string;
  /** Karma requis pour le niveau courant. */
  seuil: number;
  /** Karma requis pour le niveau suivant (ou `null` au sommet). */
  suivant: number | null;
  /** Progression 0→100 vers le niveau suivant (100 au sommet). */
  progression: number;
  /** Karma restant avant le niveau suivant (0 au sommet). */
  restant: number;
};

/** Niveau courant d'un membre à partir de son karma (négatif → niveau 1). */
export function calculerNiveau(karma: number): Niveau {
  const k = Number.isFinite(karma) ? Math.max(0, Math.trunc(karma)) : 0;
  let courant = PALIERS[0]!;
  let suivantPalier: Palier | null = PALIERS[1] ?? null;
  for (let i = 0; i < PALIERS.length; i++) {
    if (k >= PALIERS[i]!.seuil) {
      courant = PALIERS[i]!;
      suivantPalier = PALIERS[i + 1] ?? null;
    }
  }

  if (!suivantPalier) {
    return { niveau: courant.niveau, titre: courant.titre, seuil: courant.seuil, suivant: null, progression: 100, restant: 0 };
  }

  const span = suivantPalier.seuil - courant.seuil;
  const avance = k - courant.seuil;
  const progression = span > 0 ? Math.min(100, Math.round((avance / span) * 100)) : 100;
  return {
    niveau: courant.niveau,
    titre: courant.titre,
    seuil: courant.seuil,
    suivant: suivantPalier.seuil,
    progression,
    restant: Math.max(0, suivantPalier.seuil - k),
  };
}
