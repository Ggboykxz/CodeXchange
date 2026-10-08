import { test, expect } from "playwright/test";

/**
 * B8 — l'outil de gestion des rôles, vérifié de bout en bout :
 * le lien n'existe que pour un admin, l'ancre `#admin` refuse les autres,
 * et un admin change réellement un rôle… puis le restaure (l'E2E laisse la
 * base dans son état d'origine, comme `auth-edit` le fait pour les titres).
 */

/**
 * Compte d'administration. En local et en CI c'est le compte du seed ;
 * contre la production on passe `ADMIN_E2E_PASSWORD` (mot de passe fort,
 * jamais commité).
 */
const ADMIN_EMAIL = process.env.ADMIN_E2E_EMAIL ?? "admin@codexchange.dev";
const ADMIN_PASSWORD = process.env.ADMIN_E2E_PASSWORD ?? "codexchange2026";

/**
 * Connexion via la modale d'auth unique (même contract que auth-edit).
 * Les deux comptes de démo partagent le mot de passe du seed ; contre la
 * production, l'admin utilise `ADMIN_E2E_PASSWORD`.
 */
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

test.describe("Gestion des rôles (B8)", () => {
  test("un member ne voit pas l'entrée Admin et #admin le refuse", async ({
    page,
  }) => {
    await login(page, "aicha.diallo@codexchange.dev", "codexchange2026");

    // Aucune entrée « Admin » dans la navigation (desktop rendu à 1280 px).
    await expect(page.locator('nav a[href="#admin"]')).toHaveCount(0);

    // Attaque directe par l'ancre : refus net plutôt qu'un écran vide.
    await page.evaluate(() => {
      window.location.hash = "#admin";
    });
    await expect(
      page.getByText("Accès réservé aux administrateurs.")
    ).toBeVisible();
  });

  test("l'admin voit l'entrée, change un rôle puis le restaure", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // L'entrée apparaît dans la navigation desktop…
    const navLink = page.locator('nav a[href="#admin"]');
    await expect(navLink).toBeVisible();
    await navLink.click();
    await expect(page).toHaveURL(/#admin$/);

    // …l'écran liste les membres (31 comptes, 24 par page) : on cherche
    // pour cibler une ligne précise, ce qui exerce aussi la recherche.
    // On attend la réponse au debounce (250 ms) + fetch avant d'ouvrir le
    // menu : cibler une ligne « déjà visible » pendant que la recherche
    // recharge la liste, c'est se faire démonter le portail sous le clic.
    const search = page.locator('input[placeholder^="Rechercher"]');
    await expect(search).toBeVisible();
    const searched = page.waitForResponse(
      (r) => r.url().includes("/api/admin/users") && r.request().method() === "GET"
    );
    await search.fill("Nour");
    await searched;
    const row = page
      .getByTestId("admin-row")
      .filter({ hasText: "Nour Hassan" });
    await expect(row).toBeVisible();

    // Promotion : on attend la réponse de NOTRE PATCH — jamais le toast
    // pour synchroniser (celui d'une opération précédente peut encore être
    // affiché). Et on vérifie le rôle renvoyé par le serveur, pas seulement
    // la valeur optimiste du sélecteur.
    const patchResponse = () =>
      page.waitForResponse(
        (r) =>
          r.request().method() === "PATCH" &&
          r.url().includes("/api/admin/users/")
      );

    const promoted = patchResponse();
    await row.getByRole("combobox").click();
    await page.getByRole("option", { name: "Modérateur", exact: true }).click();
    const promotedRes = await promoted;
    expect(promotedRes.status()).toBe(200);
    expect((await promotedRes.json()).user.role).toBe("moderator");
    await expect(page.getByText("Rôle mis à jour.").first()).toBeVisible();
    await expect(row.getByRole("combobox")).toContainText("Modérateur");

    // Restauration — la base repart comme elle est entrée. Idem : on attend
    // la réponse de ce PATCH précis avant de conclure, sinon le test peut
    // se terminer sur la valeur optimiste pendant que la requête est encore
    // en vol (et avortée à la fermeture du contexte).
    const restored = patchResponse();
    await row.getByRole("combobox").click();
    await page.getByRole("option", { name: "Membre", exact: true }).click();
    const restoredRes = await restored;
    expect(restoredRes.status()).toBe(200);
    expect((await restoredRes.json()).user.role).toBe("member");
    await expect(row.getByRole("combobox")).toContainText("Membre");
  });
});
