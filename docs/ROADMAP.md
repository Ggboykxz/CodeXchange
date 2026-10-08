# Feuille de route — CodeXchange

> **Statut honnête au 08/10/2026** (mis à jour après commit `4ab914d`), lu dans le code de ce dépôt (pas dans une intention de roadmap).
> Légende : ✅ fait et vérifiable ici · ⏳ partiellement fait · ⬜ rien de fait pour l'instant.

## Vue d'ensemble par phase

| Phase | Contenu | Statut |
|---|---|---|
| **Hackathon J1–J2** | Fondations (Prisma 13 modèles, seed), auth par session serveur, Q&R Markdown, votes + meilleure réponse, annuaire + édition de profil, lecture jobs/projets/tutos/events, mentorat, notifications in-app, i18n fr/en, dark mode, PWA hors-ligne, CI | ✅ **livré** (détail ligne par ligne ci-dessous) |
| **Bascule PostgreSQL** | `provider = "postgresql"` en local, CI (service `postgres:16`) et Vercel ; `mode: "insensitive"` sur les 24 filtres de recherche (SQLite les rendait insensibles à la casse par défaut) ; `.env.example`, README et docs alignés | ✅ **livré** — bloquait le déploiement Vercel (disque des fonctions en lecture seule) |
| **Beta privée S1–S4** | ~~Traductions sw/ar~~ ✅ (D2), ~~RTL arabe~~ ✅ (D3), ~~filtre « non résolu » en UI~~ ✅, ~~création de contenus~~ ✅ (M1), ~~messagerie privée + temps réel~~ ✅ (I2/I3), ~~tests E2E~~ ✅ (J7) ; e-mails transactionnels : code prêt (`lib/mailer`), **identifiants SMTP à poser** | ✅ **livré** sauf SMTP (I4 en attente de `SMTP_*`) |
| **Beta publique M2–M3** | ~~OAuth GitHub/Google~~ ✅ maison (B6 — activation prod = poser les client IDs), ~~modération communautaire~~ ✅ (M1), ~~compteurs de home fiables~~ ✅, ~~landings SEO par module~~ ✅ (S1) | ✅ **livré** |
| **Croissance M4–M6** | ~~Paiement mobile money~~ ✅ mock (P1 — brancher un vrai prestataire via `PaymentProvider`), offres sponsorisées, programme de mentorat structuré (acceptation/refus côté mentor), API publique | ⏳ **partiel** (paiement mock livré, reste le vrai provider) |
| **Consolidation M7–M12** | Applications mobiles légères, analytics communauté, gouvernance open-source, extension diaspora | ⬜ à venir |

---

## Détail : ce qui est **réellement fait dans ce dépôt**

### ✅ Fait (vérifiable dans le code)

