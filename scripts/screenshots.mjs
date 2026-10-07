#!/usr/bin/env node
/**
 * E5 — Génère les captures du README depuis le build de production.
 *
 * Usage :
 *   npm run build && node scripts/screenshots.mjs
 *
 * Lance `next start` sur un port éphémère, capture les sections clés
 * (accueil, forum, fiche question avec rail de vote, jobs, projets,
 * tutos, annuaire) en 1280 px, puis écrit `docs/screenshots/<nom>.png`.
 */
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.SS_PORT || 3118);
const BASE = `http://localhost:${PORT}`;
const OUT = path.join(ROOT, "docs", "screenshots");
mkdirSync(OUT, { recursive: true });

function server() {
  const p = spawn("npx", ["next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
  });
  return p;
}

async function waitReady(timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE + "/api/threads?limit=1");
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error("server not ready");
}

const SECTIONS = [
  ["accueil — le fil", "/", "home"],
  ["forum", "/#forum", "forum"],
  ["fiche question (rail de vote)", null, "question"],
  ["jobs", "/#jobs", "jobs"],
  ["projets", "/#projects", "projects"],
  ["tutos & events", "/#tutos", "tutos"],
  ["annuaire", "/#annuaire", "annuaire"],
];

const srv = server();
try {
  await waitReady();
  const list = await (await fetch(BASE + "/api/threads?limit=1")).json();
  const slug = list?.threads?.[0]?.slug;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const [label, route, name] of SECTIONS) {
    const url = route === null ? `/#forum/${slug}` : route;
    await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
    console.log("✅", name, "—", label);
  }
  await browser.close();
} finally {
  try { process.kill(-srv.pid, "SIGTERM"); } catch { srv.kill("SIGTERM"); }
}
console.log("Captures écrites dans docs/screenshots/");
