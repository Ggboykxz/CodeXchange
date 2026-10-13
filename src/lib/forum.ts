import type { Post, Reply, User } from "@prisma/client";
import { prisma } from "./db";
import { AppError } from "./errors";
import { createNotification } from "./notifications";
import type { PaginatedResult } from "./pagination";
import { paginateArray } from "./pagination";

export type { PaginatedResult } from "./pagination";

/**
 * Forum (spec) : sujet = titre 8–120 car., corps ≤ 5 000 car., 1 à 3 tags CSV ;
 * réponse = 1–2 000 car. ; like = opération idempotente (1ᵉʳ appel `true`,
 * 2ᵉ `false`). Recherche = sous-chaîne insensible à la casse sur titre ou corps,
 * filtre par tag sur les entrées du CSV.
 */

const TITRE_MIN = 8;
const TITRE_MAX = 120;
const CORPS_MAX = 5000;
const TAGS_MIN = 1;
const TAGS_MAX = 3;
const REPONSE_MIN = 1;
const REPONSE_MAX = 2000;

/** Champs auteur exposés à l'écran (jamais `passwordHash` ni l'e-mail). */
const SELECT_AUTEUR = { id: true, nom: true, slug: true, ville: true, pays: true } as const;

export type AuteurResume = Pick<User, keyof typeof SELECT_AUTEUR>;

export type PostResume = Omit<Post, "author" | "replies" | "likes"> & {
  author: AuteurResume;
  _count: { replies: number; likes: number };
};

export type ReponseDetail = Omit<Reply, "author" | "post"> & { author: AuteurResume };

export type PostDetail = Omit<Post, "author" | "replies" | "likes"> & {
  author: AuteurResume;
  replies: ReponseDetail[];
  _count: { replies: number; likes: number };
};

export type FiltrePosts = { tag?: string; q?: string; page?: number; pageSize?: number };

export type NouveauSujet = { titre: string; corps: string; tags: string[] };

/** Réponse HTTP standard quand `getSessionUserId()` retourne `null`. */
export const NON_CONNECTE = {
  status: 401,
  body: { error: "AUTH_INVALID", message: "Vous devez être connecté pour effectuer cette action." },
} as const;

/** Identifiant d'URL → entier strict, ou `null` (évite `NaN` dans Prisma). */
export function parseId(valeur: string): number | null {
  const id = Number(valeur);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function tagsDuCsv(csv: string): string[] {
  return csv
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
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
 * Liste des sujets, du plus récent au plus ancien.
 * `q` : sous-chaîne insensible à la casse sur le titre **ou** le corps.
 * `tag` : correspondance exacte (insensible à la casse) sur une entrée du CSV.
 * Si `page` est fourni, retourne un `PaginatedResult<PostResume>`.
 */
export async function listPosts(f: FiltrePosts & { page: number }): Promise<PaginatedResult<PostResume>>;
export async function listPosts(f?: FiltrePosts): Promise<PostResume[]>;
export async function listPosts(f?: FiltrePosts): Promise<PostResume[] | PaginatedResult<PostResume>> {
  const sujets = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: SELECT_AUTEUR },
      _count: { select: { replies: true, likes: true } },
    },
  });

  const q = f?.q?.trim().toLowerCase() ?? "";
  const tag = f?.tag?.trim().toLowerCase() ?? "";
  let filtrees = sujets;
  if (q || tag) {
    filtrees = sujets.filter((sujet) => {
      if (q) {
        const dansTitre = sujet.titre.toLowerCase().includes(q);
        const dansCorps = sujet.corps.toLowerCase().includes(q);
        if (!dansTitre && !dansCorps) return false;
      }
      if (tag && !tagsDuCsv(sujet.tags).some((t) => t.toLowerCase() === tag)) return false;
      return true;
    });
  }

  if (f?.page !== undefined) {
    return paginateArray(filtrees, f.page, f.pageSize);
  }
  return filtrees;
}

