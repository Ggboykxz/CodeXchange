# Backlog CodeXchange (A → J) — statut réel

> Statuts vérifiés dans le dépôt au 08/10/2026 : ✅ fait · ⏳ partiel · ⬜ à venir.
> Les intitulés sont reformulés d'après le backlog source (les libellés d'origine n'étaient pas
> disponibles dans le contexte de rédaction) ; les **identifiants d'épic et les lettres sont conservés**.
> Chaque note dit ce qui existe **réellement** ici, pas ce qui est prévu.

## EPIC A — Fondations

| ID | Item | Statut | Note |
|---|---|---|---|
| A1 | Schéma Prisma (13 modèles) | ✅ | `prisma/schema.prisma` : User, Session, Profile, Thread, Post, Vote, Job, Project, Tutorial, Event, Mentor, Mentorship, Notification |
| A2 | Base de données + scripts `db:*` | ✅ | PostgreSQL (`provider = "postgresql"`, même base en dev, CI et prod), scripts `db:push` / `db:generate` / `db:migrate` / `db:reset` |
| A3 | Seed de données réalistes | ✅ | `scripts/seed.ts` : 31 comptes (dont **1 admin**, voir B8), 40 questions, **126 réponses dont 26 imbriquées** (fil visible), chronologie réaliste (questions étalées sur ~3 mois, réponses et votes datés entre les deux), downvotes réels sur 1/3 des questions (−1 de réputation), **2 épinglées** (limite Reddit), 10 offres, 8 projets, 8 tutos, 6 events, 8 mentors |
| A4 | Charte visuelle (monospace, palette, grain) | ✅ | IBM Plex Mono en variable `--font-mono`, tokens Tailwind 4, `paper-grain` |
| A5 | CI (lint → typecheck → build) | ✅ | `.github/workflows/ci.yml`, Bun + Node 22, `bun install --frozen-lockfile`, badge en tête du README |
| A6 | README + documentation | ✅ | README complet réécrit + `docs/` (DEMO, PITCH, ROADMAP, BACKLOG, ENVIRONNEMENTS) |
| A7 | Licence | ✅ | `LICENSE` (MIT, 2026) |
| A8 | Migration PostgreSQL / Supabase | ⬜ | Aucune migration versionnée : uniquement `db push`. Démarche documentée dans le README |

## EPIC B — Auth & profils

