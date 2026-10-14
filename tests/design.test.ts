import { expect, test } from "vitest";
import { Z, RAYON, DUREE } from "../src/lib/design";

test("Z: 6 niveaux strictement croissants", () => {
  expect(Z.base).toBe(0);
  expect(Z.raised).toBe(10);
  expect(Z.header).toBe(20);
  expect(Z.overlay).toBe(30);
  expect(Z.drawer).toBe(40);
  expect(Z.toast).toBe(50);
  expect(Z.base).toBeLessThan(Z.raised);
  expect(Z.raised).toBeLessThan(Z.header);
  expect(Z.header).toBeLessThan(Z.overlay);
  expect(Z.overlay).toBeLessThan(Z.drawer);
  expect(Z.drawer).toBeLessThan(Z.toast);
});

test("Z: drawer au-dessus de header", () => {
  expect(Z.drawer).toBeGreaterThan(Z.header);
});

test("RAYON: classes utilitaires Tailwind attendues", () => {
  expect(RAYON.sm).toBe("rounded-md");
  expect(RAYON.md).toBe("rounded-lg");
  expect(RAYON.lg).toBe("rounded-xl");
  expect(RAYON.pill).toBe("rounded-full");
});

test("DUREE: retour <= 200 ms", () => {
  expect(DUREE.retour).toBeLessThanOrEqual(200);
});
