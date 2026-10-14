import type { User } from "@prisma/client";
import { prisma } from "./db";
import type { PaginatedResult } from "./pagination";
import { paginateArray } from "./pagination";

export type { PaginatedResult } from "./pagination";

/**
 * Annuaire (spec) : membre = `nom`, `slug` unique, `titre`, `ville`, `pays`
 * (drapeau affiché), `stack` (CSV), `bio` (140 car. max), liens (`github`,
 * `linkedin`, `site`), `role` (`MEMBER` | `MENTOR`).
 *
 * Le type public n'expose **jamais** `passwordHash` ni l'e-mail (convention
 * `*Resume` des autres domaines). Les filtres sont cumulatifs et insensibles à
 * la casse (Review Focus n°4) : `pays` sur une égalité exacte, `stack` sur une
 * entrée du CSV, `q` en sous-chaîne sur nom, titre ou ville.
 */

/** Champs du profil public, sans `passwordHash` ni `email`. */
const SELECT_MEMBRE = {
  id: true,
  nom: true,
  slug: true,
  titre: true,
  ville: true,
  pays: true,
  role: true,
  createdAt: true,
  stack: true,
  avatar: true,
} as const;

type MembreBrut = Pick<User, keyof typeof SELECT_MEMBRE>;

export type MembreResume = Omit<MembreBrut, "stack"> & {
  /** Entrées du CSV, nettoyées : `["Flutter", "Dart"]`. */
  stack: string[];
};

export type MembreDetail = MembreResume &
  Pick<User, "bio" | "github" | "linkedin" | "site" | "avatar" | "verified">;

export type FiltreMembres = { pays?: string; stack?: string; q?: string; page?: number; pageSize?: number };

/** Découpe un CSV « Flutter,Dart » en jetons nettoyés. */
function motsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((mot) => mot.trim())
    .filter(Boolean);
}

function versResume(membre: MembreBrut): MembreResume {
  return {
    id: membre.id,
    nom: membre.nom,
    slug: membre.slug,
    titre: membre.titre,
    ville: membre.ville,
    pays: membre.pays,
    role: membre.role,
    createdAt: membre.createdAt,
    stack: motsDuCsv(membre.stack),
    avatar: membre.avatar,
  };
}

/**
 * Annuaire, par ordre alphabétique sur le nom. Les filtres sont cumulatifs
 * (Review Focus n°4 : chaque combinaison → sous-ensemble exact).
 */
export async function listMembers(f: FiltreMembres & { page: number }): Promise<PaginatedResult<MembreResume>>;
export async function listMembers(f?: FiltreMembres): Promise<MembreResume[]>;
export async function listMembers(f?: FiltreMembres): Promise<MembreResume[] | PaginatedResult<MembreResume>> {
  const membres = await prisma.user.findMany({
    select: SELECT_MEMBRE,
    orderBy: [{ nom: "asc" }, { id: "asc" }],
  });

  const pays = f?.pays?.trim().toLowerCase() ?? "";
  const stack = f?.stack?.trim().toLowerCase() ?? "";
  const q = f?.q?.trim().toLowerCase() ?? "";

  const filtresBruts =
    !pays && !stack && !q
      ? membres
      : membres.filter((membre) => {
          if (pays && membre.pays.toLowerCase() !== pays) return false;
          if (stack && !motsDuCsv(membre.stack).some((s) => s.toLowerCase() === stack)) return false;
          if (q) {
            const dansNom = membre.nom.toLowerCase().includes(q);
            const dansTitre = membre.titre.toLowerCase().includes(q);
            const dansVille = membre.ville.toLowerCase().includes(q);
            if (!dansNom && !dansTitre && !dansVille) return false;
          }
          return true;
        });

  const res = filtresBruts.map(versResume);

  if (f?.page !== undefined) {
    return paginateArray(res, f.page, f.pageSize);
  }
  return res;
}

/** Profil public complet (bio, stack, liens, rôle). `null` si le slug est inconnu. */
export async function getMemberBySlug(slug: string): Promise<MembreDetail | null> {
  if (!slug) return null;
  const membre = await prisma.user.findUnique({ where: { slug } });
  if (membre === null) return null;
  return {
    ...versResume(membre),
    bio: membre.bio,
    github: membre.github,
    linkedin: membre.linkedin,
    site: membre.site,
    verified: membre.verified,
  };
}

/**
 * Liste des pays présents dans l'annuaire, sans doublons, triés — destinée au
 * filtre de la page `/annuaire`. Le tri insensible de `localeCompare` garde
 * « Niger » avant « Nigéria » et les accents à leur place.
 */
export async function listCountries(): Promise<string[]> {
  const lignes = await prisma.user.findMany({ select: { pays: true } });

  const vus = new Set<string>();
  const paysUniques = lignes
    .map((ligne) => ligne.pays.trim())
    .filter((pays) => {
      if (!pays) return false;
      const cle = pays.toLowerCase();
      if (vus.has(cle)) return false; // doublon de casse : "Gabon" / "gabon "
      vus.add(cle);
      return true;
    });

  return paysUniques.sort((a, b) => a.localeCompare(b, "fr"));
}
