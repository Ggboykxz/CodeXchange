import { afterAll, beforeAll, expect, test, vi } from "vitest";

// Pot à cookies en mémoire (convention de `tests/auth.test.ts`) : indispensable
// pour appeler les route handlers, qui lisent la session via `cookies()`.
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
import { AppError, MESSAGE_FR } from "../src/lib/errors";
import { getMentor, listMentors, requestMentor } from "../src/lib/mentorat";
import { createSession } from "../src/lib/session";

/**
 * Tests de la couche métier Mentorat (Task 8) contre `prisma/dev.db`.
 * Conventions reprises de `tests/jobs.test.ts` : données uniques horodatées,
 * route handlers testés avec le pot à cookies, nettoyage `afterAll` dans
 * l'ordre des clés étrangères (MentorRequest, Users de cette suite uniquement).
 */

const HORODATAGE = Date.now();
const MESSAGE_VALIDE = "Bonjour, je souhaite être accompagné sur mon premier projet mobile.";

let mentorPrincipalId = 0;
let secondMentorId = 0;
let membreId = 0;
let demandeurId = 0;

/** Tous les Users créés par cette suite : jamais ceux des autres tests. */
function nosIds(): number[] {
  return [mentorPrincipalId, secondMentorId, membreId, demandeurId];
}

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