/** Sujet complet : auteur, réponses triées par date, compteur de likes. `null` si inexistant. */
export async function getPost(id: number): Promise<PostDetail | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: SELECT_AUTEUR },
      replies: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { author: { select: SELECT_AUTEUR } },
      },
      _count: { select: { replies: true, likes: true } },
    },
  });
}

/** Création d'un sujet ; lève `FORUM_VALIDATION` (422) en cas de règle violée. */
export async function createPost(authorId: number, i: NouveauSujet): Promise<number> {
  const titre = i.titre.trim();
  const corps = i.corps.trim();
  const tags = i.tags.map((tag) => tag.trim()).filter(Boolean);

  if (titre.length < TITRE_MIN || titre.length > TITRE_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `Le titre doit faire entre ${TITRE_MIN} et ${TITRE_MAX} caractères.`,
    );
  }
  if (!corps || corps.length > CORPS_MAX) {
    throw new AppError("FORUM_VALIDATION", `Le corps ne peut pas dépasser ${CORPS_MAX} caractères.`);
  }
  if (tags.length < TAGS_MIN || tags.length > TAGS_MAX) {
    throw new AppError("FORUM_VALIDATION", `Entre ${TAGS_MIN} et ${TAGS_MAX} tags sont attendus.`);
  }

  const post = await prisma.post.create({
    data: { titre, corps, tags: tags.join(","), authorId },
    select: { id: true },
  });
  return post.id;
}

/** Réponse à un sujet ; lève `FORUM_VALIDATION` si le corps est hors limites ou le sujet absent. */
export async function addReply(postId: number, authorId: number, corps: string): Promise<void> {
  const texte = corps.trim();
  if (texte.length < REPONSE_MIN || texte.length > REPONSE_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `La réponse doit faire entre ${REPONSE_MIN} et ${REPONSE_MAX} caractères.`,
    );
  }
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new AppError("FORUM_VALIDATION", "Sujet introuvable.");

  await prisma.reply.create({ data: { corps: texte, postId, authorId } });

  // Notification au auteur du sujet (si différent de l'auteur de la réponse).
  if (post.authorId !== authorId) {
    try {
      await createNotification({
        userId: post.authorId,
        type: "REPONSE_SUJET",
        text: "Une nouvelle réponse a été postée sur votre sujet.",
        lien: `/forum/${postId}`,
      });
    } catch {
      // fire-and-forget : ne jamais interrompre addReply
    }
  }
}

/**
 * Like idempotent (spec) : absent → ajouté, `true` ; présent → retiré, `false`.
 * Sous concurrence, la course sur l'index unique `(userId, postId)` est rattrapée
 * : on retire le like créé par l'autre requête et on répond `false` — jamais deux
 * likes pour la même paire (Review Focus n°1).
 */
export async function toggleLike(postId: number, userId: number): Promise<boolean> {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new AppError("FORUM_VALIDATION", "Sujet introuvable.");

  const paire = { userId, postId };
  const existant = await prisma.like.findUnique({ where: { userId_postId: paire } });
  if (existant) {
    await prisma.like.delete({ where: { userId_postId: paire } });
    return false;
  }

  try {
    await prisma.like.create({ data: paire });
    // Notification à l'auteur (like ajouté uniquement, si différent).
    if (post.authorId !== userId) {
      try {
        await createNotification({
          userId: post.authorId,
          type: "LIKE_SUJET",
          text: "Votre sujet a reçu un nouveau like.",
          lien: `/forum/${postId}`,
        });
      } catch {
        // fire-and-forget
      }
    }
    return true;
  } catch (erreur) {
    if (estDoublon(erreur)) {
      await prisma.like.deleteMany({ where: paire });
      return false;
    }
    throw erreur;
  }
}

/** Ce membre a-t-il déjà liké ce sujet ? (utilisé par la page de détail) */
export async function aLike(userId: number, postId: number): Promise<boolean> {
  const like = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { postId: true },
  });
  return like !== null;
}
