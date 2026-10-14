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
import { createPost, addReply } from "../src/lib/forum";
import { extraireHashtags, extraireMentions, topHashtags } from "../src/lib/hashtags";

/**
 * Tests des hashtags et mentions (`src/lib/hashtags.ts`) contre `prisma/dev.db`.
 * Conventions reprises de `tests/forum.test.ts`.
 */

const HORODATAGE = Date.now();

let auteurId = 0;
let mentionneId = 0;

beforeAll(async () => {
  const auteur = await prisma.user.create({
    data: {
      email: `hashtags.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Hashtags ${HORODATAGE}`,
      slug: `hashtags-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  auteurId = auteur.id;
  const cible = await prisma.user.create({
    data: {
      email: `mentionne.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Mentionné ${HORODATAGE}`,
      slug: `mentionne-${HORODATAGE}`,
      titre: "Designer",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  mentionneId = cible.id;
});

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { userId: mentionneId } });
  await prisma.post.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: { in: [auteurId, mentionneId] } } });
});

// --- Extraction --------------------------------------------------------------

test("extraction de hashtags : lowercase + dédupliqué", () => {
  const tags = extraireHashtags("J'adore #React et #react avec #Next_js et #flutter !");
  expect(tags).toContain("react");
  expect(tags).toContain("next_js");
  expect(tags).toContain("flutter");
  // dédupliqué : "React" et "react" → une entrée.
  expect(tags.filter((t) => t === "react")).toHaveLength(1);
});

test("hashtags : ignore les tokens trop courts et le milieu de mot", () => {
  const tags = extraireHashtags("code#pas-un-tag #ok math#x");
  expect(tags).toEqual(["ok"]);
});

test("extraction de mentions : slug lowercase", () => {
  const mentions = extraireMentions("cc @Alice-Dupont et @bob, voir @Alice-Dupont");
  expect(mentions).toContain("alice-dupont");
  expect(mentions).toContain("bob");
  expect(mentions.filter((m) => m === "alice-dupont")).toHaveLength(1);
});

// --- Notifications de mention ------------------------------------------------

test("créer un sujet avec @mention notifie le membre mentionné", async () => {
  const slug = `mentionne-${HORODATAGE}`;
  const postId = await createPost(auteurId, {
    titre: "Question sur le design system",
    corps: `Bonjour @${slug}, un avis sur les tokens ? Merci !`,
    tags: ["design"],
  });
  expect(postId).toBeGreaterThan(0);

  const notifs = await prisma.notification.findMany({ where: { userId: mentionneId } });
  expect(notifs.some((n) => n.type === "MENTION")).toBe(true);
});

test("réponse avec @mention notifie aussi", async () => {
  const slug = `mentionne-${HORODATAGE}`;
  const postId = await createPost(auteurId, {
    titre: "Sujet pour tester les mentions en réponse",
    corps: "Contexte long suffisant pour la validation du titre du sujet.",
    tags: ["test"],
  });
  await addReply(postId, auteurId, `Je propose @${slug} de confirmer, merci.`);
  const notifs = await prisma.notification.findMany({ where: { userId: mentionneId } });
  expect(notifs.length).toBeGreaterThanOrEqual(2);
});

test("l'auteur ne reçoit pas de notification pour sa propre mention", async () => {
  const avant = await prisma.notification.count({ where: { userId: auteurId } });
  await createPost(auteurId, {
    titre: "Moi-même mentionné dans mon sujet",
    corps: `Je me cite @hashtags-${HORODATAGE} pour voir. Voilà.`,
    tags: ["auto"],
  });
  const apres = await prisma.notification.count({ where: { userId: auteurId } });
  expect(apres).toBe(avant);
});

// --- Tendances ---------------------------------------------------------------

test("topHashtags agrège les tags par popularité décroissante", async () => {
  const tendances = await topHashtags(12);
  expect(tendances.length).toBeGreaterThan(0);
  // tri décroissant sur le compte.
  for (let i = 1; i < tendances.length; i++) {
    expect(tendances[i - 1]!.count).toBeGreaterThanOrEqual(tendances[i]!.count);
  }
});
