// Tests de conformité de la baseline design (viewports, échelle z, safe-area).
// Étendus par les lots suivants (A4, A5, B1…) : chaque règle vit dans son
// propre `describe` et les tests sont nommés pour rester lisibles en grandissant.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

/** Racine du projet (tests/ → parent). */
const RACINE = fileURLToPath(new URL("..", import.meta.url));

/** Tous les fichiers .tsx de `src/`, chemins relatifs à la racine du projet. */
function fichiersSrc(): string[] {
  const fichiers: string[] = [];
  function visiter(dossier: string, prefixe: string) {
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
      const chemin = join(dossier, entree.name);
      if (entree.isDirectory()) {
        visiter(chemin, `${prefixe}${entree.name}/`);
      } else if (entree.name.endsWith(".tsx")) {
        fichiers.push(`${prefixe}${entree.name}`);
      }
    }
  }
  visiter(join(RACINE, "src"), "src/");
  return fichiers.sort();
}

function lire(cheminRelatif: string): string {
  return readFileSync(join(RACINE, cheminRelatif), "utf8");
}

describe("design baseline — viewports", () => {
  test("dvh", () => {
    const contrevenants = fichiersSrc().filter((f) => /\bh-screen\b/.test(lire(f)));
    expect(contrevenants).toEqual([]);
  });
});

describe("design baseline — échelle z", () => {
  test("z", () => {
    // Échelle Z de src/lib/design.ts : 0, 10, 20, 30, 40, 50.
    const AUTORISES = new Set(["0", "10", "20", "30", "40", "50"]);
    const contrevenants: string[] = [];
    for (const f of fichiersSrc()) {
      for (const m of lire(f).matchAll(/\bz-(\d+)\b/g)) {
        if (!AUTORISES.has(m[1])) contrevenants.push(`${f} : z-${m[1]}`);
      }
    }
    expect(contrevenants).toEqual([]);
  });
});

describe("design baseline — safe-area", () => {
  test("safe-area", () => {
    // `fixed` en tant que classe entière (pas `focus:fixed` etc.) : l'élément
    // est toujours positionné fixed → doit respecter la safe-area.
    // Le skip-link (focus:fixed, src/app/layout.tsx) est traité en A5.
    const contrevenants: string[] = [];
    for (const f of fichiersSrc()) {
      const contenu = lire(f);
      const classNames = [
        ...contenu.matchAll(/className="([^"]*)"/g),
        ...contenu.matchAll(/className=\{`([^`]*)`\}/g),
      ].map((m) => m[1] ?? "");
      const aFixed = classNames.some((cn) => cn.split(/\s+/).includes("fixed"));
      if (aFixed && !/safe-area/.test(contenu)) contrevenants.push(f);
    }
    expect(contrevenants).toEqual([]);
  });
});
