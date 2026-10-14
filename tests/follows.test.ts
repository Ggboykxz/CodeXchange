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
import {
  getCompteursSuivi,
  idsSuivis,
  listAbonnes,
  listAbonnements,
  toggleFollow,
} from "../src/lib/follows";

/**
 * Tests du graphe social (suivi d'utilisateurs) contre `prisma/dev.db`.
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
      email: `${suffixe}.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Follow ${suffixe} ${HORODATAGE}`,
      slug: `follow-${suffixe}-${HORODATAGE}`,
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
  await prisma.userFollow.deleteMany({
    where: { OR: [{ followerId: aliceId }, { followeeId: aliceId }, { followerId: bobId }, { followeeId: bobId }] },
  });
  await prisma.user.deleteMany({ where: { id: { in: [aliceId, bobId] } } });
});

// --- Toggle ------------------------------------------------------------------

test("suivre puis se désabonner : compteurs cohérents", async () => {
  // Départ : 0 abonné.
  const avant = await getCompteursSuivi(bobId, aliceId);
  expect(avant.abonnes).toBe(0);
  expect(avant.jeLeSuis).toBe(false);

  // Alice suit Bob.
  const suite = await toggleFollow(aliceId, bobId);
  expect(suite.jeLeSuis).toBe(true);
  expect(suite.abonnes).toBe(1);

  // Alice se désabonne.
  const apres = await toggleFollow(aliceId, bobId);
  expect(apres.jeLeSuis).toBe(false);
  expect(apres.abonnes).toBe(0);
});

test("deux abonnés distincts → compte 2", async () => {
  await toggleFollow(aliceId, bobId);
  await toggleFollow(bobId, aliceId); // Bob suit Alice (relation inverse).
  const compteurs = await getCompteursSuivi(bobId, aliceId);
  expect(compteurs.abonnes).toBe(1);
  expect(compteurs.abonnements).toBe(1); // Alice suit aussi quelqu'un (Bob).
  // Nettoie.
  await toggleFollow(aliceId, bobId);
  await toggleFollow(bobId, aliceId);
});

// --- Auto-suivi interdit -----------------------------------------------------

test("se suivre soi-même → FORBIDDEN (403)", async () => {
  const erreur = await leveAppError(toggleFollow(aliceId, aliceId));
  expect(erreur.code).toBe("FORBIDDEN");
  expect(erreur.status).toBe(403);
});

// --- Validation --------------------------------------------------------------

test("cible invalide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(toggleFollow(aliceId, 0));
  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("cible introuvable → FORBIDDEN (403)", async () => {
  const erreur = await leveAppError(toggleFollow(aliceId, 999999999));
  expect(erreur.code).toBe("FORBIDDEN");
});

// --- Listes ------------------------------------------------------------------

test("listes abonnés / abonnements", async () => {
  await toggleFollow(aliceId, bobId);
  const abonnements = await listAbonnements(aliceId);
  expect(abonnements.some((m) => m.id === bobId)).toBe(true);
  const abonnes = await listAbonnes(bobId);
  expect(abonnes.some((m) => m.id === aliceId)).toBe(true);
  // Nettoie.
  await toggleFollow(aliceId, bobId);
});

// --- Fil d'abonnements -------------------------------------------------------

test("idsSuivis + filtre authorIds : seuls les sujets des suivis apparaissent", async () => {
  const postIdBob = await createPost(bobId, {
    titre: "Sujet de Bob pour le fil d'abonnements",
    corps: "Contexte long suffisant pour la validation du titre du sujet de Bob.",
    tags: ["bob"],
  });
  const postIdAlice = await createPost(aliceId, {
    titre: "Sujet d'Alice pour le fil d'abonnements",
    corps: "Contexte long suffisant pour la validation du titre du sujet d'Alice.",
    tags: ["alice"],
  });

  // Alice suit Bob.
  await toggleFollow(aliceId, bobId);
  const suivis = await idsSuivis(aliceId);
  expect(suivis).toContain(bobId);

  // Fil d'abonnements d'Alice → uniquement les sujets de Bob.
  const fil = listPosts({ authorIds: suivis });
  const ids = (await fil).map((p) => p.id);
  expect(ids).toContain(postIdBob);
  expect(ids).not.toContain(postIdAlice);

  // Nettoie.
  await toggleFollow(aliceId, bobId);
  await prisma.post.deleteMany({ where: { id: { in: [postIdBob, postIdAlice] } } });
});
