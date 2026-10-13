import type { Project, User } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";

/**
 * Projets (spec) : annonce co-fondateur = `titre`, `description`,
 * `stack` (CSV), `cherche` (CSV, ex. `Designer,Mobile`), `lien` ; rejoindre =
 * table de jointure unique `(projectId, userId)`.
 *
 * Rejoindre est **idempotent** (spec + Review Focus n°1) : un 2ᵉ appel retourne
 * le même compteur sans erreur, même sous concurrence (la course sur l'index
 * unique est rattrapée). L'auteur qui rejoint son propre projet est autorisé et
 * n'altère pas le compteur — il en est le propriétaire, pas un membre.
 *
 * Comme pour le forum et les jobs, les filtres sont cumulatifs et insensibles à
 * la casse : `stack` sur une entrée du CSV, `q` en sous-chaîne sur titre ou
 * description.
 */

const TITRE_MAX = 120;
const DESCRIPTION_MAX = 2000;

/** Champs auteur exposés à l'écran (jamais `passwordHash` ni l'e-mail). */
const SELECT_AUTEUR = { id: true, nom: true, slug: true, ville: true, pays: true } as const;

export type AuteurProjet = Pick<User, keyof typeof SELECT_AUTEUR>;

export type ProjetResume = Omit<Project, "author" | "membres" | "stack" | "cherche"> & {
  author: AuteurProjet;
  /** Entrées du CSV, nettoyées : `["Flutter", "Dart"]`. */
  stack: string[];
  /** Entrées du CSV, nettoyées : `["Designer", "Mobile"]`. */
  cherche: string[];
  _count: { membres: number };
};

export type FiltreProjets = { stack?: string; q?: string };

export type ProjectInput = {
  titre: string;
  description: string;
  stack?: string[];
  cherche?: string[];
  lien?: string;
};

type ProjetBrut = Project & { author: AuteurProjet; _count: { membres: number } };

/** Découpe un CSV « React,Node » en jetons nettoyés. */
function motsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((mot) => mot.trim())
    .filter(Boolean);
}

/** URL d'origine : `http(s)://…` uniquement (les `javascript:` sont rejetés). */
function estUrlValide(valeur: string): boolean {
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Violation d'index unique Prisma (P2002), y compris sous concurrence. */
function estDoublon(erreur: unknown): boolean {
  return (
    typeof erreur === "object" &&
    erreur !== null &&
    (erreur as { code?: string }).code === "P2002"
  );
}

/** Expose `stack`/`cherche` CSV sous forme de tableaux et le compteur de membres. */
function versResume(projet: ProjetBrut): ProjetResume {
  return {
    id: projet.id,
    titre: projet.titre,
    description: projet.description,
    stack: motsDuCsv(projet.stack),
    cherche: motsDuCsv(projet.cherche),
    lien: projet.lien,
    authorId: projet.authorId,
    createdAt: projet.createdAt,
    author: projet.author,
    _count: { membres: projet._count.membres },
  };
}

const INCLUS = {
  author: { select: SELECT_AUTEUR },
  _count: { select: { membres: true } },
} as const;

/**
 * Liste des projets, du plus récent au plus ancien. Les filtres sont
 * cumulatifs (Review Focus n°4 : chaque combinaison → sous-ensemble exact).
 */
export async function listProjects(f?: FiltreProjets): Promise<ProjetResume[]> {
  const projets = await prisma.project.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: INCLUS,
  });

  const listes = projets.map(versResume);
  const stack = f?.stack?.trim().toLowerCase() ?? "";
  const q = f?.q?.trim().toLowerCase() ?? "";
  if (!stack && !q) return listes;

  return listes.filter((projet) => {
    if (stack && !projet.stack.some((s) => s.toLowerCase() === stack)) return false;
    if (q) {
      const dansTitre = projet.titre.toLowerCase().includes(q);
      const dansDescription = projet.description.toLowerCase().includes(q);
      if (!dansTitre && !dansDescription) return false;
    }
    return true;
  });
}

/** Projet complet : auteur, `cherche` en tableau, compteur de membres. `null` si inexistant. */
export async function getProject(id: number): Promise<ProjetResume | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const projet = await prisma.project.findUnique({ where: { id }, include: INCLUS });
  return projet === null ? null : versResume(projet);
}

/** Création d'un projet ; lève `FORUM_VALIDATION` (422) en cas de règle violée. */
export async function createProject(authorId: number, i: ProjectInput): Promise<number> {
  const titre = i.titre.trim();
  const description = i.description.trim();
  const stack = (i.stack ?? []).map((mot) => mot.trim()).filter(Boolean);
  const cherche = (i.cherche ?? []).map((mot) => mot.trim()).filter(Boolean);
  const lien = (i.lien ?? "").trim();

  if (!titre || titre.length > TITRE_MAX) {
    throw new AppError("FORUM_VALIDATION", `Le titre est obligatoire (${TITRE_MAX} car. max).`);
  }
  if (!description || description.length > DESCRIPTION_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `La description est obligatoire (${DESCRIPTION_MAX} car. max).`,
    );
  }
  if (lien && !estUrlValide(lien)) {
    throw new AppError("FORUM_VALIDATION", "Le lien doit être une URL valide (https://…).");
  }

  const projet = await prisma.project.create({
    data: {
      titre,
      description,
      stack: stack.join(","),
      cherche: cherche.join(","),
      lien,
      authorId,
    },
    select: { id: true },
  });
  return projet.id;
}

/**
 * Rejoindre un projet : idempotent — un 2ᵉ appel retourne le même compteur sans
 * erreur, l'auteur du sien est autorisé sans que le compteur bouge. Sous
 * concurrence, la course sur l'index unique `(projectId, userId)` est rattrapée
 * (Review Focus n°1). Retourne le nouveau compteur de membres.
 */
export async function joinProject(projectId: number, userId: number): Promise<number> {
  const projet = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, authorId: true },
  });
  if (!projet) throw new AppError("FORUM_VALIDATION", "Projet introuvable.");

  if (projet.authorId !== userId) {
    const paire = { projectId, userId };
    const existant = await prisma.projectMember.findUnique({
      where: { projectId_userId: paire },
      select: { projectId: true },
    });
    if (!existant) {
      try {
        await prisma.projectMember.create({ data: paire });
      } catch (erreur) {
        if (!estDoublon(erreur)) throw erreur; // déjà créé par une requête simultanée
      }
    }
  }

  return prisma.projectMember.count({ where: { projectId } });
}

/** Ce membre a-t-il déjà rejoint ce projet ? (utilisé par la page de détail) */
export async function estMembre(userId: number, projectId: number): Promise<boolean> {
  const ligne = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { projectId: true },
  });
  return ligne !== null;
}
