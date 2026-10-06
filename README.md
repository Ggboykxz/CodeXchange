# CodeXchange

[![CI](https://github.com/Ggboykxz/CodeXchange/actions/workflows/ci.yml/badge.svg)](https://github.com/Ggboykxz/CodeXchange/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io)

> **La plateforme d'échange pour les développeurs africains — par les devs, pour les devs.**

CodeXchange réunit les développeurs africains et de la diaspora sur **une seule plateforme** : forum Q&R, jobs, projets open-source, mentorat, tutos & events, annuaire. Pensée pour le terrain africain : multi-langues, offline-friendly, légère sur mobile, et conçue pour des connexions qui coupent.

**Public visé** — développeurs juniors à seniors basés en Afrique ou en diaspora, recruteurs et startups tech locales, mentors seniors, et communautés (meetups, hub, bootcamps).

---

## Ce qu'on voit à l'écran

Une application mono-page (navigation par hash : `#forum`, `#jobs`, `#mentorat`…) avec un header collant — logo `$ codexchange.dev`, navigation, cloche de notifications, sélecteur de langue, bascule clair/sombre — et une home « style terminal » qui affiche les compteurs réels de la plateforme (`GET /api/stats`), les 3 derniers profils, les 6 modules et un CTA d'inscription. Chaque section (forum, jobs, projets, mentorat, tutos, annuaire) est chargée dynamiquement pour garder la première charge légère.

> Les captures d'écran ne sont pas versionnées dans ce dépôt : à produire depuis `bun run start` (voir `docs/ENVIRONNEMENTS.md` pour le plan de tournage).

---

## Fonctionnalités réellement livrées

Tout ce qui suit **existe aujourd'hui dans ce dépôt** (rien n'est repris de la roadmap) :

| Domaine | Ce qui marche |
|---|---|
| **Auth** | Inscription, connexion, déconnexion par **sessions serveur** en base (`cx_session`, cookie `httpOnly`), TTL 30 jours, révocation serveur immédiate à la déconnexion, **vérification d'e-mail** (jeton de 24 h, badge `profil vérifié` sur le profil public) |
| **Forum Q&R** | Questions avec titre/catégorie/tags, corps en **Markdown** (GFM, blocs de code colorés + bouton copier), réponses, **votes**, **meilleure réponse** (→ badge « Résolu »), compteur de vues |
| **Recherche & filtres** | Recherche plein-texte côté serveur (titre, corps, tags — `?q=`), filtres catégorie et tags, debounce 250 ms ; filtres pays/type/stack/remote côté jobs et statut/stack côté projets (**côté serveur**), catégorie côté tutos et ville côté annuaire (**filtre client**), pays/stack/niveau/disponibilité côté annuaire (serveur) |
| **Annuaire** | Liste des profils, filtres, page profil publique (activité récente : discussions, projets, tutos), **édition de son propre profil** (`PATCH /api/profiles/me`) avec accroche, bio, pays, ville, stack, niveaux, réseaux, disponibilité |
| **Jobs** | Offres avec détail, filtres pays / type de contrat / stack / « Remote uniquement », bouton « Postuler » (lien externe) |
| **Projets** | Cartes projet, statut (Idée → MVP → Beta → En production → Maintenu), liens repo / démo |
| **Tutos & Events** | Onglets Tutos / Events, détail de tuto, agenda des events avec compteur de participants et lien RSVP |
| **Mentorat** | Annuaire de mentors (note, avis, places restantes, tarif, langues), demande de mentorat avec message + objectif, refus des demandes en double et des mentors complets |
| **Notifications in-app** | Cloche avec badge, 30 dernières notifications, compteur de non-lues, « Tout marquer comme lu », navigation in-app au clic, polling 60 s ; déclenchées par réponse, meilleure réponse acceptée et demande de mentorat |
| **i18n** | 4 locales (fr/en/sw/ar), sélecteur à drapeaux, dictionnaire partagé, FR et EN traduits |
| **PWA / hors-ligne** | Manifest + icônes 192/512/maskable, **service worker écrit à la main** : `stale-while-revalidate` sur les assets, `network-first` sur les navigations (pages déjà visitées restent lisibles hors ligne), `/api/*` jamais mis en cache, page `/offline.html` |
| **Dark mode** | `next-themes`, thème clair par défaut, bascule dans le header |
| **Qualité** | Validation **zod** sur toutes les entrées, rate limiting, en-têtes de sécurité + CSP, sélecteurs Prisma « publics » (pas de fuite de `passwordHash`), CI GitHub Actions |

**Honnêteté sur les limites actuelles** :

- **Jobs, projets, tutos et events sont en lecture seule** : les API n'exposent que `GET`, il n'existe pas encore de formulaire de création côté client (les données viennent du seed).
- **L'interface n'expose que le vote +1** (l'API accepte aussi `-1` et `0`), et on ne peut pas upvoter sa propre contribution (422).
- **La réputation est calculée par le serveur et rendue dans l'UI** — règles du CDC §3.2 : `+10`
  réponse acceptée, `+2` réponse votée, `−1` question downvotée, versées à **l'auteur du contenu
  voté** (jamais au votant). Elle apparaît sur le profil de l'annuaire et à côté de l'auteur de
  chaque réponse ; elle est aussi relisible via `GET /api/profiles/[username]`.
- Le filtre « non résolu » existe en API (`GET /api/threads?solved=false`) **sans sélecteur correspondant dans l'interface**.
- Le chiffre affiché en home pour « Développeurs » (`12,400+`) et « Pays représentés » (`54`) est **figé côté client** : seuls discussions, offres, projets et mentors viennent réellement de `/api/stats`.

---

## Stack technique

Vérifiée dans `package.json` :

| Brique | Version déclarée | Usage |
|---|---|---|
| **Next.js** (App Router) | `^16.1.1` | Route handlers, `output: "standalone"`, proxy de sécurité |
| **React** | `^19.0.0` | UI, Server/Client components |
| **TypeScript** | `^5` | Typage strict, `tsc --noEmit` en CI |
| **Prisma + SQLite** | `^6.11.1` | ORM + base locale (`prisma/dev.db`) |
| **Tailwind CSS** | `^4` | Styling (via `@tailwindcss/postcss`) |
| **Zod** | `^4.0.2` | Validation de toutes les payloads d'entrée |
| **react-markdown + remark-gfm** | `^10.1.0` / `^4.0.1` | Rendu Markdown des questions/réponses |
| **react-syntax-highlighter** | `^16` | Coloration des blocs de code (PrismLight : 12 langages importés, 17 alias enregistrés) |
| **Zustand** | `^5.0.6` | État client (navigation + locale + utilisateur) |
| **next-themes** | `^0.4.6` | Dark mode |
| **Radix UI / shadcn** | plusieurs | Dialogs, selects, menus, switches… |
| **ESLint** | `^9` + `eslint-config-next` | `bun run lint` |

### Écart avec la fiche technique du projet (PostgreSQL / Supabase)

La fiche technique du projet cible **PostgreSQL/Supabase** ; ce dépôt tourne sur **SQLite** :
c'est le choix retenu pour le hackathon (base unique, zéro service externe, `db push` instantané).
**Passer en PostgreSQL/Supabase** se résume à deux changements : le `provider` du bloc `datasource db`
dans `prisma/schema.prisma` (`"sqlite"` → `"postgresql"`) et la valeur de `DATABASE_URL` dans `.env`
(`file:./dev.db` → `postgresql://user:pass@host:5432/codexchange`, ou l'URL Supabase du projet).
Ensuite : `bunx prisma migrate dev --name init` (les migrations PostgreSQL sont à créer, elles
n'existent pas encore — seul `db push` a été utilisé jusqu'ici), `bunx prisma generate`, puis relancer
`bun run scripts/seed.ts`. Aucune requête SQL brute n'est écrite dans le code : seule l'écriture Prisma
change.

---

## API — 27 endpoints (24 fichiers `route.ts`)

« Session » = cookie `cx_session` valide recherché côté serveur. Deux marqueurs :
**session** = lit la session et dégrade proprement si elle est absente (`{ user: null }`, liste vide) ;
**session requise** = répond `401` sans cookie valide.

| Méthode | Chemin | Rôle |
|---|---|---|
| GET | `/api` | Ping (`{ message }`) — public |
| GET | `/api/stats` | Compteurs globaux (`users`, `threads`, `jobs`, `projects`, `mentors`, `tutorials`, `events`, `countries`) — public, cache 60 s |
| POST | `/api/auth/register` | Créer un compte + ouvrir une session — public (rate limit) |
| POST | `/api/auth/login` | Connexion — public (rate limit IP + email) |
| GET | `/api/auth/me` | Utilisateur courant (`{ user: null }` sinon) — session |
| DELETE | `/api/auth/me` | Déconnexion : révocation serveur du jeton + cookie vidé — session |
| POST | `/api/auth/verify` | Valide l'adresse par le jeton du lien (24 h, hashé en base) — public (rate limit) |
| POST | `/api/auth/verify/resend` | Réémet un lien — **toujours `200`**, que l'adresse existe ou non — session ou `email` |
| GET | `/api/threads` | Questions : `?q=&category=&tag=&solved=&page=&limit=` — public |
| POST | `/api/threads` | Créer une question — **session requise** |
| GET | `/api/threads/[slug]` | Détail + réponses (tri : meilleure réponse, puis upvotes) + incrémente les vues — public |
| POST | `/api/threads/[slug]/posts` | Répondre — **session requise** |
| PATCH | `/api/posts/[id]` | Marquer/démarquer la meilleure réponse (auteur de la question ou modérateur) — **session requise** |
| POST | `/api/votes` | Voter `1` / `-1` / `0` sur une question ou une réponse — **session requise** |
| GET | `/api/profiles` | Annuaire : `?country=&city=&stack=&level=&available=&q=&limit=` — public |
| GET | `/api/profiles/[username]` | Profil détaillé (inclut `reputation`, activités récentes) — public |
| PATCH | `/api/profiles/me` | Éditer son profil — **session requise** |
| GET | `/api/mentors` | Liste des mentors — public |
| POST | `/api/mentors/[id]/request` | Demande de mentorat (message + objectif) — **session requise** |
| GET | `/api/jobs` | Offres : `?country=&type=&remote=&stack=&q=` — public |
| GET | `/api/projects` | Projets : `?status=&stack=&q=` — public |
| GET | `/api/tutorials` | Tutos : `?category=&q=` — public |
| GET | `/api/tutorials/[slug]` | Détail d'un tuto — public |
| GET | `/api/events` | Événements — public |
| GET | `/api/notifications` | 30 dernières notifications + compteur de non-lues — session (liste vide sinon) |
| PATCH | `/api/notifications` | Marquer une notification comme lue — **session requise** |
| POST | `/api/notifications/read-all` | Tout marquer comme lu — **session requise** |

Les réponses publiques passent par `json()` (`src/lib/api.ts`), qui retire systématiquement `passwordHash`
et tout `email` ; l'auteur d'une écriture est toujours lu dans la session, jamais dans le corps de requête.

---

## Modèles Prisma (13)

| Modèle | Rôle |
|---|---|
| `User` | Compte : email unique, `passwordHash`, rôle (`member`/`moderator`/`admin`), réputation |
| `Session` | Session serveur : **hash SHA-256** du jeton, `expiresAt`, UA et IP — jamais le jeton brut |
| `Profile` | Profil public : username unique, accroche, bio, pays/ville, stack, niveau, réseaux, disponibilité |
| `Thread` | Une question du forum : titre, slug unique, corps Markdown, tags, catégorie, vues, upvotes, `solved` |
| `Post` | Une réponse, avec `isAnswer` (meilleure réponse) et upvotes dénormalisés |
| `Vote` | Vote `1`/`-1` par utilisateur et par cible (unique `userId+kind+refId`) |
| `Job` | Offre d'emploi/mission : entreprise, pays, remote, type, stack, salaire, lien de candidature |
| `Project` | Projet open-source : slug, tagline, repo/demo, statut, « cherche », étoiles |
| `Tutorial` | Tutoriel : slug, extrait, corps, catégorie, temps de lecture |
| `Event` | Événement : dates, lieu/online, url, participants, organisateur |
| `Mentor` | Fiche mentor : expertises, bio, langues, tarif, capacité, places prises, note |
| `Mentorship` | Demande de mentorat : mentor, menté, message, objectif, statut (`pending` → …) |
| `Notification` | Notification in-app : destinataire, acteur, type, titre, corps, lien, `read` |

---

## Démarrage rapide

```bash
# 1. Dépendances
bun install                       # lockfile canonique : bun.lock

# 2. Environnement
cp .env.example .env              # DATABASE_URL, SESSION_SECRET, COOKIE_SECURE

# 3. Base SQLite (crée prisma/dev.db)
bun run db:push                   # prisma db push --accept-data-loss
bun run db:generate               # client Prisma

# 4. Données de démonstration
bun run scripts/seed.ts           # ⚠️ `bunx prisma db seed` : aucun champ `prisma.seed` dans package.json

# 5. Lancer
bun run dev                       # http://localhost:3000 (port 3000, log dans dev.log)
```

### Comptes de démo

Le seed crée **30 comptes** qui partagent **le même mot de passe**, constante `SEED_PASSWORD`
de `scripts/seed.ts` :

```
mot de passe : codexchange2026
```

| Email | Nom | Profil |
|---|---|---|
| `aicha.diallo@codexchange.dev` | Aïcha Diallo | `aicha.dev` — Senior Frontend, Dakar (Sénégal) |
| `kwame.mensah@codexchange.dev` | Kwame Mensah | `kwame.codes` — Backend Go, Accra (Ghana) |
| `fatou.ndiaye@codexchange.dev` | Fatou Ndiaye | `fatou.nb` — Mobile Flutter, Abidjan (Côte d'Ivoire) |

Le seed insère aussi : **40 questions**, **100 réponses**, **10 offres**, **8 projets**, **8 tutos**,
**6 événements**, **8 mentors** (les votes sont générés aléatoirement puis les compteurs `upvotes`
recalculés à partir des votes réels).

> ⚠️ Le texte d'aide affiché dans la modale de connexion (`auth.demo_note`) indique
> `… / password` : c'est un **restant à corriger** dans `src/i18n/dictionaries.ts`, le mot de passe
> réel est `codexchange2026`.

---

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `bun run dev` | Serveur dev Next sur le port 3000 (`tee dev.log`) |
| `bun run build` | `next build` + copie des assets et de `public/` dans `.next/standalone/` |
| `bun run start` | Prod : `NODE_ENV=production bun .next/standalone/server.js` (`tee server.log`) |
| `bun run lint` | `eslint .` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run check` | lint + typecheck + build (une seule commande) |
| `bun run db:push` | `prisma db push --accept-data-loss` |
| `bun run db:generate` | `prisma generate` |
| `bun run db:migrate` | `prisma migrate dev` |
| `bun run db:reset` | `prisma migrate reset` |
| `bun run scripts/seed.ts` | Seed de démonstration (destructif : purge puis réécrit tout) |

**CI** (`.github/workflows/ci.yml`, badge en haut de page) : déclenchée sur `push` vers `main` et sur
les pull requests, une exécution par branche (annulation des runs en cours). Étapes : Bun (latest) +
Node 22 → `bun install --frozen-lockfile` → `cp .env.example .env` → `prisma db push` →
`prisma generate` → `bun run lint` → `bunx next typegen` → `bun run typecheck` → `bun run build`.

---

## Internationalisation

Quatre locales exportées par `src/i18n/dictionaries.ts` :

```ts
export const locales: Locale[] = ["fr", "en", "sw", "ar"];
```

| Locale | Drapeau | État réel |
|---|---|---|
| `fr` — Français (défaut) | 🇫🇷 | **232 clés traduites** |
| `en` — English | 🇬🇧 | **232 clés traduites** (même jeu de clés que le FR) |
| `sw` — Kiswahili | 🇰🇪 | **0 clé propre** : `const sw = { ...en }` hérite intégralement de l'anglais |
| `ar` — العربية | 🇪🇬 | **0 clé propre** : `const ar = { ...en }` hérite intégralement de l'anglais |

Concrètement : **le kiswahili et l'arabe affichent aujourd'hui l'anglais**, seul le cadre (sélecteur,
drapeaux, `Locale` typé) est prêt — la traduction reste à faire. La locale est persistée dans
`localStorage` (`codexchange-storage`).

**RTL (arabe)** : **non implémenté**. `src/app/layout.tsx` écrit `<html lang="fr">` en dur, sans
attribut `dir`, et ne se met pas à jour quand l'utilisateur change de locale ; le manifest PWA
déclare `"dir": "ltr"`. Activer l'arabe correctement demandera de poser `lang`/`dir` sur `<html>`
(`dir="rtl"` pour `ar`) — voir `docs/ROADMAP.md`.

---

## Sécurité

- **Sessions en base** (`src/lib/auth.ts`) : jeton aléatoire de 32 octets, seul son **hash SHA-256**
  est stocké (`Session.tokenHash`) ; cookie `cx_session` `httpOnly`, `sameSite=lax`, `path=/`,
  `secure` piloté par `COOKIE_SECURE`, TTL 30 jours. Déconnexion = suppression de la ligne en base
  (révocation immédiate), purge des sessions expirées au login.
- **Mots de passe** : **PBKDF2-SHA512**, 100 000 itérations, sel 16 octets, format `sel:hash`,
  vérification en temps constant ; un hash « factice » est calculé pour les comptes inconnus afin
  d'égaliser les temps de réponse.
- **Vérification d'e-mail** (`src/lib/verify.ts`) : jeton de 32 octets, stocké **hashé** sous
  `sha256(SECRET:verify:jeton)` — portée distincte de celle des sessions, donc un jeton n'y valide
  jamais dans l'autre contexte — expire au bout de 24 h. `POST /api/auth/verify` valide, `POST
  /api/auth/verify/resend` réémet un lien en répondant **toujours `200`** : répondre « adresse
  inconnue » permettrait de sonder qui possède un compte. Sans serveur mail dans le projet, le
  lien n'est rendu et journalisé (`[verify] …`) **qu'en dev** : le renvoyer à celui qui saisit
  l'adresse neutraliserait la preuve de possession de la boîte.
- **Rate limiting** (`src/lib/rate-limit.ts` + `src/proxy.ts`, fenêtre glissante en mémoire) :
  auth **10/min par IP et par route**, **5/5 min par email** sur le login, écritures **30/min**
  (questions, votes, réponses, mentorat, profils). Réponses `429` avec `Retry-After`.
- **En-têtes de sécurité** posés sur toutes les réponses par le proxy Next 16 (`src/proxy.ts`, ex-middleware) :
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Permitted-Cross-Domain-Policies`,
  une **CSP** (`default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, Jitsi autorisé
  en `frame-src`), et `Strict-Transport-Security` en production.
- **Validation zod** : aucun `req.json()` ne touche Prisma sans schéma (`src/lib/validate.ts`) ;
  longueurs bornées, enums contrôlées (catégories, niveaux, types de contrat), pagination bornée à 100.
- **Pas de fuite de `passwordHash`** : sélecteurs Prisma publics (`src/lib/selects.ts`), + filtre
  récursif dans `src/lib/api.ts` qui retire `passwordHash` et les `email` des réponses publiques.
- **Anti-fraude applicative** : `authorId`, `role`, `isAnswer` ne sont jamais lus dans la payload
  client ; on ne peut pas upvoter sa propre contribution ; une seule meilleure réponse par question
  (transaction) ; demande de mentorat en double refusée.
- **SQLite** : journal et `dev.db` sont `.gitignore` ; le log SQL Prisma n'est activé qu'en dev
  (sinon les hash de mot de passe partiraient dans les `tee dev.log` / `server.log`).
- À noter : `SESSION_SECRET` sert de **sel** au hash du jeton (`sha256(SECRET:jeton)`) : le
  changer invalide instantanément toutes les sessions en base, ce qui fait office de bouton
  « déconnecter tout le monde ». L'utilisateur affiché est caché dans `localStorage`
  (`codexchange-auth`) pour l'UI, l'autorité restant le cookie `httpOnly`.

---

## Structure du projet

```
├── prisma/
│   ├── schema.prisma           # 13 modèles, datasource sqlite
│   └── dev.db                  # base locale (non versionnée)
├── public/
│   ├── sw.js                   # service worker (écrit à la main)
│   ├── manifest.webmanifest    # PWA installable
│   ├── offline.html            # fallback hors-ligne
│   └── icons/                  # 192, 512, maskable
├── scripts/
│   └── seed.ts                 # SEED_PASSWORD + données de démo
├── src/
│   ├── app/
│   │   ├── api/                # 22 fichiers route.ts (25 handlers)
│   │   ├── layout.tsx          # <html lang="fr">, fonts, metadata PWA
│   │   └── page.tsx            # shell SPA + sections dynamiques
│   ├── components/
│   │   ├── sections/           # home, forum, jobs, projects, mentorat, tutos, annuaire
│   │   ├── shared/             # Markdown, AuthForm, cloche, langue, thème…
│   │   └── shell/              # header, footer
│   ├── i18n/dictionaries.ts    # fr / en / sw / ar
│   ├── lib/                    # auth, password, rate-limit, validate, selects, db, notify
│   ├── store/                  # Zustand : navigation+locale, utilisateur
│   └── proxy.ts                # rate limiting + en-têtes de sécurité
├── .github/workflows/ci.yml    # lint → typecheck → build
├── docs/                       # DEMO, PITCH, ROADMAP, BACKLOG, ENVIRONNEMENTS
└── package.json                # scripts dev/build/start/lint/typecheck/check/db:*
```

---

## Passer en production (raccourci)

```bash
bun run build     # next build (standalone) + copie static/ et public/
bun run start     # NODE_ENV=production sur .next/standalone/server.js
```

Le service worker **ne s'enregistre qu'en production** (`sw-register.tsx` vérifie
`NODE_ENV === "production"`) : la démonstration hors-ligne exige donc `build` + `start`, pas `dev`.

---

## Feuille de route

Le détail (phases, statut honnête, milestones M0→M4) est dans **[docs/ROADMAP.md](./docs/ROADMAP.md)** ;
le backlog complet avec statut réel dans **[docs/BACKLOG.md](./docs/BACKLOG.md)**.

En bref : ✅ auth par session, Q&R Markdown, votes + meilleure réponse, recherche, annuaire +
édition de profil, jobs/projets/tutos/events en lecture, mentorat, notifications, PWA hors-ligne,
CI — ⏳ i18n (sw/ar à traduire), création de contenus, votes hors « +1 » —
⬜ RTL arabe, OAuth, messagerie, paiement mobile money, modération, e-mails, tests E2E.

---

## Licence

**MIT** — voir [LICENSE](./LICENSE) · `Copyright (c) 2026 CodeXchange`.

## Code de conduite

CodeXchange est une plateforme communautaire. Tout participant s'engage à respecter les autres
développeurs, indépendamment de leur niveau, origine, genre ou religion.

---

**built in africa, by devs · for devs**
