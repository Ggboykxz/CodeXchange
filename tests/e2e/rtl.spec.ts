import { test, expect } from "playwright/test";

/**
 * D3 — la locale arabe doit basculer vraiment toute la présentation :
 * `<html dir="rtl" lang="ar">`, et **aucun** scroll horizontal intempestif
 * sur téléphone. La bascule se fait via le store persistant
 * (`codexchange-storage` en localStorage), relue à chaque montage.
 */
test.describe("RTL pour l'arabe", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("dir/lang basculent, pas de débordement, puis retour ltr", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "codexchange-storage",
        JSON.stringify({ state: { locale: "ar" }, version: 0 })
      );
    });
    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollW).toBeLessThanOrEqual(390);

    // La conversion en propriétés logiques se traduit en dur : l'input de
    // recherche porte ps-9 (padding en début d'inline, côté droit en RTL).
    const padStart = await page
      .locator("header input")
      .first()
      .evaluate((el) => getComputedStyle(el).paddingInlineStart);
    expect(padStart).toBe("36px");

    // Retour à la locale par défaut.
    await page.evaluate(() => {
      localStorage.setItem(
        "codexchange-storage",
        JSON.stringify({ state: { locale: "fr" }, version: 0 })
      );
    });
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });
});
