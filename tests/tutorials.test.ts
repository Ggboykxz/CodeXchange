import { afterAll, beforeAll, expect, test } from "vitest";

import { prisma } from "../src/lib/db";
import { renderMarkdown } from "../src/lib/markdown";
import { getTutorial, listTutorials } from "../src/lib/tutorials";

/**
 * Tests de la couche métier Tutos (Task 8) contre `prisma/dev.db` + du
 * mini-rendu markdown maison `src/lib/markdown.ts` (aucune dépendance ajoutée).
 * Review Focus n°3 : **le corps échappe tout HTML d'entrée** — un `<script>`
 * s'affiche textuel, il ne s'exécute jamais. Conventions reprises de
 * `tests/members.test.ts` : données uniques horodatées, nettoyage `afterAll`
 * des seuls Users créés par cette suite.
 */

const HORODATAGE = Date.now();

const SLUG_MARKDOWN = `tuto-markdown-${HORODATAGE}`;
const SLUG_DEBUTANT = `tuto-debutant-${HORODATAGE}`;
const SLUG_AVANCE = `tuto-avance-${HORODATAGE}`;

let auteurId = 0;

/** Slugs créés par cette suite (sous-ensemble attendu des listes). */
const nosTutos = [SLUG_MARKDOWN, SLUG_DEBUTANT, SLUG_AVANCE];

/** Corps de test : markdown complet + HTML intrusif qui doit rester textuel. */
const CORPS_MALICIEUX = [
  "# Bien démarrer avec Flutter",
  "",
  "Un paragraphe avec du **gras**, du `code` et un [lien vers la doc](https://flutter.dev).",
  "",
  "## Les bases",
  "",
  "- Installer Flutter",
  "- Créer le premier projet",
  "",
  "```dart",
  'void main() => print("bonjour");',
  "```",
  "",
  'Avant le code : 4 < 5 & 6.',
  "",
  '<script>alert("xss")</script>',
  "",
].join("\n");

/** Tuto créé directement via Prisma (la Task 8 n'expose pas de `createTutorial`). */
async function creeTuto(
  slug: string,
  titre: string,
  options: { corps?: string; tags?: string; dureeMin?: number; createdAt?: Date } = {},
) {
  return prisma.tutorial.create({
    data: {
      slug,
      titre,
      resume: "Résumé de démonstration pour la page /tutos.",
      corps: options.corps ?? `## ${titre}\n\nContenu de démonstration.`,
      tags: options.tags ?? "Flutter,Mobile",
      dureeMin: options.dureeMin ?? 8,
      authorId: auteurId,
      createdAt: options.createdAt ?? new Date(HORODATAGE),
    },
  });
}

beforeAll(async () => {
  const auteur = await prisma.user.create({
    data: {
      email: `tutorials-auteur.${HORODATAGE}@test-cx.fr`,
      passwordHash: "hash-non-utilise",
      nom: `Auteure Test ${HORODATAGE}`,
      slug: `tutorials-auteure-test-${HORODATAGE}`,
      titre: "Développeuse Flutter",
      ville: "Libreville",
      pays: "Gabon",
    },
  });
  auteurId = auteur.id;

  // Créés du plus ancien au plus récent : `listTutorials` doit les retourner à l'envers.
  await creeTuto(SLUG_DEBUTANT, "Publier son premier package pub", {
    tags: "Dart,Open source",
    dureeMin: 12,
    createdAt: new Date(HORODATAGE - 3 * 60 * 60 * 1000),
  });
  await creeTuto(SLUG_MARKDOWN, "Comprendre le markdown en 10 minutes", {
    corps: CORPS_MALICIEUX,
    tags: "Markdown,Rédaction",
    dureeMin: 10,
    createdAt: new Date(HORODATAGE - 2 * 60 * 60 * 1000),
  });
  await creeTuto(SLUG_AVANCE, "Optimiser les performances de React Native", {
    tags: "React Native,Performance",
    dureeMin: 25,
    createdAt: new Date(HORODATAGE - 60 * 60 * 1000),
  });
});

// --- Liste & détail -----------------------------------------------------------

test("listTutorials : nos tutos, tags en tableau, du plus récent au plus ancien", async () => {
  const tutos = await listTutorials();
  const nosIds = tutos.filter((tuto) => nosTutos.includes(tuto.slug)).map((tuto) => tuto.slug);

  expect(nosIds).toEqual([SLUG_AVANCE, SLUG_MARKDOWN, SLUG_DEBUTANT]);

  const tuto = tutos.find((t) => t.slug === SLUG_MARKDOWN);
  expect(tuto?.tags).toEqual(["Markdown", "Rédaction"]);
  expect(tuto?.dureeMin).toBe(10);
  expect(tuto?.resume.length).toBeGreaterThan(0);
  expect(tuto?.author.slug).toBe(`tutorials-auteure-test-${HORODATAGE}`);
});

test("getTutorial : détail avec auteur ; slug inconnu → null", async () => {
  const tuto = await getTutorial(SLUG_MARKDOWN);
  expect(tuto).not.toBeNull();
  if (!tuto) throw new Error("Tuto introuvable après création.");
  expect(tuto.titre).toBe("Comprendre le markdown en 10 minutes");
  expect(tuto.author.id).toBe(auteurId);
  expect(tuto.corps).toContain('<script>alert("xss")</script>'); // stocké brut, échappé au rendu
  expect(tuto).not.toHaveProperty("passwordHash");

  await expect(getTutorial(`inconnu-${HORODATAGE}`)).resolves.toBeNull();
  await expect(getTutorial("")).resolves.toBeNull();
});

