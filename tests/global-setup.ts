import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Nettoie `prisma/dev.db` avant toute la suite de tests pour garantir un
 * état déterministe. Vitest l'exécute une seule fois par `npm test`.
 * `--skip-seed` évite de relancer prisma/seed.ts ici (les données de démo
 * sont insérées par `tests/seed.test.ts`, qui laisse la base remplie → la
 * démo reste utilisable après `npm test`).
 *
 * Le CLI Prisma est résolu directement et exécuté avec `process.execPath` :
 * plus besoin de `npx`, qui échoue sous Windows (ENOENT) et ralentit la CI.
 */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db" };
  const prismaCli = require.resolve("prisma/build/index.js");
  execFileSync(
    process.execPath,
    [prismaCli, "migrate", "reset", "--force", "--skip-generate", "--skip-seed"],
    {
      cwd: process.cwd(),
      env,
      timeout: 300000,
      stdio: "inherit",
    },
  );
}
