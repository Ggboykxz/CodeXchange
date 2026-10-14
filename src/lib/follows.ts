import { prisma } from "./db";
import { AppError } from "./errors";

/**
 * Graphe social : suivi d'utilisateurs (follow).
 *
 * Règles :
 * - Un utilisateur ne peut pas se suivre lui-même → `FORBIDDEN`.
 * - `toggleFollow` est idempotent en intention : suivre puis se désabonner.
 * - Les compteurs sont dérivés de la table (pas de dénormalisation).
 */

export type CompteursSuivi = {
  abonnes: number; // followers
  abonnements: number; // following
  jeLeSuis: boolean; // est-ce que je suis cet utilisateur
};

/** Impossible de se suivre soi-même. */
export async function toggleFollow(followerId: number, followeeId: number): Promise<CompteursSuivi> {
  if (!Number.isInteger(followeeId) || followeeId <= 0) {
    throw new AppError("FORUM_VALIDATION", "Utilisateur invalide.");
  }
  if (followerId === followeeId) {
    throw new AppError("FORBIDDEN", "Vous ne pouvez pas vous suivre vous-même.");
  }

  const existant = await prisma.userFollow.findUnique({
    where: { followerId_followeeId: { followerId, followeeId } },
  });

  if (existant) {
    await prisma.userFollow.delete({
      where: { followerId_followeeId: { followerId, followeeId } },
    });
  } else {
    // Vérifie que la cible existe bien avant d'insérer.
    const cible = await prisma.user.findUnique({ where: { id: followeeId }, select: { id: true } });
    if (!cible) throw new AppError("FORBIDDEN", "Utilisateur introuvable.");
    await prisma.userFollow.create({ data: { followerId, followeeId } });
  }

  return getCompteursSuivi(followeeId, followerId);
}

/** Ids des membres suivis par `userId` (pour le fil d'abonnements du forum). */
export async function idsSuivis(userId: number): Promise<number[]> {
  const lignes = await prisma.userFollow.findMany({
    where: { followerId: userId },
    select: { followeeId: true },
  });
  return lignes.map((l) => l.followeeId);
}

/** Compteurs + état « je le suis » pour un profil visité. */
export async function getCompteursSuivi(userId: number, viewerId?: number): Promise<CompteursSuivi> {
  const [abonnes, abonnements, lien] = await Promise.all([
    prisma.userFollow.count({ where: { followeeId: userId } }),
    prisma.userFollow.count({ where: { followerId: userId } }),
    viewerId === undefined || viewerId === userId
      ? Promise.resolve(null)
      : prisma.userFollow.findUnique({
          where: { followerId_followeeId: { followerId: viewerId, followeeId: userId } },
          select: { followeeId: true },
        }),
  ]);
  return { abonnes, abonnements, jeLeSuis: lien !== null };
}

/** Profils des abonnés d'un utilisateur (ordre anté-chronologique). */
export async function listAbonnes(userId: number): Promise<AbonneResume[]> {
  const lignes = await prisma.userFollow.findMany({
    where: { followeeId: userId },
    orderBy: { createdAt: "desc" },
    select: { follower: { select: SELECT_ABONNE } },
  });
  return lignes.map((l) => l.follower);
}

/** Profils des utilisateurs suivis (ordre anté-chronologique). */
export async function listAbonnements(userId: number): Promise<AbonneResume[]> {
  const lignes = await prisma.userFollow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    select: { followee: { select: SELECT_ABONNE } },
  });
  return lignes.map((l) => l.followee);
}

const SELECT_ABONNE = {
  id: true,
  nom: true,
  slug: true,
  titre: true,
  ville: true,
  pays: true,
  avatar: true,
  role: true,
} as const;

export type AbonneResume = {
  id: number;
  nom: string;
  slug: string;
  titre: string;
  ville: string;
  pays: string;
  avatar: string;
  role: string;
};
