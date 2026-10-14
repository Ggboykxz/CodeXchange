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
import { createSession } from "../src/lib/session";
import { POST } from "../src/app/api/onboarding/route";

/**
 * Tests de l'API d'onboarding (`POST /api/onboarding`) contre `prisma/dev.db`.
 * On monte une vraie session (cookie `cx_session`) pour passer l'auth.
 */

const HORODATAGE = Date.now();

let userId = 0;

function requete(body: unknown): Request {
  return new Request("http://test.local/api/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  const u = await prisma.user.create({
    data: {
      email: `onboarding.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Onboarding ${HORODATAGE}`,
      slug: `onboarding-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  userId = u.id;
});

afterAll(async () => {
  await prisma.tagFollow.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

test("non connecté → 401", async () => {
  pot.delete("cx_session"); // aucune session
  const reponse = await POST(requete({ tags: ["flutter"] }));
  expect(reponse.status).toBe(401);
});

test("connecté → suit les tags demandés", async () => {
  await createSession(userId);
  const reponse = await POST(requete({ tags: ["flutter", "nextjs", "ia"] }));
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as { suivis: number };
  expect(corps.suivis).toBe(3);

  const suivis = await prisma.tagFollow.findMany({ where: { userId }, select: { tag: true } });
  const set = new Set(suivis.map((s) => s.tag));
  expect(set.has("flutter")).toBe(true);
  expect(set.has("nextjs")).toBe(true);
  expect(set.has("ia")).toBe(true);
});

test("idempotent : re-soumettre ne crée pas de doublon", async () => {
  await createSession(userId);
  const avant = await prisma.tagFollow.count({ where: { userId } });
  const reponse = await POST(requete({ tags: ["flutter", "nextjs"] }));
  const corps = (await reponse.json()) as { suivis: number };
  const apres = await prisma.tagFollow.count({ where: { userId } });
  expect(apres).toBe(avant); // aucun doublon
  expect(corps.suivis).toBeGreaterThanOrEqual(2);
});

test("nettoyage : tags invalides filtrés, casse normalisée, dédupliqué", async () => {
  await createSession(userId);
  const reponse = await POST(
    requete({ tags: ["  Flutter ", "FLUTTER", "!!!invalid!!!", "react"] }),
  );
  const corps = (await reponse.json()) as { suivis: number };
  // "  Flutter " et "FLUTTER" → "flutter" (dédupliqué) ; "react" valide ; "!!!invalid!!!" rejeté.
  const tags = await prisma.tagFollow.findMany({ where: { userId }, select: { tag: true } });
  const set = new Set(tags.map((t) => t.tag));
  expect(set.has("flutter")).toBe(true);
  expect(set.has("react")).toBe(true);
  expect(corps.suivis).toBeGreaterThan(0);
});

test("liste vide → 200 avec suivis 0", async () => {
  await createSession(userId);
  const reponse = await POST(requete({ tags: [] }));
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as { suivis: number };
  expect(corps.suivis).toBe(0);
});
