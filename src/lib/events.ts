import type { Event } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";
import type { PaginatedResult } from "./pagination";
import { paginateArray } from "./pagination";

export type { PaginatedResult } from "./pagination";

/**
 * Événements (spec) : `titre`, `date` (ISO), `format` (`Présentiel` |
 * `En ligne`), `ville`, `pays` ou `lien`, `description`. RSVP unique par
 * membre, compteur **monotone** (pas de désinscription en v1).
 *
 * `listEvents()` est trié par date croissante : les événements passés
 * ressortent donc d'abord, puis les événements à venir — l'ordre naturel pour
 * une page « Passé / À venir ». La course sur l'index unique
 * `(eventId, userId)` est rattrapée comme pour les likes et les postulations
 * (Review Focus n°1).
 *
 * Remarque (Task 8) : `errors.ts` appartient au socle livré et reste inchangé ;
 * le doublon de RSVP réutilise donc le code 409 « action déjà effectuée »
 * `JOB_DUPLICATE_APPLICATION`, que la route traduit en message FR dédié.
 */

export const FORMATS = ["Présentiel", "En ligne"] as const;
export type Format = (typeof FORMATS)[number];

const TITRE_MIN = 3;
const TITRE_MAX = 120;
const DESCRIPTION_MAX = 2000;
const LIEU_MAX = 60;

/** Champs RSVP exposés à l'écran (jamais les lignes brutes de la table). */
const INCLUS = { _count: { select: { rsvps: true } } } as const;

export type EventResume = Omit<Event, "rsvps"> & {
  _count: { rsvps: number };
};

export type FiltreEvents = { page?: number; pageSize?: number };

export type EventInput = {
  titre: string;
  description: string;
  date: Date | string;
  format: string;
  ville?: string;
  pays?: string;
  lien?: string;
};

/** URL d'origine : `http(s)://…` uniquement (les `javascript:` sont rejetés). */
function estUrlValide(valeur: string): boolean {
  try {
    const url = new URL(valeur);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Violation d'index unique Prisma (P2002), y compris sous concurrence. */
function estDoublon(erreur: unknown): boolean {
  return (
    typeof erreur === "object" &&
    erreur !== null &&
    (erreur as { code?: string }).code === "P2002"
  );
}

/**
 * Liste des événements, du plus ancien au plus récent : les passés d'abord,
 * puis les événements à venir dans l'ordre de leur date.
 */
export async function listEvents(f: { page: number; pageSize?: number }): Promise<PaginatedResult<EventResume>>;
export async function listEvents(f?: { page?: number; pageSize?: number }): Promise<EventResume[]>;
export async function listEvents(f?: { page?: number; pageSize?: number }): Promise<EventResume[] | PaginatedResult<EventResume>> {
  const evenements = await prisma.event.findMany({
    orderBy: [{ date: "asc" }, { id: "asc" }],
    include: INCLUS,
  });
  if (f?.page !== undefined) {
    return paginateArray(evenements, f.page, f.pageSize);
  }
  return evenements;
}

/** Événement complet (compteur RSVP). `null` si inexistant ou id invalide. */
export async function getEvent(id: number): Promise<EventResume | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.event.findUnique({ where: { id }, include: INCLUS });
}

/** Création d'un événement ; lève `FORUM_VALIDATION` (422) en cas de règle violée. */
export async function createEvent(i: EventInput): Promise<number> {
  const titre = i.titre.trim();
  const description = i.description.trim();
  const format = i.format.trim();
  const ville = (i.ville ?? "").trim();
  const pays = (i.pays ?? "").trim();
  const lien = (i.lien ?? "").trim();
  const date = i.date instanceof Date ? i.date : new Date(i.date);

  if (titre.length < TITRE_MIN || titre.length > TITRE_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `Le titre doit faire entre ${TITRE_MIN} et ${TITRE_MAX} caractères.`,
    );
  }
  if (!description || description.length > DESCRIPTION_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `La description est obligatoire (${DESCRIPTION_MAX} car. max).`,
    );
  }
  if (Number.isNaN(date.getTime())) {
    throw new AppError("FORUM_VALIDATION", "La date de l'événement est invalide.");
  }
  if (!(FORMATS as readonly string[]).includes(format)) {
    throw new AppError("FORUM_VALIDATION", `Le format doit être l'un de : ${FORMATS.join(", ")}.`);
  }
  if (ville.length > LIEU_MAX || pays.length > LIEU_MAX) {
    throw new AppError("FORUM_VALIDATION", `La ville et le pays ne peuvent pas dépasser ${LIEU_MAX} car.`);
  }
  if (format === "En ligne" && !estUrlValide(lien)) {
    throw new AppError("FORUM_VALIDATION", "Un événement en ligne exige un lien http(s).");
  }
  if (lien && !estUrlValide(lien)) {
    throw new AppError("FORUM_VALIDATION", "Le lien doit être une URL valide (https://…).");
  }

  const evenement = await prisma.event.create({
    data: { titre, description, date, format, ville, pays, lien },
    select: { id: true },
  });
  return evenement.id;
}

/**
 * RSVP unique : enregistre `(eventId, userId)` et retourne le nouveau
 * compteur. La 2ᵉ présence lève `JOB_DUPLICATE_APPLICATION` (409), même si
 * deux requêtes simultanées passent le premier contrôle (rattrapage P2002).
 * Événement absent → `FORUM_VALIDATION`, la route répond 404 (même schéma que
 * `applyToJob`).
 */
export async function rsvp(eventId: number, userId: number): Promise<number> {
  const evenement = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!evenement) throw new AppError("FORUM_VALIDATION", "Événement introuvable.");

  const paire = { eventId, userId };
  const existant = await prisma.rsvp.findUnique({ where: { eventId_userId: paire } });
  if (existant) throw new AppError("JOB_DUPLICATE_APPLICATION");

  try {
    await prisma.rsvp.create({ data: paire });
  } catch (erreur) {
    if (estDoublon(erreur)) throw new AppError("JOB_DUPLICATE_APPLICATION");
    throw erreur;
  }

  return prisma.rsvp.count({ where: { eventId } });
}

/** Ce membre a-t-il déjà confirmé sa présence ? (utilisé par la page de détail) */
export async function aRsvp(userId: number, eventId: number): Promise<boolean> {
  const ligne = await prisma.rsvp.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { eventId: true },
  });
  return ligne !== null;
}
