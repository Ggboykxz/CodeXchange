import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    // SQLite : on évite les verrous en exécutant les fichiers de test en série.
    fileParallelism: false,
    reporters: ["default"],
  },
});
