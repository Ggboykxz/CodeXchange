/**
 * Validation d'entrée — zod.
 *
 * Règle : aucun `req.json()` ne touche Prisma sans passer par ici.
 * Un schéma décrit aussi la *forme* de la payload : les champs d'identité
 * (`authorId`, `isAnswer`, `role`…) n'y figurent pas, ils sont fixés serveur.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Longueurs bornées : évite de stocker des chaînes de plusieurs Mo. */
export const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const CATEGORIES = [
  "general",
  "frontend",
  "backend",
  "mobile",
  "devops",
  "ai",
  "career",
] as const;

export const LEVELS = ["junior", "mid", "senior", "lead"] as const;

export const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
] as const;

export const PROJECT_STATUSES = ["idea", "mvp", "beta", "live", "maintained"] as const;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email("Invalid email address");

/** Politique de mot de passe : 8+ avec au moins une lettre ET un chiffre. */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: "Password must contain at least one letter and one number",
  });

const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/,
    "Only lowercase letters, digits, dot, dash and underscore"
  );

/** Tags/stack : liste CSV nettoyée, jamais d'objet fourni par le client. */
const csv = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20)
        .join(",")
    );

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const registerSchema = z.object({
  name: text(2, 80),
  email,
  password,
  username,
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  stack: csv(300),
  level: z.enum(LEVELS).optional().default("junior"),
});

export const profileUpdateSchema = z.object({
  name: text(2, 80).optional(),
  headline: z.string().trim().max(140).optional(),
  bio: z.string().trim().max(2000).optional(),
  country: z.string().trim().max(80).nullable().optional(),
  city: z.string().trim().max(80).nullable().optional(),
  stack: csv(300),
  level: z.enum(LEVELS).optional(),
  github: z.string().trim().max(60).nullable().optional(),
  twitter: z.string().trim().max(60).nullable().optional(),
  linkedin: z.string().trim().max(80).nullable().optional(),
  website: z.string().trim().max(255).nullable().optional(),
  available: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/* Q&R (le cœur)                                                       */
/* ------------------------------------------------------------------ */

export const threadCreateSchema = z.object({
  title: text(8, 180),
  body: text(1, 40_000),
  tags: csv(200),
  category: z.enum(CATEGORIES).optional().default("general"),
});

export const threadUpdateSchema = z.object({
  title: text(8, 180).optional(),
  body: text(1, 40_000).optional(),
  category: z.enum(CATEGORIES).optional(),
  pinned: z.boolean().optional(),
  solved: z.boolean().optional(),
});

export const postCreateSchema = z.object({
  body: text(1, 40_000),
});

export const voteSchema = z.object({
  target: z.enum(["thread", "post"]),
  targetId: z.string().min(1).max(40),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const mentorRequestSchema = z.object({
  message: text(10, 1000),
  goal: z.string().trim().max(300).optional().nullable(),
});

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

/**
 * `limit` borné et `page` entière positive : on refuse explicitement un
 * `?limit=999999`, et on ne lit que des valeurs numériques.
 */
export function pagination(searchParams: URLSearchParams, defaultLimit = 20) {
  const rawLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit) || defaultLimit, 1), 100)
    : defaultLimit;

  const rawPage = Number(searchParams.get("page"));
  const page = Number.isFinite(rawPage) && rawPage > 1 ? Math.trunc(rawPage) : 1;

  return { limit, page, skip: (page - 1) * limit };
}
