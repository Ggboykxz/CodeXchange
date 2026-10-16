# CodeXchange — Refonte UI (baseline-ui) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Passer les 31 pages et les 47 composants de CodeXchange au baseline `baseline-ui` : viewports mobiles corrects, safe-areas, échelle z, typo, primitives accessibles Base UI, aucun dégradé, un seul accent par vue — sans régression des 204 tests ni de la démo live.

**Architecture:** Refonte par lots livrables séparément, chacun committé et poussé sur `main` (déploiement Vercel automatique vérifié). Les invariants de design sont verrouillés par un fichier de tests de conformité (`tests/design-baseline.test.ts`) qui grandit lot par lot : chaque règle du skill est d'abord un test rouge, puis le code qui le fait passer. Le look se joue dans les composants partagés (Lot B), les pages (Lot C) héritent.

**Tech Stack:** Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript strict + Vitest (node) + `clsx`/`tailwind-merge` + `@base-ui-components/react`.

**Spec:** `docs/superpowers/specs/2026-10-14-refonte-ui-baseline-design.md`

## Global Constraints

- Deadline **2026-10-25** ; chaque lot = 1 commit minimum, poussé sur `main`, déployé et vérifié (curl + marqueur de build).
- `npx tsc --noEmit`, `npm run lint`, `npm test` (204/204) et `npm run build` **verts** à la fin de chaque lot.
- UI et copy **en français** ; toute nouvelle chaîne en FR uniquement (`t()` retombe sur FR puis la clé, jamais de clé brute).
- Thèmes clair **et** sombre : contraste WCAG AA **4,5:1** pour le texte, **3:1** pour les bordures/focus.
- Aucune nouvelle route, aucun changement de modèle Prisma ou d'API.
- Dépendances autorisées : `clsx`, `tailwind-merge`, `@base-ui-components/react`. Rien d'autre.
- Règilles `baseline-ui` non négociables : `h-dvh` (jamais `h-screen`), `safe-area-inset` sur les éléments fixes, **aucun dégradé**, échelle z `0/10/20/30/40/50`, `text-balance` sur les titres, `text-pretty` sur les paragraphes, `tabular-nums` sur les données, `aria-label` sur les boutons icône seuls, retour d'interaction ≤ 200 ms, seules `transform`/`opacity` animées, `prefers-reduced-motion` respecté.
- Un seul accent par vue : `cx-primary` = liens/états actifs/focus/données, `cx-accent` = l'action principale. Bordures et ombres Tailwind par défaut.

## Review Focus