| Élément | Preuve dans le dépôt |
|---|---|
| Schéma Prisma 16 modèles (User, Session, Profile, Thread, Post, Vote, Job, Project, Tutorial, Event, Mentor, Mentorship, Notification, Conversation, Message, NewsletterSubscriber) | `prisma/schema.prisma` |
| Seed de démonstration (31 comptes, 40 questions, 100 réponses, 10 offres, 8 projets, 8 tutos, 6 events, 8 mentors) | `scripts/seed.ts` |
| Auth par sessions serveur : inscription, connexion, déconnexion révocable, `/api/auth/me` | `src/app/api/auth/*`, `src/lib/auth.ts` |
| Mots de passe PBKDF2-SHA512 100k itérations + anti-énumération temporelle | `src/lib/password.ts` |
| Cookie `cx_session` httpOnly, TTL 30 jours, hash SHA-256 du jeton en base | `src/lib/auth.ts`, modèle `Session` |
| Création de questions + réponses, Markdown (GFM, coloration, bouton copier) | `src/app/api/threads/**`, `src/components/shared/markdown.tsx` |
| Votes (API `+1 / -1 / 0`), anti-auto-upvote, recount des compteurs | `src/app/api/votes/route.ts` |
| Meilleure réponse (auteur ou modérateur), passage en `solved`, transaction | `src/app/api/posts/[id]/route.ts` |
| Recherche plein-texte (titre, corps, tags) + filtres catégorie / tag / `solved` | `src/app/api/threads/route.ts` |
| Annuaire avec filtres pays/ville/stack/niveau/disponibilité + recherche | `src/app/api/profiles/route.ts` |
| Édition de son propre profil (champs whitelistés zod) | `PATCH /api/profiles/me` |
| Jobs, projets, tutos, events : **lecture + création** (formulaires M1, `POST` zod + rate limit) + filtres + détail | `GET/POST /api/{jobs,projects,tutorials,events}` |
| Mentorat : liste des mentors + demande (message/objectif) avec garde-fous (doublon, complétude, soi-même) | `src/app/api/mentors/**` |
| **Mentorat : inbox complète** — `GET /api/mentorships` (listes `incoming`/`mine`), `PATCH /api/mentorships/[id]` (accepter/refuser/terminer avec garde de capacité et libération du slot), visio Jitsi intégrée, bouton depuis le profil public | `src/app/api/mentorships/**`, `mentorat-section.tsx`, `annuaire-section.tsx` |
| **Jobs : filtre devise + offres épinglées** — `?currency=` sur `salary`, `Job.featured` avec garde-fou staff-only sur le PATCH, tri « à la une » dans la liste | `src/app/api/jobs/**`, `prisma/schema.prisma` |
| **Badges, paliers, classement** — cœur pur `lib/badges.ts` (paliers Novice→Légende sur la réputation, 5 badges de jalons sur compteurs réels), `stats` agrégées sur `GET /api/profiles/[username]`, `GET /api/leaderboard` top 10, UI badges+palier sur le profil et carte « Top contributeurs » dans l'annuaire | `src/lib/badges.ts`, `src/app/api/leaderboard/**` |
| Notifications in-app : création (réponse, acceptation, mentorat), listing, lecture, tout-lu, cloche avec badge | `src/lib/notify.ts`, `src/app/api/notifications/**`, `notification-bell.tsx` |
| i18n : 4 locales **réelles** typées (fr, en, sw, ar — **380 clés** chacune, plus de `{ ...en }`, test de parité `tests/i18n.test.ts`), `dir=rtl` piloté par `LocaleSync` + propriétés logiques CSS, sélecteur à drapeaux, locale persistée | `src/i18n/dictionaries.ts` |
| PWA : manifest + icônes 192/512/maskable + `offline.html` + service worker maison (SWR assets, network-first pages, `/api` jamais caché) | `public/manifest.webmanifest`, `public/sw.js` |
| Dark mode (clair par défaut) | `next-themes`, `theme-toggle.tsx` |
| Rate limiting (auth 10/min/IP, login 5/5 min/email, écritures 30/min) + `429` avec `Retry-After` | `src/lib/rate-limit.ts`, `src/proxy.ts` |
| En-têtes de sécurité + CSP + HSTS en production | `src/proxy.ts` |
| Validation zod de toutes les entrées, pagination bornée à 100 | `src/lib/validate.ts` |
| Pas de fuite de `passwordHash` / `email` | `src/lib/selects.ts`, `src/lib/api.ts` |
| CI GitHub Actions : install → `migrate deploy` → generate → lint → `next typegen` → typecheck → build (+ Playwright 23 scénarios) | `.github/workflows/ci.yml` |
| **Fil d'accueil type réseau social** : tri `new`/`top`/`active`, filtre non résolus, votes `↑↓` optimistes (`myVote` dans la liste), composeur, `Charger plus`, colonne (CTA + compteurs réels + modules) | `src/components/sections/feed-section.tsx`, `src/app/api/threads/route.ts` |
| **Carte de discussion partagée** (rail de vote, avatar, réputation, temps relatif, titre en lien) utilisée par le fil **et** le forum | `src/components/shared/thread-card.tsx` |
| **Navigation du navigateur** : nav en `<a href="#…">`, `pushState`, écouteurs `hashchange`/`popstate` → Retour/Avant opérationnels | `src/store/app-store.ts`, `src/app/page.tsx` |
| **Compteurs 100 % réels** : plus aucun chiffre codé en dur (test qui refuse les valeurs inventées) | `GET /api/stats`, `tests/i18n.test.ts` |
| **Messagerie privée + temps réel** — modèles `Conversation`/`Message` (paire normalisée, `readAt`), écran `#messages` deux volets, SSE `/api/events` (cloche + fil sans rechargement) | `src/app/api/messages/**`, `src/app/api/events/**`, `messages-section.tsx` |
| **Migrations versionnées** — baseline `0_init` (16 tables) + `migration_lock.toml`, `migrate resolve` fait sur local **et** Neon, CI et build Vercel passent par `migrate deploy` | `prisma/migrations/` |
| **OAuth maison GitHub/Google (B6)** — flux autorisation + PKCE sans dépendance, `/api/oauth/*`, boutons d'inscription/connexion | `src/app/api/oauth/**`, `src/lib/oauth.ts` |
| **E-mails transactionnels (I4)** — `lib/mailer` (nodemailer) : bienvenue, vérification, réinitialisation, digest newsletter ; aperçu en journal sans `SMTP_HOST` | `src/lib/mailer.ts` |
| **Tests E2E Playwright en CI (J7)** — 23 scénarios (fil Reddit, rôles, newsletter, recherche, RTL, jobs, messagerie, temps réel) contre `next start` | `tests/e2e/**` |
| **Modération communautaire (M1)** — signalements (modèle `Report`, API, dialog UI), journal (`ModerationLog`), onglets admin (Rôles / Signalements / Journal), épinglages tracés | `prisma/migrations/20261008100704_moderation`, `src/app/api/reports/**`, `src/components/sections/admin-*` |
| **Routes réelles + SEO (S1)** — `app/[...section]/page.tsx` avec `generateMetadata` par section, store migre vers chemins réels (`/forum`, `/jobs`…), sitemap liste toutes les routes indexables, robots.txt | `src/app/[...section]/page.tsx`, `src/store/app-store.ts`, `src/app/sitemap.ts` |
| **Poids bundle en CI (B1)** — `scripts/check-bundle-size.ts` mesure les `rootMainFiles` en gzip, échoue si > 150 Ko (limite CDC), étape CI après Build | `scripts/check-bundle-size.ts`, `.github/workflows/ci.yml` |
| **Paiement mobile money (P1)** — modèle `Transaction`, API initiate/status/confirm, `PaymentProvider` interface + `MockProvider` (dev/démo, confirmation après 3 s), dialog de paiement dans le profil mentor | `prisma/migrations/20261008105240_payment_transaction`, `src/app/api/payments/**`, `src/lib/payments/**` |
| Licence MIT | `LICENSE` |

