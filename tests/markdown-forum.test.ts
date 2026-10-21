import { describe, expect, test } from "vitest";
import { decouperMarkdown, enLigne } from "@/lib/markdown-forum";

describe("markdown du forum — échappement", () => {
  test("le HTML d'entrée est toujours affiché textuellement", () => {
    const html = enLigne("<script>alert(1)</script>");
    expect(html).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  test("le contenu du code inline est échappé", () => {
    const html = enLigne("`<b>code</b>`");
    expect(html).toContain("&lt;b&gt;code&lt;/b&gt;");
    expect(html).not.toContain("<b>");
  });

  test("un guillemet dans une URL ne peut pas sortir de l'attribut", () => {
    const html = enLigne('[x](https://a"onmouseover="alert(1))');
    expect(html).toContain("&quot;onmouseover=&quot;");
    expect(html).not.toContain('"onmouseover="');
  });

  test("les caractères de contrôle utilisés en interne sont retirés", () => {
    expect(enLigne("a\u0000b\u0001c\u0002d")).toBe("abcd");
  });

  test("les protocoles dangereux ne produisent pas de lien", () => {
    expect(enLigne("[x](javascript:alert)")).toBe("x");
    expect(enLigne("[x](data:text/html,<script>1</script>)")).toBe("x");
    // Les parenthèses empêchent la reconnaissance de l'URL : le texte reste
    // affiché tel quel, sans ancre ni attribut href.
    const avecParentheses = enLigne("[x](javascript:alert(1))");
    expect(avecParentheses).not.toContain("<a");
    expect(avecParentheses).not.toContain("href=");
  });
});

describe("markdown du forum — formats en ligne", () => {
  test("gras et italique", () => {
    expect(enLigne("**gras** et *italique*")).toBe(
      "<strong>gras</strong> et <em>italique</em>",
    );
  });

  test("lien http(s) avec attributs de sécurité", () => {
    const html = enLigne("[lien](https://exemple.com)");
    expect(html).toContain('href="https://exemple.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("image avec URL sûre et alt échappé", () => {
    const html = enLigne("![<x>](https://exemple.com/a.png)");
    expect(html).toContain('src="https://exemple.com/a.png"');
    expect(html).toContain('alt="&lt;x&gt;"');
    expect(html).not.toContain("<x>");
  });

  test("hashtags et mentions deviennent des liens internes", () => {
    const html = enLigne("#javascript et @alice");
    expect(html).toContain('href="/forum?tag=javascript"');
    expect(html).toContain(">#javascript</a>");
    expect(html).toContain('href="/membres/alice"');
    expect(html).toContain(">@alice</a>");
  });

  test("une URL contenant un mot-dièse n'est pas linkifiée à l'intérieur du href", () => {
    const html = enLigne("[doc](https://exemple.com/#anchor)");
    expect(html).toContain('href="https://exemple.com/#anchor"');
    expect(html.match(/<a /g)).toHaveLength(1);
  });
});

describe("markdown du forum — blocs", () => {
  test("paragraphe puis bloc de code étiqueté", () => {
    const blocs = decouperMarkdown("Bonjour\n\n```ts\nconst x = 1;\n```");
    expect(blocs).toEqual([
      { type: "paragraphe", html: "Bonjour" },
      { type: "code", langage: "ts", code: "const x = 1;" },
    ]);
  });

  test("bloc de code sans langage conserve sa première ligne", () => {
    const blocs = decouperMarkdown("```\nconsole.log(1)\n```");
    expect(blocs).toEqual([
      { type: "code", langage: "", code: "console.log(1)" },
    ]);
  });

  test("bloc de code non fermé mange la fin du texte", () => {
    const blocs = decouperMarkdown("```js\nconst a = 1\n");
    expect(blocs).toEqual([
      { type: "code", langage: "js", code: "const a = 1" },
    ]);
  });

  test("citation multi-lignes", () => {
    const blocs = decouperMarkdown("> une\n> deux **fort**");
    expect(blocs).toEqual([
      { type: "citation", html: "une\ndeux <strong>fort</strong>" },
    ]);
  });

  test("liste à puces avec mise en forme", () => {
    const blocs = decouperMarkdown("- un\n- deux **fort**");
    expect(blocs).toEqual([
      {
        type: "liste",
        ordonnee: false,
        items: ["un", "deux <strong>fort</strong>"],
      },
    ]);
  });

  test("liste numérotée", () => {
    const blocs = decouperMarkdown("1. un\n2. deux");
    expect(blocs).toEqual([
      { type: "liste", ordonnee: true, items: ["un", "deux"] },
    ]);
  });

  test("titres : # devient h3, ## devient h4", () => {
    expect(decouperMarkdown("# Titre")).toEqual([
      { type: "titre", niveau: 3, html: "Titre" },
    ]);
    expect(decouperMarkdown("## Sous-titre")).toEqual([
      { type: "titre", niveau: 4, html: "Sous-titre" },
    ]);
  });

  test("#hashtag sans espace reste un paragraphe", () => {
    const blocs = decouperMarkdown("#javascript");
    expect(blocs).toHaveLength(1);
    expect(blocs[0].type).toBe("paragraphe");
  });

  test("document mixte : l'ordre des blocs est conservé", () => {
    const blocs = decouperMarkdown(
      "# Guide\n\nUn **texte**.\n\n> citation\n\n- a\n- b\n\n```py\nprint(1)\n```",
    );
    expect(blocs.map((bloc) => bloc.type)).toEqual([
      "titre",
      "paragraphe",
      "citation",
      "liste",
      "code",
    ]);
  });
});
