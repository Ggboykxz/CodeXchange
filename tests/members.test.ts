import { afterAll, beforeAll, expect, test } from "vitest";

import { prisma } from "../src/lib/db";
import { drapeau } from "../src/lib/drapeaux";
import { couleurDuSlug } from "../src/components/avatar";
import { getMemberBySlug, listCountries, listMembers } from "../src/lib/members";

/**
 * Tests de la couche métier Annuaire (Task 7) contre `prisma/dev.db`.
 * Conventions reprises de `tests/projects.test.ts` : données uniques
 * horodatées, filtres testés en table (Review Focus n°4), nettoyage `afterAll`
 * des **seuls** Users créés par cette suite.
 */

const HORODATAGE = Date.now();

const EMAIL_AWA = `members-awa.${HORODATAGE}@test-cx.fr`;
const SLUG_AWA = `annuaire-awa-${HORODATAGE}`;
const SLUG_KWAME = `annuaire-kwame-${HORODATAGE}`;
const SLUG_AICHA = `annuaire-aicha-${HORODATAGE}`;
const SLUG_MOUSSA = `annuaire-moussa-${HORODATAGE}`;

let awaId = 0;
let kwameId = 0;
let aichaId = 0;
let moussaId = 0;

/** Identifiants des membres créés par cette suite (sous-ensemble attendu des listes). */
function nosIds(): number[] {
  return [awaId, kwameId, aichaId, moussaId];
}

function croissants(ids: number[]): number[] {
  return [...ids].sort((a, b) => a - b);
}

/** Ids **de nos membres** retournés par `listMembers` (le DB peut contenir d'autres tests). */
async function idsRetournes(f?: Parameters<typeof listMembers>[0]): Promise<number[]> {
  const membres = await listMembers(f);
  return croissants(membres.filter((membre) => nosIds().includes(membre.id)).map((membre) => membre.id));
}

beforeAll(async () => {
  const awa = await prisma.user.create({
    data: {
      email: EMAIL_AWA,
      passwordHash: "hash-non-utilise",
      nom: `Awa Test ${HORODATAGE}`,
      slug: SLUG_AWA,
      titre: "Développeuse Flutter",
      ville: "Libreville",
      pays: "Gabon",
      bio: "Je construis des apps mobiles pour les commerçants de Libreville.",
      stack: "Flutter,Dart,Node",
      github: "https://github.com/awa-test",
      linkedin: "https://linkedin.com/in/awa-test",
      site: "https://awa-test.fr",
    },
  });
  awaId = awa.id;

  const kwame = await prisma.user.create({
    data: {
      email: `members-kwame.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Kwame Test ${HORODATAGE}`,
      slug: SLUG_KWAME,
      titre: "Développeur Backend",
      ville: "Accra",
      pays: "Ghana",
      stack: "React,Node,Postgres",
      role: "MENTOR",
    },
  });
  kwameId = kwame.id;

  const aicha = await prisma.user.create({
    data: {
      email: `members-aicha.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Aïcha Test ${HORODATAGE}`,
      slug: SLUG_AICHA,
      titre: "Designer mobile",
      ville: "Douala",
      pays: "Cameroun",
      stack: "Flutter,Figma",
    },
  });
  aichaId = aicha.id;

  const moussa = await prisma.user.create({
    data: {
      email: `members-moussa.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Moussa Test ${HORODATAGE}`,
      slug: SLUG_MOUSSA,
      titre: "Data engineer",
      ville: "Dakar",
      pays: "Sénégal",
      stack: "Python",
    },
  });
  moussaId = moussa.id;
});

// --- Filtres (Review Focus n°4 : chaque combinaison → sous-ensemble exact) ---

test("listMembers : filtre pays (égalité exacte, insensible à la casse)", async () => {
  const table = [
    { filtre: { pays: "Gabon" }, attendus: [awaId] },
    { filtre: { pays: "gabon" }, attendus: [awaId] },
    { filtre: { pays: "CAMEROUN" }, attendus: [aichaId] },
    { filtre: { pays: "Sénégal" }, attendus: [moussaId] },
    { filtre: { pays: "Maurice" }, attendus: [] },
  ];

  for (const ligne of table) {
    expect(await idsRetournes(ligne.filtre)).toEqual(croissants(ligne.attendus));
  }
});

