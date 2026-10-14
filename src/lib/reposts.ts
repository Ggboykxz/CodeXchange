import { prisma } from "./db";
import { AppError } from "./errors";

/**
 * Repost / partage interne : un membre republie un sujet sur son profil.
 *
 * Règles :
 * - Un membre ne peut pas reposter son propre sujet → `FORBIDDEN`.
 * - `toggleRepost` est idempotent en intention : repost puis annulation.
 * - Les compteurs sont dérivés de la table (pas de dénormalisation).
 */

export type EtatRepost = {
  repostes: number; // nombre total de reposts du sujet
  jeLaiReposte: boolean; // est-ce que j'ai reposté
};

/** Repost / annule le repost d'un sujet par un membre. */
export async function toggleRepost(userId: number, postId: number): Promise<EtatRepost> {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new AppError("FORUM_VALIDATION", "Sujet invalide.");
  }
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new AppError("FORUM_VALIDATION", "Sujet introuvable.");
  if (post.authorId === userId) {
    throw new AppError("FORBIDDEN", "Vous ne pouvez pas repost votre propre sujet.");
  }

  const existant = await prisma.repost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (existant) {
    await prisma.repost.delete({ where: { userId_postId: { userId, postId } } });
  } else {
    await prisma.repost.create({ data: { userId, postId } });
  }
  return getEtatRepost(postId, userId);
}

/** Compte de reposts + état « je l'ai reposté ». */
export async function getEtatRepost(postId: number, userId?: number): Promise<EtatRepost> {
  const [repostes, mien] = await Promise.all([
    prisma.repost.count({ where: { postId } }),
    userId === undefined
      ? Promise.resolve(null)
      : prisma.repost.findUnique({ where: { userId_postId: { userId, postId } }, select: { id: true } }),
  ]);
  return { repostes, jeLaiReposte: mien !== null };
}

/** Sujets repostés par un membre (pour la section « Reposts » du profil), du plus récent. */
export async function listReposts(userId: number): Promise<number[]> {
  const lignes = await prisma.repost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { postId: true },
  });
  return lignes.map((l) => l.postId);
}
