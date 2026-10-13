import { afterAll, beforeAll, expect, test, vi } from "vitest";

// Pot à cookies en mémoire (convention de `tests/forum.test.ts`) : la route
// `/api/recherche` est publique, mais on garde la mock pour cohérence.
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
import { searchCodeXchange } from "../src/lib/search";

const HORODATAGE = Date.now();
const EMAIL = `search.${HORODATAGE}@test-cx.fr`;
const SLUG = `search-test-${HORODATAGE}`;
const NOM = `Search Auteur ${HORODATAGE}`;

let auteurId = 0;
const idsSujets: number[] = [];
const idsMembres: number[] = [];

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
      stack: "Flutter,Dart",
    },
  });
  auteurId = membre.id;
  idsMembres.push(auteurId);
});

test("(a) q vide → tous les groupes vides", async () => {
  const resultat = await searchCodeXchange("");
  expect(resultat.sujets).toEqual([]);
  expect(resultat.offres).toEqual([]);
  expect(resultat.projets).toEqual([]);
  expect(resultat.membres).toEqual([]);
  expect(resultat.tutos).toEqual([]);
});

test("(b) q d'un caractère → toutes les listes vides, même avec une correspondance potentielle", async () => {
  // Un sujet avec « Flutter » existe ci-dessous, mais la requête est trop courte.
  await (async () => {
    const cree = await prisma.post.create({
      data: {
        titre: `Bug Flutter (${HORODATAGE})`,
        corps: "Application qui crash au démarrage.",
        tags: "flutter",
        authorId: auteurId,
      },
    });
    idsSujets.push(cree.id);
  })();

  const resultat = await searchCodeXchange("f");
  expect(resultat.sujets).toHaveLength(0);
  expect(resultat.offres).toHaveLength(0);
  expect(resultat.projets).toHaveLength(0);
  expect(resultat.membres).toHaveLength(0);
  expect(resultat.tutos).toHaveLength(0);
});

test("(c) q = « fl » → au moins un sujet contenant « Flutter »", async () => {
  const resultat = await searchCodeXchange("fl");
  expect(resultat.sujets.length).toBeGreaterThan(0);
  expect(
    resultat.sujets.some((sujet) => sujet.titre.toLowerCase().includes("flutter")),
  ).toBe(true);
});

test("(d) au plus 8 résultats par groupe", async () => {
  // 10 sujets supplémentaires pour dépasser la limite de 8.
  for (let i = 0; i < 10; i++) {
    const cree = await prisma.post.create({
      data: {
        titre: `Sujet maxresult ${i} (${HORODATAGE})`,
        corps: "Contenu avec le mot cle maximum results pour la pagination.",
        tags: "test",
        authorId: auteurId,
      },
    });
    idsSujets.push(cree.id);
  }
  // La requête « su » trouve les 10 sujets ci-dessus (titre « Sujet … ») + les
  // précédents : le groupe doit être borné à 8.
  const resultat = await searchCodeXchange("su");
  expect(resultat.sujets.length).toBeLessThanOrEqual(8);
  expect(resultat.sujets.length).toBe(8);

  // Membres : plus de 8 comptes → borne également.
  for (let i = 0; i < 10; i++) {
    const membre = await prisma.user.create({
      data: {
        email: `search-membre-${i}.${HORODATAGE}@test-cx.fr`,
        passwordHash: "hash-non-utilise",
        nom: `Membre Maximum ${i} ${HORODATAGE}`,
        slug: `search-membre-max-${i}-${HORODATAGE}`,
        titre: "Dev",
        ville: "Libreville",
        pays: "Gabon",
      },
    });
    idsMembres.push(membre.id);
  }
  const resultatMembres = await searchCodeXchange("membre maximum");
  expect(resultatMembres.membres.length).toBeLessThanOrEqual(8);
  expect(resultatMembres.membres.length).toBe(8);
});

test("GET /api/recherche : retourne total = somme des groupes", async () => {
  const { GET } = await import("../src/app/api/recherche/route");
  const reponse = await GET(new Request("http://localhost/api/recherche?q=fl"));
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as {
    sujets: unknown[];
    offres: unknown[];
    projets: unknown[];
    membres: unknown[];
    tutos: unknown[];
    total: number;
  };
  const somme =
    corps.sujets.length +
    corps.offres.length +
    corps.projets.length +
    corps.membres.length +
    corps.tutos.length;
  expect(corps.total).toBe(somme);
});

afterAll(async () => {
  await prisma.like.deleteMany({ where: { post: { authorId: auteurId } } });
  await prisma.like.deleteMany({ where: { userId: auteurId } });
  await prisma.reply.deleteMany({ where: { post: { authorId: auteurId } } });
  await prisma.post.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: { in: idsMembres } } });
  await prisma.$disconnect();
});