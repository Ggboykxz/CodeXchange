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
import {
  createReport,
  estKindSignalement,
  listReports,
  resolveReport,
  banUser,
  unbanUser,
  countPendingReports,
} from "../src/lib/reports";
import { getSessionUserId } from "../src/lib/session";

const HORODATAGE = Date.now();
const EMAIL = `report-user.${HORODATAGE}@test-cx.fr`;

let membreId = 0;
let postId = 0;

beforeAll(async () => {
  const membre = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: "$2b$10$abcdefghijklmnopqrstuv", // factice, jamais vérifié ici
      nom: `Report User ${HORODATAGE}`,
      slug: `report-user-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Dakar",
      pays: "Sénégal",
    },
  });
  membreId = membre.id;
  const post = await prisma.post.create({
    data: { titre: `Sujet à signaler ${HORODATAGE}`, corps: "Contenu", authorId: membre.id },
  });
  postId = post.id;
});

afterAll(async () => {
  await prisma.report.deleteMany({ where: { reporterId: membreId } });
  await prisma.post.deleteMany({ where: { id: postId } });
  await prisma.user.deleteMany({ where: { id: membreId } });
});

test("estKindSignalement filtre les types", () => {
  expect(estKindSignalement("post")).toBe(true);
  expect(estKindSignalement("membre")).toBe(true);
  expect(estKindSignalement("bidon")).toBe(false);
  expect(estKindSignalement(42)).toBe(false);
});

test("createReport puis listReports/countPendingReports", async () => {
  const id = await createReport({
    reporterId: membreId,
    kind: "post",
    targetId: postId,
    raison: "Contenu hors sujet",
  });
  expect(typeof id).toBe("number");

  const liste = await listReports("PENDING");
  expect(liste.some((r) => r.id === id)).toBe(true);
  expect(await countPendingReports()).toBeGreaterThanOrEqual(1);
});

test("createReport refuse un motif vide ou trop long", async () => {
  await expect(
    createReport({ reporterId: membreId, kind: "post", targetId: postId, raison: "   " }),
  ).rejects.toThrow();
  await expect(
    createReport({ reporterId: membreId, kind: "post", targetId: postId, raison: "x".repeat(501) }),
  ).rejects.toThrow();
});

test("resolveReport marque le signalement traité", async () => {
  const id = await createReport({
    reporterId: membreId,
    kind: "job",
    targetId: 999999,
    raison: "Spam",
  });
  expect(await resolveReport(id, membreId, "TRAITE")).toBe(1);
  expect(await resolveReport(id, membreId, "TRAITE")).toBe(1);
  const reste = await listReports("PENDING");
  expect(reste.some((r) => r.id === id)).toBe(false);
});

test("banUser supprime les sessions et bloque la connexion", async () => {
  await banUser(membreId);
  // Session directe créée pour tester le blocage
  await prisma.session.create({
    data: { id: `sess-report-${HORODATAGE}`, userId: membreId, expiresAt: new Date(Date.now() + 3600_000) },
  });
  expect(await getSessionUserId()).not.toBe(membreId);

  await unbanUser(membreId);
  expect((await prisma.user.findUnique({ where: { id: membreId }, select: { bannedAt: true } }))?.bannedAt).toBeNull();
});
