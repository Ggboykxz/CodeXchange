import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Garde-fou RSC : les props passées d'un composant **serveur** à un composant
 * **client** doivent être sérialisables. Passer une fonction fait planter la
 * page entière au rendu (erreur React #441 « Functions cannot be passed
 * directly to Client Components »), avec une page d'erreur à la place du
 * contenu — bug vécu le 16/10 sur `/forum/[id]` et `/messagerie?avec=…`.
 *
 * Ce test scanne `src/` :
 *  1. il repère les fichiers client (`"use client"`) et les noms qu'ils exportent ;
 *  2. dans les fichiers serveur, il cherche les props écrites en fonction
 *     (`={… => …}`, `={function …}`, `={async …}`) dont le composant englobant
 *     est un composant client → échec.
 *
 * Limite assumée : une référence à une fonction définie plus haut
 * (`prop={maFonction}`) n'est pas détectée ; la règle interne est d'écrire les
 * props en données sérialisables, jamais en fonctions.
 */

function* fichiersTsx(dir: string): Generator<string> {
  for (const nom of readdirSync(dir)) {
    const chemin = join(dir, nom);
    if (statSync(chemin).isDirectory()) yield* fichiersTsx(chemin);
    else if (chemin.endsWith(".tsx")) yield chemin;
  }
}

const TOUS = [...fichiersTsx("src")];
const lire = (f: string) => readFileSync(f, "utf8");
const estClient = (f: string) => lire(f).slice(0, 500).includes("use client");

/** Noms de composants exportés par les fichiers client. */
function nomsComposantsClient(): Set<string> {
  const noms = new Set<string>();
  for (const f of TOUS.filter(estClient)) {
    const source = lire(f);
    for (const m of source.matchAll(/export\s+(?:default\s+)?(?:async\s+)?function\s+([A-Z]\w*)/g)) {
      noms.add(m[1]!);
    }
    for (const m of source.matchAll(/export\s+(?:default\s+)?const\s+([A-Z]\w*)/g)) {
      noms.add(m[1]!);
    }
  }
  return noms;
}

type Violation = { fichier: string; ligne: number; composant: string; prop: string };

/** Cherche les props-fonctions passées à un composant client depuis un fichier serveur. */
function violations(): Violation[] {
  const clients = nomsComposantsClient();
  const trouvees: Violation[] = [];
  for (const f of TOUS) {
    if (estClient(f)) continue;
    const source = lire(f);
    for (const m of source.matchAll(/([a-zA-Z]\w*)=\{([^}\n]*=>[^}\n]*)\}/g)) {
      const avant = source.slice(Math.max(0, (m.index ?? 0) - 500), m.index);
      const tags = [...avant.matchAll(/<([A-Z]\w*)/g)];
      const composant = tags.length ? tags[tags.length - 1]![1]! : "";
      if (!clients.has(composant)) continue;
      trouvees.push({
        fichier: f,
        ligne: source.slice(0, m.index).split("\n").length,
        composant,
        prop: m[1]!,
      });
    }
  }
  return trouvees;
}

describe("garde-fou RSC (props sérialisables)", () => {
  test("le scan voit bien le code client (pas de test vacue)", () => {
    const clients = nomsComposantsClient();
    expect(clients.size).toBeGreaterThan(20);
    expect(clients.has("ArbreReponses")).toBe(true);
    expect(clients.has("FormulaireMessage")).toBe(true);
  });

  test("aucune fonction passée d'un composant serveur à un composant client", () => {
    const liste = violations();
    const lisible = liste.map((v) => `${v.fichier}:${v.ligne} <${v.composant} ${v.prop}>`).join("\n");
    expect(lisible, `Props-fonctions interdites (sérialisation RSC) :\n${lisible}`).toBe("");
  });
});
