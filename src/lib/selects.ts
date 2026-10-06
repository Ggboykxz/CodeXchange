/**
 * Sélecteurs Prisma « publics ».
 *
 * Règle : un `include: { user: true }` renvoie TOUTES les colonnes, y compris
 * `passwordHash` et `role`. Tout endpoint qui exposera un utilisateur doit passer
 * par ces `select` pour ne jamais fuier un hash.
 */
import type { Prisma } from "@prisma/client";

/** Utilisateur exposé publiquement (liste, auteur d'un thread, profil…). */
export const publicUserSelect = {
  id: true,
  name: true,
  image: true,
  profile: true,
} satisfies Prisma.UserSelect;

/** Utilisateur connecté — ajout de email/role, jamais de passwordHash. */
export const authUserSelect = {
  ...publicUserSelect,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/** Auteur embarqué dans une ressource (question, offre, projet, tuto…). */
export const authorSelect = publicUserSelect satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
export type AuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;
