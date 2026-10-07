import { defineConfig, devices } from "playwright/test";

/**
 * Config des tests E2E Playwright (J7).
 *
 * - **CI (`CI=1`)** : on démarre le build de production `next start` sur le
 *   port 3100 (généré par `bun run build` dans le workflow), après avoir seed
 *   la base Postgres du service — puis on exécute toute la suite.
 * - **Local** : on réutilise le serveur déjà lancé sur 3116 (`BASE_URL`
 *   surchargeable, ex. `BASE_URL=http://127.0.0.1:3116`).
 *
 * Le dossier tests/e2e n'utilise pas l'extension `.test.ts` : vitest
 * (limité aux fichiers tests en `.test.ts`) n'y touche donc pas, seul
 * Playwright le lit.
 */
const isCI = Boolean(process.env.CI);
const usePort = Number(process.env.E2E_PORT ?? 3100);
// NB : on préfère `localhost` à `127.0.0.1` — sur certains hosts le dev
// bind IPv6 (::1) et `127.0.0.1` résout sur un autre socket.
const BASE_URL =
  process.env.BASE_URL ??
  (isCI ? `http://localhost:${usePort}` : `http://localhost:3116`);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [["github"], ["list"]]
    : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    viewport: { width: 1280, height: 900 },
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Sur CI on exécute via le build de production ; en local on suppose le
  // serveur de dev déjà lancé sur BASE_URL.
  webServer: isCI
    ? {
        command: `npx next start -p ${usePort}`,
        url: `http://localhost:${usePort}`,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
