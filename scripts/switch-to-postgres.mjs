import fs from "node:fs";
import process from "node:process";

const p = "prisma/schema.prisma";
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("ERREUR: variable DATABASE_URL absente pour le build.");
  console.error("Configure-la dans Vercel → Settings → Environment Variables (scope Production).");
  process.exit(2);
}
if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  console.error("ERREUR: DATABASE_URL doit commencer par postgresql:// ou postgres://");
  process.exit(2);
}
const contenu = fs.readFileSync(p, "utf8");
fs.writeFileSync(p, contenu.replace('provider = "sqlite"', 'provider = "postgresql"'), "utf8");
console.log("Provider basculé en PostgreSQL et DATABASE_URL détectée.");
