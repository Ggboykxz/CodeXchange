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
      setupFiles: ["tests/setup-dom.ts"],
      include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
      fileParallelism: false,
      sequence: { sequencer: LexicalSequencer },
      reporters: ["default"],
    },
  };
});
