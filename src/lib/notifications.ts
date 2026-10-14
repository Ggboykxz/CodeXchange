import type { Notification, User } from "@prisma/client";
import { prisma } from "./db";

/**
 * Notifications in-app (Task notifications).
 *
 * Types (catalogue) :
 * - `REPONSE_SUJET` : une réponse a été postée sur un sujet
 * - `LIKE_SUJET` : un like a été ajouté à un sujet
 * - `CANDIDATURE` : une candidature à une offre d'emploi
 * - `REJOINDRE_PROJET` : un membre a rejoint un projet
 * - `DEMANDE_MENTOR` : une demande de mentorat reçue
 *
 * Les déclencheurs (triggers) sont *fire-and-forget* : l'échec de la création
 * d'une notification n'interrompt jamais l'opération principale (réponse, like,
 * candidature, adhésion, demande de mentorat).
 */

/**
 * Remarque de portée : les événements (RSVP) n'émettent aucune notification,
 * car `Event` n'a pas de champ `authorId` — choix délibéré pour limiter le
 * risque de migration. Seuls les auteurs/propriétaires existants (sujets de
 * forum, offres d'emploi, projets) et les mentors reçoivent des notifications.
 */

export const TYPES_NOTIFICATION = [
  "REPONSE_SUJET",
  "LIKE_SUJET",
  "CANDIDATURE",
  "REJOINDRE_PROJET",
  "DEMANDE_MENTOR",
  "MESSAGE",
  "MENTION",
] as const;

export type NotificationType = (typeof TYPES_NOTIFICATION)[number];

// Alias pour compatibilité avec les différentes conventions de nommage.
export type TypeNotification = NotificationType;
export type TypeNotif = NotificationType;
export type CatalogueNotification = NotificationType;

export const TYPES_NOTIF = TYPES_NOTIFICATION;
export const NOTIFICATION_TYPES = TYPES_NOTIFICATION;

export const NOTIFICATION_TYPE = {
  REPONSE_SUJET: "REPONSE_SUJET",
  LIKE_SUJET: "LIKE_SUJET",
  CANDIDATURE: "CANDIDATURE",
  REJOINDRE_PROJET: "REJOINDRE_PROJET",
  DEMANDE_MENTOR: "DEMANDE_MENTOR",
  MESSAGE: "MESSAGE",
  MENTION: "MENTION",
} as const satisfies Record<NotificationType, NotificationType>;

export type NouvelleNotification = {
  userId: number;
  type: NotificationType | string;
  text: string;
  lien?: string;
};

export type OptionsListeNotifications = {
  limit?: number;
  unreadOnly?: boolean;
};

const LIMITE_PAR_DEFAUT = 20;

function normaliseLimite(valeur: number | undefined): number {
  if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur <= 0) {
    return LIMITE_PAR_DEFAUT;
  }
  return Math.min(Math.trunc(valeur), 100);
}

/**
 * Crée une notification et retourne son id.
 * `data` : `{ userId, type, text, lien? }`.
 *
 * Déclenche aussi un e-mail *fire-and-forget* (jamais bloquant, jamais fatal)
 * vers le destinataire, selon le transport configuré (`src/lib/mailer.ts`).
 */
export async function createNotification(data: NouvelleNotification): Promise<number> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: String(data.type),
      text: data.text,
      lien: data.lien ?? "",
    },
    select: { id: true },
  });

  // E-mail fire-and-forget : ne doit jamais faire échouer la notification.
  try {
    void envoyerEmailNotification(data.userId, data.text, data.lien ?? "");
  } catch {
    // volontairement ignoré
  }

  return notification.id;
}

/** Croisement DB → mailer (isolé pour être testable et non bloquant). */
async function envoyerEmailNotification(userId: number, texte: string, lien: string): Promise<void> {
  const [destinataire, mailer] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, nom: true } }),
    import("./mailer"),
  ]);
  if (!destinataire?.email) return;
  await mailer.sendNotificationEmail(destinataire.email, destinataire.nom, texte, lien);
}

/**
 * Liste les notifications d'un utilisateur (du plus récent au plus ancien).
 * `unreadOnly` filtre les non lues ; `limit` borne le nombre (défaut 20).
 */
export async function listNotifications(
  userId: number,
  options?: OptionsListeNotifications,
): Promise<Notification[]> {
  const limit = normaliseLimite(options?.limit);
  return prisma.notification.findMany({
    where: {
      userId,
      ...(options?.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

/** Marque une notification comme lue (ciblée par utilisateur). Retourne le nombre mis à jour. */
export async function markRead(id: number, userId: number): Promise<number> {
  const resultat = await prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  return resultat.count;
}

/** Marque toutes les notifications de l'utilisateur comme lues. */
export async function markAllRead(userId: number): Promise<number> {
  const resultat = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return resultat.count;
}

/** Nombre de notifications non lues pour un utilisateur. */
export async function unreadCount(userId: number): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export type { User };
