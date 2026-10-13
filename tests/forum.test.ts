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
import { addReply, createPost, getPost, listPosts, toggleLike } from "../src/lib/forum";

/**
 * Tests de la couche métier du forum (Task 4) contre `prisma/dev.db`.
 * Conventions reprises de `tests/auth.test.ts` : données uniques horodatées,
 * nettoyage `afterAll` dans l'ordre des clés étrangères.
 */

const HORODATAGE = Date.now();
const EMAIL = `forum.${HORODATAGE}@test-cx.fr`;
const SLUG = `forum-test-${HORODATAGE}`;
const NOM = `Aicha Test ${HORODATAGE}`;

let auteurId = 0;

/** Petit délai : garantit des `createdAt` réellement distincts pour le tri. */
function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

beforeAll(async () => {
  const membre = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: "hash-non-utilise",
      nom: NOM,
      slug: SLUG,
      titre: "Développeuse Flutter",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  auteurId = membre.id;
});

// --- Création ---------------------------------------------------------------

test("création d'un sujet valide → id > 0", async () => {
  const id = await createPost(auteurId, {
    titre: "Facturer en freelance depuis le Gabon",
    corps: "Bonjour, quelle est la meilleure façon de facturer un client européen depuis Libreville ?",
    tags: ["gabon", "freelance"],
  });

  expect(id).toBeGreaterThan(0);
});

test("titre < 8 caractères → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    createPost(auteurId, {
      titre: "Court",
      corps: "Un corps suffisamment long pour être accepté ailleurs.",
      tags: ["test"],
    }),
  );

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("plus de 3 tags → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    createPost(auteurId, {
      titre: "Sujet avec beaucoup de tags",
      corps: "Un corps de sujet valide pour isoler la règle sur les tags.",
      tags: ["un", "deux", "trois", "quatre"],
    }),
  );

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("corps > 5000 caractères → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    createPost(auteurId, {
      titre: "Sujet au corps interminable",
      corps: "x".repeat(5001),
      tags: ["test"],
    }),
  );

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

// --- Recherche ---------------------------------------------------------------

test("listPosts({q: 'FLUTTER'}) : insensible à la casse, sur titre ou corps", async () => {
  const idTitre = await createPost(auteurId, {
    titre: `Bug Flutter sur Android 14 (${HORODATAGE})`,
    corps: "L'application crash au démarrage sur Pixel 8, la stack est illisible.",
    tags: ["flutter", "android"],
  });
  const idCorps = await createPost(auteurId, {
    titre: `Crash au démarrage (${HORODATAGE})`,
    corps: `Trace inconnue avec le moteur FLUTTER ${HORODATAGE} sous Android.`,
    tags: ["flutter"],
  });
  const idExclu = await createPost(auteurId, {
    titre: `Recette de pondu (${HORODATAGE})`,
    corps: "Un plat gabonais simple, sans dépendance.",
    tags: ["cuisine"],
  });

  const resultat = await listPosts({ q: "FLUTTER" });
  const ids = resultat.map((p) => p.id);

  expect(ids).toContain(idTitre); // trouvé dans le titre
  expect(ids).toContain(idCorps); // trouvé dans le corps
  expect(ids).not.toContain(idExclu);
});

// --- Filtre par tag ----------------------------------------------------------

test("listPosts({tag: 'gabon'}) : filtre sur les tags en CSV, insensible à la casse", async () => {
  const avecTag = await createPost(auteurId, {
    titre: `Rencontre des devs de Libreville (${HORODATAGE})`,
    corps: "On se retrouve au quartier Glass pour un meetup.",
    tags: ["Gabon", "mobile"],
  });
  const sansTag = await createPost(auteurId, {
    titre: `Node.js en production (${HORODATAGE})`,
    corps: "Retour d'expérience sur un service qui encaisse 2000 requêtes/s.",
    tags: ["javascript", "node"],
  });

  const resultat = await listPosts({ tag: "gabon" });
  const ids = resultat.map((p) => p.id);

  expect(ids).toContain(avecTag);
  expect(ids).not.toContain(sansTag);
});

// --- Likes -------------------------------------------------------------------