test("listMembers : filtre stack (une entrée parmi plusieurs, CSV insensible à la casse)", async () => {
  const table = [
    { filtre: { stack: "flutter" }, attendus: [awaId, aichaId] }, // une entrée du CSV suffit
    { filtre: { stack: "NODE" }, attendus: [awaId, kwameId] },
    { filtre: { stack: "Figma" }, attendus: [aichaId] },
    { filtre: { stack: "postgres" }, attendus: [kwameId] },
    { filtre: { stack: "cobol" }, attendus: [] },
  ];

  for (const ligne of table) {
    expect(await idsRetournes(ligne.filtre)).toEqual(croissants(ligne.attendus));
  }
});

test("listMembers : recherche q sur nom, titre et ville (insensible à la casse)", async () => {
  const table = [
    { filtre: { q: "libreville" }, attendus: [awaId] }, // ville
    { filtre: { q: "LIBREV" }, attendus: [awaId] }, // sous-chaîne, casse
    { filtre: { q: "AWA" }, attendus: [awaId] }, // nom
    { filtre: { q: "backend" }, attendus: [kwameId] }, // titre
    { filtre: { q: "douala" }, attendus: [aichaId] }, // ville
    { filtre: { q: "test" }, attendus: [awaId, kwameId, aichaId, moussaId] }, // nos 4 noms
    { filtre: { q: "zzz-introuvable" }, attendus: [] },
  ];

  for (const ligne of table) {
    expect(await idsRetournes(ligne.filtre)).toEqual(croissants(ligne.attendus));
  }
});

test("listMembers : combinaison pays + stack + q → sous-ensemble exact", async () => {
  const table = [
    { filtre: { pays: "Cameroun", stack: "flutter", q: "douala" }, attendus: [aichaId] },
    { filtre: { pays: "Gabon", stack: "flutter", q: "libreville" }, attendus: [awaId] },
    { filtre: { pays: "Ghana", stack: "flutter" }, attendus: [] },
    { filtre: { stack: "node", q: "libreville" }, attendus: [awaId] },
    { filtre: { pays: "Sénégal", stack: "node", q: "dakar" }, attendus: [] },
  ];

  for (const ligne of table) {
    expect(await idsRetournes(ligne.filtre)).toEqual(croissants(ligne.attendus));
  }
});

// --- Données publiques uniquement -------------------------------------------

test("listMembers : jamais de passwordHash ni d'e-mail dans le résumé public", async () => {
  const membres = await listMembers();
  const chaine = JSON.stringify(membres);

  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain(EMAIL_AWA);
  expect(chaine).not.toContain("test-cx.fr");

  const notreMembre = membres.find((membre) => membre.id === awaId);
  expect(notreMembre).toBeDefined();
  if (!notreMembre) throw new Error("Membre de test introuvable dans la liste.");
  expect(Object.keys(notreMembre)).not.toContain("email");
  expect(Object.keys(notreMembre)).not.toContain("passwordHash");
});

// --- Pays ---------------------------------------------------------------------

test("listCountries : trié, sans doublons, uniquement des pays présents en base", async () => {
  const pays = await listCountries();

  const lignes = await prisma.user.findMany({ select: { pays: true } });
  const presents = new Set(lignes.map((ligne) => ligne.pays));

  expect(pays.length).toBeGreaterThan(0);
  for (const paysVu of pays) expect(presents.has(paysVu)).toBe(true); // rien d'inventé
  expect(new Set(pays).size).toBe(pays.length); // sans doublons
  expect(pays).toEqual([...pays].sort((a, b) => a.localeCompare(b, "fr"))); // trié

  // Nos pays de test sont dans le résultat (les lignes ne sont pas encore purgées).
  expect(pays).toContain("Gabon");
  expect(pays).toContain("Ghana");
  expect(pays).toContain("Cameroun");
  expect(pays).toContain("Sénégal");
});

// --- Profil -------------------------------------------------------------------

