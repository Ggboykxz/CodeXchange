# CodeXchange — Refonte UI complète (baseline-ui)

> 2026-10-14 · dépôt `github.com/Ggboykxz/CodeXchange` · hackathon, échéance **2026-10-25**
> Commanditaire : « tout me gêne sur tout l'UI » → refonte de **toute** l'interface,
> pilotée par les skills de design (`baseline-ui` de `ui-skills`, données `ui-ux-pro-max`).
> Réponses du commanditaire du 2026-10-14 : **« all of them »** sur les trois arbitrages proposés.
> Tout marqué *(mon choix)* est un arbitrage de l'agent, révocable en une phrase.

## Intent

CodeXchange existe, tourne en production et remplit son job (forum, jobs, projets, annuaire,
tutos, événements, mentorat, messagerie, admin — 31 pages, 204 tests, déployé sur Vercel).
Ce qui ne va pas : **l'interface**. Trop de bruit visuel, des décisions de design prises
« au feeling » lot après lot, des écarts avec les règles d'accessibilité et de performance
que les skills de design énoncent noir sur blanc. Le commanditaire ne se reconnaît pas
dans le résultat.

La refonte part donc d'un **baseline explicite** plutôt que de mon goût : chaque surface
est passée au crible de `baseline-ui` (skill anti-« AI slop ») + des données `ui-ux-pro-max`
(styles, palettes, typo, UX), avec comme cible de qualité un site qu'on croirait fait par
une équipe design — pas assembré par un agent.

**Succès** : le 25 octobre, un jury ouvre l'URL, clique partout sur un téléphone, et trouve
une interface nette, cohérente, rapide, en français, sans jamais tomber sur une page vide.

**Échec** : une refonte casse la démo (régression, page blanche, test rouge) ; ou un
« relooking » qui embellit sans rien corriger (viewports mobiles, focus clavier, contraste).

## Goals

1. **Conformité `baseline-ui`** sur les 31 pages et les 47 composants : chaque règle du
   skill est soit respectée, soit listée comme écart assumé et documenté.
2. **Un seul système visuel** : tokens, échelle z, rayons, ombres, typo, espacements —
   une source de vérité (`globals.css` + `src/lib/design.ts`), plus de valeurs ad hoc.
3. **Mobile d'abord, réellement** : `dvh` (54 occurrences), `safe-area-inset` sur les
   éléments fixes, aucune coupure à 375 px.
4. **Primitives accessibles** : dropdowns, dialogues, disclosures passent sur **Base UI**
   (focus trap, Échap, aria, clavier) au lieu de nos implémentations maison.
5. **Typo qui respire** : `text-balance` sur les titres, `text-pretty` sur les paragraphes,
   `tabular-nums` sur toutes les données chiffrées.
6. **Vert** : `tsc`, `lint`, **204/204 tests** et build OK à chaque lot poussé.

## Non-goals

- Aucune **nouvelle fonctionnalité**, aucune nouvelle route, aucun changement de modèle
  Prisma ou d'API.
- Pas de migration framework (Next.js 16 / Tailwind v4 restent), pas de SSR → client.
- Pas de refonte du **copy** (les textes français restent, seules les macros de mise en
  page changent), pas de nouvelle i18n (FR/EN existants).
- Pas d'animation JS nouvelle (Framer/GSAP) : la motion existante en CSS suffit, et
  `baseline-ui` dit explicitement « pas d'animation si elle n'est pas demandée ».
- Pas de nouvelle police : `Plus Jakarta Sans` reste.
- Pas de Playwright/E2E (hors périmètre temps).

## Anti-goals

- Casser la démo live : chaque lot doit être déployable, `main` reste verte.
- Perdre le contenu de démo : **aucune page ne doit finir vide**.
- Régression d'accessibilité déjà acquise : contraste WCAG AA (audit 80 paires, 0 échec),
  focus visible, `prefers-reduced-motion`, `aria-busy`, labels d'icônes.
- « Jolir mais creux » : une refonte qui ne corrige aucun problème réel (viewport mobile,
  focus clavier, hiérarchie) est un échec même si les captures sont belles.

## Constraints

- Échéance **2026-10-25** (11 jours) ; chaque lot est poussé sur `main` → déploiement
  Vercel automatique, donc un lot cassé casse la démo publique.
- Budget 0 € : les seules dépendances ajoutées sont gratuites et minuscules
  (`clsx`, `tailwind-merge`, `@base-ui-components/react`).
