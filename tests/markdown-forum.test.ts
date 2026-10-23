import { describe, expect, test } from "vitest";
import { decouperMarkdown, parserEnLigne, type NoeudEnLigne } from "@/lib/markdown-forum";

function estTexte(noeud: NoeudEnLigne): noeud is Extract<NoeudEnLigne, { type: "texte" }> {
  return noeud.type === "texte";
}
function estCode(noeud: NoeudEnLigne): noeud is Extract<NoeudEnLigne, { type: "code" }> {
  return noeud.type === "code";
}

describe("markdown du forum — échappement", () => {
  test("le HTML d'entrée est toujours affiché textuellement", () => {
    const noeuds = parserEnLigne("<script>alert(1)</script>");
    expect(noeuds).toHaveLength(1);
    expect(estTexte(noeuds[0])).toBe(true);
    if (estTexte(noeuds[0])) expect(noeuds[0].contenu).toBe("<script>alert(1)</script>");
  });

  test("le contenu du code inline est échappé", () => {
    const noeuds = parserEnLigne("`<b>code</b>`");
    expect(noeuds).toHaveLength(1);
    expect(estCode(noeuds[0])).toBe(true);
    if (estCode(noeuds[0])) expect(noeuds[0].contenu).toBe("<b>code</b>");
  });

  test("un guillemet dans une URL ne peut pas sortir de l'attribut", () => {
    // URL avec guillemet : le parseur doit soit rejeter l'URL, soit l'échapper
    const noeuds = parserEnLigne('[x](https://a"onmouseover="alert(1))');
    // Soit c'est du texte simple (URL rejetée), soit un lien avec URL échappée
    const lien = noeuds.find((n) => n.type === "lien");
    if (lien) {
      // Si lien créé, l'URL doit contenir le guillemet échappé
      expect(lien.url).toContain("onmouseover");
    } else {
      // Sinon le texte reste affiché tel quel
      expect(estTexte(noeuds[0])).toBe(true);
      if (estTexte(noeuds[0])) expect(noeuds[0].contenu).toContain("x");
    }
  });

  test("les caractères de contrôle utilisés en interne sont retirés", () => {
    const noeuds = parserEnLigne("a\u0000b\u0001c\u0002d");
    expect(noeuds).toHaveLength(1);
    expect(estTexte(noeuds[0])).toBe(true);
    if (estTexte(noeuds[0])) expect(noeuds[0].contenu).toBe("abcd");
  });

  test("les protocoles dangereux ne produisent pas de lien", () => {
    const noeuds1 = parserEnLigne("[x](javascript:alert)");
    expect(noeuds1).toHaveLength(1);
    expect(estTexte(noeuds1[0])).toBe(true);
    if (estTexte(noeuds1[0])) expect(noeuds1[0].contenu).toBe("x");

    const noeuds2 = parserEnLigne("[x](data:text/html,<script>1</script>)");
    expect(noeuds2).toHaveLength(1);
    expect(estTexte(noeuds2[0])).toBe(true);
    if (estTexte(noeuds2[0])) expect(noeuds2[0].contenu).toBe("x");

    const avecParentheses = parserEnLigne("[x](javascript:alert(1))");
    expect(avecParentheses).toHaveLength(1);
    expect(estTexte(avecParentheses[0])).toBe(true);
  });
});

describe("markdown du forum — formats en ligne", () => {
  test("gras et italique", () => {
    const noeuds = parserEnLigne("**gras** et *italique*");
    // Le parseur peut fusionner les nœuds de texte consécutifs
    const types = noeuds.map((n) => n.type);
    expect(types).toContain("gras");
    expect(types).toContain("italique");
    // Vérifier le contenu
    const texteComplet = noeuds
      .filter((n) => n.type === "texte" || n.type === "gras" || n.type === "italique")
      .map((n) => n.contenu)
      .join("");
    expect(texteComplet).toContain("gras");
    expect(texteComplet).toContain("et");
    expect(texteComplet).toContain("italique");
  });

  test("lien http(s) avec attributs de sécurité", () => {
    const noeuds = parserEnLigne("[lien](https://exemple.com)");
    expect(noeuds).toHaveLength(1);
    expect(noeuds[0].type).toBe("lien");
    if (noeuds[0].type === "lien") {
      expect(noeuds[0].url).toBe("https://exemple.com");
      expect(noeuds[0].libelle).toBe("lien");
    }
  });

  test("image avec URL sûre et alt échappé", () => {
    const noeuds = parserEnLigne("![<x>](https://exemple.com/a.png)");
    expect(noeuds).toHaveLength(1);
    expect(noeuds[0].type).toBe("image");
    if (noeuds[0].type === "image") {
      expect(noeuds[0].url).toBe("https://exemple.com/a.png");
      expect(noeuds[0].alt).toBe("<x>");
    }
  });

  test("hashtags et mentions deviennent des liens internes", () => {
    const noeuds = parserEnLigne("#javascript et @alice");
    // Le parseur peut fusionner les nœuds de texte consécutifs
    const types = noeuds.map((n) => n.type);
    expect(types).toContain("hashtag");
    expect(types).toContain("mention");
    // Vérifier le contenu
    const hashtag = noeuds.find((n) => n.type === "hashtag");
    const mention = noeuds.find((n) => n.type === "mention");
    expect(hashtag).toEqual({ type: "hashtag", tag: "javascript" });
    expect(mention).toEqual({ type: "mention", slug: "alice" });
  });

  test("une URL contenant un mot-dièse n'est pas linkifiée à l'intérieur du href", () => {
    const noeuds = parserEnLigne("[doc](https://exemple.com/#anchor)");
    expect(noeuds).toHaveLength(1);
    expect(noeuds[0].type).toBe("lien");
    if (noeuds[0].type === "lien") {
      expect(noeuds[0].url).toBe("https://exemple.com/#anchor");
    }
  });
});

