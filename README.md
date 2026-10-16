# CodeXchange

**La plateforme africaine pour les développeurs — par les devs, pour les devs.**

> 🏆 Projet de hackathon — démo prévue le **25 octobre 2026**.  
> Repo : [`Ggboykxz/CodeXchange`](https://github.com/Ggboykxz/CodeXchange) · Stack : Next.js 16, TypeScript, Tailwind CSS v4, Base UI, Prisma (SQLite→Postgres), Vitest.  
> Démo en ligne : <https://code-x-change-seven.vercel.app> (`/api/sante` pour l'état).

---

## Lancer le projet en local

```bash
git clone https://github.com/Ggboykxz/CodeXchange.git
cd CodeXchange
npm install
npm run db:generate   # si besoin
npm run db:migrate    # crée prisma/dev.db
npm run seed          # 30 membres, 15 sujets, 10 offres, 8 projets, 6 événements, 8 tutos, 6 mentors
npm run dev           # http://localhost:3000
```

Vérifications qualité :

```bash
npm run lint
npm test               # Vitest, lint + tests bloquants
npx tsc --noEmit
npm run build
```

Scripts utiles : `npm run build`, `npm start`, `npm run seed`, `npm run test:watch`.

## Fonctionnalités (v1)

- **Forum** : sujets, réponses, likes idempotents, tags, recherche insensible à la casse, filtre par tag.
- **Emplois** : offres (contrat, remote, pays), filtres persistés, postulation unique (409 sinon).
- **Projets** : annonces co-fondateurs, bouton « je veux rejoindre » (idempotent).
- **Annuaire** : membres filtrables par pays/stack/recherche, profil public, drapeau par pays, avatar uploadé ou à couleur déterministe.
- **Tutos** : articles avec durée, tags, rendu markdown maison (HTML échappé — sûr).
- **Événements** : liste avec badges Passé/À venir, RSVP avec compteur.
- **Mentorat** : profils de mentors et demande de mentorat enregistrée.
- **Notifications** : réponses, likes, candidatures, rejoindre un projet, demandes de mentorat, messages.
- **Recherche globale** : une barre, cinq rubriques, résultats groupés.
- **Messagerie privée** : conversations entre membres, statut lu/non-lu.
- **Favoris** : sauvegarde de sujets, offres, projets, tutos, événements, membres.
- **Interactions riches** : réponses imbriquées (1 niveau), édition, suppression douce, likes par réponse.
- **Profil** : page personnelle avec upload d'avatar (PNG/JPEG/WebP, 500 Ko max).
- **Administration** : tableau de bord statistiques et modération (rôle `ADMIN`).

Comptes : inscription e-mail/mot de passe, session en cookie `httpOnly` (14 jours), rate-limiting 5 tentatives / 15 min sur la connexion.

## Interface (refonte baseline)

L'interface a été reprise sur une base de design system vérifiable :

- **Tokens** `--cx-*` dans `src/app/globals.css` (clair + sombre), utilitaires
  `cx-*` mappés par `@theme inline` : un seul accent orange par vue, bleu pour
  les liens/l'état actif/la donnée.
- **Primitives Base UI** (`src/components/ui/`) pour menu, popover et
  dialogue : `role="menu"`, navigation aux flèches, retour du focus sur le
  déclencheur, `alertdialog` pour les confirmations, focus piégé.
- **Accessibilité vérifiée** : contrastes WCAG calculés dans les deux thèmes
  (`tests/contraste.test.ts`), cibles tactiles, anneau de focus global,
  `text-wrap: balance/pretty`, safe-areas iOS sur tous les éléments `fixed`.
- **Mouvement sobre** : transitions ≤ 200 ms sur `transform`/`opacity`
  uniquement, `prefers-reduced-motion` respecté.
- **Mobile-first** : `h-dvh`, grilles empilées, drawer latéral dès 375 px
  (contenu derrière le voile en `inert`).

Preuves et checklist navigateur : [`docs/verification-ui.md`](docs/verification-ui.md).

## Langue

L'interface commune (navigation, pied de page, accueil) est bilingue **FR / EN** avec un sélecteur dans l'en-tête ; les contenus métier (forum, offres, descriptifs) restent en français.

## Données de démonstration

```bash
npm run seed
```

Mot de passe commun des 30 membres de démo : `CodeXchange2026!`. Les données sont reproductibles et re-générées idempotentes (les re-lancements nettoient puis remplissent).

## Architecture

- **Next.js 16** (App Router, `src/`) pour le front et l'API (route handlers).
- **Prisma + SQLite** en dev, bascule PostgreSQL (Neon) au déploiement par l'édition de `provider` dans `schema.prisma` + `prisma migrate deploy`.
- **Logique métier isolée** dans `src/lib/*.ts` — testable sans HTTP, handlers minces qui traduisent les codes d'erreur (`src/lib/errors.ts`) en statuts HTTP.
- **Authentification** : `bcryptjs` + table `Session` + cookie signé côté serveur. Aucun service tiers.
- **Design** : Tailwind CSS v4 (`@theme inline`), tokens dans `src/app/globals.css`, primitives [Base UI](https://base-ui.com) (`src/components/ui/`), polices via `next/font/google` (Plus Jakarta Sans). Choix et arbitrage dans `docs/design-choices.md`, vérification dans `docs/verification-ui.md`.
- **Tests** : Vitest 4 + Testing Library (jsdom), **237 tests** à date (dont 11 de conformité design, 7 de contraste WCAG, 8 de comportement clavier), lint et tsc bloquants.
- **Sécurité** : rate-limiting distribué (Redis/Upstash, repli mémoire) sur connexion, inscription, réponses et messages ; signalements communautaires ; bannissement de comptes ; `npm audit` propre côté production (Next 16, React 19.3).
- **E-mails** : transport Resend (`RESEND_API_KEY`) avec repli console ; e-mail de bienvenue + e-mails de notification.
- **Stockage** : avatars en base (data URL) en dev, Vercel Blob (`BLOB_READ_WRITE_TOKEN`) en production.
- **Langue** : interface complète FR/EN (sélecteur dans l'en-tête, cookie `cx_locale`) ; contenus utilisateurs dans leur langue d'origine.

## Structure du dépôt

```
src/
  app/                  # pages + route handlers (API)
  components/           # Header, Footer, EmptyState, Badge, Button, Avatar, Container, ui/ (menu, popover, dialogue)
  lib/                  # métier (auth, session, forum, jobs, projects, members, events, tutorials, mentorat, notifications, messagerie, favorites, search, admin, mailer, rate-limit, i18n, errors, db, fonts, seed, contrats, drapeaux, markdown)
docs/
  superpowers/specs/    # spec de design
  superpowers/plans/    # plan d'implémentation (12 tâches)
  design-choices.md     # décision de design (ui-ux-pro-max)
  verification-ui.md    # preuves de conformité de la refonte + checklist navigateur
  deployment.md         # niveaux de déploiement
prisma/                 # schema + migrations + seed
tests/                  # Vitest
```

## Déploiement

Trois niveaux (voir `docs/deployment.md`) :
1. **Vercel + Neon** — si compte créé (recommandé).
2. **Tunnel cloudflared** — 0 compte, machine en ligne pendant la démo.
3. **GitHub Pages** statique — dernier recours.

CI GitHub Actions : `npm ci` → `prisma generate` → `migrate deploy` → lint → tests, **bloquants** sur chaque push.

## Licence

À définir (code du hackathon).