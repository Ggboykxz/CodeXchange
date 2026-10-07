import { describe, expect, it } from "vitest";
import { dictionaries, translate } from "@/i18n/dictionaries";

/**
 * Garde-fou i18n : le site est quadrilingue, donc une clé ajoutée en français et
 * oubliée en anglais afficherait littéralement « feed.compose » dans la
 * version anglaise. Rien de plus visible qu'une clé brute dans l'interface.
 */
describe("dictionnaires", () => {
  const fr = dictionaries.fr;
  const en = dictionaries.en;

  it("fr et en ont exactement les mêmes clés", () => {
    const frKeys = Object.keys(fr).sort();
    const enKeys = Object.keys(en).sort();

    const missingInEn = frKeys.filter((k) => !(k in en));
    const missingInFr = enKeys.filter((k) => !(k in fr));

    expect(missingInEn, `clés absentes du dictionnaire EN: ${missingInEn.join(", ")}`).toEqual([]);
    expect(missingInFr, `clés absentes du dictionnaire FR: ${missingInFr.join(", ")}`).toEqual([]);
    expect(frKeys.length).toBeGreaterThan(200);
  });

  it("aucune valeur vide", () => {
    for (const [locale, dict] of Object.entries(dictionaries)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `${locale}.${key} est vide`).not.toBe("");
      }
    }
  });

  // sw et ar sont désormais traduits : ils ne retombent plus sur l'anglais.
  it("sw et ar sont traduits (plus de fallback vers EN)", () => {
    expect(dictionaries.sw["feed.compose"]).not.toBe(en["feed.compose"]);
    expect(dictionaries.ar["feed.compose"]).not.toBe(en["feed.compose"]);
    // Valeurs caractéristiques concrètes
    expect(dictionaries.sw["common.loading"]).toBe("Inapakia...");
    expect(dictionaries.ar["common.loading"]).toBe("جارٍ التحميل...");
  });

  it("aucun chiffre de communication fabriqué dans les textes de la home", () => {
    // La communauté affiche ses compteurs réels : les textes marketing ne
    // doivent pas promettre un effectif que la base ne contient pas.
    const forbidden = ["12 000", "12,400", "12,000", "12000"];
    for (const [locale, dict] of Object.entries(dictionaries)) {
      for (const [key, value] of Object.entries(dict)) {
        for (const bad of forbidden) {
          expect(value.includes(bad), `${locale}.${key} contient « ${bad} »`).toBe(false);
        }
      }
    }
  });
});

describe("translate", () => {
  it("résout une clé existante dans la locale demandée", () => {
    expect(translate("fr", "feed.compose")).toBe("Publier");
    expect(translate("en", "feed.compose")).toBe("Post");
  });

  it("retombe sur la clé elle-même quand la traduction manque", () => {
    expect(translate("fr", "clé.inexistante")).toBe("clé.inexistante");
    expect(translate("en", "clé.inexistante")).toBe("clé.inexistante");
  });
});
