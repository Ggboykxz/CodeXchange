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
import { AppError } from "../src/lib/errors";
import { createEvent, getEvent, listEvents, rsvp, type EventInput } from "../src/lib/events";
import { createSession } from "../src/lib/session";

/**
 * Tests de la couche métier Événements (Task 8) contre `prisma/dev.db`.
 * Conventions reprises de `tests/jobs.test.ts` : données uniques horodatées,
 * route handlers testés avec le pot à cookies, nettoyage `afterAll` dans
 * l'ordre des clés étrangères (Rsvp, Event, Users) — seuls les Users créés
 * par cette suite.
 */

const HORODATAGE = Date.now();
const JOUR = 24 * 60 * 60 * 1000;

let organisateurId = 0;
let participantId = 0;
let inviteId = 0;

/** Tous les événements créés par cette suite (attendus tels quels dans les listes). */
const nosEvenements: number[] = [];

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

/** Événement de base valide, personnalisable ; trace l'id pour nos vérifications. */
async function creeEvenement(partiel: Partial<EventInput> = {}): Promise<number> {
  const id = await createEvent({
    titre: `Meetup CodeXchange (${HORODATAGE})`,
    description: "Une soirée pour rencontrer la communauté.",
    date: new Date(HORODATAGE + JOUR),
    format: "Présentiel",
    ville: "Libreville",
    pays: "Gabon",
    lien: "",
    ...partiel,
  });
  nosEvenements.push(id);
  return id;
}

