import { prisma } from "../src/lib/db";
import { runSeed } from "../src/lib/seed";

runSeed(prisma)
  .then((r) => {
    console.log("[seed] terminé :", JSON.stringify(r));
  })
  .catch((e) => {
    console.error("[seed] échec :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
