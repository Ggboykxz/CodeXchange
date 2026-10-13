import type { Job, Post, Project, Tutorial } from "@prisma/client";
import { prisma } from "./db";
import { MembreResume } from "./members";

/**
 * Recherche globale cross-sections (spec). Une seule entrée pour toute la
 * plateforme : on parcourt les cinq domaines et on renvoie au plus 8 résultats
 * par groupe. Si la requête est vide ou trop courte (moins de 2 caractères
 * après trimming), on renvoie tous les groupes vides sans toucher la base
 * (YAGNI : pas de requête DB inutile, pas de résultats bruités).
 */

export type ResultatRecherche = {
  sujets: Post[];
  offres: Job[];
  projets: Project[];
  membres: MembreResume[];
  tutos: Tutorial[];
};

const LIMITE = 8;

function motsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((mot) => mot.trim())
    .filter(Boolean);
}

/** Sous-chaîne insensible à la casse. */
function contient(texte: string, q: string): boolean {
  return texte.toLowerCase().includes(q);
}

/** Passe la chaîne en minuscules pour le test d'inclusion (le q est déjà normalisé). */
function champ(valeur: string | null | undefined): string {
  return valeur ?? "";
}

export async function searchCodeXchange(q: string): Promise<ResultatRecherche> {
  const requete = (q ?? "").trim();
  if (requete.length < 2) {
    return { sujets: [], offres: [], projets: [], membres: [], tutos: [] };
  }
  const needle = requete.toLowerCase();

  const [postsBruts, jobsBruts, projectsBruts, usersBruts, tutorialsBruts] = await Promise.all([
    prisma.post.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.job.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.project.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
    prisma.user.findMany({ orderBy: [{ nom: "asc" }, { id: "asc" }] }),
    prisma.tutorial.findMany({ orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
  ]);

  const sujets = postsBruts
    .filter((post) => contient(champ(post.titre) + " " + champ(post.corps), needle))
    .slice(0, LIMITE);

  const offres = jobsBruts
    .filter((job) =>
      contient(champ(job.titre) + " " + champ(job.entreprise) + " " + champ(job.pays), needle),
    )
    .slice(0, LIMITE);

  const projets = projectsBruts
    .filter((project) =>
      contient(champ(project.titre) + " " + champ(project.description) + " " + champ(project.stack), needle),
    )
    .slice(0, LIMITE);

  const membres: MembreResume[] = usersBruts
    .filter((user) =>
      contient(
        champ(user.nom) +
          " " +
          champ(user.titre) +
          " " +
          champ(user.ville) +
          " " +
          champ(user.pays) +
          " " +
          champ(user.stack),
        needle,
      ),
    )
    .slice(0, LIMITE)
    .map((user) => ({
      id: user.id,
      nom: user.nom,
      slug: user.slug,
      titre: user.titre,
      ville: user.ville,
      pays: user.pays,
      role: user.role,
      createdAt: user.createdAt,
      stack: motsDuCsv(user.stack),
    }));

  const tutos = tutorialsBruts
    .filter((tuto) => contient(champ(tuto.titre) + " " + champ(tuto.resume) + " " + champ(tuto.corps), needle))
    .slice(0, LIMITE);

  return { sujets, offres, projets, membres, tutos };
}