- Machine : Node 20.18.1, npm 10.8.2.
- Tests bloquants : `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- UI et copy **en français** ; thèmes clair **et** sombre maintenus à contraste AA.

## Decisions — comment ça se fait

### Direction visuelle *(mon choix, à confirmer à la lecture)*

- **Chrome neutre, une seule couleur d'action.** Les surfaces restent blanches/slate
  (clair) et slate foncé (sombre). On **garde** les deux tokens existants mais avec des
  rôles stricts : `cx-primary` (bleu) = liens, états actifs, focus, données ; `cx-accent`
  (orange) = **une seule** action principale par vue. Tout le reste est neutre.
  → supprime le « arc-en-ciel » actuel (11 dégradés, badges de 4 couleurs, puces bigarrées).
- **Aucun dégradé** *(décision commanditaire : « all of them »)* : logo, bannière de profil,
  hero, widget « À propos » passent en aplat ou en teinte unie.
- **Ombres Tailwind par défaut**, rayons cohérents (une seule échelle), pas de glow.
- Densité : Reddit-like conservée côté forum (l'architecture a été demandée telle quelle
  par le commanditaire), mais **reserrée** : moins de bordures, plus d'espace blanc.

### Fondations techniques

- `min-h-screen`/`h-screen` → `min-h-dvh`/`h-dvh` (54 occurrences).
- Échelle z imposée : `z-0/10/20/30/40/50` via constantes (`src/lib/design.ts`), plus de
  `z-50` en vrac sur 11 sites.
- `safe-area-inset` : `env(safe-area-inset-*)` sur le retour-haut, le drawer, le header.
- `cn()` = `clsx` + `tailwind-merge` (`src/lib/cn.ts`), puis conversion progressive des
  template-strings de classes.
- `size-*` pour les éléments carrés (91 paires `h-N w-N`).
- `text-balance` sur les titres, `text-pretty` sur les paragraphes, `tabular-nums` sur
  toutes les données chiffrées.

### Primitives *(décision commanditaire : Base UI)*

- `Dropdown` (header, menus) → `@base-ui-components/react` Menu/DropdownMenu.
- `ConfirmDialog` + les 2 `window.confirm` → Base UI Dialog (`AlertDialog` sémantique
  pour le destructif : suppression, blocage, modération).
- Le `<details>` maison et les disclosures → Base UI.
- **Toast conservé maison** *(mon choix)* : il est déjà `role="status"`/`aria-live`, testé
  et utilisé sur ~20 sites ; le migrer coûte cher sans gain visible pour la démo. Il est
  audité ( focus, fermeture, pile) et documenté comme écart assumé.

### Ordre d'exécution *(mon choix)*

1. **Lot A — fondations** : `globals.css` (tokens, z, dvh, safe-area, typo), `cn`,
   `design.ts`, `clsx`/`tailwind-merge`/Base UI installés, build vert.
2. **Lot B — composants partagés** : boutons, cartes, badges, champs, vides, skeletons,
   header + navigation latérale, footer. C'est ici que le look se joue.
3. **Lot C — pages par trafic** : accueil, forum (+ détail), annuaire, connexion/inscription,
   jobs, projets, tutos, événements, mentorat, messagerie, mon-espace, admin, 404/erreurs.
4. **Lot D — primitives** : migration dropdown → Base UI, dialogue → Base UI, disclosures.
5. **Lot E — audit final** : re-passe `baseline-ui` (grep de conformité), contraste AA
   re-mesuré sur les nouveaux états, 375/768/1024/1440, clavier seul, build + tests.

Chaque lot = un commit, `main` verte, déploiement vérifié (curl live + marqueurs de build).

## Ce qui reste au builder

- Le mapping exact des 3 surfaces vers les primitives Base UI (Menu, Dialog, Popover).
- Les valeurs de l'échelle z et de l'échelle de rayons.
- Les choix de densité page par page (largeurs max, colonnes, espacements).
- Le sort exact de `RetourHaut` (le garder, stylé safe-area, ou le fondre dans la nav).
- L'arbitrage final orange : présent sur une action par vue, ou réduit aux seules cibles
  marketing (accueil).

## Relecture builder (2026-10-14) — points tranchés

Relecture par un agent « builder » neuf. Ses 5 questions, classées :

| # | Question du relecteur | Réponse | Statut |
|---|---|---|---|
| 1 | Quelles routes sur les 31 reçoivent une passe page dans le Lot C, et le reste ? | **Les 31.** Réponse du commanditaire « all of them ». Les routes non listées explicitement (favoris, notifications, profil, parametres, onboarding, recherche, mot-de-passe-oublie, reinitialisation, forum/tags, membres/[slug], formulaires de création, routes détail) reçoivent la même traitement : héritage des composants du Lot B **plus** une passe page (largeurs, grilles, espacements). | tranché |
| 2 | Les tests existants sont-ils gelés, ou modifiables dans le même lot ? | **Modifiables dans le même commit que le changement de DOM volontaire**, jamais pour masquer une régression. Règle : aucun test supprimé ni assoupli sans justification explicite dans le message de commit ; si un test change, le commit dit pourquoi. | mon choix |
| 3 | De nouvelles chaînes UI sont-elles autorisées, et doivent-elles exister en FR **et** EN ? | **Oui en FR.** `t()` retombe sur FR puis sur la clé (jamais de clé brute affichée), donc l'EN hérite du FR sans travail supplémentaire. Le jury voit le site en FR (locale par défaut). | mon choix |
| 4 | Le builder pousse-t-il directement sur `main` ? | **Oui** — c'est le mode de travail depuis le début du projet (chaque lot = commit + push → déploiement Vercel automatique vérifié par curl + marqueurs de build). | tranché |
| 5 | Le `confirm()` natif de `admin/bouton-moderation.tsx` (modération) est-il dans le Lot D ? | **Oui**, il est dans le périmètre : il couvre une action destructive sur une page listée au Lot C, et coercer `window.confirm` contredit l'objectif 4. | mon choix |

Aucune question bloquante restante : le relecteur confirme que le document suffit à planifier.
