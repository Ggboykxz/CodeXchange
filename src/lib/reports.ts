/**
 * Signalements et modération communautaire.
 *
 * Un membre signale un contenu (`kind` + `targetId` + `raison`) ; un admin
 * traite le signalement (`TRAITE` / `REJETE`) et peut bannir un membre
 * (`User.bannedAt`) — laquelle bloque la connexion et les sessions actives.
 */

import { prisma } from "./db";
import { AppError } from "./errors";

export const KINDS_SIGNALEMENT = [
  "post",
  "reply",
  "job",
  "projet",
  "evenement",
  "tuto",
  "membre",
  "message",
] as const;

export type KindSignalement = (typeof KINDS_SIGNALEMENT)[number];

export type NouveauSignalement = {
  reporterId: number;
  kind: KindSignalement;
  targetId: number;
  raison: string;
};

export function estKindSignalement(valeur: unknown): valeur is KindSignalement {
  return typeof valeur === "string" && KINDS_SIGNALEMENT.includes(valeur as KindSignalement);
}

export async function createReport(data: NouveauSignalement): Promise<number> {
  const raison = data.raison.trim();
  if (!raison || raison.length > 500) {
    throw new AppError("FORUM_VALIDATION", "Le motif doit faire entre 1 et 500 caractères.");
  }
  const report = await prisma.report.create({
    data: {
      reporterId: data.reporterId,
      kind: data.kind,
      targetId: data.targetId,
      raison,
      statut: "PENDING",
    },
    select: { id: true },
  });
  return report.id;
}

export async function listReports(statut?: "PENDING" | "TRAITE" | "REJETE") {
  return prisma.report.findMany({
    where: statut ? { statut } : {},
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
    include: { reporter: { select: { nom: true, slug: true } } },
  });
}

export async function countPendingReports(): Promise<number> {
  return prisma.report.count({ where: { statut: "PENDING" } });
}

/** Traite ou rejette un signalement. Renvoie le nombre de lignes mises à jour. */
export async function resolveReport(
  reportId: number,
  adminId: number,
  decision: "TRAITE" | "REJETE",
): Promise<number> {
  const { count } = await prisma.report.updateMany({
    where: { id: reportId },
    data: { statut: decision, resolvedAt: new Date(), resolvedById: adminId },
  });
  return count;
}

/** Bannit un membre : `bannedAt` + destruction des sessions actives. */
export async function banUser(userId: number): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { bannedAt: new Date() } });
  await prisma.session.deleteMany({ where: { userId } });
}

/** Lève un bannissement. */
export async function unbanUser(userId: number): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { bannedAt: null } });
}

export async function listBannedUsers() {
  return prisma.user.findMany({
    where: { bannedAt: { not: null } },
    orderBy: { bannedAt: "desc" },
    select: { id: true, nom: true, slug: true, email: true, bannedAt: true },
    take: 100,
  });
}
