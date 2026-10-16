# Vérification UI — refonte baseline (Lot E)

> Ce document est la **preuve de conformité** de la refonte : ce qui est
> verrouillé automatiquement, ce qui a été audité statiquement, et ce qui a
> été vérifié dans un vrai navigateur avant la démo.

## 1. Verrouillé par les tests (`env -u DATABASE_URL npm test`)

| Suite | Tests | Ce qui est verrouillé |
| --- | --- | --- |
| `tests/design-baseline.test.ts` | 11 | `dvh` (jamais `h-screen`/`vh` figé), échelle `z` (0/10/20/30/40/50), safe-areas sur tout élément `fixed`, aucun dégradé (hors OG images), `text-wrap: balance/pretty`, `tabular-nums`, `aria-label` des boutons-icônes, aucun `<details>` maison, garde-fou Base UI, durées de transition ≤ 200 ms, aucune propriété de layout animée |
| `tests/contraste.test.ts` | 7 | WCAG 2.1 calculé sur les tokens, **thème clair et sombre** : texte ≥ 4,5:1 (fg/card/muted, `*-fg` sur leur fond, états teintés `token/5`), interface ≥ 3:1 (champs `--cx-border-fort`, anneau de focus), palette d'avatar (initiales blanches) |
| `tests/primitives.test.tsx` | 10 | Comportements clavier en DOM réel (jsdom) : ouverture/navigation aux flèches du menu, retour du focus après Échap **et après une action**, `role="alertdialog"` + titre/description liés + ids uniques, focus initial sur « Annuler », focus piégé, Échap annule, popover de recherche (focus dans le champ, Échap rend le focus à l'icône), drawer mobile (`inert` + focus rendu au ☰) |
| `tests/serialisation.test.ts` | 2 | Garde-fou RSC : aucun props-fonction passé d'un composant serveur à un composant client (la cause du P0 `/forum/[id]`), scan non vacant (≥ 20 composants clients reconnus) |
| `tests/forum-reponses.test.tsx` | 2 | Contrat de l'arbre de réponses : rendu imbriqué à 2 niveaux, état `likesReponses` restitué sans fonction |

Total de la suite : **247 tests / 38 fichiers**, tous verts au 2026-10-16.
- `tests/seed.test.ts` : verrouille l'absence de pages vides à la démo (messagerie 10 msgs dont 2 non lus, notifications 5 dont 2 non lues, 8 favoris couvrant les 6 types, 3 demandes mentorat, fil imbriqué).

## 2. Audité statiquement (recherche dans `src/`)

- **Débordement horizontal** : aucune largeur fixe > 300 px, aucun `w-screen`,
  aucun `whitespace-nowrap`, aucune balise `<table>` (les tableaux denses de
  l'admin sont des listes flex avec `truncate` + `gap`).
- **Contenu long** : les blocs de code markdown et les `<pre>` ont
  `overflow-x-auto` ; les lignes `justify-between` à contenu variable portent
  `truncate`/`min-w-0`/`shrink-0` (annuaire, admin, tendances, messagerie).
- **Grilles** : toutes les grilles multi-colonnes sont mobile-first
  (`grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3`). Seule exception
  assumée : les statistiques de la colonne de droite du forum (deux nombres).
- **Correctif d'audit** : la paire Ville/Pays de l'inscription empilait deux
  champs dès 375 px — passée en `grid-cols-1 sm:grid-cols-2`.
- **Cibles tactiles** (estimation statique des classes) :
  - boutons d'action : `min-h-[44px]` (soumissions, CTAs, dialogues) ;
  - actions de carte en ligne : 36–40 px (lecture, vote, favori, signaler) —
    au-dessus des 24 px exigés par WCAG 2.2 (2.5.8) ;
  - boutons-icônes du header : 32–36 px (`p-2` + icône 20 px) ;
  - liens en ligne (titres de carte, breadcrumbs, « tout voir ») : hauteur de
    texte, couverts par l'exception « inline » de la 2.5.8.
- **Clavier** : anneau de focus global (`:focus-visible`, 2 px + offset 2 px) ;
  skip-link « Aller au contenu » ; `aria-expanded`/`aria-controls` sur le ☰ ;
  drawer mobile en `inert` + focus rendu au déclencheur ; Échap ferme menu,
  popover, dialogue et drawer.

## 3. Passée dans un vrai navigateur — automatisée le 2026-10-16

Historique : au départ il n'y avait pas de navigateur dans l'environnement
d'implémentation. Il a été débloqué le 16/10 :
- Chromium 138 (store nix) derrière le wrapper stable `~/.local/bin/chromium-ok`,
  polices symlinkées (`~/.fonts`), Playwright 1.64.1 npm dans `/tmp/opencode`
  (scripts `shot.mjs`, `audit-404.mjs`, `check-fonts.mjs`, `passe-ui.mjs`,
  `mini-interac.mjs`);
- MCP Playwright (`microsoft/playwright-mcp`, 25 outils) câblé dans
  `~/.config/opencode/opencode.json` (lecture au redémarrage d'OpenCode).
- Login partagé entre contextes via `storageState` (contournement de la limite
  anti-bruteforce 5/15 min); attentes par sélecteur plutôt que des `sleep`.
- En plus : `tests/serialisation.test.ts` scanne le code source contre la
  régression RSC; `tests/forum-reponses.test.tsx` verrouille l'arbre imbriqué.

La passe a lieu sur l'URL live (`https://code-x-change-seven.vercel.app`),
commit `080d123`, parcours :
accueil · forum · connexion · annuaire · sujet · nouveau sujet · messagerie ·
admin · 404 ; largeurs **375 / 768 / 1024 / 1440** ; + thème sombre (1024).

Résultats (voir `/tmp/opencode/passe-resultat.json` côté agent,
36 captures conservées dans `/tmp/opencode/passe/`) :

| # | Point | Résultat |
|---|---|---|
| 1 | Aucun défilement horizontal (9×4) | ✅ **0 entrée** après les correctifs (`overflow-x-hidden` sur le drawer + Tendances `hidden sm:block`) |
| 2 | Aucun chevauchement de texte à 375 px (captures lues à l'œil) | ✅ aucun overflow mesuré |
| 3 | Drawer : ☰ ouvre, Échap ferme, focus piégé, retour au ☰ | ✅ 4/4 (bug trouvé : vol de focus au chargement → fixé `e915318`) |
| 4 | Menu utilisateur : flèches, Échap, retour du focus | ✅ 3/3 |
| 5 | Dialogue de confirmation (forum → supprimer une réponse) : focus sur « Annuler », Échap, Tab piégé | ✅ 5/5 |
| 6 | Recherche : icône → champ prend le focus, Échap rend le focus (375) | ✅ vérifiée live (`debug-search-mobile.mjs`, focus INPUT puis `aria-label="Rechercher"`) ; au desktop la recherche est un champ centré |
| 7 | Cibles tactiles 375 px (WCAG 2.5.8 ≥ 24 px) | ✅ **0 cible sous 24 px** (fr/en 20 → 24, admin « pause » 16 → 24) |
|   | actions principales ≥ 44 px (header + `formulaire-sujet`) | ✅ bump à `min-h-[44px]` (header + `formulaire-sujet`) |
| 8 | Thème sombre (`data-theme="dark"`, reload via cookie `cx_theme`) | ✅ 10 parcours sans crash, `data-theme="dark"` appliqué, captures `*-sombre.png` |

Constat P0 isolé par la passe et corrigé :
`/forum/[id]` et `/messagerie?with=…` rendaient « Oops — quelque chose a cassé »
(React #441) parce que le serveur passait une *fonction* (`hasReplyLiked={(id) => …}`,
`onEnvoye={() => {}}`) à un composant client. Corrections :
`likesReponses: number[]` dans `page.tsx`, signature `likesReponses: number[]` dans
`arbre-reponses.tsx`, `FormulaireMessage` sans `onEnvoye`. Garde-fou :
`tests/serialisation.test.ts`.

Bonus : les réponses imbriquées n'étaient jamais affichées
(`racines = replies.filter(r => !r.parentId)` éliminait les siens) → filtre recalé
par niveau, seed inclut désormais un fil à 2 niveaux (commit `080d123`).

Compteurs :
- Statuts : 36 éléments en 200, quatre éléments en 404 (`/page-inexistante`, comportement
  voulu, statut aligné avec l'attente dessus).
- `243 tests / 37 fichiers`, `env -u DATABASE_URL npm test` vert, lint propre,
  `npm run build` OK — à chaque lot.

## 4. Live

Après chaque lot : `curl` sur les 9 parcours + `/api/sante`.
Dernier relevé (commit `080d123`, 2026-10-16) :

- `/api/sante` → `{"ok":true,"utilisateurs":31}` (la démo est re-peuplée à
  chaque build via `vercel-build` : `db push --force-reset && seed`,
  31 utilisateurs, 15 sujets dont 21 réponses dont 1 imbriquée à 2 niveaux,
  10 messages dont 2 non lus, 5 notifications dont 2 non lues, 8 favoris,
  10 offres, 8 projets, 6 événements, 8 tutoriels, 6 mentors).
- Aucune page d'erreur (« quelque chose a cassé ») sur les parcours réels.
- Build : `node scripts/switch-to-postgres.mjs && prisma generate &&
  prisma db push --force-reset && npm run seed && next build`.