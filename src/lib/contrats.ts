/**
 * Contrats admis pour une offre (spec : `CDI` | `Freelance` | `Stage` |
 * `Alternance`). Module sans dépendance serveur, importable côté client
 * (formulaire de publication) comme côté serveur (`src/lib/jobs.ts`).
 */
export const CONTRATS = ["CDI", "Freelance", "Stage", "Alternance"] as const;

export type Contrat = (typeof CONTRATS)[number];