1. **Navigation clavier seule** sur les primitives migrées (Lot D) : Tab atteint le déclencheur, Entrée/Espace ouvre, Échap ferme et **rend le focus au déclencheur**, Tab reste piégé dans le dialogue. Test : `tests/design-baseline.test.ts` → assertions clavier sur la base rendue (rôle, `aria-expanded`, état ouvert/fermé).
2. **Viewport mobile 375 px** : aucun débordement horizontal, header et drawer utilisables, `dvh` (barre d'adresse dynamique). Test : garde-fou grep (0 `h-screen`) + vérification manuelle documentée au Lot E.
3. **Contraste des nouveaux états** (hover, active, focus, désactivé) dans les deux thèmes. Test : `tests/contraste.test.ts` (Lot E) mesurant les paires de tokens des états.
4. **Régressions de contenu** : aucune page ne devient vide (démo) et aucune chaîne existante n'est perdue. Test : la suite existante (204 tests) + `tests/smoke.test.ts`.
5. **i18n** : un libellé ajouté en FR ne doit jamais apparaître en clé brute en EN. Test : `tests/i18n.test.ts` (existant) + règle de couverture dans le Lot C.

---

# Lot A — Fondations

**Livrable :** les invariants de design sont testables et le socle (dvh, z, safe-area, typo, `cn`) est en place. Aucun changement visuel au-delà du nécessaire.

### Task A1: `cn()` + dépendances

**Files:**
- Create: `src/lib/cn.ts`
- Test: `tests/cn.test.ts`
- Modify: `package.json` (dépendances)

**Interfaces:**
- Consumes: `clsx`, `tailwind-merge`
- Produces: `export function cn(...inputs: ClassValue[]): string` — fusionne les classes, la dernière gagne sur un même utilitaire Tailwind (`p-2 p-4` → `p-4`).

- [x] **Step 1: Installer les dépendances**

```bash
npm install clsx tailwind-merge
```

- [x] **Step 2: Écrire le test qui échoue**

`tests/cn.test.ts` :
- `cn("p-2", "p-4")` retourne `"p-4"`
- `cn("p-2", cond && "p-4")` retourne `"p-2"` quand `cond` vaut `false`
- `cn("rounded-lg", [{ "rounded-xl": true }])` retourne `"rounded-xl"`

- [x] **Step 3: Le lancer, vérifier l'échec**

Run: `env -u DATABASE_URL npx vitest run tests/cn.test.ts`
Expected: FAIL — `cn` n'existe pas.

- [x] **Step 4: Implémenter `cn` dans `src/lib/cn.ts`**

`twMerge(clsx(inputs))`.

- [x] **Step 5: Vérifier le passage**

Run: `env -u DATABASE_URL npx vitest run tests/cn.test.ts`
Expected: PASS (3 tests)

- [x] **Step 6: Committer**

```bash
git add src/lib/cn.ts tests/cn.test.ts package.json package-lock.json
git commit -m "feat(ui): utilitaire cn (clsx + tailwind-merge)"
```

### Task A2: Échelle de design partagée

**Files:**
- Create: `src/lib/design.ts`
- Test: `tests/design.test.ts`

**Interfaces:**
- Produces :
  - `export const Z = { base: 0, raised: 10, header: 20, overlay: 30, drawer: 40, toast: 50 } as const`
  - `export const RAYON = { sm: "rounded-md", md: "rounded-lg", lg: "rounded-xl", pill: "rounded-full" } as const`
  - `export const DUREE = { interaction: 150, retour: 200 } as const` (ms, utilisé en CSS et en documentation)

- [x] **Step 1: Écrire le test qui échoue** — `Z` a 6 niveaux strictement croissants, `Z.drawer > Z.header`, `DUREE.retour <= 200`.

- [x] **Step 2: Le lancer, vérifier l'échec** — FAIL (module absent).

- [x] **Step 3: Implémenter `src/lib/design.ts`** avec les signatures ci-dessus.

- [x] **Step 4: Vérifier le passage** — PASS.

- [x] **Step 5: Committer** — `feat(ui): échelle z / rayons / durées partagées`.

### Task A3: Viewports `dvh` + échelle z (grep-gate)

**Files:**
- Modify: les ~31 fichiers contenant `min-h-screen`/`h-screen` (liste produite par `grep -rl`)
- Modify: `src/components/panneau-nav.tsx:79`, `src/components/toast.tsx:63`, `src/components/confirm-dialog.tsx:40`, `src/components/header.tsx`, `src/app/layout.tsx`, `src/components/barre-recherche.tsx`, `src/app/forum/[id]/bouton-sondage.tsx`, `src/components/dropdown.tsx`, `src/components/retour-haut.tsx` (z)
- Create: `tests/design-baseline.test.ts`

**Interfaces:**
- Produces : `tests/design-baseline.test.ts` expose 3 tests (`dvh`, `z`, `safe-area`) réutilisés et étendus par les lots suivants.

- [x] **Step 1: Écrire les tests qui échouent** dans `tests/design-baseline.test.ts` (lecture récursive de `src/**/*.tsx` avec `node:fs`) :
  - `aucun h-screen` : aucun fichier de `src` ne contient `h-screen` (regex `\bh-screen\b`) — aujourd'hui 54 occurrences.
  - `échelle z limitée` : toutes les classes `z-*` appartiennent à `0/10/20/30/40/50`.
  - `safe-area sur les éléments fixed` : tout fichier contenant `fixed ` dans un `className` référence `safe-area` (lutoto les 5 fichiers de la liste).

- [x] **Step 2: Les lancer, vérifier l'échec** — FAIL sur les 3.

- [x] **Step 3: Appliquer `min-h-screen` → `min-h-dvh`, `h-screen` → `h-dvh`** par remplacement global sur `src/**/*.tsx`, puis corriger chaque `z-` arbitraire (11 sites) vers l'échelle : `header z-30 → z-20`, `retour-haut z-40 → z-30`, `panneau-nav z-50 (drawer) → z-40`, `toast z-50 → z-50`, les autres `z-50/z-40` de dropdown/confirm/overlay → `z-40`/`z-30` selon la couche.

- [x] **Step 4: Relancer les 3 tests** — PASS.

- [x] **Step 5: Vérifier la non-régression** — `npx tsc --noEmit`, `npm run lint`, `env -u DATABASE_URL npm test` (204+3), `npm run build`.

- [x] **Step 6: Committer** — `fix(ui): viewports dvh + échelle z + tests de conformité`.

### Task A4: Typographie (balance / pretty / tabular-nums)

**Files:**
- Modify: `src/app/globals.css`
- Test: `tests/design-baseline.test.ts` (2 tests ajoutés)

**Interfaces:**
- Produces dans `globals.css` : règle de base `h1,h2,h3,h4 { text-wrap: balance }`, `p, li { text-wrap: pretty }`, et `time, [data-numeric] { font-variant-numeric: tabular-nums }`.

- [x] **Step 1: Ajouter les 2 tests** : `globals.css` contient `text-wrap: balance` ET `text-wrap: pretty` ET `tabular-nums`.

- [x] **Step 2: Les lancer** — FAIL (les 2 nouveaux).

- [x] **Step 3: Ajouter les règles dans `globals.css`** (bloc après `@layer base`/preflight, portée `:where(h1,h2,h3,h4)` pour rester surchargeable).

- [x] **Step 4: Relancer** — PASS (les 5 tests du fichier).

- [x] **Step 5: Vérifier** — tsc, lint, tests, build.

- [x] **Step 6: Committer** — `feat(ui): text-balance, text-pretty, tabular-nums en base`.

### Task A5: Safe-areas sur les éléments fixes

**Files:**
- Modify: `src/app/layout.tsx` (skip-link), `src/components/header.tsx` si un élément fixe subsiste
- Test: `tests/design-baseline.test.ts` (test safe-area existant, créé en A3)

**Interfaces:**
- Produces : tout élément `fixed` respecte la safe-area. **Note de ruling (2026-10-15)** : A3 a déjà appliqué la safe-area en inline (`env(safe-area-inset-*)` wrappé dans `max()`, dégradation gracieuse sans utilitaire) sur 4 sites — drawer (`panneau-nav.tsx`), toast (`toast.tsx`), dialogue (`confirm-dialog.tsx`), retour-haut (`retour-haut.tsx`). L'approche inline est **acceptée** : A5 ne crée donc pas de classes utilitaires et se limite aux sites restants, dans le même style inline.

- [x] **Step 1: Vérifier l'état actuel** — `grep -rn 'safe-area' src` liste les 4 sites déjà traités ; identifier ce qui reste (skip-link `focus:fixed` de `src/app/layout.tsx`, et tout `fixed` apparu depuis).
- [x] **Step 2: Le lancer** (le test safe-area doit déjà être vert ; s'il ne l'est pas, c'est un échec attendu à corriger).
- [x] **Step 3: Appliquer la safe-area aux sites restants** dans le même style inline que A3 (`max()` avec l'offset existant).
- [x] **Step 4: Relancer** — PASS, y compris le test `dvh` élargi (`(?<!d)\d+vh`) resté vert.
- [x] **Step 5: Vérifier** (tsc, lint, tests, build) puis pousser et confirmer le déploiement live.
- [x] **Step 6: Committer** — `fix(ui): safe-area-inset sur les éléments fixes`.

---

# Lot B — Composants partagés (le look)

**Livrable :** tous les composants réutilisables sont passés au baseline ; aucune page n'est encore retouchée. Un test par règle ajouté au fur et à mesure.

### Task B1: Boutons — un seul accent, pas de dégradé, retour tactile

**Files:**
- Modify: `src/components/button.tsx`, `src/components/bouton-vote.tsx`, `src/components/bouton-suivre.tsx`, `src/components/bouton-repost.tsx`, `src/components/bouton-bloquer.tsx`, `src/components/bouton-signaler.tsx`, `src/components/bouton-abonnement.tsx`
- Test: `tests/design-baseline.test.ts` (test `aucun dégradé`)

**Interfaces:**
- Consumes: `cn` (Task A1), `Z`, `RAYON`, `DUREE` (Task A2).
- Produces : tous les boutons passent par `cn`, ont `min-h-[44px]`, `cursor-pointer`, un retour `active:scale-[0.97]` (≤ 200 ms), et n'utilisent **qu'un** fond accent par vue (le bouton principal ; les secondaires sont `ghost`/`border`).

- [x] **Step 1: Ajouter le test `aucun dégradé`** — aucun `bg-gradient-*`, `from-cx-*`, `to-cx-*` dans `src/**/*.tsx`. Aujourd'hui 4 fichiers échouent.

- [x] **Step 2: Le lancer** — FAIL (logo, visuel-accueil, forum, membres).

- [x] **Step 3: Passer les 7 composants de bouton sur `cn`** et harmoniser : `min-h-[44px]`, `RAYON.md`, `active:scale-[0.97]`, suppression des fonds dégradés restants, variantes limitées à `primary | ghost | danger` (`accent` alias de `primary` pour ne pas casser les appels existants).

- [x] **Step 4: Relancer** — le test `aucun dégradé` échoue encore (les 3 autres fichiers) → le faire passer en Task B2/B3 ; vérifier que les 7 fichiers de bouton sont conformes.

- [x] **Step 5: Vérifier** — tsc, lint, tests, build. Committer : `refactor(ui): boutons unifiés (cn, retour tactile, un accent)`.

### Task B2: Logo et visuel d'accueil sans dégradé

**Files:**
- Modify: `src/components/logo.tsx`, `src/components/visuel-accueil.tsx`

**Interfaces:**
- Produces : un logo en aplat `bg-cx-primary` + icône `text-cx-primary-fg` ; un hero sans dégradé (teintes unies, ombres Tailwind par défaut).

- [x] **Step 1: Remplacer le dégradé du logo** par `bg-cx-primary` (le contraste blanc/bleu est déjà validé AA).
- [x] **Step 2: Remplacer les dégradés du hero** (`visuel-accueil.tsx`) par des aplats `bg-cx-card` + `border-cx-border` + une teinte `bg-cx-primary/5` sur une seule carte.
- [x] **Step 3: Relancer le test `aucun dégradé`** — reste 2 fichiers en échec (forum, membres) → conformes après B3.
- [x] **Step 4: Vérifier** (tsc, lint, tests, build) puis committer : `refactor(ui): logo et hero en aplat`.

### Task B3: Bannière profil et widget forum aplats

**Files:**
- Modify: `src/app/forum/page.tsx` (widget « À propos »), `src/app/membres/[slug]/page.tsx` (bannière de couverture)

**Interfaces:**
- Produces : widget = `bg-cx-card` + `border` ; couverture = `bg-cx-primary` (aplat) avec le motif de points conservé en `opacity-20`.

- [x] **Step 1: Remplacer les 2 dégradés** par des aplats.
- [x] **Step 2: Relancer `aucun dégradé`** — PASS (les 6 tests du fichier).
- [x] **Step 3: Vérifier** puis committer : `refactor(ui): bannière et widget en aplat`.

### Task B4: Cartes, badges, champs — densité et hiérarchie

**Files:**
- Modify: `src/components/carte-sujet.tsx`, `src/components/badge.tsx`, `src/components/empty-state.tsx`, `src/components/pagination.tsx`, `src/components/skeleton.tsx`, `src/components/fil-ariane.tsx`
- Test: `tests/design-baseline.test.ts` (test `boutons icône avec aria-label`)

**Interfaces:**
- Produits : `Badge` limité à 3 variantes (`primary`, `neutral`, `danger`) — plus de badges multicolores par vue ; `CarteSujet` avec hiérarchie resserrée (titre, méta en `text-xs`, actions groupées) ; `EmptyState` avec **une seule** action claire (règle baseline) ; tous les champs `text-sm` + `placeholder` lisible.

- [x] **Step 1: Ajouter le test** — tout `className` sans texte visible (bouton dont le contenu est uniquement une icône) a un `aria-label`. Implémentation : vérifier que les fichiers de boutons icône contiennent `aria-label` ou `sr-only`.
- [x] **Step 2: Le lancer** — FAIL ou PASS selon l'existant ; corriger les manquants.
- [x] **Step 3: Refondre les 6 composants** selon les sorties d'interface.
- [x] **Step 4: Vérifier** puis committer : `refactor(ui): cartes, badges, champs unifiés`.

### Task B5: Chrome — header, navigation latérale, footer

**Files:**
- Modify: `src/components/header.tsx`, `src/components/panneau-nav.tsx`, `src/components/footer.tsx`, `src/components/menu-mobile.tsx` (si encore utilisé), `src/components/retour-haut.tsx`
- Test: `tests/components.test.tsx` (mise à jour **uniquement** si des libellés changent volontairement)

**Interfaces:**
- Consumes: `Z`, `cn`, `RAYON`.
- Produces : header = logo (aplat) + ☰ + recherche centrée + actions (un accent) ; sidebar = sections Fil/Explorer/Communautés avec teinte `bg-cx-primary/5` sur l'actif ; footer allégé (3 colonnes max, liens neutres).

- [x] **Step 1: Passer header/sidebar/footer sur `cn`** et appliquer l'échelle z (`Z.header`, `Z.drawer`).
- [x] **Step 2: Réduire à un accent par vue** : header = accent sur « Écrire un sujet » uniquement, le reste en neutre.
- [x] **Step 3: Mettre à jour `tests/components.test.tsx`** si et seulement si des libellés changent, en le disant dans le message de commit.
- [x] **Step 5: Auditer le toast maison** (écart assumé, pas de migration) : `role="status"`/`aria-live` correct, fermeture au clic **et** au clavier, pile qui ne se chevauche pas, `pb-safe`. Corriger ce qui manque sans le migrer.
- [x] **Step 6: Vérifier** (tsc, lint, tests, build) puis committer : `refactor(ui): chrome header/sidebar/footer`.

### Task B6: Squelettes structurels et états vides

**Files:**
- Modify: `src/components/skeleton.tsx`, `src/app/*/loading.tsx` (22 fichiers, contrôle de cohérence)

**Interfaces:**
- Produces : tous les `loading.tsx` utilisent les squelettes partagés (`SqueletteListe`, `SqueletteGrille`, `SqueletteDetail`) — pas de spinner seul, pas de bloc `animate-pulse` isolé dupliqué.

- [x] **Step 1: Recenser les `animate-pulse` hors `skeleton.tsx`** et les remplacer par un composant partagé.
- [x] **Step 2: Vérifier la cohérence** des 22 `loading.tsx` (largeurs max alignées sur leur page).
- [x] **Step 3: Vérifier** puis committer : `refactor(ui): squelettes structurels unifiés`.

---

# Lot C — Les 31 pages

**Livrable :** chaque famille de pages hérite des composants du Lot B et reçoit une passe page (largeurs, grilles, espacements, un accent par vue). Tâches groupées par famille pour rester reviewable ; l'implémenteur applique le même canevas à chaque page de la famille.

**Canevas commun à chaque page** (répété dans chaque tâche, pas de redondance dans le document) :
1. passer les `className` sur `cn` là où il y a de la logique conditionnelle ;
2. remplacer les `h-N w-N` carrés restants par `size-N` ;
3. vérifier qu'**un seul** fond `cx-accent` apparaît (le reste en `cx-primary` ou neutre) ;
4. appliquer `text-balance`/`text-pretty`/`tabular-nums` là où des nombres s'affichent (vote, compteurs, dates, stats) ;
5. largeur max alignée sur la famille (`max-w-3xl` pour le contenu seul, `max-w-5xl` listes, `max-w-7xl` grilles + sidebar) ;
6. `npx tsc --noEmit`, `npm run lint`, `env -u DATABASE_URL npm test`, `npm run build`, commit, push, vérifier le déploiement live.

### Task C1: Accueil
**Files:** Modify `src/app/page.tsx` (+ `src/components/visuel-accueil.tsx` si besoin)

- [x] Steps : canevas commun + hero à deux colonnes dès `lg`, statistiques en `tabular-nums`, CTA principal unique (`Rejoindre` en accent, les liens secondaires en `cx-primary`).
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C2: Forum (liste + détail)
**Files:** Modify `src/app/forum/page.tsx`, `src/app/forum/[id]/page.tsx`, `src/components/carte-sujet.tsx` si le détail l'exige

- [x] Steps : canevas commun ; fil centré + widget à droite (`xl:grid-cols-[minmax(0,1fr)_320px]`) ; barre de tri et filtres sur une ligne dès `sm` ; compteurs de votes/commentaires en `tabular-nums` ; réponses groupées par carte avec `RAYON.md`.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C3: Annuaire + profil membre
**Files:** Modify `src/app/annuaire/page.tsx`, `src/app/membres/[slug]/page.tsx`

- [x] Steps : canevas commun ; couverture aplatie (déjà fait en B3) ; badges de stack unifiés (variante `neutral` ou `primary`, pas les deux) ; grille 2→3 colonnes ; bouton « Suivre » en `primary`.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C4: Jobs (+ détail + formulaire)
**Files:** Modify `src/app/jobs/page.tsx`, `src/app/jobs/[id]/page.tsx`, `src/app/jobs/nouveau/page.tsx` + formulaire

- [x] Steps : canevas commun ; filtres sur une ligne ; dates et salaires en `tabular-nums` ; bouton « Postuler » en accent (action principale), le reste en neutre.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C5: Projets (+ détail + formulaire)
**Files:** Modify `src/app/projets/page.tsx`, `src/app/projets/[id]/page.tsx`, `src/app/projets/nouveau/page.tsx` + formulaire

- [x] Steps : idem C4 ; cartes projet avec méta « cherche » en évidence.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C6: Tutos (+ détail)
**Files:** Modify `src/app/tutos/page.tsx`, `src/app/tutos/[slug]/page.tsx`, `src/app/tutos/loading.tsx`

- [x] Steps : canevas commun ; lecture confortable (`max-w-3xl`, `leading-relaxed`, `text-pretty`) ; durée en `tabular-nums`.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C7: Événements (+ détail)
**Files:** Modify `src/app/evenements/page.tsx`, `src/app/evenements/[id]/page.tsx`

- [x] Steps : canevas commun ; dates en `tabular-nums` ; RSVP en accent.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C8: Mentorat
**Files:** Modify `src/app/mentorat/page.tsx` + `src/app/mentorat/formulaire-mentorat.tsx`

- [x] Steps : canevas commun ; cartes mentor (avatar + stack + dispo) ; formulaire complet.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C9: Authentification et onboarding
**Files:** Modify `src/app/connexion/page.tsx`, `src/app/inscription/page.tsx`, `src/app/mot-de-passe-oublie/page.tsx`, `src/app/reinitialisation/page.tsx`, `src/app/onboarding/page.tsx`

- [x] Steps : canevas commun ; un seul appel à l'action par écran, centré, `max-w-md` ; messages d'erreur **à côté du champ** (règle baseline) ; boutons `min-h-[44px]`.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C10: Espace membre
**Files:** Modify `src/app/mon-espace/page.tsx`, `src/app/profil/page.tsx`, `src/app/parametres/page.tsx` + `formulaire-parametres.tsx`, `src/app/favoris/page.tsx`, `src/app/notifications/page.tsx`, `src/app/messagerie/page.tsx` + `formulaire-message.tsx`

- [x] Steps : canevas commun ; stats en `tabular-nums` ; listes vides avec **une** action claire ; messagerie avec bulles resserrées et horodatages `tabular-nums`.
- [x] Vérifier, committer, pousser, confirmer le live.

### Task C11: Recherche, communautés, admin, erreurs
**Files:** Modify `src/app/recherche/page.tsx`, `src/app/forum/tags/page.tsx`, `src/app/admin/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/components/barre-recherche.tsx`

- [x] Steps : canevas commun ; résultats groupés avec compteurs `tabular-nums` ; admin = tableau dense lisible (une accent = la modération) ; 404/erreur avec un seul chemin de sortie.
- [x] Vérifier, committer, pousser, confirmer le live.

---

# Lot D — Primitives accessibles (Base UI)

**Livrable :** les surfaces interactives clavier utilisent Base UI ; nos implémentations maison sont supprimées.

### Task D1: Installer Base UI
**Files:** Modify `package.json`, Create `src/components/ui/menu.tsx`, `src/components/ui/dialog.tsx`

**Interfaces:**
- Consumes: `@base-ui-components/react`, `cn`.
- Produces : `<MenuTrigger>`/`<Menu>`, `<DialogTrigger>`/`<Dialog>` — enveloppes minces qui portent les classes `cx-*` et n'exposent que les props nécessaires (déclencheur, enfants, `onOpenChange`).

- [x] **Step 1: Installer** : `npm install @base-ui-components/react`
- [x] **Step 2: Écrire `src/components/ui/menu.tsx`** : enveloppe `Menu.Root/Trigger/Positioner/Popup` rendant `className` via `cn`, items en `Menu.Item`.
- [x] **Step 3: Écrire `src/components/ui/dialog.tsx`** : `Dialog.Root/Trigger/Backdrop/Popup/Title/Description/Close`, focus piégé, `role="dialog"`, fermeture par Échap.
- [x] **Step 4: Vérifier** — tsc, lint, build. Committer : `feat(ui): primitives Base UI (menu, dialogue)`.

### Task D2: Migrer le `Dropdown`
**Files:** Modify `src/components/dropdown.tsx` (réécrit sur Base UI), `src/components/menu-utilisateur.tsx`, `src/components/recherche-dropdown.tsx`

**Interfaces:**
- Consumes: `src/components/ui/menu.tsx` (D1), `Z`.
- Produces : `Dropdown` **conserve sa signature actuelle** — `{ trigger: ReactNode; children: ReactNode; label: string; align?: "right" | "left"; triggerClassName?: string }` — mais délègue à Base UI. Comportements attendus et aujourd'hui absents ou partiels : `role="menu"` + items en `role="menuitem"`, navigation aux flèches, **retour du focus sur le déclencheur** après fermeture, focus piégé dans le panneau ouvert.

- [x] **Step 1: Écrire le test qui échoue** (`tests/design-baseline.test.ts`, bloc « primitives ») : rendre `MenuUtilisateur` (connecté) et vérifier (a) l'absence actuelle de `role="menu"`, (b) qu'après `Escape` le focus revient sur le bouton déclencheur (`document.activeElement === bouton`), (c) que la touche `ArrowDown` déplace le focus sur le premier item.
- [x] **Step 2: Le lancer** — FAIL sur (a) et (b) : le composant maison a `aria-expanded`/`aria-haspopup` mais pas de sémantique menu ni de retour de focus.
- [x] **Step 3: Réécrire `Dropdown` sur Base UI** en conservant la signature ; adapter `menu-utilisateur.tsx` et `recherche-dropdown.tsx` (props inchangées côté pages).
- [x] **Step 4: Relancer** — PASS.
- [x] **Step 5: Vérifier** (204+tests) puis committer : `refactor(ui): dropdown sur Base UI`.

### Task D3: Migrer les dialogues de confirmation
**Files:** Modify `src/components/confirm-dialog.tsx` (sur Base UI), `src/app/forum/[id]/bouton-reponse.tsx`, `src/app/parametres/formulaire-parametres.tsx`, `src/app/admin/bouton-moderation.tsx`

**Interfaces:**
- Consumes: `src/components/ui/dialog.tsx` (D1).
- Produces : `ConfirmDialog` **conserve sa signature actuelle** — `{ open: boolean; titre: string; description?: string; confirmer: () => void; annuler: () => void; labelConfirmer?: string; labelAnnuler?: string }` — mais rend un dialogue Base UI avec `role="alertdialog"`, focus initial sur « Annuler », fermeture Échap, focus piégé, et des ids **uniques** (aujourd'hui `aria-labelledby="confirm-titre"` est codé en dur : deux dialogues simultanés se marcheraient dessus).

- [x] **Step 1: Étendre le test** : `ConfirmDialog` rendu ouvert expose `role="alertdialog"` (aujourd'hui `role="dialog"` → échec attendu), un `aria-describedby` pointant vers la description, et un titre lié par un id unique.
- [x] **Step 2: Le lancer** — FAIL sur `role="alertdialog"` et `aria-describedby`.
- [x] **Step 3: Réécrire `ConfirmDialog` sur Base UI** ; remplacer le `window.confirm` de `bouton-moderation.tsx` par le dialogue.
- [x] **Step 4: Relancer** — PASS.
- [x] **Step 5: Vérifier** puis committer : `refactor(ui): confirmations sur Base UI`.

### Task D4: Supprimer le dernier `<details>` maison et auditer le clavier
**Files:** Modify les fichiers restants utilisant `<details>`/`<summary>` pour des interactions

- [x] **Step 1: Rechercher** `grep -rn '<details' src` et convertir chaque cas en primitive Base UI ou en balisage non interactif.
- [x] **Step 2: Vérifier** qu'aucun `<details>` ne reste (`test` ajouté au fichier de conformité).
- [x] **Step 3: Parcours clavier manuel documenté** : header, sidebar, formulaires, dialogues, messagerie — noter tout blocage et corriger.
- [x] **Step 4: Vérifier** puis committer : `refactor(ui): disclosures et audit clavier`.

---

# Lot E — Audit final

**Livrable :** preuve de conformité + démo prête.

### Task E1: Suite de conformité complète
**Files:** Modify `tests/design-baseline.test.ts` (consolider toutes les règles)

- [x] **Step 1: Consolider** en un seul fichier les règles : `dvh`, `z`, `safe-area`, `aucun dégradé`, `balance/pretty`, `tabular-nums`, `aria-label` icônes, `≤200ms` (aucune durée > 200ms dans les `transition-*`), aucune propriété layout animée (`transition-all`, `width`, `height`, `margin`, `padding` dans les transitions), pas de `<details>`.
- [x] **Step 2: Lancer** — corriger tout écart restant.
- [x] **Step 3: Committer** : `test(ui): suite de conformité baseline`.

### Task E2: Contraste des nouveaux états
**Files:** Create `tests/contraste.test.ts`

**Interfaces:**
- Consumes: les tokens `--cx-*` lus dans `globals.css`.
- Produces : calcul WCAG pour chaque paire (texte/fond : 4,5:1 ; bordures/focus : 3:1), dans les **deux** thèmes, états hover/active/focus/désactivé inclus.

- [x] **Step 1: Écrire le test** lisant `globals.css` (regex sur `--cx-*`) et calculant les ratios pour les paires : fg/bg, fg/card, fg/muted, muted-fg/bg|card|muted, `*-fg`/`*-bg` de chaque couleur, et les états (`primary/5`, `accent/5` sur card et bg).
- [x] **Step 2: Le lancer** — corriger tout token fautif.
- [x] **Step 3: Committer** : `test(a11y): contraste des états verrouillé`.

### Task E3: Vérification responsive manuelle (documentée)
**Files:** Modify `docs/verification-ui.md` (créer)

- [x] **Step 1: Check-imprimante navigateur** à 375 / 768 / 1024 / 1440 sur les 9 parcours (accueil, forum, connexion, annuaire, un détail, formulaire, messagerie, admin, 404) : noter tout débordement horizontal, tout chevauchement, toute cible tactile < 44 px.
- [x] **Step 2: Corriger** ce qui est trouvé, committer au coup par coup.
- [x] **Step 3: Committer** le document de vérification.

### Task E4: Feu vert final et mise à jour des docs
**Files:** Modify `README.md`, `docs/pitch.md` si le parcours de démo change

- [x] **Step 1: `npx tsc --noEmit`, `npm run lint`, `env -u DATABASE_URL npm test`, `npm run build`** — tout vert.
- [x] **Step 2: Pousser, attendre le déploiement, vérifier le live** (curl sur 9 parcours + `/api/sante`).
- [x] **Step 3: Mettre à jour `docs/pitch.md`** si des écrans ont changé de nom ou de parcours.
- [x] **Step 4: Committer** : `docs: refonte UI livrée`.

---

## Notes d'exécution

- Un lot qui casse un test **volontairement** (changement de libellé/DOM) doit le dire dans son message de commit et mettre le test à jour dans le même commit. Aucun test supprimé ni assoupli sans justification.
- Les commandes de test locales : `env -u DATABASE_URL npm test` (SQLite), `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Vérification live après chaque push : attendre le déploiement, puis `curl` sur les pages du lot + `/api/sante`.
