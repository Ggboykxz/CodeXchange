/**
 * F5 — badges et paliers de réputation.
 *
 * Tout est **dérivé de données réelles** (compteurs de contributions déjà
 * produits par le site) : aucun badge ne s'achète ni ne se fabrique. Deux
 * familles distinctes :
 *
 *  - les **paliers** (`reputationLevel`) traduisent un score cumulé en un
 *    grade affichable — à ne pas confondre avec l'expérience **déclarée**
 *    à l'inscription (`User.level` : junior/mid/senior/lead) ;
 *  - les **badges** (`computeBadges`) sont des jalons binaires atteints
 *    une fois pour toutes (première question, réponse acceptée…).
 */

/* ------------------------------------------------------------------ */
/* Paliers de réputation                                               */
/* ------------------------------------------------------------------ */

export const REP_TIERS = [
  { id: "novice", min: 0, key: "tier.novice" },
  { id: "contributeur", min: 50, key: "tier.contributeur" },
  { id: "expert", min: 200, key: "tier.expert" },
  { id: "legende", min: 500, key: "tier.legende" },
] as const;

export type RepTierId = (typeof REP_TIERS)[number]["id"];
export type RepTier = (typeof REP_TIERS)[number];

/**
 * Palier atteint pour un score donné. Les seuils sont triés croissants :
 * on remonte jusqu'au dernier franchi, donc `rep` négatif (remaniement
 * d'une sanction) retombe sur « novice » plutôt que sur `undefined`.
 */
export function reputationLevel(rep: number): RepTier {
  let reached: RepTier = REP_TIERS[0];
  for (const tier of REP_TIERS) {
    if (rep >= tier.min) reached = tier;
    else break;
  }
  return reached;
}

/* ------------------------------------------------------------------ */
/* Badges — jalons de contribution                                     */
/* ------------------------------------------------------------------ */

/** Compteurs agrégés par `/api/profiles/[username]` (4 `COUNT`). */
export type BadgeStats = {
  threads: number;
  posts: number;
  accepted: number;
  mentorships: number;
};

export type BadgeId =
  | "question"
  | "reponse"
  | "acceptee"
  | "plume"
  | "mentor";

type BadgeDef = {
  id: BadgeId;
  key: string;
  test: (s: BadgeStats) => boolean;
};

export const BADGES: readonly BadgeDef[] = [
  { id: "question", key: "badge.question", test: (s) => s.threads >= 1 },
  { id: "reponse", key: "badge.reponse", test: (s) => s.posts >= 1 },
  { id: "acceptee", key: "badge.acceptee", test: (s) => s.accepted >= 1 },
  { id: "plume", key: "badge.plume", test: (s) => s.posts >= 25 },
  { id: "mentor", key: "badge.mentor", test: (s) => s.mentorships >= 1 },
];

/** Badges mérités, dans l'ordre du catalogue (affichage stable). */
export function computeBadges(stats: BadgeStats): BadgeId[] {
  return BADGES.filter((b) => b.test(stats)).map((b) => b.id);
}

/** Clé i18n d'un badge (`badge.*`). */
export function badgeKey(id: BadgeId): string {
  return BADGES.find((b) => b.id === id)?.key ?? `badge.${id}`;
}
