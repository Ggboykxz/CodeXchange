# Backlog CodeXchange (A → J) — statut réel

> Statuts vérifiés dans le dépôt au 06/10/2026 : ✅ fait · ⏳ partiel · ⬜ à venir.
> Les intitulés sont reformulés d'après le backlog source (les libellés d'origine n'étaient pas
> disponibles dans le contexte de rédaction) ; les **identifiants d'épic et les lettres sont conservés**.
> Chaque note dit ce qui existe **réellement** ici, pas ce qui est prévu.

## EPIC A — Fondations

| ID | Item | Statut | Note |
|---|---|---|---|
| A1 | Schéma Prisma (13 modèles) | ✅ | `prisma/schema.prisma` : User, Session, Profile, Thread, Post, Vote, Job, Project, Tutorial, Event, Mentor, Mentorship, Notification |
| A2 | Base de données + scripts `db:*` | ✅ | PostgreSQL (`provider = "postgresql"`, même base en dev, CI et prod), scripts `db:push` / `db:generate` / `db:migrate` / `db:reset` |
| A3 | Seed de données réalistes | ✅ | `scripts/seed.ts` : 30 comptes, 40 questions, **126 réponses dont 26 imbriquées** (fil visible), chronologie réaliste (questions étalées sur ~3 mois, réponses et votes datés entre les deux), downvotes réels sur 1/3 des questions (−1 de réputation), **2 épinglées** (limite Reddit), 10 offres, 8 projets, 8 tutos, 6 events, 8 mentors |
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
| B6 | OAuth GitHub / Google | ⬜ | L'implémentation d'origine transportait `next-auth` **sans jamais l'importer** : dépendance retirée, il faudra l'intégrer pour de bon |
| B7 | E-mail de bienvenue / réinitialisation | ⬜ | Aucune dépendance ni route d'envoi |
| B8 | Rôles & permissions (member / moderator / admin) | ⏳ | Champ `role` + contrôle serveur à l'acceptation d'une réponse ; **aucun outil** de gestion des rôles dans l'UI |
| B9 | Vérification d'e-mail | ✅ | **Absente du backlog initial**, ajoutée et livrée : `emailVerifiedAt` + jeton hashé (24 h), `POST /api/auth/verify` (`200`/`410`/`400`), `/verify` en page, badge `profil vérifié`, renvoi toujours `200`. 18 tests bout en bout |

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
| C10 | Édition / suppression / épinglage d'une question | ⬜ | `threadUpdateSchema` existe dans `validate.ts` mais **aucune route ne l'utilise** (seul le tri `pinned` est codé) |
| C11 | Tri du fil — les 5 tris de Reddit | ✅ | `GET /api/threads?sort=` = `hot` (défaut), `new`, `top`, `active`, `rising` + `?t=hour\|day\|week\|month\|year\|all` sur `top` ; moteur pur `lib/ranking.ts` (`hotScore` signé = log10 du score net + rang temporel), tris SQL paginés, `hot`/`rising` classés sur 500 candidats bornés ; barre d'icônes + sélecteur d'échéance dans le fil |

## EPIC D — Expérience

