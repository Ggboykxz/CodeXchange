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
import { createProject, getProject, joinProject, listProjects, type ProjectInput } from "../src/lib/projects";
import { createSession } from "../src/lib/session";

/**
 * Tests de la couche métier Projets (Task 6) contre `prisma/dev.db`.
 * Conventions reprises de `tests/jobs.test.ts` : données uniques horodatées,
 * route handlers testés avec le pot à cookies, nettoyage `afterAll` dans
 * l'ordre des clés étrangères (ProjectMember, Project, Users).
 */

const HORODATAGE = Date.now();
const EMAIL = `projects.${HORODATAGE}@test-cx.fr`;
const SLUG = `projects-test-${HORODATAGE}`;
const NOM = `Awa Test ${HORODATAGE}`;

let auteurId = 0;
let candidatId = 0;

/** Tous les projets créés par cette suite : attendus tels quels « sans filtre ». */
const nosProjets: number[] = [];

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

/**
 * Projet de base valide, personnalisable ; trace l'id pour la table « aucun
 * filtre ». Les valeurs par défaut sont inertes : aucun jeton des lignes de
 * filtres (`flutter`, `consultations`…) n'y apparaît.
 */
async function creeProjet(partiel: Partial<ProjectInput> = {}): Promise<number> {
  const id = await createProject(auteurId, {
    titre: `Coopérative de développeurs (${HORODATAGE})`,
    description: "Un espace de travail partagé pour lancer des produits utiles.",
    stack: ["Elixir"],
    cherche: ["Mentor"],
    ...partiel,
  });
  nosProjets.push(id);
  return id;
}

function requeteJson(url: string, corps: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corps),
  });
}

function croissants(ids: number[]): number[] {
  return [...ids].sort((a, b) => a - b);
}

async function idsRetournes(f?: Parameters<typeof listProjects>[0]): Promise<number[]> {
  const projets = await listProjects(f);
  return croissants(projets.map((projet) => projet.id));
}

beforeAll(async () => {
  const auteur = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: "hash-non-utilise",
      nom: NOM,
      slug: SLUG,
      titre: "Développeuse React",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  auteurId = auteur.id;

  const candidat = await prisma.user.create({
    data: {
      email: `projects-candidat.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Kwame Test ${HORODATAGE}`,
      slug: `projects-candidat-test-${HORODATAGE}`,
      titre: "Développeur Flutter",
      ville: "Accra",
      pays: "Ghana",
    },
  });
  candidatId = candidat.id;
});

// --- Création ---------------------------------------------------------------

test("création d'un projet valide → id > 0", async () => {
  const id = await creeProjet(); // valeurs par défaut inertes pour les filtres

  expect(id).toBeGreaterThan(0);

  const detail = await getProject(id);
  expect(detail?.titre).toBe(`Coopérative de développeurs (${HORODATAGE})`);
  expect(detail?.author.id).toBe(auteurId);
  expect(detail?._count.membres).toBe(0);
});

test("titre vide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(creeProjet({ titre: "    " }));
  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("description de plus de 2000 caractères → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    creeProjet({
      titre: `Projet à description trop longue (${HORODATAGE})`,
      description: "x".repeat(2001),
    }),
  );
  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

// --- Filtres (Review Focus n°4 : chaque combinaison → sous-ensemble exact) ---

test("listProjects : filtre stack (CSV, insensible à la casse) et recherche q", async () => {
  const A = await creeProjet({
    titre: `Application de santé communautaire (${HORODATAGE})`,
    description: "Suivi des consultations pour les cliniques de quartier.",
    stack: ["Flutter", "Dart"],
    cherche: ["Designer"],
  });
  const B = await creeProjet({
    titre: `Marketplace agricole (${HORODATAGE})`,
    description: "Plateforme de vente entre producteurs et citadins.",
    stack: ["React", "TypeScript"],
    cherche: ["Mobile", "Backend"],
  });
  const C = await creeProjet({
    titre: `Portefeuille crypto (${HORODATAGE})`,
    description: "Paiements simples pour les commerces de Douala.",
    stack: ["Flutter", "Node"],
    cherche: ["Sécurité"],
  });

  const table = [
    { filtre: { stack: "flutter" }, attendus: [A, C] }, // CSV : une entrée suffit
    { filtre: { stack: "REACT" }, attendus: [B] }, // insensible à la casse
    { filtre: { stack: "dart" }, attendus: [A] },
    { filtre: { q: "marketplace" }, attendus: [B] }, // sur le titre
    { filtre: { q: "CONSULTATIONS" }, attendus: [A] }, // sur la description, casse
    { filtre: { q: "citadins" }, attendus: [B] },
    { filtre: { stack: "flutter", q: "paiements" }, attendus: [C] },
    { filtre: { stack: "flutter", q: "marketplace" }, attendus: [] },
    { filtre: { stack: "cobol" }, attendus: [] },
    { filtre: undefined, attendus: [...nosProjets] }, // aucun filtre → tous nos projets
  ];

  for (const ligne of table) {
    expect(await idsRetournes(ligne.filtre)).toEqual(croissants(ligne.attendus));
  }
});