function requeteJson(url: string, corps: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

beforeAll(async () => {
  const organisateur = await prisma.user.create({
    data: {
      email: `events-orga.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Organisateur Test ${HORODATAGE}`,
      slug: `events-orga-test-${HORODATAGE}`,
      titre: "Développeur Node.js",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  organisateurId = organisateur.id;

  const participant = await prisma.user.create({
    data: {
      email: `events-participant.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Participant Test ${HORODATAGE}`,
      slug: `events-participant-test-${HORODATAGE}`,
      titre: "Développeuse Flutter",
      ville: "Port-Gentil",
      pays: "Gabon",
    },
  });
  participantId = participant.id;

  const invite = await prisma.user.create({
    data: {
      email: `events-invite.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Invité Test ${HORODATAGE}`,
      slug: `events-invite-test-${HORODATAGE}`,
      titre: "Ingénieure Backend",
      ville: "Dakar",
      pays: "Sénégal",
    },
  });
  inviteId = invite.id;
});

// --- Création -----------------------------------------------------------------

test("createEvent : événement valide → id > 0, détail avec compteur RSVP", async () => {
  const id = await creeEvenement({
    titre: `Hackathon Libreville (${HORODATAGE})`,
    description: "24 heures de code au bord de l'océan.",
    date: new Date(HORODATAGE + 5 * JOUR),
    format: "Présentiel",
    ville: "Libreville",
    pays: "Gabon",
  });

  expect(id).toBeGreaterThan(0);

  const detail = await getEvent(id);
  expect(detail).not.toBeNull();
  if (!detail) throw new Error("Événement introuvable après création.");
  expect(detail.titre).toBe(`Hackathon Libreville (${HORODATAGE})`);
  expect(detail.format).toBe("Présentiel");
  expect(detail.date.getTime()).toBe(HORODATAGE + 5 * JOUR);
  expect(detail._count.rsvps).toBe(0);
});

test("createEvent : règle violée → FORUM_VALIDATION (422)", async () => {
  const cas: Partial<EventInput>[] = [
    { titre: "ab" }, // titre < 3 car.
    { titre: "   " },
    { description: "" },
    { description: "x".repeat(2001) },
    { date: "ce n'est pas une date" },
    { format: "Visio" }, // hors liste Présentiel | En ligne
    { ville: "x".repeat(61) },
    { lien: "javascript:alert(1)" },
    { format: "En ligne", lien: "" }, // en ligne → lien obligatoire
  ];

  for (const partiel of cas) {
    const erreur = await leveAppError(creeEvenement(partiel));
    expect(erreur.code).toBe("FORUM_VALIDATION");
    expect(erreur.status).toBe(422);
  }
});

// --- Liste (tri par date croissante, passés d'abord) --------------------------

test("listEvents : tri par date croissante, les passés d'abord", async () => {
  // Créés volontairement dans un ordre différent de l'ordre attendu.
  const passeRecemment = await creeEvenement({
    titre: `Meetup passé récent (${HORODATAGE})`,
    date: new Date(HORODATAGE - 10 * JOUR),
  });
  const passeAncien = await creeEvenement({
    titre: `Meetup passé ancien (${HORODATAGE})`,
    date: new Date(HORODATAGE - 60 * JOUR),
  });
  const futurProche = await creeEvenement({
    titre: `Meetup à venir proche (${HORODATAGE})`,
    date: new Date(HORODATAGE + 10 * JOUR),
  });
  const futurLointain = await creeEvenement({
    titre: `Meetup à venir lointain (${HORODATAGE})`,
    date: new Date(HORODATAGE + 60 * JOUR),
  });

  const liste = await listEvents();

  // Notre sous-ensemble ressort dans l'ordre chronologique attendu.
  const attendus = [passeAncien, passeRecemment, futurProche, futurLointain];
  const sousEnsemble = liste
    .filter((evenement) => attendus.includes(evenement.id))
    .map((evenement) => evenement.id);
  expect(sousEnsemble).toEqual(attendus);

  // La liste globale est croissante (les passés d'abord découlent de ce tri).
  const dates = liste.map((evenement) => evenement.date.getTime());
  expect(dates).toEqual([...dates].sort((a, b) => a - b));

  const maintenant = Date.now();
  const premierFutur = liste.findIndex((evenement) => evenement.date.getTime() > maintenant);
  if (premierFutur > 0) {
    const avant = liste.slice(0, premierFutur).map((evenement) => evenement.date.getTime());
    expect(avant.every((date) => date <= maintenant)).toBe(true); // aucun événement à venir avant un passé
  }
});

// --- RSVP ---------------------------------------------------------------------

test("rsvp : première présence → compteur 1, puis 2 avec un second membre", async () => {
  const eventId = await creeEvenement({
    titre: `Atelier React (${HORODATAGE})`,
    date: new Date(HORODATAGE + 15 * JOUR),
  });

  await expect(rsvp(eventId, participantId)).resolves.toBe(1);
  await expect(rsvp(eventId, inviteId)).resolves.toBe(2);

  const detail = await getEvent(eventId);
  expect(detail?._count.rsvps).toBe(2);
});

test("rsvp : doublon → AppError 409, compteur inchangé", async () => {
  const eventId = await creeEvenement({
    titre: `Conférence Flutter (${HORODATAGE})`,
    date: new Date(HORODATAGE + 20 * JOUR),
  });
  await rsvp(eventId, participantId);

  const erreur = await leveAppError(rsvp(eventId, participantId));

  expect(erreur.status).toBe(409);
  // Réutilisation du code 409 « action déjà effectuée » : `errors.ts` (Task 1)
  // reste inchangé, la route traduit le code en message FR dédié aux RSVP.
  expect(erreur.code).toBe("JOB_DUPLICATE_APPLICATION");

  const detail = await getEvent(eventId);
  expect(detail?._count.rsvps).toBe(1);
});

test("rsvp : événement inconnu → FORUM_VALIDATION (422) ; getEvent inconnu → null", async () => {
  const erreur = await leveAppError(rsvp(999_999_999, participantId));
  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);

  await expect(getEvent(999_999_999)).resolves.toBeNull();
  await expect(getEvent(0)).resolves.toBeNull();
  await expect(getEvent(Number.NaN)).resolves.toBeNull();
});

// --- Route handlers -----------------------------------------------------------

test("GET /api/events → 200 { evenements } triés avec compteur", async () => {
  const { GET: listerEvenements } = await import("../src/app/api/events/route");

  const reponse = await listerEvenements();
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as {
    evenements: { id: number; date: string; _count: { rsvps: number } }[];
  };

  const ids = corps.evenements.map((evenement) => evenement.id);
  for (const id of nosEvenements) expect(ids).toContain(id);

  const dates = corps.evenements.map((evenement) => new Date(evenement.date).getTime());
  expect(dates).toEqual([...dates].sort((a, b) => a - b));

  const chaine = JSON.stringify(corps);
  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain("test-cx.fr");
});

test("POST /api/events : sans session → 401 { error: 'AUTH_INVALID' }", async () => {
  pot.clear();
  const { POST: creerEvenement } = await import("../src/app/api/events/route");

  const reponse = await creerEvenement(
    requeteJson("http://localhost/api/events", {
      titre: "Événement tenté sans session",
      description: "Ne doit pas être créé.",
      date: new Date(HORODATAGE + JOUR).toISOString(),
      format: "Présentiel",
    }),
  );

  expect(reponse.status).toBe(401);
  const corps = (await reponse.json()) as { error: string; message: string };
  expect(corps.error).toBe("AUTH_INVALID");
  expect(corps.message.length).toBeGreaterThan(0);
  expect(pot.size).toBe(0); // précondition : aucun cookie de session en mémoire
});

test("POST /api/events : format inconnu → 422 ; valide → 201 { id }", async () => {
  await createSession(organisateurId);
  const { POST: creerEvenement } = await import("../src/app/api/events/route");

  const invalide = await creerEvenement(
    requeteJson("http://localhost/api/events", {
      titre: `Événement au format ${HORODATAGE}`,
      description: "Format non admis.",
      date: new Date(HORODATAGE + JOUR).toISOString(),
      format: "Hybride",
    }),
  );
  expect(invalide.status).toBe(422);
  expect(((await invalide.json()) as { error: string }).error).toBe("FORUM_VALIDATION");

  const valide = await creerEvenement(
    requeteJson("http://localhost/api/events", {
      titre: `Publié depuis l'API (${HORODATAGE})`,
      description: "Événement créé par la route.",
      date: new Date(HORODATAGE + 30 * JOUR).toISOString(),
      format: "En ligne",
      lien: `https://live.test-cx.fr/${HORODATAGE}`,
    }),
  );
  expect(valide.status).toBe(201);
  const { id } = (await valide.json()) as { id: number };
  expect(id).toBeGreaterThan(0);
  nosEvenements.push(id);

  pot.clear();
});

test("GET /api/events/[id] : 200 { evenement, dejaConfirme } ; inconnu ou id invalide → 404", async () => {
  const eventId = await creeEvenement({
    titre: `Détail consulté via l'API (${HORODATAGE})`,
    date: new Date(HORODATAGE + 25 * JOUR),
  });
  await rsvp(eventId, participantId);
  await createSession(participantId);

  const { GET: detailEvenement } = await import("../src/app/api/events/[id]/route");
  const contexte = (id: string) => ({ params: Promise.resolve({ id }) });

  const reponse = await detailEvenement(
    new Request(`http://localhost/api/events/${eventId}`),
    contexte(String(eventId)),
  );
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as {
    evenement: { id: number; _count: { rsvps: number } };
    dejaConfirme: boolean;
  };
  expect(corps.evenement.id).toBe(eventId);
  expect(corps.evenement._count.rsvps).toBe(1);
  expect(corps.dejaConfirme).toBe(true);

  for (const id of ["999999999", "abc"]) {
    const inconnue = await detailEvenement(
      new Request(`http://localhost/api/events/${id}`),
      contexte(id),
    );
    expect(inconnue.status).toBe(404);
    expect(((await inconnue.json()) as { error: string }).error).toBe("NOT_FOUND");
  }

  pot.clear();
});

test("POST /api/events/[id]/rsvp : 401 sans session, 200 puis 409, 404 sur événement inconnu", async () => {
  const eventId = await creeEvenement({
    titre: `RSVP testé par la route (${HORODATAGE})`,
    date: new Date(HORODATAGE + 35 * JOUR),
  });
  const { POST: confirmer } = await import("../src/app/api/events/[id]/rsvp/route");
  const contexte = (id: string) => ({ params: Promise.resolve({ id }) });

  // 1. sans session → 401
  pot.clear();
  const sansSession = await confirmer(
    requeteJson(`http://localhost/api/events/${eventId}/rsvp`, {}),
    contexte(String(eventId)),
  );
  expect(sansSession.status).toBe(401);
  expect(((await sansSession.json()) as { error: string }).error).toBe("AUTH_INVALID");

  // 2. avec session → 200 { rsvps: 1 }
  await createSession(participantId);
  const premiere = await confirmer(
    requeteJson(`http://localhost/api/events/${eventId}/rsvp`, {}),
    contexte(String(eventId)),
  );
  expect(premiere.status).toBe(200);
  expect(((await premiere.json()) as { rsvps: number }).rsvps).toBe(1);

  // 3. doublon → 409 avec un message FR dédié (pas le message des offres d'emploi)
  const doublon = await confirmer(
    requeteJson(`http://localhost/api/events/${eventId}/rsvp`, {}),
    contexte(String(eventId)),
  );
  expect(doublon.status).toBe(409);
  const corpsDoublon = (await doublon.json()) as { error: string; message: string };
  expect(corpsDoublon.error).toBe("RSVP_DUPLICATE");
  expect(corpsDoublon.message).toContain("déjà");

  // 4. événement inconnu ou id invalide → 404
  for (const id of ["999999999", "abc"]) {
    const inconnue = await confirmer(
      requeteJson(`http://localhost/api/events/${id}/rsvp`, {}),
      contexte(id),
    );
    expect(inconnue.status).toBe(404);
    expect(((await inconnue.json()) as { error: string }).error).toBe("NOT_FOUND");
  }

  pot.clear();
});

// --- Nettoyage -----------------------------------------------------------------

afterAll(async () => {
  // Nettoyage des lignes créées par ces tests, dans l'ordre des clés étrangères.
  await prisma.rsvp.deleteMany({
    where: {
      OR: [{ event: { id: { in: nosEvenements } } }, { userId: { in: [organisateurId, participantId, inviteId] } }],
    },
  });
  await prisma.event.deleteMany({ where: { id: { in: nosEvenements } } });
  await prisma.user.deleteMany({
    where: { id: { in: [organisateurId, participantId, inviteId] } },
  });
  await prisma.$disconnect();
  pot.clear();
});
