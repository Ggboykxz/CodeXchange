/**
 * B1 — mesure du poids du bundle initial en CI.
 *
 * Vérifie que les chunks nécessaires au premier chargement (rootMainFiles
 * du build-manifest Next.js — React, runtime, layout partagé) restent sous
 * la limite. Sans ce garde-fou, un import trop lourd ou un découpage
 * oublié fausse la première charge de chaque visiteur, et personne ne
 * s'en rend compte tant qu'on n'est pas en prod.
 *
 * La mesure porte sur la **compression gzip**, au plus proche du poids
 * réellement transféré sur le réseau. Le CDC vise < 150 Ko compressé.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const manifestPath = join(process.cwd(), ".next", "build-manifest.json");
const MAX_GZIP_KB = 150; // objectif CDC : < 150 Ko compressé

if (!existsSync(manifestPath)) {
  console.error("❌ .next/build-manifest.json introuvable — lance `next build` d'abord.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const files: string[] = manifest.rootMainFiles ?? [];

let totalGz = 0;
const rows: Array<{ file: string; gz: number }> = [];

for (const file of files) {
  const fullPath = join(process.cwd(), ".next", file);
  if (!existsSync(fullPath)) continue;
  const gz = gzipSync(readFileSync(fullPath)).length;
  totalGz += gz;
  rows.push({ file: file.replace("static/chunks/", ""), gz });
}

console.log("\n📦 Bundle initial (rootMainFiles, gzip) :\n");
for (const r of rows) {
  console.log(`   ${(r.gz / 1024).toFixed(1)} Ko  ${r.file}`);
}

console.log(`\n   Total : ${(totalGz / 1024).toFixed(1)} Ko gzip (${rows.length} chunks)`);

if (totalGz > MAX_GZIP_KB * 1024) {
  console.error(`\n❌ Dépassement : ${(totalGz / 1024).toFixed(1)} Ko > ${MAX_GZIP_KB} Ko (limite CDC)`);
  process.exit(1);
}

console.log(`\n✅ Sous la limite CDC de ${MAX_GZIP_KB} Ko\n`);
