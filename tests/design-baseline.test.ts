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
    // Toute unité vh non dynamique : classe `h-screen` ou valeur arbitraire
    // `100vh` (le (?<!d) exclut `dvh`/`100dvh`).
    const VH_NON_DYNAMIQUE = /\bh-screen\b|(?<!d)\d+vh\b/;
    const contrevenants = fichiersSrc().filter((f) => VH_NON_DYNAMIQUE.test(lire(f)));
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
    // Classe `fixed` entière ou avec variante (`focus:fixed`, `md:fixed`…) :
    // l'élément est (au moins sous cette condition) positionné fixed → doit
    // respecter la safe-area. Le skip-link (`focus:fixed`) est le cas concret.
    const EST_FIXED = /(^|:)fixed$/;
    const contrevenants: string[] = [];
    for (const f of fichiersSrc()) {
      const contenu = lire(f);
      const classNames = [
        ...contenu.matchAll(/className="([^"]*)"/g),
        ...contenu.matchAll(/className=\{`([^`]*)`\}/g),
      ].map((m) => m[1] ?? "");
      const aFixed = classNames.some((cn) => cn.split(/\s+/).some((c) => EST_FIXED.test(c)));
      if (aFixed && !/safe-area/.test(contenu)) contrevenants.push(f);
    }
    expect(contrevenants).toEqual([]);
  });
});

describe("design baseline — aplats", () => {
  test("aucun dégradé", () => {
    // La baseline proscrit les dégradés de couleur : fonds unis `cx-*`.
    // `bg-gradient-*`, `from-cx-*`/`to-cx-*` n'ont d'autre usage qu'un dégradé, et
    // `linear-gradient` attrape les inline (`style={{ backgroundImage }}`).
    // `radial-gradient(...1px...)` reste permis : motif de points, pas une couleur.
    // Exception documentée (ruling) : les images de prévisualisation sociale
    // (`**/opengraph-image.tsx`) sont des visuels générés, pas de l'UI.
    const DEGRADE = /bg-gradient|from-cx-|to-cx-|linear-gradient/;
    const HORS_UI = /opengraph-image\.tsx$/;
    const contrevenants = fichiersSrc().filter((f) => !HORS_UI.test(f) && DEGRADE.test(lire(f)));
    expect(contrevenants).toEqual([]);
  });
});

describe("design baseline — accessibilité des icônes", () => {
  test("boutons icône seuls avec aria-label", () => {
    // Un `<button>` dont le contenu n'est qu'une icône (aucun texte visible)
    // doit porter un `aria-label` (ou un équivalent `sr-only`) : sans lui,
    // un lecteur d'écran n'annonce rien.
    const clandestins: string[] = [];
    for (const f of fichiersSrc()) {
      const contenu = lire(f);
      // Chaque `<button …>` puis son corps jusqu'à `</button>` (fenêtre large).
      for (const m of contenu.matchAll(/<button\b([^>]*)>([\s\S]{0,320}?)<\/button>/g)) {
        const props = m[1] ?? "";
        const corps = m[2] ?? "";
        const aUneIcone = /<Icone\b|<IconeAnimee\b|<svg\b/.test(corps);
        if (!aUneIcone) continue;
        // Texte visible : au moins 3 lettres hors balises et hors commentaires.
        const texte = corps
          .replace(/<!--[\s\S]*?-->/g, "")
          .replace(/<[^>]*>/g, " ")
          .trim();
        if (/[A-Za-zÀ-ÿ]{3,}/.test(texte)) continue;
        if (/aria-label=|aria-labelledby=|sr-only/.test(props)) continue;
        clandestins.push(`${f} (${texte.slice(0, 20) || "sans texte"})`);
      }
    }
    expect(clandestins).toEqual([]);
  });
});

describe("design baseline — typographie", () => {
  const css = lire("src/app/globals.css");

  test("balance-pretty", () => {
    // Titres équilibrés (`text-wrap: balance`) et paragraphes sans orphelin
    // sur la dernière ligne (`text-wrap: pretty`) en règle de base.
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("text-wrap: pretty");
  });

  test("tabular-nums", () => {
    // Chiffres de largeur fixe pour les données alignées (`time`, `[data-numeric]`).
    expect(css).toContain("tabular-nums");
  });
});

describe("design baseline — primitives interactives", () => {
  test("aucun disclosure maison (<details>/<summary>)", () => {
    // Les surfaces dépliables passent par Base UI (menu, popover, dialogue) :
    // aucun `<details>`/`<summary>` interactif ne doit subsister dans `src/`.
    const BALISE = /<(details|summary)[\s>]/;
    const contrevenants = fichiersSrc().filter((f) => BALISE.test(lire(f)));
    expect(contrevenants).toEqual([]);
  });

  test("les composants interactifs du header sont client et sur Base UI", () => {
    // Garde-fou d'architecture : menu utilisateur et recherche ne réimplémentent
    // pas l'ancrage/le clavier à la main (enveloppes `ui/menu` et `ui/popover`).
    expect(lire("src/components/dropdown.tsx")).toContain("@/components/ui/menu");
    expect(lire("src/components/recherche-dropdown.tsx")).toContain("@/components/ui/popover");
    expect(lire("src/components/confirm-dialog.tsx")).toContain("@/components/ui/dialog");
  });
});

describe("design baseline — mouvement", () => {
  test("aucune durée de transition > 200 ms", () => {
    // Le retour visuel doit rester sous 200 ms (perception « instantanée »).
    // Les animations `@keyframes` décoratives (entrée, tracé d'icône) ne sont
    // pas concernées : ce sont des animations, pas des transitions, et elles
    // sont désactivées par `prefers-reduced-motion`.
    const DUREE = /\bduration-(\d+)\b|duration-\[(\d+)ms\]/g;
    const contrevenants: string[] = [];
    for (const f of fichiersSrc()) {
      for (const m of lire(f).matchAll(DUREE)) {
        const ms = Number(m[1] ?? m[2]);
        // `duration-150` = 150 ms (Tailwind) ; `duration-[120ms]` = ms directes.
        if (ms > 200) contrevenants.push(`${f} : duration-${m[1] ?? `[${m[2]}ms]`}`);
      }
    }
    expect(contrevenants).toEqual([]);
  });

  test("aucune propriété de layout animée", () => {
    // Seuls `transform` et `opacity` sont animés (pas de reflow par frame) :
    // ni `transition-all`, ni transition sur width/height/margin/padding/inset.
    const INTERDIT = /\btransition-all\b|\btransition-\[(width|height|margin|padding|top|left|right|bottom)\b/;
    const contrevenants = fichiersSrc().filter((f) => INTERDIT.test(lire(f)));
    expect(contrevenants).toEqual([]);

    // La règle globale de `globals.css` liste elle aussi des propriétés sûres.
    const css = lire("src/app/globals.css");
    const bloc = /transition-property:\s*([^;]+);/.exec(css);
    expect(bloc).not.toBeNull();
    const proprietes = (bloc?.[1] ?? "").split(",").map((p) => p.trim());
    for (const interdite of ["width", "height", "margin", "padding", "top", "left"]) {
      expect(proprietes).not.toContain(interdite);
    }
    expect(proprietes).toContain("transform");
    expect(proprietes).toContain("opacity");
  });
});