function requeteJson(url: string, corps: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

async function creeMembre(
  prefixe: string,
  nom: string,
  role: "MEMBER" | "MENTOR",
): Promise<number> {
  const membre = await prisma.user.create({
    data: {
      email: `${prefixe}.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `${nom} Test ${HORODATAGE}`,
      slug: `${prefixe}-test-${HORODATAGE}`,
      titre: role === "MENTOR" ? "Lead technique" : "Développeur Backend",
      ville: "Libreville",
      pays: "Gabon",
      role,
      stack: role === "MENTOR" ? "Node,Postgres" : "Django",
    },
  });
  return membre.id;
}

beforeAll(async () => {
  mentorPrincipalId = await creeMembre("mentorat-mentor", "Mentor Principal", "MENTOR");
  secondMentorId = await creeMembre("mentorat-second", "Second Mentor", "MENTOR");
  membreId = await creeMembre("mentorat-membre", "Membre Simple", "MEMBER");
  demandeurId = await creeMembre("mentorat-demandeur", "Demandeur", "MEMBER");
});

// --- Annuaire des mentors ------------------------------------------------------

test("listMentors : uniquement les users role=MENTOR, sans données privées", async () => {
  const mentors = await listMentors();
  const ids = mentors.map((mentor) => mentor.id);

  expect(ids).toContain(mentorPrincipalId);
  expect(ids).toContain(secondMentorId);
  expect(ids).not.toContain(membreId); // role MEMBER
  expect(ids).not.toContain(demandeurId); // role MEMBER

  for (const mentor of mentors) expect(mentor.role).toBe("MENTOR");

  const principal = mentors.find((mentor) => mentor.id === mentorPrincipalId);
  expect(principal?.stack).toEqual(["Node", "Postgres"]);
  expect(principal?.slug).toBe(`mentorat-mentor-test-${HORODATAGE}`);

  const chaine = JSON.stringify(mentors);
  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain("test-cx.fr");
});

test("getMentor : mentor connu → profil public ; membre simple ou id inconnu → null", async () => {
  const mentor = await getMentor(mentorPrincipalId);
  expect(mentor?.id).toBe(mentorPrincipalId);
  expect(mentor?.role).toBe("MENTOR");

  await expect(getMentor(membreId)).resolves.toBeNull(); // pas de rôle MENTOR
  await expect(getMentor(999_999_999)).resolves.toBeNull();
  await expect(getMentor(0)).resolves.toBeNull();
});

// --- Demandes ------------------------------------------------------------------

test("requestMentor : demande valide → id > 0", async () => {
  const id = await requestMentor(mentorPrincipalId, demandeurId, MESSAGE_VALIDE);

  expect(id).toBeGreaterThan(0);

  const ligne = await prisma.mentorRequest.findUnique({ where: { id } });
  expect(ligne?.mentorId).toBe(mentorPrincipalId);
  expect(ligne?.requesterId).toBe(demandeurId);
  expect(ligne?.message).toBe(MESSAGE_VALIDE.trim());
});

test("requestMentor : seconde demande au même mentor → MENTOR_DUPLICATE (409)", async () => {
  const avant = await prisma.mentorRequest.count({
    where: { mentorId: mentorPrincipalId, requesterId: demandeurId },
  });

  const erreur = await leveAppError(
    requestMentor(mentorPrincipalId, demandeurId, "Un autre message, même mentor."),
  );

  expect(erreur.code).toBe("MENTOR_DUPLICATE");
  expect(erreur.status).toBe(409);

  const apres = await prisma.mentorRequest.count({
    where: { mentorId: mentorPrincipalId, requesterId: demandeurId },
  });
  expect(apres).toBe(avant); // toujours une seule demande
});

test("requestMentor : soi-même → MENTOR_SELF_REQUEST (403)", async () => {
  const erreur = await leveAppError(
    requestMentor(mentorPrincipalId, mentorPrincipalId, MESSAGE_VALIDE),
  );

  expect(erreur.code).toBe("MENTOR_SELF_REQUEST");
  expect(erreur.status).toBe(403);

  const lignes = await prisma.mentorRequest.count({
    where: { mentorId: mentorPrincipalId, requesterId: mentorPrincipalId },
  });
  expect(lignes).toBe(0);
});

test("requestMentor : message hors 10–1000 car. → FORUM_VALIDATION (422)", async () => {
  // Paire neuve (membre → second mentor) : aucun doublon ne fausse le contrôle.
  const cas = ["", "court", " ".repeat(12), "x".repeat(1001)];

  for (const message of cas) {
    const erreur = await leveAppError(requestMentor(secondMentorId, membreId, message));
    expect(erreur.code).toBe("FORUM_VALIDATION");
    expect(erreur.status).toBe(422);
  }

  // À la limite basse : exactement 10 caractères → accepté.
  await expect(requestMentor(secondMentorId, membreId, "a".repeat(10))).resolves.toBeGreaterThan(0);
});

test("requestMentor : mentor inconnu ou membre sans le rôle → FORUM_VALIDATION (422)", async () => {
  const inconnu = await leveAppError(requestMentor(999_999_999, demandeurId, MESSAGE_VALIDE));
  expect(inconnu.code).toBe("FORUM_VALIDATION");
  expect(inconnu.status).toBe(422);

  const sansRole = await leveAppError(requestMentor(membreId, demandeurId, MESSAGE_VALIDE));
  expect(sansRole.code).toBe("FORUM_VALIDATION");
  expect(sansRole.status).toBe(422);
});

// --- Route handlers ------------------------------------------------------------

test("GET /api/mentorat → 200 { mentors } sans données privées", async () => {
  const { GET: listerMentors } = await import("../src/app/api/mentorat/route");

  const reponse = await listerMentors();
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as { mentors: { id: number; role: string }[] };
  const ids = corps.mentors.map((mentor) => mentor.id);

  expect(ids).toContain(mentorPrincipalId);
  expect(ids).not.toContain(membreId);

  const chaine = JSON.stringify(corps);
  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain("test-cx.fr");
});

test("POST /api/mentorat : sans session → 401 { error: 'AUTH_INVALID' }", async () => {
  pot.clear();
  const { POST: demander } = await import("../src/app/api/mentorat/route");

  const reponse = await demander(
    requeteJson("http://localhost/api/mentorat", {
      mentorId: mentorPrincipalId,
      message: MESSAGE_VALIDE,
    }),
  );

  expect(reponse.status).toBe(401);
  const corps = (await reponse.json()) as { error: string; message: string };
  expect(corps.error).toBe("AUTH_INVALID");
  expect(corps.message.length).toBeGreaterThan(0);
  expect(pot.size).toBe(0); // précondition : aucun cookie de session en mémoire
});

test("POST /api/mentorat : demande valide → 201 { id }", async () => {
  await createSession(demandeurId);
  const { POST: demander } = await import("../src/app/api/mentorat/route");

  const reponse = await demander(
    requeteJson("http://localhost/api/mentorat", {
      mentorId: secondMentorId,
      message: `Bonjour, un message envoyé depuis l'API (${HORODATAGE}).`,
    }),
  );

  expect(reponse.status).toBe(201);
  const { id } = (await reponse.json()) as { id: number };
  expect(id).toBeGreaterThan(0);

  pot.clear();
});

