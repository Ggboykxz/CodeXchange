import { test, expect } from "playwright/test";

/**
 * I5 — la newsletter n'est plus une coquille : le formulaire du footer
 * appelle réellement `POST /api/newsletter` (réponse identique que
 * l'adresse soit neuve ou déjà abonnée — donc adresse fixe ici, sans
 * accumulation), et un lien de désinscription à jeton invalide remonte
 * un toast dont l'URL est nettoyée derrière.
 */

test.describe("Newsletter", () => {
  test("s'abonner depuis le footer écrit et confirme", async ({ page }) => {
    await page.goto("/");
    const input = page.locator('footer input[type="email"]');
    await input.scrollIntoViewIfNeeded();
    await input.fill("nl-e2e@codexchange.dev");
    await page.locator('footer button[type="submit"]').click();
    await expect(
      page.getByText("C'est fait. On revient vers toi.").first()
    ).toBeVisible();
  });

  test("jeton de désinscription invalide → toast d'erreur, URL nettoyée", async ({ page }) => {
    await page.goto("/api/newsletter/unsubscribe?token=deadbeef");
    // Redirigé vers /?nl=error, puis le paramètre est retiré au montage.
    await expect(page.getByText("Lien de désinscription invalide").first()).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });
});
