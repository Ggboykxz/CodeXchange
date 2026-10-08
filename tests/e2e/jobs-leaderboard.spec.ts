import { test, expect } from "playwright/test";

/**
 * G4/G5/G6 + F5 — vérifiés de bout en bout :
 *  - la recherche texte des offres filtre réellement (debounce 150 ms) ;
 *  - la puce « XOF » ne laisse que les offres en FCFA (alias compris) ;
 *  - le staff épingle puis retire une offre de la vitrine ;
 *  - le classement affiche les vrais scores et mène au profil, dont les
 *    badges sont calculés sur les compteurs du membre.
 */

const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL ?? "admin@codexchange.dev";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD ?? "codexchange2026";

async function login(
  page: import("playwright/test").Page,
  email: string,
  password: string
) {
  await page.goto("/");
  await page.getByRole("button", { name: "Connexion" }).click();
  const dialog = page.locator('[data-slot="dialog-content"]');
  await expect(dialog).toBeVisible();
  await dialog
    .locator('input[type="email"], input[name="email"]')
    .first()
    .fill(email);
  await dialog.locator('input[type="password"]').fill(password);
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
}

test.describe("Jobs : recherche et devise (G4/G5)", () => {
  test("la recherche texte filtre la liste, état vide dédié", async ({ page }) => {
    await page.goto("/#jobs");
    const box = page.getByPlaceholder("Rechercher titre, entreprise, stack…");
    await expect(box).toBeVisible();

    await box.fill("xyzzyplouf");
    await expect(
      page.getByText("Aucune offre ne correspond à tes filtres.")
    ).toBeVisible();

    await box.fill("react");
    await expect(
      page.getByRole("heading", { name: "Senior Frontend Engineer (React)" })
    ).toBeVisible();
  });

  test("la puce XOF ne laisse passer que les offres en FCFA", async ({ page }) => {
    await page.goto("/#jobs");
    const all = page.getByRole("button", { name: "Toutes devises" });
    await expect(all).toBeVisible();

    await page.getByRole("button", { name: "XOF", exact: true }).click();
    await expect(page.getByText("FCFA").first()).toBeVisible();
    // L'offre en dollar ne survit pas au filtre.
    await expect(page.getByText("$40-65K USD / year")).toHaveCount(0);

    await all.click();
    await expect(page.getByText("$40-65K USD / year").first()).toBeVisible();
  });
});

test.describe("Vitrine « à la une » (G6)", () => {
  test("le staff épingle puis retire une offre", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/#jobs");

    await page
      .getByRole("heading", { name: "Senior Frontend Engineer (React)" })
      .click();
    const dialog = page.locator('[data-slot="dialog-content"]');
    await expect(dialog).toBeVisible();
    const card = page
      .locator("main button")
      .filter({ hasText: "Senior Frontend Engineer (React)" })
      .first();

    // Le staff voit le pilotage ; il retire d'abord si déjà épinglée
    // (l'E2E repasse toujours par les deux états).
    const toggle = dialog.getByRole("button", { name: /^À la une$|^Retirer de la une$/ });
    await expect(toggle).toBeVisible();
    if ((await toggle.textContent())?.includes("Retirer")) {
      await toggle.click();
      await expect(
        dialog.getByRole("button", { name: "À la une" })
      ).toBeVisible();
      await expect(card.getByText("À la une", { exact: true })).toHaveCount(0);
    }

    await dialog.getByRole("button", { name: "À la une" }).click();
    // Le badge apparaît sur SA carte (portail du dialog hors de `main`).
    await expect(card.getByText("À la une", { exact: true })).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Retirer de la une" })
    ).toBeVisible();

    // Nettoyage : l'offre repart sans épinglage (base inchangée).
    await dialog.getByRole("button", { name: "Retirer de la une" }).click();
    await expect(dialog.getByRole("button", { name: "À la une" })).toBeVisible();
    await expect(card.getByText("À la une", { exact: true })).toHaveCount(0);
  });
});

test.describe("Classement et badges (F5)", () => {
  test("le top contributeurs est réel et mène au profil", async ({ page }) => {
    await page.goto("/#annuaire");
    await expect(page.getByText("Top contributeurs")).toBeVisible();

    const firstRow = page.locator("main ol > li button").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();
    await expect(page).toHaveURL(/#annuaire\//);

    // Le profil expose les jalons calculés sur ses compteurs réels.
    await expect(page.getByText("Badges")).toBeVisible();
    await expect(
      page
        .getByText("Première question")
        .or(page.getByText("Première réponse"))
        .first()
    ).toBeVisible();
  });

  test("le palier de réputation suit le score du membre", async ({ page }) => {
    // eric.m : seed déterministe — 91 de réputation → palier Contributeur.
    await page.goto("/#annuaire/eric.m");
    await expect(page.getByText("Contributeur", { exact: true })).toBeVisible();
    await expect(page.getByText("Réponse acceptée")).toBeVisible();
  });
});
