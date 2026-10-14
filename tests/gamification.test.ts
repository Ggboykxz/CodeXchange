import { expect, test } from "vitest";
import { calculerNiveau, PALIERS } from "../src/lib/gamification";

/**
 * Tests de la logique de niveaux (`src/lib/gamification.ts`).
 * Fonctions pures : aucun accès BDD.
 */

test("karma 0 → niveau 1 (Débutant), progression vers le palier suivant", () => {
  const n = calculerNiveau(0);
  expect(n.niveau).toBe(1);
  expect(n.titre).toBe("Débutant");
  expect(n.suivant).toBe(10);
  expect(n.progression).toBe(0);
  expect(n.restant).toBe(10);
});

test("karma négatif ou NaN → plancher niveau 1", () => {
  expect(calculerNiveau(-50).niveau).toBe(1);
  expect(calculerNiveau(Number.NaN).niveau).toBe(1);
});

test("frontière exacte d'un palier → ce niveau atteint", () => {
  const n = calculerNiveau(50);
  expect(n.niveau).toBe(3);
  expect(n.titre).toBe("Contributeur");
  expect(n.progression).toBe(0); // pile sur le seuil
});

test("juste sous un palier → niveau précédent", () => {
  expect(calculerNiveau(49).niveau).toBe(2); // palier 3 = seuil 50
  expect(calculerNiveau(9).niveau).toBe(1); // palier 2 = seuil 10
});

test("milieu d'un palier → progression proportionnelle", () => {
  const n = calculerNiveau(30); // palier 2 [10..50) → 20/40 = 50%
  expect(n.niveau).toBe(2);
  expect(n.progression).toBe(50);
  expect(n.restant).toBe(20);
});

test("sommet : karma ≥ dernier seuil → niveau max, progression 100, pas de suivant", () => {
  const n = calculerNiveau(5000);
  const max = PALIERS[PALIERS.length - 1]!;
  expect(n.niveau).toBe(max.niveau);
  expect(n.suivant).toBeNull();
  expect(n.progression).toBe(100);
  expect(n.restant).toBe(0);
});

test("les paliers sont strictement croissants en karma", () => {
  for (let i = 1; i < PALIERS.length; i++) {
    expect(PALIERS[i]!.seuil).toBeGreaterThan(PALIERS[i - 1]!.seuil);
    expect(PALIERS[i]!.niveau).toBe(PALIERS[i - 1]!.niveau + 1);
  }
});
