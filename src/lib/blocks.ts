import { prisma } from "./db";
import { AppError } from "./errors";

/**
 * Blocage de membres (graphe social).
 *
 * Quand A bloque B, la relation est **symétrique au niveau de la visibilité** :
 * - A ne voit plus le contenu de B,
 * - B ne voit plus le contenu de A,
 * - aucune interaction directe (message, etc.) entre eux.
 *
 * `idsAEviter` renvoie l'union de « ceux que je bloque » et « ceux qui me
 * bloquent » pour filtrer les fils et annuaires dans les deux sens.
 */

/** Bloque / débloque un membre. Retourne l'état après action (`true` = bloqué). */
export async function toggleBlock(blockerId: number, blockedId: number): Promise<boolean> {
  if (!Number.isInteger(blockedId) || blockedId <= 0) {
    throw new AppError("FORUM_VALIDATION", "Utilisateur invalide.");
  }
  if (blockerId === blockedId) {
    throw new AppError("FORBIDDEN", "Vous ne pouvez pas vous bloquer vous-même.");
  }
  const cible = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!cible) throw new AppError("FORBIDDEN", "Utilisateur introuvable.");

  const existant = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
  if (existant) {
    await prisma.block.delete({ where: { blockerId_blockedId: { blockerId, blockedId } } });
    return false;
  }
  await prisma.block.create({ data: { blockerId, blockedId } });
  return true;
}

/** Est-ce que `blockerId` a bloqué `blockedId` ? */
export async function isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
  const lien = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { id: true },
  });
  return lien !== null;
}

/**
 * Ids de membres à ignorer pour `userId` : ceux qu'il a bloqués **et** ceux
 * qui l'ont bloqué (filtrage symétrique des fils).
 */
export async function idsAEviter(userId: number): Promise<number[]> {
  const [bloques, bloquants] = await Promise.all([
    prisma.block.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
    prisma.block.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
  ]);
  return [...new Set([...bloques.map((b) => b.blockedId), ...bloquants.map((b) => b.blockerId)])];
}

/** Membres bloqués par `userId` (pour la gestion dans les paramètres/profil). */
export async function listBlocked(blockerId: number): Promise<number[]> {
  const lignes = await prisma.block.findMany({
    where: { blockerId },
    orderBy: { createdAt: "desc" },
    select: { blockedId: true },
  });
  return lignes.map((l) => l.blockedId);
}
