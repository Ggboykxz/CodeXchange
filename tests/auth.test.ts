import { afterAll, beforeEach, expect, test, vi } from "vitest";

// Mock de `cookies()` (next/headers) : un pot à cookies en mémoire, pour tester
// createSession / getSessionUserId / destroySession sans requête HTTP.
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

import { hashPassword, loginUser, registerUser, slugify, verifyPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/db";
import { AppError } from "../src/lib/errors";
import { createSession, destroySession, getSessionUserId } from "../src/lib/session";

const HORODATAGE = Date.now();
/** Tous les e-mails créés ici portent un suffixe horodaté unique. */
const emailsCrees: string[] = [];

function emailUnique(base: string): string {
  const email = `${base}.${HORODATAGE}@test-cx.fr`;
  emailsCrees.push(email);
  return email;
}

function champsValidess(email: string, password = "motdepasse123") {
  return {
    email,
    password,
    nom: "Aïcha Ondo",
    ville: "Libreville",
    pays: "Gabon",
    titre: "Développeuse Flutter",
  };
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

beforeEach(() => {
  pot.clear();
});

// --- Inscription -----------------------------------------------------------

test("inscription valide : crée un membre avec slug et hash bcrypt", async () => {
  const membre = await registerUser(champsValidess(emailUnique("inscription.valide")));

  expect(membre.id).toBeGreaterThan(0);
  expect(membre.nom).toBe("Aïcha Ondo");
  expect(membre.ville).toBe("Libreville");
  expect(membre.pays).toBe("Gabon");
  expect(membre.titre).toBe("Développeuse Flutter");
  expect(membre.slug).toBe("aicha-ondo");
  expect(membre.passwordHash).not.toBe("motdepasse123");
  await expect(verifyPassword("motdepasse123", membre.passwordHash)).resolves.toBe(true);
});

test("hashPassword : hash bcrypt vérifiable et salé différemment", async () => {
  const h1 = await hashPassword("motdepasse123");
  const h2 = await hashPassword("motdepasse123");

  expect(h1).toMatch(/^\$2[aby]\$/);
  expect(h1).not.toBe(h2);
  await expect(verifyPassword("motdepasse123", h1)).resolves.toBe(true);
  await expect(verifyPassword("autre-motdepasse", h1)).resolves.toBe(false);
});

test("slugify : casse, accents et espaces normalisés", () => {
  expect(slugify("Aïcha Ondo")).toBe("aicha-ondo");
  expect(slugify("  Koffi   N'Guessan  ")).toBe("koffi-nguessan");
});

test("slug en collision : suffixe numérique pour garder l'unicité", async () => {
  const premier = await registerUser(champsValidess(emailUnique("slug.premier")));
  const second = await registerUser(champsValidess(emailUnique("slug.second")));

  expect(premier.slug).toMatch(/^aicha-ondo(-\d+)?$/);
  expect(second.slug).toMatch(/^aicha-ondo-\d+$/);
  expect(second.slug).not.toBe(premier.slug);
});

test("e-mail dupliqué (casse différente) → AUTH_DUPLICATE_EMAIL (409)", async () => {
  const email = emailUnique("duplique");
  await registerUser(champsValidess(email.toUpperCase()));

  const erreur = await leveAppError(registerUser(champsValidess(email.toLowerCase())));

  expect(erreur.code).toBe("AUTH_DUPLICATE_EMAIL");
  expect(erreur.status).toBe(409);
});

// --- Validation ------------------------------------------------------------

test("mot de passe < 8 caractères → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(
    registerUser(champsValidess(emailUnique("motdepasse.court"), "court78")),
  );

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

test("e-mail invalide → FORUM_VALIDATION (422)", async () => {
  const erreur = await leveAppError(registerUser(champsValidess("pas-un-email")));

  expect(erreur.code).toBe("FORUM_VALIDATION");
  expect(erreur.status).toBe(422);
});

// --- Connexion -------------------------------------------------------------

test("mauvais mot de passe → AUTH_INVALID (401)", async () => {
  const email = emailUnique("connexion.mauvais");
  await registerUser(champsValidess(email));

  const erreur = await leveAppError(loginUser(email, "mauvais-mdp"));

  expect(erreur.code).toBe("AUTH_INVALID");
  expect(erreur.status).toBe(401);
});

test("connexion : e-mail à casse différente accepté", async () => {
  const email = emailUnique("connexion.casse");
  const membre = await registerUser(champsValidess(email));

  const connecte = await loginUser(email.toUpperCase(), "motdepasse123");

  expect(connecte.id).toBe(membre.id);
});

test("e-mail inconnu → AUTH_INVALID (401)", async () => {
  const erreur = await leveAppError(loginUser(emailUnique("connexion.inconnu"), "nimporte-quoi"));

  expect(erreur.code).toBe("AUTH_INVALID");
});

// --- Session ---------------------------------------------------------------

test("session créée : getSessionUserId() retourne l'id du membre", async () => {
  const membre = await registerUser(champsValidess(emailUnique("session.creer")));

  const token = await createSession(membre.id);

  expect(token).toBeTypeOf("string");
  expect(pot.get("cx_session")).toBe(token);
  await expect(getSessionUserId()).resolves.toBe(membre.id);
});

test("destroySession() : getSessionUserId() retourne null ensuite", async () => {
  const membre = await registerUser(champsValidess(emailUnique("session.detruire")));
  await createSession(membre.id);

  await destroySession();

  expect(pot.has("cx_session")).toBe(false);
  await expect(getSessionUserId()).resolves.toBeNull();
});

// --- Review Focus n°2 : session expirée ou cookie forgé --------------------

test("session_expiree : getSessionUserId() retourne null", async () => {
  const membre = await registerUser(champsValidess(emailUnique("session.expiree")));
  await createSession(membre.id);
  await prisma.session.updateMany({
    where: { userId: membre.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });

  await expect(getSessionUserId()).resolves.toBeNull();
});

test("cookie forgé : token inconnu → null, sans lever", async () => {
  pot.set("cx_session", "jeton-invente-0000");

  await expect(getSessionUserId()).resolves.toBeNull();
});

test("sans session : getSessionUserId() retourne null", async () => {
  await expect(getSessionUserId()).resolves.toBeNull();
});

afterAll(async () => {
  // Nettoyage des lignes créées par ces tests, dans l'ordre des clés étrangères.
  await prisma.session.deleteMany({ where: { user: { email: { in: emailsCrees } } } });
  await prisma.user.deleteMany({ where: { email: { in: emailsCrees } } });
  await prisma.$disconnect();
});