| ID | Item | Statut | Note |
|---|---|---|---|
| D1 | Dark mode | ✅ | `next-themes`, clair par défaut, bascule dans le header |
| D2 | i18n 4 locales (fr, en, sw, ar) | ⏳ | Cadre complet, **356 clés** en fr et en (test `tests/i18n.test.ts` : les deux dictionnaires doivent rester identiques clé à clé) ; `sw` et `ar` = `{ ...en }` → **0 clé traduite** |
| D3 | RTL pour l'arabe | ⬜ | `<html lang="fr">` en dur, aucun attribut `dir` ; manifest `"dir": "ltr"` |
| D4 | PWA installable + hors-ligne | ✅ | Manifest, icônes 192/512/maskable, `offline.html`, service worker maison (SWR / network-first, `/api` non caché) — **en production uniquement** |
| D5 | Chargement à la demande (poids) | ✅ | 6 sections en `next/dynamic`, PrismLight allégé ; objectif **< 150 Ko** affiché dans le code, **non mesuré** en CI |
| D6 | Filtres jobs / projets / tutos / events | ✅ | pays, type, stack, remote · statut, stack · catégorie · onglets Tutos/Events |
| D7 | Filtres annuaire (pays, ville, stack, niveau, dispo) | ✅ | pays/stack/niveau/dispo envoyés à l'API, ville filtrée côté client sur la page chargée. **Limite** : les listes de valeurs sont codées en dur alors que le seed en compte **21 pays** (liste corrigée de 10 à 21, mais elle ne suivra pas les pays réels tant qu'il n'y a pas de `SELECT DISTINCT country`) |
| D8 | Menu & grilles responsives | ✅ | Header collant, `Sheet` de navigation mobile, grilles `sm:/lg:` |
| D9 | Recherche globale (tout module) | ⏳ | **Recherche dans le fil d'accueil livrée** (debounce 300 ms, `?q=` côté serveur, état vide dédié) ; le champ `nav.search` du header reste sans implémentation transverse |
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
| E5 | Captures d'écran du produit | ⬜ | Aucune image versionnée ; à produire depuis `bun run start` |

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
| I4 | E-mails transactionnels | ⬜ | Aucun envoi |
| I5 | Digest / newsletter | ⬜ | Le formulaire existe dans le footer mais `subscribe()` n'écrit **rien** : il affiche juste le toast `C'est fait. On revient vers toi.` |

## EPIC J — Robustesse & sécurité

| ID | Item | Statut | Note |
|---|---|---|---|
| J1 | Validation de toutes les entrées | ✅ | `src/lib/validate.ts` (zod) : longueurs, enums, pagination bornée à 100 |
| J2 | Rate limiting | ✅ | Fenêtre glissante mémoire : auth 10/min/IP, login 5/5 min/email, écritures 30/min, `429` + `Retry-After` |
| J3 | En-têtes de sécurité + CSP | ✅ | `src/proxy.ts` : nosniff, DENY, Referrer/Permissions/COPP, CSP stricte, HSTS en prod |
| J4 | Non-fuite de `passwordHash` / `email` | ✅ | Sélecteurs Prisma publics + filtre récursif `json()` |
| J5 | Cookies sécurisés pilotés par env | ✅ | `COOKIE_SECURE` (`secure` derrière HTTPS) ; `SESSION_SECRET` sert de sel au hash de session (rotation ⇒ révocation générale) |
| J6 | CI bloquante (lint, types, build) | ✅ | `next build` échoue sur erreur de type (`ignoreBuildErrors: false`) |
| J7 | Tests unitaires / E2E | ⏳ | **Unitaires livrés** : Vitest, **197 tests / 11 fichiers** (hash+salt, digest salé, sélecteurs Prisma, zod — dont les 45 de la couche d'écriture —, rate limit, pays, `ranking` 43, `comments` 22, i18n), étape `bun run test` en CI. **E2E Playwright exécuté à chaque livraison** (connexion, publication des 4 contenus, votes, réponse imbriquée + pliage + tri, audit 390 px) mais via des scripts hors CI : il reste à les versionner et à les lancer en workflow |
| J8 | Journalisation & monitoring | ⬜ | `console.error` + logs `tee` ; log SQL Prisma en dev uniquement (volontaire) |
| J9 | Sauvegardes / réplication de base | ⬜ | PostgreSQL managé en prod : les backups (PITR) relèvent du fournisseur (Neon / Supabase) — il reste à écrire la procédure de restauration et à la tester |

---

### Top 5 des correctifs prioritaires (issus de la lecture du code)

1. **C10** — édition / suppression / épinglage d'une question (`threadUpdateSchema` est écrit dans `validate.ts`, aucune route ne l'utilise encore).
2. **D2** — traduire les dictionnaires `sw`/`ar` (les 356 clés fr/en sont déjà alignées par le test, le `lang`/`dir` est piloté par `LocaleSync`).
3. **J7** — versionner les scénarios Playwright et les lancer en CI : ils sont aujourd'hui exécutés à la main avant chaque livraison.
4. **B7** — e-mails de bienvenue et de réinitialisation de mot de passe.
5. **E5** — produire les captures d'écran depuis `bun run start` pour le README.

> Livré entre-temps : **G — création de contenus** (API d'écriture + `ContentDialog`), les **5 tris de Reddit**, les **réponses imbriquées** et la **modale d'auth unique**.