test("getMemberBySlug : titre, ville, pays, stack, bio, liens et rôle sont exposés", async () => {
  const membre = await getMemberBySlug(SLUG_AWA);

  expect(membre).not.toBeNull();
  if (!membre) throw new Error("Membre de test introuvable par slug.");
  expect(membre.id).toBe(awaId);
  expect(membre.titre).toBe("Développeuse Flutter");
  expect(membre.ville).toBe("Libreville");
  expect(membre.pays).toBe("Gabon");
  expect(membre.stack).toEqual(["Flutter", "Dart", "Node"]); // CSV → tableau
  expect(membre.bio).toBe("Je construis des apps mobiles pour les commerçants de Libreville.");
  expect(membre.github).toBe("https://github.com/awa-test");
  expect(membre.linkedin).toBe("https://linkedin.com/in/awa-test");
  expect(membre.site).toBe("https://awa-test.fr");
  expect(membre.role).toBe("MEMBER");

  const mentor = await getMemberBySlug(SLUG_KWAME);
  expect(mentor?.role).toBe("MENTOR");
  expect(mentor?.stack).toEqual(["React", "Node", "Postgres"]);
});

test("getMemberBySlug : profil public sans passwordHash ni e-mail", async () => {
  const membre = await getMemberBySlug(SLUG_AWA);
  if (!membre) throw new Error("Membre de test introuvable par slug.");

  const cles = Object.keys(membre);
  expect(cles).not.toContain("email");
  expect(cles).not.toContain("passwordHash");
  const chaine = JSON.stringify(membre);
  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain(EMAIL_AWA);
});

test("getMemberBySlug : slug inexistant (ou vide) → null", async () => {
  await expect(getMemberBySlug(`inexistant-${HORODATAGE}`)).resolves.toBeNull();
  await expect(getMemberBySlug("")).resolves.toBeNull();
});

// --- Drapeaux (calculés côté serveur) -----------------------------------------

test("drapeaux : pays du mapping → emoji, accents/casse ignorés, inconnu → 🌍", async () => {
  expect(drapeau("Gabon")).toBe("🇬🇦");
  expect(drapeau("Côte d'Ivoire")).toBe("🇨🇮");
  expect(drapeau("cote d'ivoire")).toBe("🇨🇮"); // sans accent, casse différente
  expect(drapeau("AFRIQUE DU SUD")).toBe("🇿🇦");
  expect(drapeau("Nigéria")).toBe("🇳🇬");
  expect(drapeau("Atlantide")).toBe("🌍"); // fallback
  expect(drapeau("")).toBe("🌍");
});

// --- Avatar -------------------------------------------------------------------

test("avatar : couleur déterministe dérivée du slug", () => {
  expect(couleurDuSlug("awa-test")).toBe(couleurDuSlug("awa-test")); // même slug → même couleur
  expect(couleurDuSlug("awa-test")).toMatch(/^#[0-9a-f]{6}$/i); // couleur hexadécimale valide
});

// --- Route handler -------------------------------------------------------------

test("GET /api/members : filtres en query string → 200 { membres } sans données privées", async () => {
  const { GET: listerMembres } = await import("../src/app/api/members/route");

  const parStack = await listerMembres(new Request("http://localhost/api/members?stack=flutter"));
  expect(parStack.status).toBe(200);
  const corpsStack = (await parStack.json()) as {
    membres: { id: number; stack: string[] }[];
  };
  const idsStack = corpsStack.membres.map((membre) => membre.id);
  expect(idsStack).toContain(awaId);
  expect(idsStack).toContain(aichaId);
  expect(idsStack).not.toContain(kwameId);
  for (const membre of corpsStack.membres) {
    expect(membre.stack.map((s) => s.toLowerCase())).toContain("flutter");
  }

  const combine = await listerMembres(
    new Request("http://localhost/api/members?pays=Gabon&stack=FLUTTER&q=libreville"),
  );
  expect(combine.status).toBe(200);
  const corpsCombine = (await combine.json()) as { membres: { id: number }[] };
  expect(corpsCombine.membres.map((membre) => membre.id)).toEqual([awaId]);

  const chaine = JSON.stringify(corpsStack);
  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain("test-cx.fr");
});

// --- Nettoyage -----------------------------------------------------------------

afterAll(async () => {
  // Uniquement les Users créés par cette suite — jamais ceux des autres tests.
  await prisma.user.deleteMany({ where: { id: { in: nosIds() } } });
  await prisma.$disconnect();
});
