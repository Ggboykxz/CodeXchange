import { test, expect } from "playwright/test";

/**
 * I2 — messagerie privée, vérifiée de bout en bout :
 *  - le visiteur non connecté voit un refus net (pas une page vide) ;
 *  - Aïcha écrit à Kwame depuis son profil → le fil s'ouvre, le message
 *    apparaît ;
 *  - Kwame voit la conversation avec la pastille d'inédit, l'ouvre →
 *    marquage lu automatique ;
 *  - Aïcha supprime son message → la conversation repart exactement
 *    d'où elle venait (aucun résidu : l'E2E rend la base intacte, même
 *    en cas d'échec via `finally`).
 */

const DEMO_PW = "codexchange2026";
const AICHA = "aicha.diallo@codexchange.dev";
const KWAME = "kwame.mensah@codexchange.dev";
const KWAME_USERNAME = "kwame.codes";
const BODY = "Salut Kwame, test I2.";

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

test.describe("Messagerie privée (I2)", () => {
  test("refuse le visiteur non connecté", async ({ page }) => {
    await page.goto("/#messages");
    await expect(
      page.getByText("Connecte-toi pour lire tes messages.")
    ).toBeVisible();
    // Deux boutons « Connexion » (header + carte) : le premier suffit,
    // les deux ouvrent la même modale.
    await expect(
      page.getByRole("button", { name: "Connexion" }).first()
    ).toBeVisible();
  });

  test("envoi, réception, marquage lu, suppression (base intacte)", async ({
    browser,
  }) => {
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();

    try {
      /* --- Aïcha : envoie depuis le profil public de Kwame --- */
      await login(a, AICHA, DEMO_PW);
      await a.goto(`/#annuaire/${KWAME_USERNAME}`);
      await a.getByRole("button", { name: "Envoyer un message" }).click();
      await expect(a).toHaveURL(/#messages\//);

      const box = a.getByLabel("Écrire un message…");
      await box.fill(BODY);
      await a.getByRole("button", { name: "Envoyer" }).click();
      await expect(
        a.getByTestId("thread-messages").getByText(BODY)
      ).toBeVisible();

      /* --- Kwame : la conversation arrive avec la pastille --- */
      await login(b, KWAME, DEMO_PW);
      await b.goto("/#messages");
      const row = b.getByTestId("conv-list").locator("li").first();
      await expect(row).toContainText("Aïcha Diallo");
      await expect(row.locator('[aria-label="1"]')).toBeVisible();

      await row.click();
      await expect(
        b.getByTestId("thread-messages").getByText(BODY)
      ).toBeVisible();
      // Ouverture du fil = lecture : la pastille disparaît d'elle-même.
      await expect(row.locator('[aria-label="1"]')).toHaveCount(0);

      /* --- Aïcha : supprime son message (retour à l'état initial) --- */
      await a.getByTestId("thread-messages").getByLabel("Supprimer").click();
      await expect(
        a.getByTestId("thread-messages").getByText(BODY)
      ).toHaveCount(0);
      // La conversation entière a disparu (message supprimé → conv vidée
      // → masquée de la liste) : on retrouve l'état initial du départ.
      await expect(
        a.getByText("Aucune conversation pour l'instant.")
      ).toBeVisible();
    } finally {
      // Filet de sécurité : même en cas d'échec plus haut, aucun message
      // de test ne survit dans la base (local comme production).
      try {
        const prof = await ctxA.request.get(`/api/profiles/${KWAME_USERNAME}`);
        const peerId = (await prof.json()).profile.userId;
        const th = await ctxA.request.get(`/api/messages/thread?peer=${peerId}`);
        const data = await th.json();
        for (const m of data.messages ?? []) {
          if (String(m.body).startsWith(BODY)) {
            await ctxA.request.delete(`/api/messages/${m.id}`);
          }
        }
      } catch {
        /* le nettoyage best-effort ne doit jamais masquer l'assertion */
      }
      await ctxA.close();
      await ctxB.close();
    }
  });

  test("réception en temps réel sans rechargement (SSE, I3)", async ({
    browser,
  }) => {
    // Le sondage serveur pousse toutes les 8 s : 20 s laissent une
    // large marge (connexion EventSource + rafraîchissement du fil).
    test.setTimeout(60_000);
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    const a = await ctxA.newPage();
    const b = await ctxB.newPage();
    const body = "Temps réel, zéro rechargement.";

    try {
      /* --- Kwame ouvre SON fil vers Aïcha AVANT tout envoi --- */
      await login(b, KWAME, DEMO_PW);
      const profA = await b.request.get("/api/profiles?limit=50");
      const aichaId = (
        (await profA.json()).profiles as Array<{ userId: string; username: string }>
      ).find((p) => p.username === "aicha.dev")!.userId;
      await b.goto(`/#messages/${aichaId}`);
      await expect(b.getByLabel("Écrire un message…")).toBeVisible();

      /* --- Aïcha envoie : le fil de Kwame se remplit SANS action --- */
      await login(a, AICHA, DEMO_PW);
      const profK = await a.request.get("/api/profiles?limit=50");
      const kwameId = (
        (await profK.json()).profiles as Array<{ userId: string; username: string }>
      ).find((p) => p.username === KWAME_USERNAME)!.userId;
      await a.goto(`/#messages/${kwameId}`);
      await expect(a.getByLabel("Écrire un message…")).toBeVisible();

      await a.getByLabel("Écrire un message…").fill(body);
      await a.getByRole("button", { name: "Envoyer" }).click();
      await expect(
        a.getByTestId("thread-messages").getByText(body)
      ).toBeVisible();

      // Aucun rechargement ni clic côté Kwame : SSE → évènement `cx:message`
      // → rechargement du fil ouvert.
      await expect(
        b.getByTestId("thread-messages").getByText(body)
      ).toBeVisible({ timeout: 20_000 });
    } finally {
      try {
        // Seul Aïcha a envoyé : nettoyage depuis sa session vers Kwame.
        const prof = await ctxA.request.get(`/api/profiles/${KWAME_USERNAME}`);
        const peerId = (await prof.json()).profile.userId;
        const th = await ctxA.request.get(`/api/messages/thread?peer=${peerId}`);
        const data = await th.json();
        for (const m of data.messages ?? []) {
          if (String(m.body).startsWith(body)) {
            await ctxA.request.delete(`/api/messages/${m.id}`);
          }
        }
      } catch {
        /* nettoyage best-effort */
      }
      await ctxA.close();
      await ctxB.close();
    }
  });
});
