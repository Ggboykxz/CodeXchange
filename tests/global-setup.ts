import { execFileSync } from "node:child_process";

/**
 * Nettoie `prisma/dev.db` avant toute la suite de tests pour garantir un
 * état déterministe. Vitest l'exécute une seule fois par `npm test`.
 * `--skip-seed` évite de relancer prisma/seed.ts ici (les données de démo
 * sont insérées par `tests/seed.test.ts`, qui laisse la base remplie → la
 * démo reste utilisable après `npm test`).
 */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db" };
  execFileSync("npx", ["prisma", "migrate", "reset", "--force", "--skip-generate", "--skip-seed"], {
    cwd: process.cwd(),
    env,
    timeout: 300000,
    stdio: "inherit",
  });
}
