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
import { applyToJob, createJob, getJob, listJobs, type JobInput } from "../src/lib/jobs";
import { createSession } from "../src/lib/session";

/**
 * Tests de la couche métier Jobs (Task 5) contre `prisma/dev.db`.
 * Conventions reprises de `tests/forum.test.ts` : données uniques horodatées,
 * route handlers testés avec le pot à cookies, nettoyage `afterAll` dans
 * l'ordre des clés étrangères (Application, Job, Users).
 */

const HORODATAGE = Date.now();
const EMAIL = `jobs.${HORODATAGE}@test-cx.fr`;
const SLUG = `jobs-test-${HORODATAGE}`;
const NOM = `Moustapha Test ${HORODATAGE}`;

let auteurId = 0;
let candidatId = 0;

/** Toutes les offres créées par cette suite : attendues telles quelles « sans filtre ». */
const nosOffres: number[] = [];

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

/** Offre de base valide, personnalisable ; trace l'id pour la table « aucun filtre ». */
async function creeOffre(partiel: Partial<JobInput> = {}): Promise<number> {
  const id = await createJob(auteurId, {
    titre: "Développeur Fullstack",
    entreprise: "Entreprise Test",
    contrat: "CDI",
    remote: false,
    pays: "Gabon",
    ville: "Libreville",
    lien: `https://offres-test-cx.ga/${HORODATAGE}`,
    ...partiel,
  });
  nosOffres.push(id);
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

async function idsRetournes(f?: Parameters<typeof listJobs>[0]): Promise<number[]> {
  const offres = await listJobs(f);
  return croissants(offres.map((offre) => offre.id));
}

beforeAll(async () => {
  const membre = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: "hash-non-utilise",
      nom: NOM,
      slug: SLUG,
      titre: "Développeur Node.js",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  auteurId = membre.id;

  const candidat = await prisma.user.create({
    data: {
      email: `jobs-candidat.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Jeanne Test ${HORODATAGE}`,
      slug: `jobs-candidat-test-${HORODATAGE}`,
      titre: "Développeuse Flutter",
      ville: "Port-Gentil",
      pays: "Gabon",
    },
  });
  candidatId = candidat.id;
});

// --- Création ---------------------------------------------------------------

test("création d'une offre valide → id > 0", async () => {
  const id = await creeOffre({
    titre: `Développeur Backend Go pour fintech (${HORODATAGE})`,
    entreprise: "Microfinance Numérique",
    contrat: "Stage",
    remote: false,
    pays: "Bénin",
    ville: "Cotonou",
    lien: `https://microfinance-numerique.bj/offres/go-${HORODATAGE}`,
  });

  expect(id).toBeGreaterThan(0);

  const detail = await getJob(id);
  expect(detail?.contrat).toBe("Stage");
  expect(detail?.remote).toBe(false);
  expect(detail?.ville).toBe("Cotonou");
  expect(detail?.lien).toBe(`https://microfinance-numerique.bj/offres/go-${HORODATAGE}`);
  expect(detail?.auteur.id).toBe(auteurId);
});

test("contrat hors liste ('CDD') → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    creeOffre({ contrat: "CDD", titre: `Offre au contrat CDD (${HORODATAGE})` }),
  );

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("lien non-URL ('plop') → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    creeOffre({ lien: "plop", titre: `Offre au lien plop (${HORODATAGE})` }),
  );

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("titre ou entreprise vide → FORUM_VALIDATION (422)", async () => {
  const sansTitre = await leveAppError(creeOffre({ titre: "   " }));
  expect(sansTitre.code).toBe("FORUM_VALIDATION");

  const sansEntreprise = await leveAppError(creeOffre({ entreprise: " " }));
  expect(sansEntreprise.code).toBe("FORUM_VALIDATION");
});

// --- Filtres (Review Focus n°4 : chaque combinaison → sous-ensemble exact) ---

test("listJobs : table des combinaisons de filtres → résultat exact", async () => {
  const A = await creeOffre({
    titre: `Développeur Flutter senior (${HORODATAGE})`,
    entreprise: "Fintech Gabonaise",
    contrat: "Freelance",
    remote: true,
    pays: "Gabon",
    ville: "Libreville",
    lien: `https://fintech-gabonaise.ga/offres/flutter-${HORODATAGE}`,
  });
  const B = await creeOffre({
    titre: `Développeur Flutter mobile (${HORODATAGE})`,
    entreprise: "Cameroun Tech",
    contrat: "CDI",
    remote: false,
    pays: "Cameroun",
    ville: "Douala",
    lien: `https://cameroun-tech.cm/offres/mobile-${HORODATAGE}`,
  });
  const C = await creeOffre({
    titre: `Ingénieur backend Node (${HORODATAGE})`,
    entreprise: "Dakar Digital",
    contrat: "Stage",
    remote: true,
    pays: "Sénégal",
    ville: "Dakar",
    lien: `https://dakar-digital.sn/offres/node-${HORODATAGE}`,
  });
  const D = await creeOffre({
    titre: `Testeur QA manuel (${HORODATAGE})`,
    entreprise: "Qualité Libreville",
    contrat: "Alternance",
    remote: false,
    pays: "Gabon",
    ville: "Libreville",
    lien: `https://qualite-libreville.ga/offres/qa-${HORODATAGE}`,
  });

  const table = [
    { filtre: { remote: true }, attendus: [A, C] },
    { filtre: { pays: "Gabon" }, attendus: [A, D] },
    { filtre: { contrat: "CDI" }, attendus: [B] },
    { filtre: { q: "FLUTTER" }, attendus: [A, B] }, // insensible à la casse
    { filtre: { remote: true, pays: "Sénégal" }, attendus: [C] },
    { filtre: { q: "flutter", pays: "Cameroun" }, attendus: [B] },
    { filtre: { contrat: "freelance" }, attendus: [A] }, // insensible à la casse
    { filtre: undefined, attendus: [...nosOffres] }, // aucun filtre → toutes les offres
  ];

  for (const ligne of table) {
    expect(await idsRetournes(ligne.filtre)).toEqual(croissants(ligne.attendus));
  }
});

// --- Postulation -------------------------------------------------------------

test("applyToJob : première postulation → compteur 1", async () => {
  const jobId = await creeOffre({
    titre: `Offre à postuler une fois (${HORODATAGE})`,
    lien: `https://postuler-une-fois.ga/${HORODATAGE}`,
  });

  await expect(applyToJob(jobId, auteurId)).resolves.toBe(1);
});

test("applyToJob : seconde postulation → JOB_DUPLICATE_APPLICATION (409), compteur inchangé", async () => {
  const jobId = await creeOffre({
    titre: `Offre à postuler deux fois (${HORODATAGE})`,
    lien: `https://postuler-deux-fois.ga/${HORODATAGE}`,
  });
  await applyToJob(jobId, auteurId);

  const erreur = await leveAppError(applyToJob(jobId, auteurId));

  expect(erreur.code).toBe("JOB_DUPLICATE_APPLICATION");
  expect(erreur.status).toBe(409);

  const detail = await getJob(jobId);
  expect(detail?._count.candidatures).toBe(1);
});

test("applyToJob : offre inconnue → FORUM_VALIDATION", async () => {
  const erreur = await leveAppError(applyToJob(999_999_999, auteurId));

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

// --- Détail ------------------------------------------------------------------

test("getJob : auteur inclus et compteur de candidatures ; offre inconnue → null", async () => {
  const jobId = await creeOffre({
    titre: `Offre suivie par deux membres (${HORODATAGE})`,
    lien: `https://deux-membres.ga/${HORODATAGE}`,
  });
  await applyToJob(jobId, auteurId);
  await applyToJob(jobId, candidatId);

  const detail = await getJob(jobId);

  expect(detail).not.toBeNull();
  if (!detail) throw new Error("Offre introuvable après création.");
  expect(detail.auteur.id).toBe(auteurId);
  expect(detail.auteur.nom).toBe(NOM);
  expect(detail.auteur.slug).toBe(SLUG);
  expect(detail._count.candidatures).toBe(2);

  await expect(getJob(999_999_999)).resolves.toBeNull();
});

// --- Route handlers ---------------------------------------------------------

test("routes jobs sans session → 401 { error: 'AUTH_INVALID' }", async () => {
  pot.clear();
  const { POST: creerOffre } = await import("../src/app/api/jobs/route");
  const { POST: postuler } = await import("../src/app/api/jobs/[id]/apply/route");
  const contexte = { params: Promise.resolve({ id: "1" }) };

  const reponses = await Promise.all([
    creerOffre(
      requeteJson("http://localhost/api/jobs", {
        titre: "Offre tentée sans session",
        entreprise: "Entreprise Test",
        contrat: "CDI",
        remote: false,
        pays: "Gabon",
        lien: "https://sans-session.ga",
      }),
    ),
    postuler(requeteJson("http://localhost/api/jobs/1/apply", {}), contexte),
  ]);

  for (const reponse of reponses) {
    expect(reponse.status).toBe(401);
    const corps = (await reponse.json()) as { error: string; message: string };
    expect(corps.error).toBe("AUTH_INVALID");
    expect(corps.message.length).toBeGreaterThan(0);
  }
  expect(pot.size).toBe(0); // précondition : aucun cookie de session en mémoire
});

test("POST /api/jobs : contrat hors liste ou lien invalide → 422 { error: 'FORUM_VALIDATION' }", async () => {
  await createSession(auteurId);
  const { POST: creerOffre } = await import("../src/app/api/jobs/route");

  for (const contrat of ["CDD", "CDD senior", ""]) {
    const reponse = await creerOffre(
      requeteJson("http://localhost/api/jobs", {
        titre: `Offre au contrat « ${contrat || "vide"} » (${HORODATAGE})`,
        entreprise: "Entreprise Invalide",
        contrat,
        remote: false,
        pays: "Gabon",
        lien: `https://contrat-invalide.ga/${HORODATAGE}`,
      }),
    );
    expect(reponse.status).toBe(422);
    const corps = (await reponse.json()) as { error: string };
    expect(corps.error).toBe("FORUM_VALIDATION");
  }

  const lienInvalide = await creerOffre(
    requeteJson("http://localhost/api/jobs", {
      titre: `Offre au lien invalide (${HORODATAGE})`,
      entreprise: "Entreprise Invalide",
      contrat: "CDI",
      remote: false,
      pays: "Gabon",
      lien: "ce-n'est-pas-une-url",
    }),
  );
  expect(lienInvalide.status).toBe(422);
  expect(((await lienInvalide.json()) as { error: string }).error).toBe("FORUM_VALIDATION");

  pot.clear();
});

test("POST /api/jobs valide → 201 { id } ; GET /api/jobs applique les filtres", async () => {
  await createSession(auteurId);
  const { GET: listerOffres, POST: creerOffre } = await import("../src/app/api/jobs/route");

  const reponse = await creerOffre(
    requeteJson("http://localhost/api/jobs", {
      titre: `Offre publiée depuis l'API (${HORODATAGE})`,
      entreprise: "API Test",
      contrat: "Alternance",
      remote: true,
      pays: "Sénégal",
      ville: "Thiès",
      lien: `https://api-test.sn/offres/${HORODATAGE}`,
    }),
  );
  expect(reponse.status).toBe(201);
  const { id } = (await reponse.json()) as { id: number };
  expect(id).toBeGreaterThan(0);
  nosOffres.push(id);

  const liste = await listerOffres(new Request("http://localhost/api/jobs?contrat=Alternance"));
  expect(liste.status).toBe(200);
  const corps = (await liste.json()) as { offres: { id: number; contrat: string }[] };
  expect(corps.offres.map((offre) => offre.id)).toContain(id);
  for (const offre of corps.offres) expect(offre.contrat).toBe("Alternance");

  pot.clear();
});

test("POST /api/jobs/[id]/apply : doublon → 409 { error: 'JOB_DUPLICATE_APPLICATION' }", async () => {
  const jobId = await creeOffre({
    titre: `Offre déjà postulée via l'API (${HORODATAGE})`,
    lien: `https://deja-postule.ga/${HORODATAGE}`,
  });
  await applyToJob(jobId, auteurId);
  await createSession(auteurId);
  const { POST: postuler } = await import("../src/app/api/jobs/[id]/apply/route");

  const reponse = await postuler(requeteJson(`http://localhost/api/jobs/${jobId}/apply`, {}), {
    params: Promise.resolve({ id: String(jobId) }),
  });

  expect(reponse.status).toBe(409);
  const corps = (await reponse.json()) as { error: string };
  expect(corps.error).toBe("JOB_DUPLICATE_APPLICATION");

  pot.clear();
});

test("routes jobs : offre inconnue ou id invalide → 404 { error: 'NOT_FOUND' }", async () => {
  const { GET: detailOffre } = await import("../src/app/api/jobs/[id]/route");
  const { POST: postuler } = await import("../src/app/api/jobs/[id]/apply/route");
  const contexte = (id: string) => ({ params: Promise.resolve({ id }) });

  const inconnue = await detailOffre(
    new Request("http://localhost/api/jobs/999999999"),
    contexte("999999999"),
  );
  expect(inconnue.status).toBe(404);
  expect(((await inconnue.json()) as { error: string }).error).toBe("NOT_FOUND");

  const idInvalide = await detailOffre(new Request("http://localhost/api/jobs/abc"), contexte("abc"));
  expect(idInvalide.status).toBe(404);

  await createSession(auteurId);
  const postulation = await postuler(
    requeteJson("http://localhost/api/jobs/999999999/apply", {}),
    contexte("999999999"),
  );
  expect(postulation.status).toBe(404);
  expect(((await postulation.json()) as { error: string }).error).toBe("NOT_FOUND");

  pot.clear();
});

afterAll(async () => {
  // Nettoyage des lignes créées par ces tests, dans l'ordre des clés étrangères.
  await prisma.application.deleteMany({ where: { job: { authorId: auteurId } } });
  await prisma.job.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: { in: [auteurId, candidatId] } } });
  await prisma.$disconnect();
  pot.clear();
});
