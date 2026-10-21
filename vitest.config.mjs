import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const { BaseSequencer } = await import("vitest/node");

  class LexicalSequencer extends BaseSequencer {
    async sort(files) {
      return [...files].sort((a, b) =>
        String(a.moduleId).localeCompare(String(b.moduleId)),
      );
    }
  }

  return {
    esbuild: {
      jsx: "automatic",
    },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    test: {
      globalSetup: "tests/global-setup.ts",
      environment: "node",
      // La CI fournit DATABASE_URL ; en local, on retombe sur la base SQLite
      // éphémère pour que `npm test` fonctionne sans `.env`.
      env: { DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db" },
      setupFiles: ["tests/setup-dom.ts"],
      // Les tests d'intégration Prisma peuvent dépasser les 5 s par défaut
      // sur un runner froid ou chargé (le seed prend ~15-20 s).
      testTimeout: 60000,
      hookTimeout: 60000,
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      fileParallelism: false,
      sequence: { sequencer: LexicalSequencer },
      reporters: ["default"],
    },
  };
});
