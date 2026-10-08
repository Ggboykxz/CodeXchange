import { describe, expect, it } from "vitest";
import { currencyTerms, salaryCurrency, salaryCurrencies } from "@/lib/salary";

describe("salaryCurrency", () => {
  it("lit le code littéral du format seed", () => {
    expect(salaryCurrency("3-5K EUR / month")).toBe("EUR");
    expect(salaryCurrency("80-120K USD / year")).toBe("USD");
    expect(salaryCurrency("500K XOF / mois")).toBe("XOF");
    expect(salaryCurrency("450 000 MAD / mois")).toBe("MAD");
  });

  it("respecte la priorité littéral > symbole (CAD vs $)", () => {
    expect(salaryCurrency("70-90K CAD / year")).toBe("CAD");
    expect(salaryCurrency("6-8K$ / mois")).toBe("USD");
  });

  it("retombe sur les symboles seuls", () => {
    expect(salaryCurrency("4-6K€ / mois")).toBe("EUR");
    expect(salaryCurrency("$8-10K")).toBe("USD");
  });

  it("distingue les codes par mot entier (pas de préfixe)", () => {
    // « USD » ne doit pas attraper « USDT » ni « EUR » par sous-chaîne.
    expect(salaryCurrency("5-7K USDT / mois")).toBe(null);
    expect(salaryCurrency("3-5K EURX")).toBe(null);
  });

  it("gère le vide", () => {
    expect(salaryCurrency(null)).toBe(null);
    expect(salaryCurrency(undefined)).toBe(null);
    expect(salaryCurrency("")).toBe(null);
    expect(salaryCurrency("Selon profil")).toBe(null);
  });

  it("normalise « FCFA » vers le code ISO XOF (seed en toutes lettres)", () => {
    expect(salaryCurrency("150K FCFA / month")).toBe("XOF");
    expect(salaryCurrency("5-8M FCFA / year")).toBe("XOF");
    expect(salaryCurrency("500K XOF / mois")).toBe("XOF");
  });
});

describe("currencyTerms", () => {
  it("couvre les deux graphies de XOF (FCFA compris)", () => {
    expect(currencyTerms("XOF")).toEqual(["XOF", "FCFA"]);
    expect(currencyTerms("xof")).toEqual(["XOF", "FCFA"]);
  });

  it("passe le littéral tel quel pour les autres codes", () => {
    expect(currencyTerms("EUR")).toEqual(["EUR"]);
    expect(currencyTerms("usd")).toEqual(["USD"]);
  });
});

describe("salaryCurrencies", () => {
  it("dénoue, trie et supprime les doublons", () => {
    expect(
      salaryCurrencies(["3-5K EUR / month", null, "500K XOF / mois", "2-4K EUR", "$8K"])
    ).toEqual(["EUR", "USD", "XOF"]);
  });

  it("renvoie [] sans aucun code lisible", () => {
    expect(salaryCurrencies([null, "", "Selon profil"])).toEqual([]);
  });
});
