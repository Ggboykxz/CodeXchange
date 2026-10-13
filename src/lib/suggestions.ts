/**
 * Suggestions de recherche : tags les plus utilisés + villes des membres.
 * Sert la barre avec historique (aucune dépendance, résultats déterministes).
 */
import { prisma } from "./db";

function motsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

/** Compte les occurrences de chaque tag (forum + tutos). */
export async function suggestionsRecherche(limite = 8): Promise<string[]> {
  const [sujets, tutos, membres] = await Promise.all([
    prisma.post.findMany({ select: { tags: true } }),
    prisma.tutorial.findMany({ select: { tags: true } }),
    prisma.user.findMany({ select: { ville: true } }),
  ]);

  const comptes = new Map<string, number>();
  const ajouter = (valeur: string) => {
    comptes.set(valeur, (comptes.get(valeur) ?? 0) + 1);
  };
  for (const s of sujets) for (const tag of motsDuCsv(s.tags)) ajouter(tag.toLowerCase());
  for (const t of tutos) for (const tag of motsDuCsv(t.tags)) ajouter(tag.toLowerCase());
  for (const m of membres) if (m.ville) ajouter(m.ville.toLowerCase());

  return [...comptes.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limite)
    .map(([valeur]) => valeur);
}
