import { prisma } from "./db";
import { AppError } from "./errors";

/**
 * Réactions sociales (Reddit/Facebook-like) sur posts ET réponses.
 *
 * Règles :
 * - Une seule réaction par (utilisateur, cible) : re-sélectionner un autre emoji
 *   remplace le précédent, re-sélectionner le même le retire (toggle).
 * - `emoji` est validé contre une liste blanche (jamais de valeur libre en BDD).
 * - Agrégats retournés dans l'ordre canonique `REACTIONS` pour un affichage stable.
 */

export type ReactionKind = "post" | "reply";

/** Liste blanche des réactions, dans l'ordre d'affichage. */
export const REACTIONS = [
  { emoji: "👍", cle: "like", label: "J'aime" },
  { emoji: "❤️", cle: "love", label: "Adore" },
  { emoji: "🎉", cle: "celebrate", label: "Félicite" },
  { emoji: "🤔", cle: "think", label: "Réfléchit" },
  { emoji: "🔥", cle: "fire", label: "Impressionné" },
  { emoji: "🚀", cle: "rocket", label: "Top" },
] as const;

const EMOJIS_VALIDES: Set<string> = new Set(REACTIONS.map((r) => r.emoji));

export type ReactionKindTarget = { kind: ReactionKind; targetId: number };

export type ReactionCounts = {
  /** Compteurs par emoji, dans l'ordre `REACTIONS` (emoji → nombre). */
  totaux: Record<string, number>;
  /** Emoji sélectionné par l'utilisateur courant (ou null). */
  maReaction: string | null;
  /** Nombre total de réactions (somme des compteurs). */
  total: number;
};

function comptesVides(): ReactionCounts {
  const totaux: Record<string, number> = Object.fromEntries(REACTIONS.map((r) => [r.emoji, 0]));
  return { totaux, maReaction: null, total: 0 };
}

/**
 * Pose/remplace/retire la réaction d'un utilisateur sur une cible.
 * - emoji nouveau → l'ajoute (remplace l'ancien s'il y en avait un).
 * - emoji déjà posé → le retire (toggle off).
 * Lève `FORUM_VALIDATION` si l'emoji ou la cible est invalide.
 */
export async function toggleReaction(
  userId: number,
  kind: ReactionKind,
  targetId: number,
  emoji: string
): Promise<ReactionCounts> {
  if (kind !== "post" && kind !== "reply") {
    throw new AppError("FORUM_VALIDATION", "Type de cible invalide.");
  }
  if (!Number.isInteger(targetId) || targetId <= 0) {
    throw new AppError("FORUM_VALIDATION", "Cible invalide.");
  }
  if (!EMOJIS_VALIDES.has(emoji)) {
    throw new AppError("FORUM_VALIDATION", "Réaction inconnue.");
  }

  const existante = await prisma.reaction.findUnique({
    where: { userId_kind_targetId: { userId, kind, targetId } },
  });

  if (existante && existante.emoji === emoji) {
    // Toggle off : même emoji → on retire.
    await prisma.reaction.delete({
      where: { userId_kind_targetId: { userId, kind, targetId } },
    });
  } else if (existante) {
    // Remplacement : un seul emoji par utilisateur/cible.
    await prisma.reaction.update({
      where: { userId_kind_targetId: { userId, kind, targetId } },
      data: { emoji },
    });
  } else {
    await prisma.reaction.create({ data: { userId, kind, targetId, emoji } });
  }

  return getReactions(kind, targetId, userId);
}

/** Agrégats de réactions d'une cible, avec l'état de l'utilisateur courant. */
export async function getReactions(
  kind: ReactionKind,
  targetId: number,
  userId?: number
): Promise<ReactionCounts> {
  const lignes = await prisma.reaction.groupBy({
    by: ["emoji"],
    where: { kind, targetId },
    _count: { _all: true },
  });

  if (lignes.length === 0 && userId === undefined) return comptesVides();

  const totaux: Record<string, number> = Object.fromEntries(REACTIONS.map((r) => [r.emoji, 0]));
  let total = 0;
  for (const l of lignes) {
    if (EMOJIS_VALIDES.has(l.emoji)) {
      totaux[l.emoji] = l._count._all;
      total += l._count._all;
    }
  }

  let maReaction: string | null = null;
  if (userId !== undefined) {
    const mien = await prisma.reaction.findUnique({
      where: { userId_kind_targetId: { userId, kind, targetId } },
      select: { emoji: true },
    });
    maReaction = mien?.emoji ?? null;
  }

  return { totaux, maReaction, total };
}

/**
 * Agrégats pour plusieurs cibles d'un même type en une seule passe
 * (utilisé pour charger les réponses d'un sujet sans N+1).
 */
export async function getReactionsPourCibles(
  kind: ReactionKind,
  targetIds: number[],
  userId?: number
): Promise<Map<number, ReactionCounts>> {
  const map = new Map<number, ReactionCounts>();
  if (targetIds.length === 0) return map;

  const [lignes, miennes] = await Promise.all([
    prisma.reaction.groupBy({
      by: ["emoji", "targetId"],
      where: { kind, targetId: { in: targetIds } },
      _count: { _all: true },
    }),
    userId === undefined
      ? Promise.resolve([])
      : prisma.reaction.findMany({
          where: { kind, targetId: { in: targetIds }, userId },
          select: { targetId: true, emoji: true },
        }),
  ]);

  for (const id of targetIds) map.set(id, comptesVides());
  for (const l of lignes) {
    if (!EMOJIS_VALIDES.has(l.emoji)) continue;
    const c = map.get(l.targetId);
    if (c) {
      c.totaux[l.emoji] = l._count._all;
      c.total += l._count._all;
    }
  }
  const parCible = new Map(miennes.map((m) => [m.targetId, m.emoji]));
  for (const id of targetIds) {
    const c = map.get(id);
    if (c) c.maReaction = parCible.get(id) ?? null;
  }
  return map;
}