test("toggleLike : true au premier appel, false au second (idempotent)", async () => {
  const id = await createPost(auteurId, {
    titre: `Sujet à liker (${HORODATAGE})`,
    corps: "Un sujet quelconque pour vérifier l'alternance du compteur de likes.",
    tags: ["test"],
  });

  await expect(toggleLike(id, auteurId)).resolves.toBe(true);
  await expect(toggleLike(id, auteurId)).resolves.toBe(false);
  await expect(toggleLike(id, auteurId)).resolves.toBe(true); // re-likable
});

// --- Détail ------------------------------------------------------------------

test("getPost : auteur inclus, réponses triées par date, compteur de likes", async () => {
  const id = await createPost(auteurId, {
    titre: `Migrer de SQLite vers Postgres (${HORODATAGE})`,
    corps: "Quelles sont les étapes pour basculer en production ?",
    tags: ["postgres"],
  });
  await addReply(id, auteurId, "Première réponse");
  await pause(5);
  await addReply(id, auteurId, "Seconde réponse");
  await toggleLike(id, auteurId);

  const detail = await getPost(id);

  expect(detail).not.toBeNull();
  if (!detail) throw new Error("Sujet introuvable après création.");
  expect(detail.author.id).toBe(auteurId);
  expect(detail.author.nom).toBe(NOM);
  expect(detail.author.slug).toBe(SLUG);
  expect(detail._count.likes).toBe(1);
  expect(detail._count.replies).toBe(2);
  expect(detail.replies.map((r) => r.corps)).toEqual(["Première réponse", "Seconde réponse"]);
  expect(detail.replies[0].author.id).toBe(auteurId);
});

test("getPost : sujet inexistant → null", async () => {
  await expect(getPost(999_999_999)).resolves.toBeNull();
});

// --- Réponses ----------------------------------------------------------------

test("addReply valide : la réponse apparaît dans le sujet", async () => {
  const id = await createPost(auteurId, {
    titre: `Comment publier un package npm (${HORODATAGE})`,
    corps: "Je bloque sur l'authentification du registre, une idée ?",
    tags: ["npm"],
  });

  await addReply(id, auteurId, "Merci pour cette explication détaillée !");

  const detail = await getPost(id);
  expect(detail?.replies).toHaveLength(1);
  expect(detail?.replies[0].corps).toBe("Merci pour cette explication détaillée !");
});

test("addReply : corps > 2000 caractères → FORUM_VALIDATION (422)", async () => {
  const id = await createPost(auteurId, {
    titre: `Sujet pour réponse trop longue (${HORODATAGE})`,
    corps: "Un sujet valide qui sert uniquement à tester la longueur d'une réponse.",
    tags: ["test"],
  });

  const erreur = await leveAppError(addReply(id, auteurId, "y".repeat(2001)));

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

// --- Route handlers ---------------------------------------------------------

test("routes protégées sans session → 401 { error: 'AUTH_INVALID' }", async () => {
  const { POST: creerSujet } = await import("../src/app/api/forum/route");
  const { POST: aimerSujet } = await import("../src/app/api/forum/[id]/like/route");
  const { POST: repondreAuSujet } = await import("../src/app/api/forum/[id]/replies/route");

  const requete = (url: string) =>
    new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titre: "Sujet tenté sans session", corps: "Corps du sujet", tags: ["test"] }),
    });
  const contexte = { params: Promise.resolve({ id: "1" }) };

  const reponses = await Promise.all([
    creerSujet(requete("http://localhost/api/forum")),
    aimerSujet(requete("http://localhost/api/forum/1/like"), contexte),
    repondreAuSujet(requete("http://localhost/api/forum/1/replies"), contexte),
  ]);

  for (const reponse of reponses) {
    expect(reponse.status).toBe(401);
    const corps = (await reponse.json()) as { error: string; message: string };
    expect(corps.error).toBe("AUTH_INVALID");
    expect(corps.message.length).toBeGreaterThan(0);
  }
  expect(pot.size).toBe(0); // précondition : aucun cookie de session en mémoire
});

afterAll(async () => {
  // Nettoyage des lignes créées par ces tests, dans l'ordre des clés étrangères.
  await prisma.like.deleteMany({ where: { post: { authorId: auteurId } } });
  await prisma.like.deleteMany({ where: { userId: auteurId } });
  await prisma.reply.deleteMany({ where: { post: { authorId: auteurId } } });
  await prisma.post.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: auteurId } });
  await prisma.$disconnect();
});
