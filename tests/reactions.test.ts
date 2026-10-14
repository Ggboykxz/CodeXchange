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
import { createPost, addReply } from "../src/lib/forum";
import { getReactions, toggleReaction } from "../src/lib/reactions";

/**
 * Tests de la couche métier des réactions (post + réponse) contre `prisma/dev.db`.
 * Conventions reprises de `tests/forum.test.ts`.
 */

const HORODATAGE = Date.now();

let auteurId = 0;
let postId = 0;
let replyId = 0;

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

beforeAll(async () => {
  const membre = await prisma.user.create({
    data: {
      email: `reactions.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Réactions Test ${HORODATAGE}`,
      slug: `reactions-test-${HORODATAGE}`,
      titre: "Développeur Node",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  auteurId = membre.id;
  postId = await createPost(auteurId, {
    titre: "Quelle librairie d'état préférez-vous ?",
    corps: "Contexte long suffisant : partagez votre retour d'expérience sur la gestion d'état.",
    tags: ["react", "state"],
  });
  replyId = await addReply(postId, auteurId, "J'utilise Zustand au quotidien, très léger.");
});

afterAll(async () => {
  await prisma.reaction.deleteMany({ where: { userId: auteurId } });
  await prisma.reply.deleteMany({ where: { postId } });
  await prisma.post.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: auteurId } });
});

// --- Pose / toggle -----------------------------------------------------------

test("première réaction → compte 1 et maReaction renseignée", async () => {
  // État de départ propre.
  const propre = await getReactions("post", postId, auteurId);
  if (propre.maReaction) await toggleReaction(auteurId, "post", postId, propre.maReaction);

  const avant = await getReactions("post", postId, auteurId);
  expect(avant.total).toBe(0);
  expect(avant.maReaction).toBeNull();

  const apres = await toggleReaction(auteurId, "post", postId, "👍");
  expect(apres.total).toBe(1);
  expect(apres.maReaction).toBe("👍");
  expect(apres.totaux["👍"]).toBe(1);
  // Nettoie pour les tests suivants.
  await toggleReaction(auteurId, "post", postId, "👍");
});

test("re-cliquer le même emoji → toggle off (0)", async () => {
  // Pose puis retire : le même emoji en double doit annuler.
  await toggleReaction(auteurId, "post", postId, "👍");
  const apres = await toggleReaction(auteurId, "post", postId, "👍");
  expect(apres.total).toBe(0);
  expect(apres.maReaction).toBeNull();
});

test("emoji différent → remplace (toujours 1 par utilisateur)", async () => {
  await toggleReaction(auteurId, "post", postId, "👍");
  const apres = await toggleReaction(auteurId, "post", postId, "🔥");
  expect(apres.total).toBe(1);
  expect(apres.maReaction).toBe("🔥");
  expect(apres.totaux["👍"]).toBe(0);
  expect(apres.totaux["🔥"]).toBe(1);
  // Nettoie pour les tests suivants.
  await toggleReaction(auteurId, "post", postId, "🔥");
});

// --- Réponses ----------------------------------------------------------------

test("réaction sur une réponse indépendante du post", async () => {
  const apres = await toggleReaction(auteurId, "reply", replyId, "🎉");
  expect(apres.total).toBe(1);
  expect(apres.maReaction).toBe("🎉");
  // Le post n'est pas affecté.
  const post = await getReactions("post", postId, auteurId);
  expect(post.total).toBe(0);
});

// --- Validation --------------------------------------------------------------

test("emoji hors liste blanche → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(toggleReaction(auteurId, "post", postId, "💩"));
  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("cible invalide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(toggleReaction(auteurId, "post", 0, "👍"));
  expect(erreur.code).toBe("FORUM_VALIDATION");
});

test("kind invalide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    // @ts-expect-error kind volontairement invalide pour le test.
    toggleReaction(auteurId, "comment", postId, "👍"),
  );
  expect(erreur.code).toBe("FORUM_VALIDATION");
});