// --- Rejoindre --------------------------------------------------------------

test("joinProject : première adhésion → 1 ; seconde → même compteur (idempotent)", async () => {
  const id = await creeProjet({ titre: `Projet à rejoindre deux fois (${HORODATAGE})` });

  await expect(joinProject(id, candidatId)).resolves.toBe(1);
  await expect(joinProject(id, candidatId)).resolves.toBe(1); // aucune erreur

  const detail = await getProject(id);
  expect(detail?._count.membres).toBe(1);
});

test("joinProject : l'auteur rejoint son propre projet → autorisé, compteur inchangé", async () => {
  const id = await creeProjet({ titre: `Projet rejoint par son auteur (${HORODATAGE})` });
  await joinProject(id, candidatId); // compteur 1

  await expect(joinProject(id, auteurId)).resolves.toBe(1); // aucune erreur, inchangé

  const detail = await getProject(id);
  expect(detail?._count.membres).toBe(1);
});

test("joinProject : projet inconnu → FORUM_VALIDATION", async () => {
  const erreur = await leveAppError(joinProject(999_999_999, candidatId));
  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

// --- Détail ------------------------------------------------------------------

test("getProject : auteur inclus, `cherche` en tableau, nombre de membres ; inexistant → null", async () => {
  const id = await creeProjet({
    titre: `Application de santé communautaire (${HORODATAGE})`,
    description: "Suivi des consultations pour les cliniques de quartier.",
    stack: ["Flutter", "Dart"],
    cherche: ["Designer", "Mobile"],
  });
  await joinProject(id, candidatId);

  const detail = await getProject(id);

  expect(detail).not.toBeNull();
  if (!detail) throw new Error("Projet introuvable après création.");
  expect(detail.author.id).toBe(auteurId);
  expect(detail.author.nom).toBe(NOM);
  expect(detail.author.slug).toBe(SLUG);
  expect(detail.stack).toEqual(["Flutter", "Dart"]);
  expect(detail.cherche).toEqual(["Designer", "Mobile"]);
  expect(detail._count.membres).toBe(1);

  await expect(getProject(999_999_999)).resolves.toBeNull();
});

// --- Route handlers ---------------------------------------------------------

test("routes projets sans session → 401 { error: 'AUTH_INVALID' }", async () => {
  pot.clear();
  const { POST: creerProjet } = await import("../src/app/api/projects/route");
  const { POST: rejoindre } = await import("../src/app/api/projects/[id]/join/route");
  const contexte = { params: Promise.resolve({ id: "1" }) };

  const reponses = await Promise.all([
    creerProjet(
      requeteJson("http://localhost/api/projects", {
        titre: "Projet tenté sans session",
        description: "Un projet qui ne devrait pas être créé.",
        stack: ["Flutter"],
        cherche: ["Designer"],
      }),
    ),
    rejoindre(requeteJson("http://localhost/api/projects/1/join", {}), contexte),
  ]);

  for (const reponse of reponses) {
    expect(reponse.status).toBe(401);
    const corps = (await reponse.json()) as { error: string; message: string };
    expect(corps.error).toBe("AUTH_INVALID");
    expect(corps.message.length).toBeGreaterThan(0);
  }
  expect(pot.size).toBe(0); // précondition : aucun cookie de session en mémoire
});

test("POST /api/projects : titre vide ou description trop longue → 422 { error: 'FORUM_VALIDATION' }", async () => {
  await createSession(auteurId);
  const { POST: creerProjet } = await import("../src/app/api/projects/route");

  const titreVide = await creerProjet(
    requeteJson("http://localhost/api/projects", {
      titre: "    ",
      description: "Un projet sans titre.",
      stack: ["Flutter"],
      cherche: ["Designer"],
    }),
  );
  expect(titreVide.status).toBe(422);
  expect(((await titreVide.json()) as { error: string }).error).toBe("FORUM_VALIDATION");

  const descriptionLongue = await creerProjet(
    requeteJson("http://localhost/api/projects", {
      titre: `Projet à description trop longue via l'API (${HORODATAGE})`,
      description: "x".repeat(2001),
      stack: ["Flutter"],
      cherche: ["Designer"],
    }),
  );
  expect(descriptionLongue.status).toBe(422);
  expect(((await descriptionLongue.json()) as { error: string }).error).toBe("FORUM_VALIDATION");

  pot.clear();
});

test("POST /api/projects valide → 201 { id } ; GET /api/projects filtre par stack", async () => {
  await createSession(auteurId);
  const { GET: listerProjets, POST: creerProjet } = await import("../src/app/api/projects/route");

  const reponse = await creerProjet(
    requeteJson("http://localhost/api/projects", {
      titre: `Projet publié depuis l'API (${HORODATAGE})`,
      description: "Un carnet de bord numérique pour les pêcheurs de Port-Gentil.",
      stack: ["React", "Node"],
      cherche: ["Mobile"],
    }),
  );
  expect(reponse.status).toBe(201);
  const { id } = (await reponse.json()) as { id: number };
  expect(id).toBeGreaterThan(0);
  nosProjets.push(id);

  const liste = await listerProjets(new Request("http://localhost/api/projects?stack=node"));
  expect(liste.status).toBe(200);
  const corps = (await liste.json()) as { projets: { id: number; stack: string[] }[] };
  expect(corps.projets.map((projet) => projet.id)).toContain(id);
  for (const projet of corps.projets) expect(projet.stack).toContain("Node");

  pot.clear();
});

test("POST /api/projects/[id]/join : deux appels → 200 { membres } identique (idempotent)", async () => {
  const projetId = await creeProjet({
    titre: `Projet rejoint deux fois via l'API (${HORODATAGE})`,
  });
  await createSession(candidatId);
  const { POST: rejoindre } = await import("../src/app/api/projects/[id]/join/route");
  const contexte = { params: Promise.resolve({ id: String(projetId) }) };

  const premiere = await rejoindre(
    requeteJson(`http://localhost/api/projects/${projetId}/join`, {}),
    contexte,
  );
  expect(premiere.status).toBe(200);
  expect(((await premiere.json()) as { membres: number }).membres).toBe(1);

  const seconde = await rejoindre(
    requeteJson(`http://localhost/api/projects/${projetId}/join`, {}),
    contexte,
  );
  expect(seconde.status).toBe(200);
  expect(((await seconde.json()) as { membres: number }).membres).toBe(1);

  pot.clear();
});

test("routes projets : projet inconnu ou id invalide → 404 { error: 'NOT_FOUND' }", async () => {
  const { GET: detailProjet } = await import("../src/app/api/projects/[id]/route");
  const { POST: rejoindre } = await import("../src/app/api/projects/[id]/join/route");
  const contexte = (id: string) => ({ params: Promise.resolve({ id }) });

  const inconnu = await detailProjet(
    new Request("http://localhost/api/projects/999999999"),
    contexte("999999999"),
  );
  expect(inconnu.status).toBe(404);
  expect(((await inconnu.json()) as { error: string }).error).toBe("NOT_FOUND");

  const idInvalide = await detailProjet(
    new Request("http://localhost/api/projects/abc"),
    contexte("abc"),
  );
  expect(idInvalide.status).toBe(404);

  await createSession(candidatId);
  const adhesion = await rejoindre(
    requeteJson("http://localhost/api/projects/999999999/join", {}),
    contexte("999999999"),
  );
  expect(adhesion.status).toBe(404);
  expect(((await adhesion.json()) as { error: string }).error).toBe("NOT_FOUND");

  pot.clear();
});

afterAll(async () => {
  // Nettoyage des lignes créées par ces tests, dans l'ordre des clés étrangères.
  await prisma.projectMember.deleteMany({
    where: {
      OR: [{ project: { authorId: auteurId } }, { userId: { in: [auteurId, candidatId] } }],
    },
  });
  await prisma.project.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: { in: [auteurId, candidatId] } } });
  await prisma.$disconnect();
  pot.clear();
});