| ID | Item | Statut | Note |
|---|---|---|---|
| B1 | Inscription (nom, username, email, mot de passe, pays, ville, stack, niveau) | ✅ | `POST /api/auth/register`, `registerSchema` zod, username unique |
| B2 | Connexion / déconnexion | ✅ | `POST /api/auth/login`, `DELETE /api/auth/me` (révocation serveur + cookie vidé) |
| B3 | Sessions serveur révocables | ✅ | Jeton 32 octets hashé **SHA-256** en base, cookie `cx_session` httpOnly, TTL 30 j, purge des expirées |
| B4 | Édition de son profil | ✅ | `PATCH /api/profiles/me`, champs whitelistés zod, identité depuis la session |
| B5 | Page profil publique + activités récentes | ✅ | `GET /api/profiles/[username]` : réputation, 5 dernières questions, 5 projets, 3 tutos |
| B6 | OAuth GitHub / Google | ✅ | **Flux code d'autorisation maison, zéro dépendance** — `next-auth` était embarqué sans jamais être importé ; réintroduire un cadre entier aurait fallu le faire cohabiter avec les sessions `cx_session` (digest SHA-256, révocation serveur), donc deux requêtes serveur écrites à la main. Cœur pur `lib/oauth.ts` — **30 tests** : URLs d'autorisation, `state` 32 octets comparé **en temps constant**, `normalizeGitHub`/`normalizeGoogle` (rattachement par e-mail **vérifié chez le fournisseur** sinon refus net), `usernameCandidates`/`sanitizeUsername` (règle exacte de `validate.ts`), avatar déterministe sur la palette du seed. Routes : `GET /api/oauth/providers` (liste = source unique des boutons), `GET /api/oauth/[provider]` (302 + cookies `cx_oauth_state`/`cx_oauth_next`, rate-limit IP, `?next=#ancre`), `GET /api/oauth/[provider]/callback` (state → échange `code` **côté serveur uniquement** → profil → rattachement ou création `passwordHash=null` + e-mail marqué vérifié + bienvenue → session habituelle ; erreur = `/?oauth_error=` lue au montage de l'app → toast, `silent` si annulation chez le fournisseur). UI : boutons **SVG inline** dans la modale d'auth (lucide a déprécié ses logos de marque, Google n'en a jamais eu), **masqués sans credentials** plutôt que cassés, i18n 4 clés × 4 locales ; `.env.example` + table Vercel documentent `GITHUB_*`/`GOOGLE_*` (**à fournir pour activer**). Vérifié en local : aller 302 GitHub avec `state`+`next`, garde CSRF, échange, annulation |
| B7 | E-mail de bienvenue / réinitialisation | ✅ | `lib/mailer` (nodemailer : SMTP réel si `SMTP_HOST`, aperçu journal sinon — l'envoi ne bloque jamais la requête) ; e-mail de bienvenue à l'inscription ; reset : `resetTokenHash`/`resetExpiresAt` (30 min, usage unique, purge à la consommation, révocation des sessions), `POST /api/auth/forgot` (réponse identique quelle que soit l'adresse — anti-énumération, rate-limit IP+email) et `POST /api/auth/reset` (`400`/`410`) ; UI : panneau « Mot de passe oublié ? » dans la modale d'auth unique + page `/reset` ; i18n 16 clés × 4 locales ; `.env.example` documente les variables SMTP ; **vérifié bout en bout** (reset réel → login nouveau 200 / ancien 401 / réutilisation jeton 400) |
| B8 | Rôles & permissions (member / moderator / admin) | ✅ | **Outil complet de gestion des rôles**. Cœur pur `lib/roles.ts` (`ROLES`, `canAssignRoles`, `canChangeRole`) : seuls les `admin` composent l'équipe, **personne ne se change soi-même** → le dernier admin ne peut jamais disparaître, *sans requête de comptage ni fenêtre de course* (preuve dans le module). `roleUpdateSchema` (zod, énumération partagée) ; API **admin-only** `GET /api/admin/users` (recherche nom / username / e-mail renvoyé jamais, filtre rôle, pagination) + `PATCH /api/admin/users/[id]` (rate-limit `WRITE_POLICY`, 403 avant 404, audit `logger.info`, notification `system`, PATCH idempotent) ; **écran `#admin`** : entrée `Admin` conditionnelle desktop + tiroir mobile, recherche debounce 250 ms, `Select` Radix par ligne, badge « toi », refus net si non-admin ; seed **31ᵉ compte** `admin@codexchange.dev` + script ops idempotent `scripts/create-admin.ts` (prod sans réinitialiser la base) ; i18n ×4 locales, tests unitaires + **2 scénarios E2E** |
| B9 | Vérification d'e-mail | ✅ | **Absente du backlog initial**, ajoutée et livrée : `emailVerifiedAt` + jeton hashé (24 h), `POST /api/auth/verify` (`200`/`410`/`400`), `/verify` en page, badge `profil vérifié`, renvoi toujours `200`. **Le lien voyage par e-mail** (porté par le mail de bienvenue, et par `sendVerificationEmail` à chaque renvoi) : utilisable en production, pas seulement en dev. 18 tests bout en bout |

## EPIC C — Questions & réponses

| ID | Item | Statut | Note |
|---|---|---|---|
| C1 | Création de question (titre, catégorie, tags, corps) | ✅ | `POST /api/threads`, slug unique généré serveur, taux limite 30/min |
| C2 | Rendu Markdown + blocs de code | ✅ | `react-markdown` + `remark-gfm` + PrismLight (12 langages), bouton copier, **pas de HTML brut** |
| C3 | Réponses **imbriquées** | ✅ | `POST /api/threads/[slug]/posts` avec `parentId` (la cible doit appartenir à la même question, sinon 404 ; l'auteur du parent est notifié). Arbre pur `lib/comments.ts` (parents disparus / auto-références / cycles → racine), tri best / new / old, pliage de branche, badge Auteur, acceptation réservée à l'auteur de la question ou au staff |
| C4 | Votes `+1 / -1 / 0` | ✅ | API complète (recount, anti-auto-upvote 422) **et** UI : ↑ / ↓ / ré-cliquer annule. `myVote` renvoyé par **la liste et le détail** : les flèches de la liste savent donc si le visiteur a déjà voté |
| C5 | Meilleure réponse + statut `Résolu` | ✅ | `PATCH /api/posts/[id]`, transaction (une seule acceptée), auteur **ou** modérateur |
| C6 | Recherche plein-texte (titre, corps, tags) | ✅ | `GET /api/threads?q=`, debounce 250 ms côté UI |
| C7 | Filtres catégorie / tag | ✅ | `?category=&tag=` + sélecteurs dans l'interface |
| C8 | Filtre « non résolu » | ✅ | API `?solved=false` + badge `Résolu` + **sélecteur `Non résolus`** dans le fil d'accueil (le forum garde son sélecteur de statut) |
| C9 | Compteur de vues | ✅ | Incrémentation non bloquante à l'ouverture du détail |
| C10 | Édition / suppression / épinglage d'une question | ✅ | `PATCH`/`DELETE /api/threads/[slug]` (droits auteur ou staff via `canManage`/`isStaff`), `threadUpdateSchema` consommé par le PATCH, `MAX_PINNED = 2`, purge des votes à la suppression ; menu ⋯ du fil (Modifier / Supprimer / Épingler, masqué pour un `member`) + scénario E2E `auth-edit.spec.ts` |
| C11 | Tri du fil — les 5 tris de Reddit | ✅ | `GET /api/threads?sort=` = `hot` (défaut), `new`, `top`, `active`, `rising` + `?t=hour\|day\|week\|month\|year\|all` sur `top` ; moteur pur `lib/ranking.ts` (`hotScore` signé = log10 du score net + rang temporel), tris SQL paginés, `hot`/`rising` classés sur 500 candidats bornés ; barre d'icônes + sélecteur d'échéance dans le fil |

## EPIC D — Expérience

| ID | Item | Statut | Note |
|---|---|---|---|
| D1 | Dark mode | ✅ | `next-themes`, clair par défaut, bascule dans le header |
| D2 | i18n 4 locales (fr, en, sw, ar) | ✅ | Cadre complet avec **4 locales** réelles : fr et en étaient déjà alignées clé à clé (380 clés) ; `sw` et `ar` prodiguent à présent de vraies traductions (plus de `{ ...en }`), et le cas test i18n est inversé. `dir=rtl` géré par `LocaleSync` pour l'arabe. |
| D3 | RTL pour l'arabe | ✅ | **Migration complétée** : classes physiques converties en propriétés logiques dans tout le code applicatif (`ps-/pe-` pour `pl-/pr-`, `ms-/me-` pour `ml-/mr-`, `start-/end-` pour `left-/right-`, `text-start`, `border-s/e`, `rounded-s/e-*`, dialog/drawer inclus) — chevrons/flèches mirrorisés (`rtl:-scale-x-100`), bloc et inline code figés en `dir="ltr"` dans le Markdown, tiroir mobile maintenu à droite (convention RTL), `space-x-*` vérifié logique dans la CSS compilée v4. **E2E** : `dir/lang=ar`, aucune overflow à 390 px, `paddingInlineStart` logique calculé, retour LTR
| D4 | PWA installable + hors-ligne | ✅ | Manifest, icônes 192/512/maskable, `offline.html`, service worker maison (SWR / network-first, `/api` non caché) — **en production uniquement** |
| D5 | Chargement à la demande (poids) | ✅ | 6 sections en `next/dynamic`, PrismLight allégé ; objectif **< 150 Ko** affiché dans le code, **non mesuré** en CI |
| D6 | Filtres jobs / projets / tutos / events | ✅ | pays, type, stack, remote · statut, stack · catégorie · onglets Tutos/Events |
| D7 | Filtres annuaire (pays, ville, stack, niveau, dispo) | ✅ | pays/stack/niveau/dispo envoyés à l'API, ville filtrée côté client sur la page chargée. **Limite** : les listes de valeurs sont codées en dur alors que le seed en compte **21 pays** (liste corrigée de 10 à 21, mais elle ne suivra pas les pays réels tant qu'il n'y a pas de `SELECT DISTINCT country`) |
| D8 | Menu & grilles responsives | ✅ | Header collant, `Sheet` de navigation mobile, grilles `sm:/lg:` |
| D9 | Recherche globale (tout module) | ✅ | Le champ `nav.search` du header est enfin branché : **`GET /api/search?q=`** interroge threads, jobs, projets, tutos, events et membres (6×4, ILIKE insensible à la casse, `SEARCH_POLICY` 60/min/IP), et `GlobalSearch` (composant dans une seconde ligne du header, aucun squeezing des breakpoints) affiche les groupes en dropdown avec href d'ancre réels (`#forum/slug`, `#annuaire/<username>`, sections sinon), debounce 300 ms comme le fil, fermeture clic/Escape/blur 150 ms, état vide dédié. Cœur pur `lib/search.ts` (`normalizeQuery`, `toResult`) — 8 tests ; E2E 2 scénarios ; complète la recherche-dans-le-fil déjà livrée (même placeholder, donc requêtes scopées à `header`) |
| D10 | Fil d'accueil (flux social) | ✅ | `FeedSection` : tri Récents/Populaires/Actifs, filtre non résolus, **votes ↑↓ optimistes** avec retour serveur, composeur `Publier` (formulaire partagé `CreateThreadForm`), `Charger plus`, colonne de droite = CTA + **compteurs réels** (`/api/stats`) + modules. Carte `ThreadCard` réutilisée par la liste du forum |
| D11 | Navigation du navigateur | ✅ | Nav et logo en **vrais liens** `<a href="#…">` (clic médiant, ouvrir dans un onglet), `pushState` au lieu de `replaceState` + écouteurs `hashchange`/`popstate` → boutons **Retour/Avant opérationnels** |
| D12 | Header mobile sans débordement | ✅ | `Connexion`/`Rejoindre` masqués sous `sm` (déjà en bas de la feuille) ; **et une fois connecté** : le groupe de droite faisait 257 px et débordait de 62 px sur toutes les pages — langue + thème passent sous `sm` et sont repris dans la feuille (où le sélecteur de langue s'ouvre bien). Audit Playwright 390 px : 0 px sur les 5 sections, la modale de création et le menu |
| D13 | Modale d'authentification unique | ✅ | Existait en **deux exemplaires** (en-tête et fil) avec leur propre état → deux superpositions possibles. `authOpen` / `authMode` / `openAuth()` dans `auth-store`, composant `AuthDialog` rendu une fois dans `page.tsx` : n'importe quelle section, y compris sur un 401, appelle `openAuth("login")` |

## EPIC E — Démo & livrables Sprint 0

| ID | Item | Statut | Note |
|---|---|---|---|
| E1 | Script de démo scénarisé (3 parcours chronométrés) | ✅ | `docs/DEMO.md` (+ encadrés hors-ligne et pièges à éviter) |
| E2 | Deck de pitch 10 slides | ✅ | `docs/PITCH.md` (avec la ligne « à dire à voix haute » par slide) |
| E3 | Environnements documentés (local / staging / preview / prod) | ✅ | `docs/ENVIRONNEMENTS.md` (variables, commandes) |
| E4 | Plan de tournage d'une vidéo de secours (5 min) | ✅ | `docs/ENVIRONNEMENTS.md`, section « Plan de tournage » |
| E5 | Captures d'écran du produit | ✅ | `scripts/screenshots.mjs` (lance `next start`, capture 7 vues en 1280 px → `docs/screenshots/*.png`, versionnées) ; le README s'ouvre sur la galerie (accueil, forum, fiche question avec rail de vote, jobs, projets, tutos, annuaire) |

## EPIC F — Réputation

| ID | Item | Statut | Note |
|---|---|---|---|
| F1 | +10 sur réponse acceptée | ✅ | `ACCEPTED_BONUS = 10`, versé à l'**auteur de la réponse**, retiré si désacceptation |
| F2 | +2 sur réponse votée | ✅ | `applyReputation()` crédite l'**auteur de la réponse** (vérifié : auteur 50 → 52, votant inchangé) |
| F3 | −1 sur question downvotée | ✅ | Branché sur la transition (-1 posé / levé) ; l'upvote de question ne rapporte rien, conformément au barème |
| F4 | Affichage de la réputation dans l'UI | ✅ | Badge sur le profil de l'annuaire + `★ n` à côté de l'auteur de chaque réponse (`reputation` ajoutée à `publicUserSelect`) |
| F5 | Badges, classements, niveaux | ⬜ | Rien |

## EPIC G — Jobs

| ID | Item | Statut | Note |
|---|---|---|---|
| G1 | Liste d'offres + filtres (pays, type, stack, remote) | ✅ | `GET /api/jobs` + sélecteurs de l'UI |
| G2 | Fiche détaillée + « Postuler » | ✅ | Panneau détail avec description et lien `applyUrl` |
| G3 | Création / modification d'offre | ✅ | `POST /api/jobs` + `PATCH`/`DELETE /api/jobs/[id]` (droits auteur/staff, rate-limit), et l'**écran** : `ContentDialog` — un composant générique pour les 4 contenus (offres, projets, tutos, événements) qui choisit endpoint / formulaire / libellé selon `kind`, gère 401 → modale de connexion, 400 → erreur sous le champ en `role="alert"`, 429 → rate-limit. Bouton « Publier » dans Jobs, Projets et les deux onglets de Tutos & Events |
| G4 | Recherche plein-texte des offres | ⏳ | `?q=` supporté côté serveur, **aucun champ de recherche** dans l'UI |
| G5 | Multi-devises & salaires | ⏳ | Champ `salary` simple (`"3-5K EUR / month"`), aucune logique de devise |
| G6 | Offres sponsorisées / boosting | ⬜ | Rien |

## EPIC H — Mentorat

| ID | Item | Statut | Note |
|---|---|---|---|
| H1 | Annuaire de mentors (note, avis, places, tarif, langues) | ✅ | `GET /api/mentors` + cartes |
| H2 | Demande de mentorat (message + objectif) | ✅ | `POST /api/mentors/[id]/request` : 10 à 1000 caractères, garde-fous doublon/complet/soi-même |
| H3 | Notification au mentor | ✅ | `notify()` fire-and-forget, type `mentorship`, lien `#mentorat` |
| H4 | Bouton « Demander un mentorat » depuis l'annuaire | ⬜ | Absent du profil : il faut passer par la section Mentorat |
| H5 | Réponse du mentor (accepter / refuser / planifier) | ⬜ | Modèle `Mentorship.status` prêt (`pending/accepted/declined/active/completed`), **aucune interface** |
| H6 | Visio de mentorat (Jitsi) | ⬜ | La CSP autorise déjà `frame-src https://meet.jit.si`, **aucune UI** |

## EPIC I — Messagerie

| ID | Item | Statut | Note |
|---|---|---|---|
| I1 | Notifications in-app (cloche, badge, tout-lu) | ✅ | 3 endpoints + polling 60 s + navigation au clic ; déclenchées par réponse, acceptation, mentorat |
| I2 | Messagerie privée entre membres | ⬜ | Aucun modèle `Message` / `Conversation` |
| I3 | Temps réel (websocket / SSE) | ⬜ | Seul le polling 60 s de la cloche existe |
| I4 | E-mails transactionnels | ⏳ | `lib/mailer` (nodemailer) : bienvenue (**porteur du lien de vérification**), réinitialisation du mot de passe et vérification d'adresse, aperçu en journal sans `SMTP_HOST`, envoi jamais bloquant ; UI panneau oublié + page `/reset`. **Reste** : `SMTP_HOST/PORT/USER/PASS` non renseignés dans l'environnement Vercel → en prod les e-mails restent des aperçus journal ; dès que les identifiants SMTP sont posés, les trois envois deviennent réels sans toucher au code |
| I5 | Digest / newsletter | ✅ | Formulaire footer enfin réel : `POST /api/newsletter` (zod `newsletterSchema`, rate-limit IP, réponse identique neuf/déjà abonné/réabonné, `P2002` absorbé). Modèle `NewsletterSubscriber` (jeton **dérivé** de l'e-mail via `lib/newsletter`, stocké hashé `SECRET:nl:` comme sessions/vérif/reset — extraction ⇒ aucun lien valide) ; mail de bienvenue porteur du lien de désinscription. Désinscription un-clic `GET /api/newsletter/unsubscribe` (idempotent, 302 `?nl=`). `GET /api/cron/newsletter` : digest mensuel (contenu réel : top questions, jobs, projets, tutos, events à venir, nouveaux membres — HTML inline-styles + texte brut, **tout contenu échappé**), `Authorization: Bearer $CRON_SECRET` exigé (401 sinon), `?dryRun=1` comptage sans envoi ; cron Vercel `0 6 1 * *` ; sans SMTP, aperçu journal. i18n 3 clés × 4 locales, E2E 2 scénarios (abonnement footer réel + désinscription invalide → toast) |

## EPIC J — Robustesse & sécurité

| ID | Item | Statut | Note |
|---|---|---|---|
| J1 | Validation de toutes les entrées | ✅ | `src/lib/validate.ts` (zod) : longueurs, enums, pagination bornée à 100 |
| J2 | Rate limiting | ✅ | Fenêtre glissante mémoire : auth 10/min/IP, login 5/5 min/email, écritures 30/min, `429` + `Retry-After` |
| J3 | En-têtes de sécurité + CSP | ✅ | `src/proxy.ts` : nosniff, DENY, Referrer/Permissions/COPP, CSP stricte, HSTS en prod |
| J4 | Non-fuite de `passwordHash` / `email` | ✅ | Sélecteurs Prisma publics + filtre récursif `json()` |
| J5 | Cookies sécurisés pilotés par env | ✅ | `COOKIE_SECURE` (`secure` derrière HTTPS) ; `SESSION_SECRET` sert de sel au hash de session (rotation ⇒ révocation générale) |
| J6 | CI bloquante (lint, types, build) | ✅ | `next build` échoue sur erreur de type (`ignoreBuildErrors: false`) |
| J7 | Tests unitaires / E2E | ✅ | **Unitaires** : Vitest, **323 tests / 19 fichiers** (hash+salt, digest salé, sélecteurs Prisma, zod, rate limit, pays, ranking 43, comments 22, i18n, `feed-prefs`, mailer, log, reset, **rôles 40**, **oauth 30**, **newsletter 12**, **search 8**), étape `bun run test`. **E2E Playwright versionnés en CI** : `tests/e2e` (**15 scénarios** — action bar Reddit, sauvegarde, masquage, rail de vote desktop/mobile, édition C10, 0 débordement 390 px, **gestion des rôles B8**, **newsletter I5**, **recherche D9**, **RTL D3**), lancés par le workflow GitHub après seed + Chromium + `next start` |
| J8 | Journalisation & monitoring | ✅ | `lib/log` : événements JSON une ligne (`ts`/`level`/`message`/ctx) en production, lisibles en dev ; les **23 routes** (35 appels) sont passées de `console.error` à `logger.route` ; `GET /api/health` (`{ok, db, latencyMs, uptime}`, 503 si DB down) pour les sondes ; 3 tests unitaires |
| J9 | Sauvegardes / réplication de base | ✅ | PostgreSQL managé : la PITR reste chez Neon (documentée). `docs/RUNBOOK.md` : restauration PITR, bascule `DATABASE_URL` Vercel, dump/restauration locale, vérification ; `scripts/db-backup.sh` (`pg_dump -Fc` par défaut, `--plain` pour SQL) vers `./backups/` (gitignoré) — **exécuté et prouvé** sur le PG local (dump 263 K) |

---

### Top 5 des correctifs prioritaires (issus de la lecture du code)

> **Tous les 5 sont livrés** : **B7** (e-mails), **E5** (captures), **J8** (logging/santé), **J9** (runbook Neon + backup), et **D2** (sw/ar traduits, livré juste avant). Voir les sections par épique pour le reste (D3 RTL **livré** depuis — migration complète en propriétés logiques + E2E, I2/I3 messagerie temps réel, …).

> Livré entre-temps : **G**, **C10**, **D2**, **B7**, **B8**, **E5**, **J8**, **J9**, **B6** (OAuth maison), **I5** (newsletter + cron mensuel), les **5 tris de Reddit**, les **réponses imbriquées**, la **modale d'auth unique**, la **barre d'actions Reddit** et **J7** (E2E Playwright en CI ✅).
