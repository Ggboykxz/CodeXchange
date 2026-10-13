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

export type ReponseDetail = Omit<Reply, "author" | "post"> & {
  author: AuteurResume;
  _count: { likes: number };
};

export type PostDetail = Omit<Post, "author" | "replies" | "likes"> & {
  author: AuteurResume;
  replies: ReponseDetail[];
  _count: { replies: number; likes: number };
};

export type FiltrePosts = { tag?: string; q?: string; page?: number; pageSize?: number; tri?: "recent" | "populaire" };

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

  // Tri : « populaire » = score likes + 2×réponses, puis date.
  if (f?.tri === "populaire") {
    filtrees = [...filtrees].sort((a, b) => {
      const scoreA = a._count.likes + a._count.replies * 2;
      const scoreB = b._count.likes + b._count.replies * 2;
      return scoreB - scoreA || b.createdAt.getTime() - a.createdAt.getTime();
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
  const result = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: SELECT_AUTEUR },
      replies: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { author: { select: SELECT_AUTEUR }, _count: { select: { likes: true } } },
      },
      _count: { select: { replies: true, likes: true } },
    },
  });
  if (result) {
    result.replies.sort((a: ReponseDetail, b: ReponseDetail) => {
      const diffLikes = (b._count?.likes ?? 0) - (a._count?.likes ?? 0);
      if (diffLikes !== 0) return diffLikes;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }
  return result;
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
export async function addReply(
  postId: number,
  authorId: number,
  corps: string,
  parentId?: number
): Promise<number> {
  const texte = corps.trim();
  if (texte.length < REPONSE_MIN || texte.length > REPONSE_MAX) {
    throw new AppError(
      "FORUM_VALIDATION",
      `La réponse doit faire entre ${REPONSE_MIN} et ${REPONSE_MAX} caractères.`,
    );
  }
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new AppError("FORUM_VALIDATION", "Sujet introuvable.");

  // Validation du parent (imbrication d'un seul niveau).
  if (parentId) {
    const parent = await prisma.reply.findUnique({ where: { id: parentId }, select: { postId: true, parentId: true, deletedAt: true } });
    if (!parent || parent.postId !== postId || parent.deletedAt) throw new AppError("FORUM_VALIDATION", "Réponse parente introuvable.");
    if (parent.parentId !== null) throw new AppError("FORUM_VALIDATION", "Imbrication limitée à un seul niveau.");
  }

  const reply = await prisma.reply.create({ data: { corps: texte, postId, authorId, parentId: parentId ?? null } });

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
  return reply.id;
}

/** Édite une réponse (uniquement par son auteur). Lève `FORBIDDEN` sinon. */
export async function editReply(replyId: number, authorId: number, corps: string): Promise<void> {
  const texte = corps.trim();
  if (texte.length < REPONSE_MIN || texte.length > REPONSE_MAX) {
    throw new AppError("FORUM_VALIDATION", `La réponse doit faire entre ${REPONSE_MIN} et ${REPONSE_MAX} caractères.`);
  }
  const reply = await prisma.reply.findUnique({ where: { id: replyId }, select: { id: true, authorId: true, deletedAt: true } });
  if (!reply) throw new AppError("FORUM_VALIDATION", "Réponse introuvable.");
  if (reply.deletedAt) throw new AppError("FORUM_VALIDATION", "Réponse supprimée.");
  if (reply.authorId !== authorId) throw new AppError("FORBIDDEN", "Vous ne pouvez pas modifier cette réponse.");
  await prisma.reply.update({ where: { id: replyId }, data: { corps: texte } });
}

/** Suppression douce d'une réponse (uniquement par son auteur). */
export async function deleteReply(replyId: number, authorId: number): Promise<void> {
  const reply = await prisma.reply.findUnique({ where: { id: replyId }, select: { authorId: true } });
  if (!reply) throw new AppError("FORUM_VALIDATION", "Réponse introuvable.");
  if (reply.authorId !== authorId) throw new AppError("FORBIDDEN", "Vous ne pouvez pas supprimer cette réponse.");
  await prisma.reply.update({ where: { id: replyId }, data: { deletedAt: new Date(), corps: "[message supprimé]" } });
}

/** Like idempotent sur une réponse (retourne true si ajouté). */
export async function toggleReplyLike(replyId: number, userId: number): Promise<boolean> {
  const reply = await prisma.reply.findUnique({ where: { id: replyId }, select: { id: true, deletedAt: true } });
  if (!reply || reply.deletedAt) throw new AppError("FORUM_VALIDATION", "Réponse introuvable.");

  const paire = { userId, replyId };
  const existant = await prisma.replyLike.findUnique({ where: { replyId_userId: paire } });
  if (existant) {
    await prisma.replyLike.delete({ where: { replyId_userId: paire } });
    return false;
  }

  try {
    await prisma.replyLike.create({ data: paire });
    return true;
  } catch (erreur) {
    if (estDoublon(erreur)) {
      await prisma.replyLike.deleteMany({ where: paire });
      return false;
    }
    throw erreur;
  }
}

export async function hasReplyLiked(userId: number, replyId: number): Promise<boolean> {
  const like = await prisma.replyLike.findUnique({ where: { replyId_userId: { replyId, userId } }, select: { replyId: true } });
  return like !== null;
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