---

## Milestones M0 → M4 (critères de sortie)

| Milestone | Fenêtre | Critères de sortie (définissables, vérifiables) |
|---|---|---|
| **M0 — Démo stable** ✅ | J1–J2 | `bun install` → `db:deploy` → `scripts/seed.ts` → `dev` en 4 commandes ; les 3 parcours de `docs/DEMO.md` passent sans erreur ; `bun run check` vert ; CI verte sur `main`. **Atteint.** |
| **M1 — Produit complet en lecture/écriture** ✅ | S1–S4 | Formulaires de création jobs/projets/tutos/events ; mentor peut répondre à une demande ; au moins 1 test E2E Playwright sur le parcours Q&R |
| **M2 — Multilingue + portabilité** ✅ | M1–M2 | 100 % des clés traduites en sw et ar (D2, test de parité) ; `lang`/`dir` pilotés par la locale (`dir="rtl"` pour `ar`, D3) ; bascule PostgreSQL effectuée avec **`prisma migrate` versionné** (A8, baseline `0_init` en CI et en prod) et seed ré-exécuté sans erreur. **Atteint.** |
| **M3 — Confiance & ouverture** ✅ | M2–M3 | OAuth GitHub/Google opérationnel (B6) ; e-mail de bienvenue + réinitialisation (I4 code prêt, `SMTP_*` à poser) ; outils de modération (signalement M1, rôles B8, épinglage) ; compteurs home tous issus de `/api/stats` ; budget de poids vérifié en CI (B1, ≤ 150 Ko gzip). **Atteint** sauf I4 prod (SMTP). |
| **M4 — Monétisation & échelle** ⏳ | M4–M6 | Paiement mobile money sur un flux réel (**mock P1 livré**, brancher Orange Money/MTN/Wave via `PaymentProvider`) ; 100 offres et 100 binômes atteints ; API publique documentée ; rate limiting distribué (Redis/Upstash) derrière une instance multi-nœuds |

---

### Notes de séquence

1. **Avant M1**, corriger l'attribution des `+2` de réputation (le votant reçoit aujourd'hui les points) : c'est un défaut de produit visible dès la démo.
2. **Avant M2**, trancher l'objectif de poids : **100 Ko (CDC)** ou **150 Ko (code actuel)** — et l'automatiser en CI pour ne plus en discuter.
3. **Avant M3**, écrire les premiers tests : aujourd'hui la CI ne vérifie que lint, types et build.
4. Le **mobile money** et la **messagerie** restent les deux chantiers les plus structurants (modèle de données + conformité) : les planifier dès la beta privée, pas à la croissance.
