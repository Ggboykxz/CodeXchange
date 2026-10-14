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
import { toggleFollow } from "../src/lib/follows";
import { visibiliteProfil } from "../src/lib/privacy";

/**
 * Tests de la confidentialité du profil (`src/lib/privacy.ts`) contre `prisma/dev.db`.
 * Conventions reprises de `tests/forum.test.ts`.
 */

const HORODATAGE = Date.now();

let proprietaireId = 0;
let abonneId = 0;
let inconnuId = 0;

async function creerMembre(suffixe: string): Promise<number> {
  const u = await prisma.user.create({
    data: {
      email: `privacy.${suffixe}.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Privacy ${suffixe} ${HORODATAGE}`,
      slug: `privacy-${suffixe}-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  return u.id;
}

beforeAll(async () => {
  proprietaireId = await creerMembre("pro");
  abonneId = await creerMembre("abonne");
  inconnuId = await creerMembre("inconnu");
});

afterAll(async () => {
  await prisma.userFollow.deleteMany({
    where: { OR: [{ followerId: abonneId, followeeId: proprietaireId }] },
  });
  await prisma.user.deleteMany({ where: { id: { in: [proprietaireId, abonneId, inconnuId] } } });
});

test("profil PUBLIC → visible par tous (même anonyme)", async () => {
  await prisma.user.update({ where: { id: proprietaireId }, data: { privacy: "PUBLIC" } });
  const anonyme = await visibiliteProfil(proprietaireId);
  expect(anonyme.complet).toBe(true);
  expect(anonyme.prive).toBe(false);
  const inconnu = await visibiliteProfil(proprietaireId, inconnuId);
  expect(inconnu.complet).toBe(true);
});

test("profil PRIVÉ → propriétaire voit toujours son profil complet", async () => {
  await prisma.user.update({ where: { id: proprietaireId }, data: { privacy: "PRIVATE" } });
  const owner = await visibiliteProfil(proprietaireId, proprietaireId);
  expect(owner.complet).toBe(true);
  expect(owner.prive).toBe(true);
});

test("profil PRIVÉ → visiteur anonyme ne voit pas le profil complet", async () => {
  const anonyme = await visibiliteProfil(proprietaireId);
  expect(anonyme.complet).toBe(false);
  expect(anonyme.prive).toBe(true);
});

test("profil PRIVÉ → non-abonné ne voit pas le profil complet", async () => {
  const inconnu = await visibiliteProfil(proprietaireId, inconnuId);
  expect(inconnu.complet).toBe(false);
});

test("profil PRIVÉ → abonné voit le profil complet", async () => {
  await toggleFollow(abonneId, proprietaireId);
  const abonne = await visibiliteProfil(proprietaireId, abonneId);
  expect(abonne.complet).toBe(true);
  expect(abonne.prive).toBe(true);
  // Nettoie.
  await toggleFollow(abonneId, proprietaireId);
});
