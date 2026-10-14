import { prisma } from "./db";

/**
 * Confidentialité du profil.
 *
 * - `PUBLIC` : profil entièrement visible par tous.
 * - `PRIVATE` : seuls le propriétaire et ses abonnés voient la bio, les liens
 *   et la localisation ; les autres visiteurs n'voient que nom/titre/avatars.
 *
 * Le propriétaire voit toujours son profil en entier.
 */

export type VisibiliteProfil = {
  /** true si le visiteur voit la profil complète (bio, liens, localisation). */
  complet: boolean;
  /** true si le profil est en mode privé. */
  prive: boolean;
};

/** Détermine si `viewerId` peut voir le profil complet de `membreId`. */
export async function visibiliteProfil(membreId: number, viewerId?: number): Promise<VisibiliteProfil> {
  const membre = await prisma.user.findUnique({
    where: { id: membreId },
    select: { privacy: true },
  });
  const prive = membre?.privacy === "PRIVATE";
  if (!prive) return { complet: true, prive: false };

  // Profil privé : propriétaire ou abonné.
  if (viewerId === undefined) return { complet: false, prive: true };
  if (viewerId === membreId) return { complet: true, prive: true };
  const abonne = await prisma.userFollow.findUnique({
    where: { followerId_followeeId: { followerId: viewerId, followeeId: membreId } },
    select: { followeeId: true },
  });
  return { complet: abonne !== null, prive: true };
}