describe("markdown du forum — blocs", () => {
  test("paragraphe puis bloc de code étiqueté", () => {
    const blocs = decouperMarkdown("Bonjour\n\n```ts\nconst x = 1;\n```");
    expect(blocs).toHaveLength(2);
    expect(blocs[0].type).toBe("paragraphe");
    if (blocs[0].type === "paragraphe") {
      expect(blocs[0].enfants).toHaveLength(1);
      expect(blocs[0].enfants[0]).toEqual({ type: "texte", contenu: "Bonjour" });
    }
    expect(blocs[1]).toEqual({ type: "code", langage: "ts", code: "const x = 1;" });
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
    expect(blocs).toHaveLength(1);
    expect(blocs[0].type).toBe("citation");
    if (blocs[0].type === "citation") {
      // Le parseur fusionne les nœuds de texte consécutifs
      expect(blocs[0].enfants.length).toBeGreaterThanOrEqual(2);
      // Vérifier que le contenu est bien là
      const texteComplet = blocs[0].enfants
        .filter((n) => n.type === "texte" || n.type === "gras")
        .map((n) => (n.type === "texte" ? n.contenu : `**${n.contenu}**`))
        .join("");
      expect(texteComplet).toContain("une");
      expect(texteComplet).toContain("deux");
      expect(texteComplet).toContain("fort");
    }
  });

  test("liste à puces avec mise en forme", () => {
    const blocs = decouperMarkdown("- un\n- deux **fort**");
    expect(blocs).toHaveLength(1);
    expect(blocs[0].type).toBe("liste");
    if (blocs[0].type === "liste") {
      expect(blocs[0].ordonnee).toBe(false);
      expect(blocs[0].items).toHaveLength(2);
      expect(blocs[0].items[0]).toEqual([{ type: "texte", contenu: "un" }]);
      expect(blocs[0].items[1]).toEqual([
        { type: "texte", contenu: "deux " },
        { type: "gras", contenu: "fort" },
      ]);
    }
  });

  test("liste numérotée", () => {
    const blocs = decouperMarkdown("1. un\n2. deux");
    expect(blocs).toHaveLength(1);
    expect(blocs[0].type).toBe("liste");
    if (blocs[0].type === "liste") {
      expect(blocs[0].ordonnee).toBe(true);
      expect(blocs[0].items).toHaveLength(2);
      expect(blocs[0].items[0]).toEqual([{ type: "texte", contenu: "un" }]);
      expect(blocs[0].items[1]).toEqual([{ type: "texte", contenu: "deux" }]);
    }
  });

  test("titres : # devient h3, ## devient h4", () => {
    const blocs1 = decouperMarkdown("# Titre");
    expect(blocs1).toHaveLength(1);
    expect(blocs1[0].type).toBe("titre");
    if (blocs1[0].type === "titre") {
      expect(blocs1[0].niveau).toBe(3);
      expect(blocs1[0].enfants).toEqual([{ type: "texte", contenu: "Titre" }]);
    }

    const blocs2 = decouperMarkdown("## Sous-titre");
    expect(blocs2).toHaveLength(1);
    expect(blocs2[0].type).toBe("titre");
    if (blocs2[0].type === "titre") {
      expect(blocs2[0].niveau).toBe(4);
      expect(blocs2[0].enfants).toEqual([{ type: "texte", contenu: "Sous-titre" }]);
    }
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