import type { Job, Post, Project, Tutorial } from "@prisma/client";
import { prisma } from "./db";
import { MembreResume } from "./members";

/**
 * Recherche globale cross-sections (spec). Une seule entrée pour toute la
 * plateforme : on parcourt les cinq domaines et on renvoie au plus 8 résultats
 * par groupe. Si la requête est vide ou trop courte (moins de 2 caractères
 * après trimming), on renvoie tous les groupes vides sans toucher la base
 * (YAGNI : pas de requête DB inutile, pas de résultats bruités).
 *
 * Optimisé : le filtrage est poussé au niveau DB via Prisma `where` +
 * `mode: 'insensitive'` (PostgreSQL) ou fallback `contains` simple (SQLite).
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

/** Détecte si on utilise SQLite (dev) vs PostgreSQL (prod). */
async function estSQLite(): Promise<boolean> {
  try {
    // Prisma ne expose pas directement le provider, on essaie une requête
    // spécifique à SQLite pour détecter.
    const result = await prisma.$queryRaw<[{ sqlite_version: string }]>`
      SELECT sqlite_version()
    `;
    return Array.isArray(result) && result.length > 0;
  } catch {
    return false; // Si erreur, on assume PostgreSQL (ou autre qui supporte mode)
  }
}

/** Construit une clause WHERE Prisma pour recherche. */
async function ouContient(champs: string[], q: string) {
  const sqlite = await estSQLite();
  if (sqlite) {
    // SQLite : contains sans mode (case-sensitive), on filtrera en mémoire si besoin
    return {
      OR: champs.map((champ) => ({
        [champ]: { contains: q },
      })),
    };
  }
  // PostgreSQL / autres : mode insensitive supporté
  return {
    OR: champs.map((champ) => ({
      [champ]: { contains: q, mode: "insensitive" as const },
    })),
  };
}

export async function searchCodeXchange(q: string): Promise<ResultatRecherche> {
  const requete = (q ?? "").trim();
  if (requete.length < 2) {
    return { sujets: [], offres: [], projets: [], membres: [], tutos: [] };
  }

  const [sujets, offres, projets, usersBruts, tutos] = await Promise.all([
    // Sujets (forum)
    prisma.post.findMany({
      where: await ouContient(["titre", "corps"], requete),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIMITE,
    }),

    // Offres d'emploi
    prisma.job.findMany({
      where: await ouContient(["titre", "entreprise", "pays"], requete),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIMITE,
    }),

    // Projets
    prisma.project.findMany({
      where: await ouContient(["titre", "description", "stack"], requete),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIMITE,
    }),

    // Membres (users) - on récupère plus large puis on mappe
    prisma.user.findMany({
      where: await ouContient(["nom", "titre", "ville", "pays", "stack"], requete),
      orderBy: [{ nom: "asc" }, { id: "asc" }],
      take: LIMITE * 2, // marge pour le mapping
    }),

    // Tutoriels
    prisma.tutorial.findMany({
      where: await ouContient(["titre", "resume", "corps"], requete),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: LIMITE,
    }),
  ]);

  const membres: MembreResume[] = usersBruts
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
      avatar: user.avatar,
    }));

  return { sujets, offres, projets, membres, tutos };
}