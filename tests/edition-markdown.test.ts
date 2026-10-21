import { describe, expect, test } from "vitest";
import { appliquerFormat } from "@/lib/edition-markdown";

describe("édition Markdown — actions en ligne", () => {
  test("gras entoure la sélection et la restitue", () => {
    expect(appliquerFormat("bonjour", 0, 7, "gras")).toEqual({
      texte: "**bonjour**",
      debut: 2,
      fin: 9,
    });
  });

  test("gras retire les marqueurs d'une sélection déjà formatée (bascule)", () => {
    expect(appliquerFormat("**bonjour**", 2, 9, "gras")).toEqual({
      texte: "bonjour",
      debut: 0,
      fin: 7,
    });
  });

  test("gras retire les marqueurs quand la sélection les inclut", () => {
    expect(appliquerFormat("**bonjour**", 0, 11, "gras")).toEqual({
      texte: "bonjour",
      debut: 0,
      fin: 7,
    });
  });

  test("italique et code utilisent des marqueurs distincts", () => {
    expect(appliquerFormat("mot", 0, 3, "italique").texte).toBe("*mot*");
    expect(appliquerFormat("mot", 0, 3, "code").texte).toBe("`mot`");
  });

  test("une sélection inversée est normalisée", () => {
    expect(appliquerFormat("bonjour", 7, 0, "gras").texte).toBe("**bonjour**");
  });
});

describe("édition Markdown — blocs et liens", () => {
  test("bloc de code sur plusieurs lignes", () => {
    expect(appliquerFormat("a\nb", 0, 3, "bloc-code")).toEqual({
      texte: "```\na\nb\n```",
      debut: 4,
      fin: 7,
    });
  });

  test("bloc de code vide place le curseur entre les balises", () => {
    expect(appliquerFormat("", 0, 0, "bloc-code")).toEqual({
      texte: "```\n\n```",
      debut: 4,
      fin: 4,
    });
  });

  test("lien avec sélection sélectionne l'URL à remplacer", () => {
    expect(appliquerFormat("site", 0, 4, "lien")).toEqual({
      texte: "[site](https://)",
      debut: 7,
      fin: 15,
    });
  });

  test("lien sans sélection propose le libellé", () => {
    expect(appliquerFormat("", 0, 0, "lien")).toEqual({
      texte: "[texte](https://)",
      debut: 1,
      fin: 6,
    });
  });
});

describe("édition Markdown — citations et listes", () => {
  test("citation préfixe chaque ligne", () => {
    expect(appliquerFormat("ligne 1\nligne 2", 0, 15, "citation")).toEqual({
      texte: "> ligne 1\n> ligne 2",
      debut: 0,
      fin: 19,
    });
  });

  test("citation bascule (retire le préfixe)", () => {
    expect(appliquerFormat("> ligne 1\n> ligne 2", 0, 19, "citation")).toEqual({
      texte: "ligne 1\nligne 2",
      debut: 0,
      fin: 15,
    });
  });

  test("citation sans sélection préfixe la ligne du curseur", () => {
    expect(appliquerFormat("a\nb", 2, 2, "citation")).toEqual({
      texte: "a\n> b",
      debut: 4,
      fin: 4,
    });
  });

  test("liste à puces ignore les lignes vides", () => {
    expect(appliquerFormat("a\n\nb", 0, 4, "liste")).toEqual({
      texte: "- a\n\n- b",
      debut: 0,
      fin: 8,
    });
  });

  test("aucun préfixe ajouté sur une ligne vide", () => {
    expect(appliquerFormat("a\n\nb", 2, 2, "liste")).toEqual({
      texte: "a\n\nb",
      debut: 2,
      fin: 2,
    });
  });
});
