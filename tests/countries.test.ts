import { describe, expect, it } from "vitest";
import { AFRICAN_COUNTRIES, REGISTRATION_COUNTRIES } from "@/lib/countries";

/**
 * Ces listes existaient en trois endroits qui avaient divergé (15 pays au
 * formulaire, 10 au filtre de l'annuaire, 21 au seed). Le fichier est la
 * source unique : le test empêche qu'il ne redevienne l'une des copies.
 */
describe("AFRICAN_COUNTRIES — liste du filtre de l'annuaire", () => {
  it("ne contient aucun doublon", () => {
    expect(new Set(AFRICAN_COUNTRIES).size).toBe(AFRICAN_COUNTRIES.length);
  });

  it("est triée (un sélecteur désordonné fait paraître le filtre bâclé)", () => {
    const trié = [...AFRICAN_COUNTRIES].sort((a, b) => a.localeCompare(b, "fr"));
    expect([...AFRICAN_COUNTRIES]).toEqual(trié);
  });

  it("ne contient ni `all`, ni la mention `Autre`", () => {
    // `all` est un mot-clé de filtre (API : `country=all` = sans filtre),
    // pas un pays : s'il fuyait dans la liste, un membre pourrait s'y
    // inscrire comme pays d'origine.
    expect(AFRICAN_COUNTRIES).not.toContain("all");
    expect(AFRICAN_COUNTRIES).not.toContain("Autre");
  });

  it("couvre les pays réellement présents au seed", () => {
    // Échantillon de `scripts/seed.ts` — si le seed gagne un pays, il
    // doit être déclaré ici pour être filtrable et affichable.
    const auSeed = [
      "Sénégal",
      "Ghana",
      "Nigeria",
      "Kenya",
      "Éthiopie",
      "Rwanda",
      "Cameroun",
      "RD Congo",
      "Bénin",
      "Guinée",
    ];
    for (const pays of auSeed) expect(AFRICAN_COUNTRIES).toContain(pays);
  });
});

describe("REGISTRATION_COUNTRIES — liste du formulaire d'inscription", () => {
  it("contient exactement la liste du filtre, plus `Autre`", () => {
    expect([...REGISTRATION_COUNTRIES].sort()).toEqual(
      [...AFRICAN_COUNTRIES, "Autre"].sort()
    );
  });

  it("`Autre` ferme la liste pour la diaspora, sans jamais l'ouvrir à n'importe quoi", () => {
    expect(REGISTRATION_COUNTRIES).toContain("Autre");
    expect(REGISTRATION_COUNTRIES).toHaveLength(AFRICAN_COUNTRIES.length + 1);
    expect(new Set(REGISTRATION_COUNTRIES).size).toBe(REGISTRATION_COUNTRIES.length);
  });

  it("découpe le formulaire et le filtre sur le même référentiel", () => {
    // Le bug d'origine : 7 pays affichés à l'annuaire introuvables au
    // moment de s'inscrire (et l'inverse).
    const formulaire = new Set(REGISTRATION_COUNTRIES);
    for (const pays of AFRICAN_COUNTRIES) expect(formulaire.has(pays)).toBe(true);
  });
});
