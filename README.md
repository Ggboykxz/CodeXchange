# CodeXchange

**La plateforme africaine pour les développeurs — par les devs, pour les devs.**

> 🏆 Projet de hackathon — démo prévue le **25 octobre 2026**.  
> Repo : [`Ggboykxz/CodeXchange`](https://github.com/Ggboykxz/CodeXchange) · Stack : Next.js 15, TypeScript, Tailwind CSS, Prisma (SQLite→Postgres), Vitest.

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
- **Annuaire** : membres filtrables par pays/stack/recherche, profil public, drapeau par pays, avatar à couleur déterministe.
- **Tutos** : articles avec durée, tags, rendu markdown maison (HTML échappé — sûr).
- **Événements** : liste avec badges Passé/À venir, RSVP avec compteur.
- **Mentorat** : profils de mentors et demande de mentorat enregistrée.

Comptes : inscription e-mail/mot de passe, session en cookie `httpOnly` (14 jours).

## Langue

Toute l'interface et le copy sont **en français**.

## Données de démonstration

```bash
npm run seed
```

Mot de passe commun des 30 membres de démo : `CodeXchange2026!`. Les données sont reproductibles et re-générées idempotentes (les re-lancements nettoient puis remplissent).

## Architecture

- **Next.js 15** (App Router, `src/`) pour le front et l'API (route handlers).
- **Prisma + SQLite** en dev, bascule PostgreSQL (Neon) au déploiement par l'édition de `provider` dans `schema.prisma` + `prisma migrate deploy`.
- **Logique métier isolée** dans `src/lib/*.ts` — testable sans HTTP, handlers minces qui traduisent les codes d'erreur (`src/lib/errors.ts`) en statuts HTTP.
- **Authentification** : `bcryptjs` + table `Session` + cookie signé côté serveur. Aucun service tiers.
- **Design** : Tailwind CSS v4 (`@theme inline`), tokens dans `src/app/globals.css`, polices via `next/font/google` (Plus Jakarta Sans). Choix et arbitrage dans `docs/design-choices.md`.
- **Tests** : Vitest, ≥ 100 tests à date (comptage réel selon build), lint et tsc bloquants.

## Structure du dépôt

```
src/
  app/                  # pages + route handlers (API)
  components/           # Header, Footer, EmptyState, Badge, Button, Avatar, Container
  lib/                  # métier (auth, session, forum, jobs, projects, members, events, tutorials, mentorat, errors, db, fonts, seed, contrats, drapeaux, markdown)
docs/
  superpowers/specs/    # spec de design
  superpowers/plans/    # plan d'implémentation (12 tâches)
  design-choices.md     # décision de design (ui-ux-pro-max)
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