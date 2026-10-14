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
import { createPost, listPosts } from "../src/lib/forum";
import { idsAEviter, isBlocked, listBlocked, toggleBlock } from "../src/lib/blocks";

/**
 * Tests du blocage de membres (`src/lib/blocks.ts`) contre `prisma/dev.db`.
 * Conventions reprises de `tests/forum.test.ts`.
 */

const HORODATAGE = Date.now();

let aliceId = 0;
let bobId = 0;

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
      email: `block.${suffixe}.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Block ${suffixe} ${HORODATAGE}`,
      slug: `block-${suffixe}-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  return u.id;
}

beforeAll(async () => {
  aliceId = await creerMembre("alice");
  bobId = await creerMembre("bob");
});

afterAll(async () => {
  await prisma.block.deleteMany({ where: { OR: [{ blockerId: aliceId }, { blockedId: aliceId }, { blockerId: bobId }, { blockedId: bobId }] } });
  await prisma.user.deleteMany({ where: { id: { in: [aliceId, bobId] } } });
});

// --- Toggle ------------------------------------------------------------------

test("bloquer puis débloquer : état cohérent", async () => {
  expect(await isBlocked(aliceId, bobId)).toBe(false);
  const bloque = await toggleBlock(aliceId, bobId);
  expect(bloque).toBe(true);
  expect(await isBlocked(aliceId, bobId)).toBe(true);

  const debloque = await toggleBlock(aliceId, bobId);
  expect(debloque).toBe(false);
  expect(await isBlocked(aliceId, bobId)).toBe(false);
});

// --- Auto-blocage & validation -----------------------------------------------

test("se bloquer soi-même → FORBIDDEN (403)", async () => {
  const erreur = await leveAppError(toggleBlock(aliceId, aliceId));
  expect(erreur.code).toBe("FORBIDDEN");
  expect(erreur.status).toBe(403);
});

test("cible invalide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(toggleBlock(aliceId, 0));
  expect(erreur.code).toBe("FORUM_VALIDATION");
});

test("cible introuvable → FORBIDDEN (403)", async () => {
  const erreur = await leveAppError(toggleBlock(aliceId, 999999999));
  expect(erreur.code).toBe("FORBIDDEN");
});

// --- Filtrage symétrique -----------------------------------------------------

test("idsAEviter inclut bloqués ET bloquants (symétrique)", async () => {
  await toggleBlock(aliceId, bobId); // Alice bloque Bob
  const aEviterAlice = await idsAEviter(aliceId);
  expect(aEviterAlice).toContain(bobId);
  // Bob (bloqué) voit aussi Alice dans sa liste à éviter.
  const aEviterBob = await idsAEviter(bobId);
  expect(aEviterBob).toContain(aliceId);
  // Nettoie.
  await toggleBlock(aliceId, bobId);
});

test("listBlocked renvoie les membres bloqués", async () => {
  await toggleBlock(aliceId, bobId);
  const ids = await listBlocked(aliceId);
  expect(ids).toContain(bobId);
  // Nettoie.
  await toggleBlock(aliceId, bobId);
});

// --- Fil du forum -------------------------------------------------------------

test("le fil d'Alice masque les sujets des membres bloqués", async () => {
  const postIdBob = await createPost(bobId, {
    titre: "Sujet de Bob à masquer pour Alice",
    corps: "Contexte long suffisant pour la validation du titre du sujet de Bob.",
    tags: ["bob"],
  });

  // Avant blocage : visible.
  const avant = (await listPosts({ userId: aliceId })).map((p) => p.id);
  expect(avant).toContain(postIdBob);

  // Alice bloque Bob → son sujet disparaît de son fil.
  await toggleBlock(aliceId, bobId);
  const apres = (await listPosts({ userId: aliceId })).map((p) => p.id);
  expect(apres).not.toContain(postIdBob);

  // Le fil d'un tiers non concerné le voit toujours.
  const autreId = await creerMembre("tiers");
  const filTiers = (await listPosts({ userId: autreId })).map((p) => p.id);
  expect(filTiers).toContain(postIdBob);

  // Nettoie.
  await toggleBlock(aliceId, bobId);
  await prisma.post.deleteMany({ where: { id: postIdBob } });
  await prisma.user.deleteMany({ where: { id: autreId } });
});
