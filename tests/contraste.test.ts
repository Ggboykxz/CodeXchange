// Contraste WCAG 2.1 des tokens du design system (`src/app/globals.css`).
//
// Règles verrouillées :
// - texte : ratio >= 4,5:1 (AA) — paires fg/card/muted, tokens `*-fg` sur leur fond,
//   et texte coloré sur les fonds teintés des états (`primary/5`, `accent/5`…) ;
// - interface : ratio >= 3:1 — bordures des champs (`--cx-border-fort`) et
//   anneau de focus (`--cx-ring`) sur fond et carte ;
// - les deux thèmes (clair et sombre) sont vérifiés séparément.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const CSS = readFileSync(`${RACINE}src/app/globals.css`, "utf8");

/** Lit les tokens `--cx-*` d'un bloc de thème (`:root` ou `:root[data-theme="dark"]`). */
function lireTokens(selecteur: string): Record<string, string> {
  const echappe = selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bloc = new RegExp(`${echappe}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(CSS);
  if (!bloc) throw new Error(`Bloc de thème introuvable : ${selecteur}`);
  const tokens: Record<string, string> = {};
  for (const m of bloc[1].matchAll(/(--cx-[a-z-]+):\s*(#[0-9a-fA-F]{6});/g)) {
    tokens[m[1]] = m[2].toLowerCase();
  }
  return tokens;
}

type Rgb = [number, number, number];

function versRgb(hex: string): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

/** Luminance relative WCAG 2.1. */
function luminance([r, g, b]: Rgb): number {
  const canal = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function ratio(a: Rgb, b: Rgb): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Compose une couleur semi-transparente (opacité 0-1) sur un fond opaque. */
function composer(dessus: Rgb, dessous: Rgb, alpha: number): Rgb {
  return dessus.map((v, i) => Math.round(v * alpha + dessous[i] * (1 - alpha))) as Rgb;
}

function nommer(hex: string): string {
  return hex;
}

const CLAIR = lireTokens(":root");
const SOMBRE = lireTokens(':root[data-theme="dark"]');

const THEMES: Array<[string, Record<string, string>]> = [
  ["clair", CLAIR],
  ["sombre", SOMBRE],
];

/** Paires de texte : [token texte, token fond, description]. */
const PAIRES_TEXTE: Array<[string, string]> = [
  ["--cx-fg", "--cx-bg"],
  ["--cx-fg", "--cx-card"],
  ["--cx-fg", "--cx-muted"],
  ["--cx-card-fg", "--cx-card"],
  ["--cx-card-fg", "--cx-muted"],
  ["--cx-muted-fg", "--cx-bg"],
  ["--cx-muted-fg", "--cx-card"],
  ["--cx-muted-fg", "--cx-muted"],
  ["--cx-primary-fg", "--cx-primary"],
  ["--cx-secondary-fg", "--cx-secondary"],
  ["--cx-accent-fg", "--cx-accent"],
  ["--cx-destructive-fg", "--cx-destructive"],
  ["--cx-success-fg", "--cx-success"],
  ["--cx-warning-fg", "--cx-warning"],
];

/** Paires d'interface : [token, fond] — 3:1 minimum. */
const PAIRES_INTERFACE: Array<[string, string]> = [
  ["--cx-border-fort", "--cx-bg"],
  ["--cx-border-fort", "--cx-card"],
  ["--cx-ring", "--cx-bg"],
  ["--cx-ring", "--cx-card"],
];

/** États teintés : texte du même nom sur `token/5` posé sur bg et card. */
const ETATS: Array<[string, string]> = [
  ["--cx-primary", "--cx-primary"],
  ["--cx-accent", "--cx-accent"],
  ["--cx-success", "--cx-success"],
  ["--cx-destructive", "--cx-destructive"],
];

describe("contraste — texte (AA 4,5:1)", () => {
  for (const [theme, tokens] of THEMES) {
    test(`thème ${theme}`, () => {
      const fautifs: string[] = [];
      for (const [texte, fond] of PAIRES_TEXTE) {
        const r = ratio(versRgb(tokens[texte]), versRgb(tokens[fond]));
        if (r < 4.5) {
          fautifs.push(
            `${nommer(tokens[texte])} sur ${nommer(tokens[fond])} = ${r.toFixed(2)}:1 (${theme})`,
          );
        }
      }
      expect(fautifs).toEqual([]);
    });
  }
});

describe("contraste — interface (3:1)", () => {
  for (const [theme, tokens] of THEMES) {
    test(`thème ${theme}`, () => {
      const fautifs: string[] = [];
      for (const [dessus, fond] of PAIRES_INTERFACE) {
        const r = ratio(versRgb(tokens[dessus]), versRgb(tokens[fond]));
        if (r < 3) {
          fautifs.push(
            `${nommer(tokens[dessus])} sur ${nommer(tokens[fond])} = ${r.toFixed(2)}:1 (${theme})`,
          );
        }
      }
      expect(fautifs).toEqual([]);
    });
  }
});

describe("contraste — états teintés (AA 4,5:1)", () => {
  for (const [theme, tokens] of THEMES) {
    test(`thème ${theme}`, () => {
      const fautifs: string[] = [];
      for (const [texte, teinte] of ETATS) {
        const couleur = versRgb(tokens[texte]);
        for (const fond of ["--cx-bg", "--cx-card"] as const) {
          const melange = composer(couleur, versRgb(tokens[fond]), 0.05);
          const r = ratio(couleur, melange);
          if (r < 4.5) {
            fautifs.push(
              `${nommer(tokens[texte])} sur ${nommer(tokens[teinte])}/5 + ${nommer(tokens[fond])} = ${r.toFixed(2)}:1 (${theme})`,
            );
          }
        }
      }
      expect(fautifs).toEqual([]);
    });
  }
});

describe("contraste — pastilles d'avatar (initiales blanches)", () => {
  test("chaque couleur de la palette porte du texte blanc lisible", () => {
    const source = readFileSync(`${RACINE}src/components/avatar.tsx`, "utf8");
    const palette = [...source.matchAll(/"#([0-9a-fA-F]{6})"/g)].map((m) => `#${m[1]}`.toLowerCase());
    expect(palette.length).toBeGreaterThanOrEqual(6);
    const fautifs: string[] = [];
    for (const hex of palette) {
      const r = ratio(versRgb(hex), [255, 255, 255]);
      if (r < 4.5) fautifs.push(`${hex} = ${r.toFixed(2)}:1`);
    }
    expect(fautifs).toEqual([]);
  });
});
