import type { User } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";
import { createNotification } from "./notifications";
import type { PaginatedResult } from "./pagination";
import { paginateArray } from "./pagination";

export type { PaginatedResult } from "./pagination";

/**
 * Mentorat v1 (spec) : profils de mentors (`role = "MENTOR"`) + formulaire
 * « demander un mentorat », enregistré dans `MentorRequest` — pas de
 * messagerie en v1.
 *
 * Règles : `mentorId === requesterId` → `MENTOR_SELF_REQUEST` (403) ;
 * demande déjà existante → `MENTOR_DUPLICATE` (409) ; message de 10 à 1000
 * caractères, sinon `FORUM_VALIDATION` (422). La course sur l'index unique
 * `(mentorId, requesterId)` est rattrapée (Review Focus n°1), et
 * `listMentors()` ne retourne que les membres porteurs du rôle `MENTOR`.
 */

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 1000;

/** Champs du profil mentor exposés à l'écran (jamais `passwordHash` ni l'e-mail). */
const SELECT_MENTOR = {
  id: true,
  nom: true,
  slug: true,
  titre: true,
  ville: true,
  pays: true,
  role: true,
  bio: true,
  createdAt: true,
  stack: true,
} as const;

type MentorBrut = Pick<User, keyof typeof SELECT_MENTOR>;

export type MentorResume = Omit<MentorBrut, "stack"> & {
  /** Entrées du CSV, nettoyées : `["Node", "Postgres"]`. */
  stack: string[];
};

/** Découpe un CSV « Node,Postgres » en jetons nettoyés. */
function motsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((mot) => mot.trim())
    .filter(Boolean);
}

function versResume(mentore: MentorBrut): MentorResume {
  const { stack, ...reste } = mentore;
  return { ...reste, stack: motsDuCsv(stack) };
}

/** Violation d'index unique Prisma (P2002), y compris sous concurrence. */
function estDoublon(erreur: unknown): boolean {
  return (
    typeof erreur === "object" &&
    erreur !== null &&
    (erreur as { code?: string }).code === "P2002"
  );
}

/** Liste des mentors, par ordre alphabétique — uniquement `role = "MENTOR"`. */
export async function listMentors(f: { page: number; pageSize?: number }): Promise<PaginatedResult<MentorResume>>;
export async function listMentors(f?: { page?: number; pageSize?: number }): Promise<MentorResume[]>;
export async function listMentors(f?: { page?: number; pageSize?: number }): Promise<MentorResume[] | PaginatedResult<MentorResume>> {
  const mentors = await prisma.user.findMany({
    where: { role: "MENTOR" },
    select: SELECT_MENTOR,
    orderBy: [{ nom: "asc" }, { id: "asc" }],
  });
  const res = mentors.map(versResume);
  if (f?.page !== undefined) {
    return paginateArray(res, f.page, f.pageSize);
  }
  return res;
}

/**
 * Profil public d'un membre porteur du rôle `MENTOR`. `null` si l'id est
 * invalide, l'utilisateur est inconnu ou n'est pas mentor (la route en tire un
 * 404).
 */
export async function getMentor(id: number): Promise<MentorResume | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const mentore = await prisma.user.findUnique({ where: { id }, select: SELECT_MENTOR });
  if (mentore === null || mentore.role !== "MENTOR") return null;
  return versResume(mentore);
}

/**
 * Enregistre une demande de mentorat et retourne son id.
 * Ordre des contrôles : soi-même (403) → mentor existant et doté du rôle (422)
 * → demande déjà envoyée (409) → longueur du message (422).
 */
export async function requestMentor(
  mentorId: number,
  requesterId: number,
  message: string,
): Promise<number> {
  if (mentorId === requesterId) throw new AppError("MENTOR_SELF_REQUEST");

  const mentore = await prisma.user.findUnique({
    where: { id: mentorId },
    select: { id: true, role: true },
  });
  if (!mentore || mentore.role !== "MENTOR") {
    throw new AppError("FORUM_VALIDATION", "Mentor introuvable.");
  }

  const paire = { mentorId, requesterId };
  const existante = await prisma.mentorRequest.findUnique({
    where: { mentorId_requesterId: paire },
    select: { id: true },
  });
  if (existante) throw new AppError("MENTOR_DUPLICATE");

  const texte = message.trim();
  if (texte.length < MESSAGE_MIN || texte.length > MESSAGE_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `Le message doit faire entre ${MESSAGE_MIN} et ${MESSAGE_MAX} caractères.`,
    );
  }

  try {
    const demande = await prisma.mentorRequest.create({
      data: { mentorId, requesterId, message: texte },
      select: { id: true },
    });

    // Notification au mentor (si différent du demandeur — toujours vrai ici).
    if (mentorId !== requesterId) {
      try {
        await createNotification({
          userId: mentorId,
          type: "DEMANDE_MENTOR",
          text: "Vous avez reçu une nouvelle demande de mentorat.",
          lien: `/mentorat`,
        });
      } catch {
        // fire-and-forget
      }
    }

    return demande.id;
  } catch (erreur) {
    if (estDoublon(erreur)) throw new AppError("MENTOR_DUPLICATE");
    throw erreur;
  }
}

/** Ce membre a-t-il déjà demandé ce mentor ? (utilisé par la page `/mentorat`) */
export async function aDemande(requesterId: number, mentorId: number): Promise<boolean> {
  const ligne = await prisma.mentorRequest.findUnique({
    where: { mentorId_requesterId: { mentorId, requesterId } },
    select: { id: true },
  });
  return ligne !== null;
}
