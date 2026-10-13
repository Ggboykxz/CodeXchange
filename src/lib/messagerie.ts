/**
 * Messagerie privée — DM en un fil par paire d'utilisateurs. Les messages
 * sont stockés bruts (pas chiffrés Phase 1 — acceptable pour la démo).
 */
import { prisma } from "./db";
import { createNotification } from "./notifications";

export type MessageDetail = {
  id: number;
  senderId: number;
  recipientId: number;
  corps: string;
  isRead: boolean;
  createdAt: Date;
};

export type ThreadResume = {
  autreId: number;
  autreNom: string;
  autreSlug: string;
  dernierCorps: string;
  dernierDate: Date;
  nonLus: number;
};

export async function sendDm(senderId: number, recipientId: number, corps: string): Promise<number> {
  if (senderId === recipientId) throw new Error("SELF_DM");
  const texte = corps.trim();
  if (!texte || texte.length > 2000) throw new Error("INVALID_CORPS");
  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) throw new Error("RECIPIENT_NOT_FOUND");

  const msg = await prisma.message.create({ data: { senderId, recipientId, corps: texte } });

  // Notification à la réception.
  try {
    await createNotification({ userId: recipientId, type: "MESSAGE", text: "Vous avez reçu un nouveau message.", lien: "/messagerie" });
  } catch {
    // fire-and-forget
  }
  return msg.id;
}

export async function listThreads(userId: number): Promise<ThreadResume[]> {
  // Récupérer tous les messages impliquant l'utilisateur.
  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    select: { senderId: true, recipientId: true, corps: true, isRead: true, createdAt: true },
  });

  const autres = new Map<number, { dernierCorps: string; dernierDate: Date; nonLus: number }>();
  for (const m of msgs) {
    const autreId = m.senderId === userId ? m.recipientId : m.senderId;
    if (!autres.has(autreId)) {
      autres.set(autreId, { dernierCorps: m.corps, dernierDate: m.createdAt, nonLus: 0 });
    }
    const slot = autres.get(autreId)!;
    if (m.recipientId === userId && !m.isRead) slot.nonLus += 1;
  }

  const userIds = Array.from(autres.keys());
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, nom: true, slug: true } })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  return Array.from(autres.entries())
    .sort((a, b) => b[1].dernierDate.getTime() - a[1].dernierDate.getTime())
    .map(([id, info]) => {
      const u = userMap.get(id);
      return {
        autreId: id,
        autreNom: u?.nom ?? "Membre",
        autreSlug: u?.slug ?? "",
        dernierCorps: info.dernierCorps,
        dernierDate: info.dernierDate,
        nonLus: info.nonLus,
      };
    });
}

export async function listMessages(a: number, b: number): Promise<MessageDetail[]> {
  // Mark messages sent to a as read.
  await prisma.message.updateMany({
    where: { senderId: b, recipientId: a, isRead: false },
    data: { isRead: true },
  });
  const msgs = await prisma.message.findMany({
    where: { OR: [{ senderId: a, recipientId: b }, { senderId: b, recipientId: a }] },
    orderBy: { createdAt: "asc" },
  });
  return msgs;
}

export async function unreadMessages(userId: number): Promise<number> {
  return prisma.message.count({ where: { recipientId: userId, isRead: false } });
}
