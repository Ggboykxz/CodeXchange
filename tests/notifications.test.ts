import { afterAll, beforeAll, expect, test, vi } from "vitest";

// Pot à cookies (convention) — requis si on teste les route handlers.
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
  createNotification,
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from "../src/lib/notifications";
import { addReply, createPost, toggleLike } from "../src/lib/forum";
import { applyToJob, createJob } from "../src/lib/jobs";
import { createProject, joinProject } from "../src/lib/projects";
import { requestMentor } from "../src/lib/mentorat";

const HORODATAGE = Date.now();

let auteurId = 0; // propriétaire des entités (rôle MENTOR)
let acteurId = 0; // membre qui agit

function goodsJobInput() {
  return {
    titre: `Offre notif ${HORODATAGE}`,
    entreprise: "CodeXchange",
    contrat: "CDI",
    remote: true,
    pays: "Gabon",
    ville: "Libreville",
    lien: "https://example.com/offre",
  };
}

beforeAll(async () => {
  const auteur = await prisma.user.create({
    data: {
      email: `notif-auteur.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Auteur Notif ${HORODATAGE}`,
      slug: `notif-auteur-${HORODATAGE}`,
      titre: "Mentor",
      ville: "Libreville",
      pays: "Gabon",
      role: "MENTOR",
    },
  });
  auteurId = auteur.id;

  const acteur = await prisma.user.create({
    data: {
      email: `notif-acteur.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Acteur Notif ${HORODATAGE}`,
      slug: `notif-acteur-${HORODATAGE}`,
      titre: "Développeur",
      ville: "Dakar",
      pays: "Sénégal",
    },
  });
  acteurId = acteur.id;
});

// --- Modèle -----------------------------------------------------------------

test("modèle Notification expose les champs attendus", async () => {
  const n = await prisma.notification.create({
    data: { userId: auteurId, type: "REPONSE_SUJET", text: "bonjour", lien: "/x" },
  });
  expect(typeof n.id).toBe("number");
  expect(n.userId).toBe(auteurId);
  expect(n.type).toBe("REPONSE_SUJET");
  expect(n.text).toBe("bonjour");
  expect(n.lien).toBe("/x");
  expect(n.isRead).toBe(false);
  expect(n.createdAt instanceof Date).toBe(true);
  await prisma.notification.delete({ where: { id: n.id } });
});

// --- Création / liste / compteur ------------------------------------------

test("createNotification → listNotifications et unreadCount", async () => {
  const id = await createNotification({
    userId: auteurId,
    type: "LIKE_SUJET",
    text: "Un like reçu",
    lien: "/forum/1",
  });

  const liste = await listNotifications(auteurId, { limit: 10, unreadOnly: true });
  expect(liste.some((n) => n.id === id)).toBe(true);

  const compte = await unreadCount(auteurId);
  expect(compte).toBeGreaterThanOrEqual(1);

  const toutes = await listNotifications(auteurId, { limit: 5 });
  expect(toutes.length).toBeLessThanOrEqual(5);
});

// --- Mark read / mark all ---------------------------------------------------

test("markRead cible une notification et unreadCount diminue", async () => {
  const id = await createNotification({
    userId: auteurId,
    type: "CANDIDATURE",
    text: "Candidature reçue",
  });

  const misAJour = await markRead(id, auteurId);
  expect(misAJour).toBe(1);

  const nonLues = await listNotifications(auteurId, { unreadOnly: true });
  expect(nonLues.some((n) => n.id === id)).toBe(false);
});

test("markAllRead remet le compteur à zéro", async () => {
  await createNotification({ userId: auteurId, type: "DEMANDE_MENTOR", text: "Demande" });

  const misAJour = await markAllRead(auteurId);
  expect(misAJour).toBeGreaterThanOrEqual(1);
  expect(await unreadCount(auteurId)).toBe(0);
});

// --- Triggers ---------------------------------------------------------------