test("POST /api/mentorat : soi-même → 403 et doublon → 409 avec MESSAGE_FR", async () => {
  // Soi-même : la session correspond au mentor demandé.
  await createSession(mentorPrincipalId);
  const { POST: demander } = await import("../src/app/api/mentorat/route");

  const soiMeme = await demander(
    requeteJson("http://localhost/api/mentorat", {
      mentorId: mentorPrincipalId,
      message: MESSAGE_VALIDE,
    }),
  );
  expect(soiMeme.status).toBe(403);
  const corpsSoiMeme = (await soiMeme.json()) as { error: string; message: string };
  expect(corpsSoiMeme.error).toBe("MENTOR_SELF_REQUEST");
  expect(corpsSoiMeme.message).toBe(MESSAGE_FR.MENTOR_SELF_REQUEST);

  pot.clear();
  await createSession(demandeurId);

  // Doublon : le demandeur a déjà écrit au mentor principal.
  const doublon = await demander(
    requeteJson("http://localhost/api/mentorat", {
      mentorId: mentorPrincipalId,
      message: "Un message répété, même mentor.",
    }),
  );
  expect(doublon.status).toBe(409);
  const corpsDoublon = (await doublon.json()) as { error: string; message: string };
  expect(corpsDoublon.error).toBe("MENTOR_DUPLICATE");
  expect(corpsDoublon.message).toBe(MESSAGE_FR.MENTOR_DUPLICATE);

  pot.clear();
});

test("POST /api/mentorat : message invalide → 422 ; mentor inconnu ou id invalide → 404", async () => {
  // Paire neuve (second mentor → mentor principal) : pas de doublon préexistant.
  await createSession(secondMentorId);
  const { POST: demander } = await import("../src/app/api/mentorat/route");

  const messageCourt = await demander(
    requeteJson("http://localhost/api/mentorat", {
      mentorId: mentorPrincipalId,
      message: "tropcourt", // 9 caractères : sous le minimum de 10
    }),
  );
  expect(messageCourt.status).toBe(422);
  expect(((await messageCourt.json()) as { error: string }).error).toBe("FORUM_VALIDATION");

  for (const mentorId of [999999999, "abc"]) {
    const inconnu = await demander(
      requeteJson("http://localhost/api/mentorat", { mentorId, message: MESSAGE_VALIDE }),
    );
    expect(inconnu.status).toBe(404);
    expect(((await inconnu.json()) as { error: string }).error).toBe("NOT_FOUND");
  }

  pot.clear();
});

// --- Nettoyage -----------------------------------------------------------------

afterAll(async () => {
  // Nettoyage des lignes créées par ces tests, dans l'ordre des clés étrangères.
  await prisma.mentorRequest.deleteMany({
    where: { OR: [{ mentorId: { in: nosIds() } }, { requesterId: { in: nosIds() } }] },
  });
  await prisma.user.deleteMany({ where: { id: { in: nosIds() } } });
  await prisma.$disconnect();
  pot.clear();
});
