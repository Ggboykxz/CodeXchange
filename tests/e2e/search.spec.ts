import { test, expect } from "playwright/test";

/**
 * D9 — la boîte de recherche du header n'est plus décor : saisie débounce
 * 300 ms, groupes par module, clic → fiche, état vide dédié.
 * (Sondes placées dans `header` : la recherche du fil réutilise le même
 * placeholder, d'où la portée stricte.)
 */

test.describe("Recherche globale", () => {
  test("trouve une question et ouvre sa fiche", async ({ page }) => {
    await page.goto("/");
    const box = page.locator("header").getByPlaceholder("Rechercher...");
    await box.fill("kubernetes");

    const result = page
      .locator("header")
      .locator('a[href^="/forum/"]')
      .first();
    await expect(result).toBeVisible();
    await expect(result).toContainText("Kubernetes");

    await result.click();
    await expect(page).toHaveURL(/forum\//);
  });

  test("état vide dédié quand rien ne matche", async ({ page }) => {
    await page.goto("/");
    await page.locator("header").getByPlaceholder("Rechercher...").fill("xyzzyplouf");
    await expect(page.locator("header").getByText("Aucun résultat.")).toBeVisible();
  });
});
