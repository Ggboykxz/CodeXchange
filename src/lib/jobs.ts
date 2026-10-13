import type { Job, User } from "@prisma/client";
import { CONTRATS } from "./contrats";
import { prisma } from "./db";
import { AppError } from "./errors";
import type { PaginatedResult } from "./pagination";
import { paginateArray } from "./pagination";

export type { PaginatedResult } from "./pagination";
import { createNotification } from "./notifications";

export { CONTRATS };

/**
 * Offres d'emploi (spec) : `titre`, `entreprise`, `contrat`
 * (`CDI` | `Freelance` | `Stage` | `Alternance`), `remote`, `pays`, `ville`,
 * `lien` (URL). Postulation = ligne unique `(jobId, userId)` + compteur ; une
 * 2ᵉ postulation est rejetée (409) — y compris sous concurrence, la course sur
 * l'index unique étant rattrapée (Review Focus n°1).
 *
 * Les filtres sont cumulatifs et, comme pour le forum, insensibles à la casse :
 * `remote` sur le booléen, `pays`/`contrat` sur une égalité exacte, `q` en
 * sous-chaîne sur titre, entreprise ou ville.
 */

const TITRE_MIN = 3;
const TITRE_MAX = 120;
const ENTREPRISE_MAX = 120;
const PAYS_MAX = 60;
const VILLE_MAX = 60;

/** Champs auteur exposés à l'écran (jamais `passwordHash` ni l'e-mail). */
const SELECT_AUTEUR = { id: true, nom: true, slug: true, ville: true, pays: true } as const;

export type AuteurOffre = Pick<User, keyof typeof SELECT_AUTEUR>;

export type JobResume = Job & { auteur: AuteurOffre };

export type JobDetail = JobResume & { _count: { candidatures: number } };

export type FiltreJobs = { remote?: boolean; pays?: string; contrat?: string; q?: string; page?: number; pageSize?: number; tri?: "recent" | "populaire" };

export type JobInput = {
  titre: string;
  entreprise: string;
  contrat: string;
  remote: boolean;
  pays: string;
  ville?: string;
  lien: string;
};

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

/**
 * Liste des offres, de la plus récente à la plus ancienne. Les filtres sont
 * cumulatifs (Review Focus n°4 : chaque combinaison → sous-ensemble exact).
 */