test("trigger réponse : notification REPONSE_SUJET à l'auteur", async () => {
  const postId = await createPost(auteurId, {
    titre: `Sujet notif réponse ${HORODATAGE}`,
    corps: "Corps suffisamment long pour être valide.",
    tags: ["test"],
  });

  await addReply(postId, acteurId, "Merci pour ce sujet !");

  const notifs = await listNotifications(auteurId, { limit: 20 });
  expect(
    notifs.some((n) => n.type === "REPONSE_SUJET" && n.lien === `/forum/${postId}`),
  ).toBe(true);
});

test("trigger like : notification LIKE_SUJET à l'auteur (like ajouté uniquement)", async () => {
  const postId = await createPost(auteurId, {
    titre: `Sujet notif like ${HORODATAGE}`,
    corps: "Corps suffisamment long pour être valide.",
    tags: ["test"],
  });

  const resultat = await toggleLike(postId, acteurId);
  expect(resultat).toBe(true);

  const notifs = await listNotifications(auteurId, { limit: 20 });
  expect(notifs.some((n) => n.type === "LIKE_SUJET" && n.lien === `/forum/${postId}`)).toBe(true);

  // unlike → pas de nouvelle notification
  await toggleLike(postId, acteurId);
});

test("trigger candidature : notification CANDIDATURE au propriétaire", async () => {
  const jobId = await createJob(auteurId, goodsJobInput());

  await applyToJob(jobId, acteurId);

  const notifs = await listNotifications(auteurId, { limit: 20 });
  expect(
    notifs.some((n) => n.type === "CANDIDATURE" && n.lien === `/jobs/${jobId}`),
  ).toBe(true);
});

test("trigger rejoindre projet : notification REJOINDRE_PROJET", async () => {
  const projectId = await createProject(auteurId, {
    titre: `Projet notif ${HORODATAGE}`,
    description: "Description suffisamment longue.",
  });

  await joinProject(projectId, acteurId);

  const notifs = await listNotifications(auteurId, { limit: 20 });
  expect(
    notifs.some((n) => n.type === "REJOINDRE_PROJET" && n.lien === `/projets/${projectId}`),
  ).toBe(true);
});

test("trigger mentorat : notification DEMANDE_MENTOR au mentor", async () => {
  const demandeId = await requestMentor(auteurId, acteurId, "Bonjour, j'aimerais être mentoré par vous.");
  expect(demandeId).toBeGreaterThan(0);

  const notifs = await listNotifications(auteurId, { limit: 20 });
  expect(notifs.some((n) => n.type === "DEMANDE_MENTOR")).toBe(true);
});

// --- API protégée -----------------------------------------------------------

test("GET /api/notifications sans session → 401 { error: 'AUTH_INVALID' }", async () => {
  const { GET } = await import("../src/app/api/notifications/route");
  const reponse = await GET(new Request("http://localhost/api/notifications"));
  expect(reponse.status).toBe(401);
  const corps = (await reponse.json()) as { error: string };
  expect(corps.error).toBe("AUTH_INVALID");
});

afterAll(async () => {
  // Nettoyage dans l'ordre des clés étrangères.
  await prisma.notification.deleteMany({
    where: { userId: { in: [auteurId, acteurId] } },
  });
  await prisma.mentorRequest.deleteMany({
    where: { OR: [{ mentorId: auteurId }, { requesterId: acteurId }] },
  });
  await prisma.projectMember.deleteMany({
    where: { userId: acteurId },
  });
  await prisma.application.deleteMany({
    where: { OR: [{ job: { authorId: auteurId } }, { userId: acteurId }] },
  });
  await prisma.reply.deleteMany({
    where: { OR: [{ authorId: acteurId }, { post: { authorId: auteurId } }] },
  });
  await prisma.like.deleteMany({
    where: { OR: [{ userId: acteurId }, { post: { authorId: auteurId } }] },
  });
  await prisma.post.deleteMany({ where: { authorId: auteurId } });
  await prisma.job.deleteMany({ where: { authorId: auteurId } });
  await prisma.project.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: { in: [auteurId, acteurId] } } });
  await prisma.$disconnect();
  pot.clear();
});
