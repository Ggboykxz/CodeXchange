import { test, expect } from "playwright/test";

/**
 * Cœur social refondu : barre d'actions façon Reddit sur chaque carte,
 * sauvegarde, masquage annulable, fiche question (rail de vote vertical)
 * — sur desktop comme sur mobile. La base CI est seedée avant ce spec.
 */

test.describe("Fil d'accueil", () => {
  test("affiche une carte avec la barre d'actions Reddit", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("article").first();
    await expect(card).toBeVisible();
    await expect(card.getByRole("button", { name: "Commenter" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Partager" })).toBeVisible();
    await expect(card.getByRole("button", { name: "Sauvegarder" })).toBeVisible();
    await expect(
      card.getByRole("button", { name: "Plus d'actions" })
    ).toBeVisible();
  });

  test("sauvegarder bascule l'état et affiche un toast", async ({ page }) => {
    await page.goto("/");
    const card = page.locator("article").first();
    await card.getByRole("button", { name: "Sauvegarder" }).first().click();
    await expect(
      card.getByRole("button", { name: "Retirer des sauvegardes" })
    ).toBeVisible();
    await expect(
      page.getByText("Enregistré dans tes sauvegardes").first()
    ).toBeVisible();
  });

  test("masquer une carte puis annuler le masquage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("article").first()).toBeVisible();
    const total = await page.locator("article").count();
    const card = page.locator("article").first();
    await card.getByRole("button", { name: "Plus d'actions" }).first().click();
    await page.getByRole("menuitem", { name: /^Masquer$/ }).click();
    await expect(page.locator("article")).toHaveCount(total - 1);
    await page.getByRole("button", { name: /^Annuler$/ }).first().click();
    await expect(page.locator("article")).toHaveCount(total);
  });

  test("l'auteur est cliquable vers sa page profil", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator("article a[href^='#annuaire/']").first()
    ).toBeVisible();
  });
});

test.describe("Fiche question", () => {
  test("rail de vote vertical visible sur desktop", async ({ page }) => {
    await page.goto("/");
    await page.locator("article a[href^='#forum/']").first().click();
    await expect(page.getByTestId("vote-rail")).toBeVisible();
    await expect(page.getByTestId("vote-bar")).toBeHidden();
  });
});

test.describe("Mobile (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("aucun débordement horizontal sur le fil, le forum et la fiche", async ({
    page,
  }) => {
    for (const path of ["/", "/#forum"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, `débordement sur ${path}`).toBeLessThanOrEqual(0);
    }
    // La fiche question elle-même
    await page.goto("/#forum");
    await page.locator("article a[href^='#forum/']").first().click();
    const detailOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(detailOverflow).toBeLessThanOrEqual(0);
  });

  test("le vote est une barre horizontale, le rail vertical masqué", async ({
    page,
  }) => {
    await page.goto("/#forum");
    await page.locator("article a[href^='#forum/']").first().click();
    await expect(page.getByTestId("vote-bar")).toBeVisible();
    await expect(page.getByTestId("vote-rail")).toBeHidden();
  });
});
