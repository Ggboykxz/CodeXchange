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
const cleanList = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(",");

const csv = (max: number) => z.string().max(max).optional().default("").transform(cleanList);

/**
 * Variante PATCH : le champ **absent** reste `undefined` (Prisma n'y touche
 * pas), alors que `csv()` appliquerait le défaut `""` et effacerait la liste.
 */
const csvPatch = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((v) => (v === undefined ? undefined : cleanList(v)));

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

/**
 * Vérification d'e-mail (B1). Le jeton est toujours 32 octets hexadécimaux :
 * on refuse toute autre forme avant même de toucher la base, ce qui évite
 * de faire tourner un hash sur une chaîne arbitraire envoyée par un bot.
 */
export const verifySchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{64}$/i, "Invalid verification token"),
});

/**
 * Renvoi du lien. `email` absent → on se sert du cookie de session ;
 * la valeur est optionnelle parce que l'utilisateur peut demander un
 * lien avant même d'être connecté.
 */
export const verifyResendSchema = z.object({
  email: email.optional(),
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
/* Contenus publiés par les membres (offres, projets, tutos, events)   */
/* ------------------------------------------------------------------ */

/**
 * Seules les URL http(s) sont acceptées : un `javascript:` ou un `data:`
 * collé dans un lien de candidature s'exécuterait dans un onglet.
 */
const httpUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(v), "Invalid URL");

/** Lien optionnel : `undefined` = absent (inchangé en PATCH), `null` = effacé. */
const link = httpUrl.optional().nullable();

/** Couverture : un émoji saisi par l'auteur, jamais une image distante imposée. */
const emoji = (fallback: string) => z.string().trim().min(1).max(8).default(fallback);

/** Date interprétée par le serveur (`Date.parse`), pas un `new Date` aveugle. */
const dateTime = z
  .string()
  .trim()
  .min(4)
  .max(40)
  .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");

/**
 * Chaque contenu est déclaré **une fois**, sous forme 100 % optionnelle
 * (« patch »), puis la création est dérivée par `.extend()` : les champs
 * obligatoires y redeviennent obligatoires et les défauts (`remote`,
 * `type`, `coverEmoji`…) n'existent QUE là.
 *
 * Attention — `.partial()` sur un schéma qui porte des `.default()` ne
 * fonctionne pas : le défaut s'applique quand même à la création, donc un
 * PATCH viendrait réinitialiser `remote`, `type` et `stack` à chaque
 * édition. D'où ce sens de dérivation (patch → create) et non l'inverse.
 */
const jobPatch = z.object({
  title: text(4, 140).optional(),
  company: text(2, 120).optional(),
  location: z.string().trim().max(120).optional().nullable(),
  country: z.string().trim().max(80).optional().nullable(),
  remote: z.boolean().optional(),
  type: z.enum(JOB_TYPES).optional(),
  stack: csvPatch(300),
  salary: z.string().trim().max(80).optional().nullable(),
  description: text(1, 8000).optional(),
  applyUrl: link,
});

const projectPatch = z.object({
  name: text(2, 120).optional(),
  tagline: text(3, 160).optional(),
  description: text(1, 8000).optional(),
  repoUrl: link,
  demoUrl: link,
  stack: csvPatch(300),
  status: z.enum(PROJECT_STATUSES).optional(),
  lookingFor: csvPatch(200),
  cover: link,
});

const tutorialPatch = z.object({
  title: text(6, 180).optional(),
  excerpt: text(10, 300).optional(),
  body: text(1, 40_000).optional(),
  category: z.enum(CATEGORIES).optional(),
  tags: csvPatch(300),
  coverEmoji: z.string().trim().min(1).max(8).optional(),
});

const eventPatch = z.object({
  title: text(4, 140).optional(),
  description: text(1, 4000).optional(),
  date: dateTime.optional(),
  endDate: dateTime.optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  online: z.boolean().optional(),
  url: link,
  coverEmoji: z.string().trim().min(1).max(8).optional(),
});

export const jobUpdateSchema = jobPatch;
export const projectUpdateSchema = projectPatch;
export const tutorialUpdateSchema = tutorialPatch;
export const eventUpdateSchema = eventPatch;

export const jobCreateSchema = jobPatch.extend({
  title: text(4, 140),
  company: text(2, 120),
  description: text(1, 8000),
  remote: z.boolean().default(true),
  type: z.enum(JOB_TYPES).default("full-time"),
  stack: csv(300),
});

export const projectCreateSchema = projectPatch.extend({
  name: text(2, 120),
  tagline: text(3, 160),
  description: text(1, 8000),
  stack: csv(300),
  status: z.enum(PROJECT_STATUSES).default("idea"),
  lookingFor: csv(200),
});

export const tutorialCreateSchema = tutorialPatch.extend({
  title: text(6, 180),
  excerpt: text(10, 300),
  body: text(1, 40_000),
  category: z.enum(CATEGORIES).default("general"),
  tags: csv(300),
  coverEmoji: emoji("📝"),
});

export const eventCreateSchema = eventPatch.extend({
  title: text(4, 140),
  description: text(1, 4000),
  date: dateTime,
  online: z.boolean().default(false),
  coverEmoji: emoji("📅"),
});

/** Une fin d'événement qui précède son début n'a aucun sens à afficher. */
export function isValidEventRange(start: Date, end?: Date | null): boolean {
  if (Number.isNaN(start.getTime())) return false;
  if (!end) return true;
  if (Number.isNaN(end.getTime())) return false;
  return end.getTime() >= start.getTime();
}

/**
 * Temps de lecture **dérivé** du corps (~200 mots/minute) : il est calculé
 * à l'écriture, jamais saisi par l'auteur — donc jamais en décalage avec
 * le texte réellement publié.
 */
export function readMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

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
