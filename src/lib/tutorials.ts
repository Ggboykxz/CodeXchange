import type { Tutorial, User } from "@prisma/client";
import { prisma } from "./db";

/**
 * Tutos (spec) : `slug` unique, `titre`, `resume`, `corps` (markdown léger),
 * `tags` (CSV), `dureeMin`.
 *
 * Le corps est stocké brut et **rendu côté serveur** par
 * `src/lib/markdown.ts`, qui échappe tout HTML d'entrée (Review Focus n°3) :
 * la page `/tutos/[slug]` n'a donc aucun filtrage supplémentaire à faire.
 */

/** Champs auteur exposés à l'écran (jamais `passwordHash` ni l'e-mail). */
const SELECT_AUTEUR = { id: true, nom: true, slug: true, ville: true, pays: true } as const;

export type AuteurTuto = Pick<User, keyof typeof SELECT_AUTEUR>;

export type TutoResume = Omit<Tutorial, "author" | "tags"> & {
  /** Entrées du CSV, nettoyées : `["Flutter", "Mobile"]`. */
  tags: string[];
  author: AuteurTuto;
};

type TutoBrut = Tutorial & { author: AuteurTuto };

/** Découpe un CSV « Flutter,Mobile » en jetons nettoyés. */
function tagsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function versResume(tuto: TutoBrut): TutoResume {
  const { author, tags, ...reste } = tuto;
  return { ...reste, tags: tagsDuCsv(tags), author };
}

/** Liste des tutos, du plus récent au plus ancien. */
export async function listTutorials(): Promise<TutoResume[]> {
  const tutos = await prisma.tutorial.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { author: { select: SELECT_AUTEUR } },
  });
  return tutos.map(versResume);
}

/** Tuto complet (corps markdown brut + auteur). `null` si le slug est inconnu. */
export async function getTutorial(slug: string): Promise<TutoResume | null> {
  if (!slug) return null;
  const tuto = await prisma.tutorial.findUnique({
    where: { slug },
    include: { author: { select: SELECT_AUTEUR } },
  });
  return tuto === null ? null : versResume(tuto);
}
