import { test, expect } from "playwright/test";

/**
 * Vérifie C10 en vrai : login démo → menu ⋯ de la question → édition,
 * et épinglage réservé au staff (masqué pour un `member`).
 */
async function login(page: import("playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Connexion" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await dialog
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill("aicha.diallo@codexchange.dev");
  await dialog.locator('input[type="password"]').fill("codexchange2026");
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
}

test.describe("Édition d'une question (C10)", () => {
  test("le menu ⋯ permet d'éditer et n'expose pas l'épinglage à un member", async ({
    page,
  }) => {
    await login(page);
    // Première question de la liste écrite par Aïcha (compte démo).
    await page.goto("/forum");
    const mine = page
      .locator("article")
      .filter({ hasText: "u/aicha.dev" })
      .first();
    await mine.locator("a[href^='/forum/']").first().click();
    // Menu ⋯ de la question (le premier « ⋯ » est celui de PostActions).
    await page
      .getByRole("button", { name: "Plus d'actions" })
      .first()
      .click();
    const modifier = page.getByRole("menuitem", {
      name: /Modifier la question/i,
    });
    const supprimer = page.getByRole("menuitem", {
      name: /Supprimer la question/i,
    });
    await expect(modifier).toBeVisible();
    await expect(supprimer).toBeVisible();
    // L'épinglage est réservé à l'équipe : invisible pour un member.
    await expect(
      page.getByRole("menuitem", { name: /Épingler/i })
    ).toBeHidden();
    // Édition : on revient au formulaire et on sauvegarde.
    await modifier.click();
    const titleInput = page.locator("form input#edit-title");
    await expect(titleInput).toBeVisible();
    const original = await titleInput.inputValue();
    await titleInput.fill(original + " — modifié");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByText("Question mise à jour.").first()).toBeVisible();
    // On rétablit le titre pour garder la seed propre.
    await page
      .getByRole("button", { name: "Plus d'actions" })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: /Modifier la question/i })
      .click();
    await page.locator("form input#edit-title").fill(original);
    await page
      .getByRole("button", { name: "Enregistrer les modifications" })
      .click();
    await expect(page.getByText("Question mise à jour.").first()).toBeVisible();
  });
});
