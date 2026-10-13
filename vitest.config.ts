import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que `tsconfig.json` (`@/*` → `src/*`) pour importer les route handlers.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // SQLite : on évite les verrous en exécutant les fichiers de test en série.
    fileParallelism: false,
    reporters: ["default"],
  },
});
