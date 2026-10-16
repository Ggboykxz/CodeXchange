# Vérification UI — refonte baseline (Lot E)

> Ce document est la **preuve de conformité** de la refonte : ce qui est
> verrouillé automatiquement, ce qui a été audité statiquement, et ce qui reste
> à passer à l'œil (et à la souris) dans un vrai navigateur avant la démo.

## 1. Verrouillé par les tests (`env -u DATABASE_URL npm test`)

| Suite | Tests | Ce qui est verrouillé |
| --- | --- | --- |
| `tests/design-baseline.test.ts` | 11 | `dvh` (jamais `h-screen`/`vh` figé), échelle `z` (0/10/20/30/40/50), safe-areas sur tout élément `fixed`, aucun dégradé (hors OG images), `text-wrap: balance/pretty`, `tabular-nums`, `aria-label` des boutons-icônes, aucun `<details>` maison, garde-fou Base UI, durées de transition ≤ 200 ms, aucune propriété de layout animée |
| `tests/contraste.test.ts` | 7 | WCAG 2.1 calculé sur les tokens, **thème clair et sombre** : texte ≥ 4,5:1 (fg/card/muted, `*-fg` sur leur fond, états teintés `token/5`), interface ≥ 3:1 (champs `--cx-border-fort`, anneau de focus), palette d'avatar (initiales blanches) |
| `tests/primitives.test.tsx` | 8 | Comportements clavier en DOM réel (jsdom) : ouverture/navigation aux flèches du menu, retour du focus après Échap **et après une action**, `role="alertdialog"` + titre/description liés + ids uniques, focus initial sur « Annuler », focus piégé, Échap annule, popover de recherche (focus dans le champ, Échap rend le focus à l'icône) |

Total de la suite : **237 tests / 35 fichiers**, tous verts au 2026-10-16.

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

## 3. À passer dans un vrai navigateur avant la démo (non automatisable ici)

L'environnement d'implémentation n'a pas de navigateur : les points ci-dessous
sont volontairement listés pour une passe humaine (≈ 15 min), à faire sur
**375 / 768 / 1024 / 1440 px**, sur les 9 parcours : accueil, forum, connexion,
annuaire, un détail (sujet), un formulaire (nouveau sujet), messagerie, admin,
404.

À vérifier à chaque largeur :

1. **Aucun défilement horizontal** (barre en bas de page) — le test le plus rapide.
2. **Aucun chevauchement** de texte en 375 px (titres longs, tags, noms).
3. **Drawer** : ☰ ouvre, Échap ferme, le focus ne sort pas du panneau, retour au ☰.
4. **Menu utilisateur** : flèches, Échap, focus rendu au bouton.
5. **Dialogue de confirmation** : (forum → supprimer une réponse) focus sur
   « Annuler », Échap annule, Tab reste dans la modale.
6. **Recherche** : icône → le champ prend le focus, Échap rend le focus.
7. **Cibles tactiles** (émulation tactile 375 px) : aucun bouton difficile à
   toucher (les actions principales doivent faire ≥ 44 px de haut).
8. **Thème sombre** (`data-theme="dark"`) : relire les écrans clés, bordures et
   placeholders compris.

## 4. Live

Après chaque lot : `curl` sur les 9 parcours + `/api/sante` (voir le ledger SDD
pour les relevés datés). Dernier relevé : 13 routes en 200, `/api/sante` →
`{"ok":true}`.
