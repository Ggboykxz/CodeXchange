import { afterAll, beforeAll, expect, test, vi } from "vitest";

// Pot à cookies en mémoire (convention de `tests/forum.test.ts`).
const pot = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nom: string) => (pot.has(nom) ? { name: nom, value: pot.get(nom) as string } : undefined),
    set: (nom: string, valeur: string) => {
      pot.set(nom, valeur);
    },
    delete: (nom: string) => {
      pot.delete(nom);
    },
  }),
}));

import { prisma } from "../src/lib/db";
import { AppError } from "../src/lib/errors";
import { createPost } from "../src/lib/forum";
import { getEtatRepost, listReposts, toggleRepost } from "../src/lib/reposts";

/**
 * Tests du repost / partage interne (`src/lib/reposts.ts`) contre `prisma/dev.db`.
 * Conventions reprises de `tests/forum.test.ts`.
 */

const HORODATAGE = Date.now();

let auteurId = 0;
let autreId = 0;
let postId = 0;

function estAppError(erreur: unknown): erreur is AppError {
  return erreur instanceof AppError;
}

async function leveAppError(promesse: Promise<unknown>): Promise<AppError> {
  try {
    await promesse;
  } catch (erreur) {
    if (estAppError(erreur)) return erreur;
    throw erreur;
  }
  throw new Error("Aucune erreur levée alors qu'une AppError était attendue.");
}

async function creerMembre(suffixe: string): Promise<number> {
  const u = await prisma.user.create({
    data: {
      email: `${suffixe}.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Repost ${suffixe} ${HORODATAGE}`,
      slug: `repost-${suffixe}-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  return u.id;
}

beforeAll(async () => {
  auteurId = await creerMembre("auteur");
  autreId = await creerMembre("autre");
  postId = await createPost(auteurId, {
    titre: "Sujet à repost par la communauté",
    corps: "Contexte long suffisant pour la validation du titre du sujet ici.",
    tags: ["partage"],
  });
});

afterAll(async () => {
  await prisma.repost.deleteMany({ where: { postId } });
  await prisma.post.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: { in: [auteurId, autreId] } } });
});

// --- Toggle ------------------------------------------------------------------

test("repost puis annulation : compteurs cohérents", async () => {
  const avant = await getEtatRepost(postId, autreId);
  expect(avant.repostes).toBe(0);
  expect(avant.jeLaiReposte).toBe(false);

  const reposte = await toggleRepost(autreId, postId);
  expect(reposte.jeLaiReposte).toBe(true);
  expect(reposte.repostes).toBe(1);

  const annule = await toggleRepost(autreId, postId);
  expect(annule.jeLaiReposte).toBe(false);
  expect(annule.repostes).toBe(0);
});

// --- Auto-repost interdit ----------------------------------------------------

test("repost de son propre sujet → FORBIDDEN (403)", async () => {
  const erreur = await leveAppError(toggleRepost(auteurId, postId));
  expect(erreur.code).toBe("FORBIDDEN");
  expect(erreur.status).toBe(403);
});

// --- Validation --------------------------------------------------------------

test("sujet invalide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(toggleRepost(autreId, 0));
  expect(erreur.code).toBe("FORUM_VALIDATION");
});

test("sujet introuvable → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(toggleRepost(autreId, 999999999));
  expect(erreur.code).toBe("FORUM_VALIDATION");
});

// --- Liste des reposts du profil ---------------------------------------------

test("listReposts retourne les postId repostés par un membre", async () => {
  await toggleRepost(autreId, postId);
  const ids = await listReposts(autreId);
  expect(ids).toContain(postId);
  // Nettoie.
  await toggleRepost(autreId, postId);
});
