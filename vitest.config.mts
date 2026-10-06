import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Configuration des tests unitaires (J7).
 *
 * Deux choix :
 * - **`@` → `src/`** : mêmes alias que `tsconfig.json`, sinon les tests
 *   testeraient un chemin que le code applicatif n'utilise jamais.
 * - **`tests/` hors de `src/`** : aucun fichier de test n'est routé par
 *   Next, et `next build` ne les embarque pas dans les bundles.
 *
 * Aucun test n'importe `lib/db` — la suite ne touche donc ni au
 * `dev.db` de développement ni au seed. Elle tourne en `node`, sans
 * DOM : tout ce qui est testé est de la logique pure (hash, validation,
 * sélection Prisma, rate limiting).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Un échec silencieux de la suite passerait pour un succès en CI.
    passWithNoTests: false,
  },
});