// --- Review Focus n°3 : échappement du HTML -----------------------------------

test("corps_escaped : le HTML d'entrée s'affiche textuel (Review Focus n°3)", async () => {
  const tuto = await getTutorial(SLUG_MARKDOWN);
  if (!tuto) throw new Error("Tuto introuvable.");

  const html = renderMarkdown(tuto.corps);

  // Le balisage d'entrée n'apparaît jamais comme balise : il est échappé.
  expect(html).not.toContain("<script>");
  expect(html).not.toContain("</script>");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("&lt;/script&gt;");
  expect(html).toContain('alert(&quot;xss&quot;)'); // le contenu reste lisible, mais inerte

  // Aucune balise d'entrée ne transite : `<img … onerror=…>` devient du texte.
  const img = renderMarkdown('<img src=x onerror="alert(1)">');
  expect(img).not.toContain("<img");
  expect(img).toContain("&lt;img");
});

// --- Rendu markdown maison ----------------------------------------------------

test("markdown : titres # et ##, gras, code inline et bloc de code", () => {
  expect(renderMarkdown("# Titre principal")).toBe("<h1>Titre principal</h1>");
  expect(renderMarkdown("## Titre secondaire")).toBe("<h2>Titre secondaire</h2>");
  expect(renderMarkdown("Du **gras** ici")).toBe("<p>Du <strong>gras</strong> ici</p>");
  expect(renderMarkdown("Du `code` ici")).toBe("<p>Du <code>code</code> ici</p>");

  const bloc = renderMarkdown("```js\nconst x = 1 < 2;\n```");
  expect(bloc).toBe("<pre><code>const x = 1 &lt; 2;</code></pre>");
  // À l'intérieur d'un bloc de code, le markdown n'est pas interprété.
  expect(renderMarkdown("```\n**pas en gras**\n```")).toContain("**pas en gras**");
});

test("markdown : paragraphes, listes à puces et sauts de ligne", () => {
  expect(renderMarkdown("Premier paragraphe.\n\nSecond paragraphe.")).toBe(
    "<p>Premier paragraphe.</p>\n<p>Second paragraphe.</p>",
  );

  expect(renderMarkdown("- un\n- deux")).toBe("<ul><li>un</li><li>deux</li></ul>");
  // Une ligne à puces au milieu d'un paragraphe casse le paragraphe.
  expect(renderMarkdown("Avant\n- item")).toBe("<p>Avant</p>\n<ul><li>item</li></ul>");
});

test("markdown : liens http(s) seulement, tout autre protocole reste du texte", () => {
  const lien = renderMarkdown("Lire la [doc Flutter](https://flutter.dev/docs)");
  expect(lien).toContain('<a href="https://flutter.dev/docs"');
  expect(lien).toContain(">doc Flutter</a>");

  const http = renderMarkdown("Voir [le site](http://exemple.ga/page)");
  expect(http).toContain('<a href="http://exemple.ga/page"');

  for (const dangereux of [
    "[clic](javascript:alert(1))",
    "[clic](data:text/html;base64,PHNjcmlwdD4=)",
    "[clic](vbscript:msgbox)",
  ]) {
    const html = renderMarkdown(dangereux);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain('href="javascript');
    expect(html).toContain("clic"); // le libellé reste lisible
  }
});

test("markdown : caractères spéciaux échappés, jamais de HTML d'entrée", () => {
  expect(renderMarkdown("4 < 5 & 6 > 3")).toBe("<p>4 &lt; 5 &amp; 6 &gt; 3</p>");
  expect(renderMarkdown('Il a dit "bonjour" & <b>salut</b>')).toBe(
    "<p>Il a dit &quot;bonjour&quot; &amp; &lt;b&gt;salut&lt;/b&gt;</p>",
  );

  // Source vide ou nulle → rien de cassé.
  expect(renderMarkdown("")).toBe("");
});

// --- Route handler -------------------------------------------------------------

test("GET /api/tutorials → 200 { tutos } sans données privées", async () => {
  const { GET: listerTutos } = await import("../src/app/api/tutorials/route");

  const reponse = await listerTutos();
  expect(reponse.status).toBe(200);
  const corps = (await reponse.json()) as {
    tutos: { slug: string; tags: string[]; author: { slug: string } }[];
  };

  const slugs = corps.tutos.map((tuto) => tuto.slug);
  for (const slug of nosTutos) expect(slugs).toContain(slug);

  const chaine = JSON.stringify(corps);
  expect(chaine).not.toContain("passwordHash");
  expect(chaine).not.toContain("test-cx.fr");
});

// --- Nettoyage -----------------------------------------------------------------

afterAll(async () => {
  // Uniquement les lignes créées par cette suite — jamais celles des autres tests.
  await prisma.tutorial.deleteMany({ where: { authorId: auteurId } });
  await prisma.user.deleteMany({ where: { id: auteurId } });
  await prisma.$disconnect();
});
