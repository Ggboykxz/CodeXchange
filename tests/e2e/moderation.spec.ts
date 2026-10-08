import { test, expect } from "playwright/test";

/**
 * M1 — modération : un membre signale un fil, l'admin le voit dans
 * l'onglet Signalements de l'admin, le résout avec une note, et
 * l'action apparaît dans le journal de modération.
 */

const PW = process.env.ADMIN_E2E_PASSWORD ?? "codexchange2026";
const DEMO_PW = "codexchange2026";
const AICHA = "aicha.diallo@codexchange.dev";
const ADMIN = "admin@codexchange.dev";

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

test.describe("Modération (M1)", () => {
  test("signalement d'un fil + résolution admin + journal", async ({
    browser,
  }) => {
    test.setTimeout(60_000);
    const ctxA = await browser.newContext();
    const ctxAdmin = await browser.newContext();
    const a = await ctxA.newPage();
    const admin = await ctxAdmin.newPage();

    try {
      /* --- Aïcha signale un fil --- */
      await login(a, AICHA, DEMO_PW);
      await a.goto("/forum");
      // Ouvre le premier fil de la liste (lien de titre)
      await a.locator('a[href^="/forum/"]').first().click();
      await expect(a).toHaveURL(/forum\//);
      // Menu ⋯ → Signaler
      await a.getByRole("button", { name: "Plus d'actions" }).click();
      await a.getByRole("menuitem", { name: "Signaler" }).click();
      // Dialog de signalement
      await expect(a.getByText("Signaler ce contenu")).toBeVisible();
      await a.getByRole("button", { name: "Spam" }).click();
      await a.getByLabel("Détails (optionnel)").fill("Contenu de spam évident.");
      await a.getByRole("button", { name: "Envoyer le signalement" }).click();
      await expect(a.getByText("Signalement envoyé. Merci !")).toBeVisible();

      /* --- Admin : onglet Signalements --- */
      await login(admin, ADMIN, PW);
      await admin.goto("/admin");
      await admin.getByRole("tab", { name: "Signalements" }).click();
      const reportCard = admin.getByText("Contenu de spam évident.");
      await expect(reportCard).toBeVisible();
      // Résoudre avec une note
      await admin.getByRole("button", { name: "Résoudre" }).first().click();
      await admin
        .getByPlaceholder("Note de résolution…")
        .fill("Contenu supprimé, avertissement donné.");
      await admin.getByRole("button", { name: "Résoudre" }).last().click();
      await expect(admin.getByText("Signalement résolu.")).toBeVisible();

      /* --- Admin : onglet Journal --- */
      await admin.getByRole("tab", { name: "Journal" }).click();
      await expect(admin.getByText("Signalement résolu")).toBeVisible();
    } finally {
      /* Nettoyage : supprimer le signalement de test */
      try {
        const reports = await ctxAdmin.request.get("/api/reports?status=all&pageSize=50");
        const data = await reports.json();
        for (const r of data.reports ?? []) {
          if (String(r.details).includes("Contenu de spam évident.")) {
            await ctxAdmin.request.delete(`/api/reports/${r.id}`);
          }
        }
      } catch {
        /* best-effort */
      }
      await ctxA.close();
      await ctxAdmin.close();
    }
  });
});
