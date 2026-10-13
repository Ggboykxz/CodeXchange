import { afterAll, beforeAll, expect, test, vi } from "vitest";

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
import { createSession } from "../src/lib/session";
import { toggleFavorite, isFavorite, listFavorites } from "../src/lib/favorites";

const HORODATAGE = Date.now();

let userId = 0;
let postId = 0;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `fav-user.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Fav User ${HORODATAGE}`,
      slug: `fav-user-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  userId = user.id;
  await createSession(userId);

  const author = await prisma.user.create({
    data: {
      email: `fav-author.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Fav Author ${HORODATAGE}`,
      slug: `fav-author-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Dakar",
      pays: "Sénégal",
    },
  });
  const post = await prisma.post.create({ data: { titre: `Fav sujet ${HORODATAGE}`, corps: "Corps", authorId: author.id } });
  postId = post.id;
});

afterAll(async () => {
  await prisma.favorite.deleteMany({ where: { userId } });
  await prisma.post.deleteMany({ where: { id: postId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { email: { contains: `fav-` } } });
});

test("modèle Favorite est créé avec @@unique", async () => {
  const created = await prisma.favorite.create({ data: { userId, kind: "post", targetId: postId } });
  expect(typeof created.id).toBe("number");
  await expect(
    prisma.favorite.create({ data: { userId, kind: "post", targetId: postId } })
  ).rejects.toThrow();
  await prisma.favorite.delete({ where: { id: created.id } });
});

test("toggleFavorite bascule l'état et isFavorite le reflète", async () => {
  expect(await isFavorite(userId, "post", postId)).toBe(false);
  expect(await toggleFavorite(userId, "post", postId)).toBe(true);
  expect(await isFavorite(userId, "post", postId)).toBe(true);
  expect(await toggleFavorite(userId, "post", postId)).toBe(false);
  expect(await isFavorite(userId, "post", postId)).toBe(false);
});

test("listFavorites renvoie les favoris par groupe", async () => {
  await toggleFavorite(userId, "post", postId);
  const result = await listFavorites(userId);
  expect(result.posts.map((p) => p.id)).toContain(postId);
  await toggleFavorite(userId, "post", postId);
});