export async function listJobs(f: FiltreJobs & { page: number }): Promise<PaginatedResult<Job>>;
export async function listJobs(f?: FiltreJobs): Promise<Job[]>;
export async function listJobs(f?: FiltreJobs): Promise<Job[] | PaginatedResult<Job>> {
  const offres = await prisma.job.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const remote = f?.remote;
  const pays = f?.pays?.trim().toLowerCase() ?? "";
  const contrat = f?.contrat?.trim().toLowerCase() ?? "";
  const q = f?.q?.trim().toLowerCase() ?? "";
  let filtrees = offres;
  if (remote !== undefined || pays || contrat || q) {
    filtrees = offres.filter((offre) => {
      if (remote !== undefined && offre.remote !== remote) return false;
      if (pays && offre.pays.toLowerCase() !== pays) return false;
      if (contrat && offre.contrat.toLowerCase() !== contrat) return false;
      if (q) {
        const dansTitre = offre.titre.toLowerCase().includes(q);
        const dansEntreprise = offre.entreprise.toLowerCase().includes(q);
        const dansVille = offre.ville.toLowerCase().includes(q);
        if (!dansTitre && !dansEntreprise && !dansVille) return false;
      }
      return true;
    });
  }

  // Tri « populaire » : nombre de candidatures (une requête groupée), puis date.
  if (f?.tri === "populaire") {
    const comptes = await prisma.application.groupBy({
      by: ["jobId"],
      _count: { _all: true },
    });
    const poids = new Map(comptes.map((c) => [c.jobId, c._count._all]));
    filtrees = [...filtrees].sort(
      (a, b) => (poids.get(b.id) ?? 0) - (poids.get(a.id) ?? 0) || b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  if (f?.page !== undefined) {
    return paginateArray(filtrees, f.page, f.pageSize);
  }
  return filtrees;
}

/** Offre complète : auteur + compteur de candidatures. `null` si inexistante. */
export async function getJob(id: number): Promise<JobDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.job.findUnique({
    where: { id },
    include: {
      auteur: { select: SELECT_AUTEUR },
      _count: { select: { candidatures: true } },
    },
  });
}

/** Création d'une offre ; lève `FORUM_VALIDATION` (422) en cas de règle violée. */
export async function createJob(authorId: number, i: JobInput): Promise<number> {
  const titre = i.titre.trim();
  const entreprise = i.entreprise.trim();
  const contrat = i.contrat.trim();
  const pays = i.pays.trim();
  const ville = (i.ville ?? "").trim();
  const lien = i.lien.trim();

  if (titre.length < TITRE_MIN || titre.length > TITRE_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `Le titre doit faire entre ${TITRE_MIN} et ${TITRE_MAX} caractères.`,
    );
  }
  if (!entreprise || entreprise.length > ENTREPRISE_MAX) {
    throw new AppError("FORUM_VALIDATION", `L'entreprise est obligatoire (${ENTREPRISE_MAX} car. max).`);
  }
  if (!(CONTRATS as readonly string[]).includes(contrat)) {
    throw new AppError("FORUM_VALIDATION", `Le contrat doit être l'un de : ${CONTRATS.join(", ")}.`);
  }
  if (!pays || pays.length > PAYS_MAX) {
    throw new AppError("FORUM_VALIDATION", `Le pays est obligatoire (${PAYS_MAX} car. max).`);
  }
  if (ville.length > VILLE_MAX) {
    throw new AppError("FORUM_VALIDATION", `La ville ne peut pas dépasser ${VILLE_MAX} caractères.`);
  }
  if (!estUrlValide(lien)) {
    throw new AppError("FORUM_VALIDATION", "Le lien doit être une URL valide (https://…).");
  }

  const offre = await prisma.job.create({
    data: {
      titre,
      entreprise,
      contrat,
      remote: i.remote === true,
      pays,
      ville,
      lien,
      authorId,
    },
    select: { id: true },
  });
  return offre.id;
}

/**
 * Postulation : enregistre `(jobId, userId)` unique et retourne le nouveau
 * compteur. La 2ᵉ postulation lève `JOB_DUPLICATE_APPLICATION` (409), même si
 * deux requêtes simultanées passent le premier contrôle (rattrapage P2002).
 */
export async function applyToJob(jobId: number, userId: number): Promise<number> {
  const offre = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true, authorId: true } });
  if (!offre) throw new AppError("FORUM_VALIDATION", "Offre introuvable.");

  const paire = { jobId, userId };
  const existant = await prisma.application.findUnique({ where: { jobId_userId: paire } });
  if (existant) throw new AppError("JOB_DUPLICATE_APPLICATION");

  try {
    await prisma.application.create({ data: paire });
  } catch (erreur) {
    if (estDoublon(erreur)) throw new AppError("JOB_DUPLICATE_APPLICATION");
    throw erreur;
  }

  // Notification au propriétaire de l'offre (si différent du candidat).
  if (offre.authorId !== userId) {
    try {
      await createNotification({
        userId: offre.authorId,
        type: "CANDIDATURE",
        text: "Une nouvelle candidature a été reçue pour votre offre.",
        lien: `/jobs/${jobId}`,
      });
    } catch {
      // fire-and-forget
    }
  }

  return prisma.application.count({ where: { jobId } });
}

/** Ce membre a-t-il déjà postulé à cette offre ? (utilisé par la page de détail) */
export async function aPostule(userId: number, jobId: number): Promise<boolean> {
  const candidature = await prisma.application.findUnique({
    where: { jobId_userId: { jobId, userId } },
    select: { jobId: true },
  });
  return candidature !== null;
}
