# Pitch CodeXchange — deck en 10 slides

> Format texte slide par slide, destiné à être projeté ou lu. Ton hackathon : direct, factuel,
> aucun chiffre qui n'existe pas dans le dépôt.

---

## Slide 1 — Problème

- Les développeurs africains cherchent leurs réponses **hors d'Afrique** : forums anglo-saxons, tutos pensés pour d'autres contextes, jobs à l'autre bout du monde.
- Les opportunités sont **éparpillées** : offres sur LinkedIn, discussions sur WhatsApp/Telegram, mentorat sur Twitter, projets nulle part.
- Les outils existants **pèsent trop** et cassent en 3G : applications lourdes, jamais utilisables hors-ligne, pensées pour la fibre.
- Résultat : un talent de Dakar ou d'Accra perd du temps, rate des opportunités, et sa valeur reste invisible pour les recruteurs locaux.
- **Aucune plateforme ne relie Q&R, jobs, projets, mentorat et annuaire pour les devs africains**, dans les langues du terrain.

**À dire à voix haute :** « Un dev africain passe aujourd'hui sur cinq sites différents pour une seule chose : avancer dans sa carrière. »

---

## Slide 2 — Solution

- **CodeXchange : une plateforme, six modules** — Forum Q&R, Jobs & Missions, Projets & Collab, Mentorat, Tutos & Events, Annuaire.
- Pensée **pour le contexte africain** : multi-langues (fr/en/sw/ar), offline-friendly, légère sur mobile, formats locaux.
- Du premier commit à l'embauche : poser une question, trouver un mentor, rejoindre un projet open-source, décrocher une mission.
- Qualité éditoriale exigée : Markdown, catégories claires, votes, **meilleure réponse**, réputation.
- **Par les devs, pour les devs** : la communauté est modérée par des ingénieurs en activité, les données sont transparentes.

**À dire à voix haute :** « On ne réinvente pas Stack Overflow : on l'adapte au terrain, en une plateforme unique. »

---

## Slide 3 — Démo (ce qu'on montre)

- **Parcours 1 (8 min)** : inscription → profil éditable → question avec bloc de code Markdown → réponse d'un second compte → votes (+1 / −1 / annulation) → **meilleure réponse** → réputation (+10) affichée dans l'UI.
- **Parcours 2 (4 min)** : recherche plein-texte `flutter` (`GET /api/threads?q=`), filtres catégorie `Mobile` et tag `flutter`, badge `Résolu`, démonstration de `?solved=false`.
- **Parcours 3 (5 min)** : annuaire filtré (pays / ville / stack / niveau / disponibilité) → profil public → demande de mentorat → **notification qui tombe dans la cloche du mentor**.
- **Encadré hors-ligne (2 min)** : DevTools → `Offline` → recharger → la page consultée est servie par le service worker, puis retour en ligne.
- Script complet, intitulés à l'appui : `docs/DEMO.md`.

**À dire à voix haute :** « Tout ce que vous allez voir existe déjà dans le dépôt : je ne montre pas une maquette, je montre le produit. »

---

## Slide 4 — Marché & public

- **Cible primaire** : développeurs juniors → seniors basés en Afrique et dans la diaspora (54 pays annoncés dans la copie de la plateforme).
- **Cible secondaire** : startups et scale-ups locales qui recrutent, agences, bootcamps, hubs et meetups.
- **Cible tertiaire** : mentors seniors africains qui veulent transmettre, et projets open-source africains qui cherchent des contributeurs.
- Besoins spécifiques intégrés dès la V1 : multi-devises dans les offres, multi-langues, **connexions instables**, mobile-first.
- La valeur vient du **réseau** : chaque question, profil et mentor enrichit l'annuaire collectif.

**À dire à voix haute :** « Le marché n'est pas “les devs du monde”, c'est les devs africains — un marché qu'on connaît, qu'on habite. »

---

## Slide 5 — Produit livré (liste de ce qui existe)

- **Auth par sessions serveur** : inscription, connexion, déconnexion révocable (cookie `cx_session` `httpOnly`, jeton hashé SHA-256 en base, TTL 30 j), PBKDF2-SHA512.
- **Forum Q&R complet** : questions, catégories, tags, Markdown + coloration de code, votes, meilleure réponse, badge `Résolu`, compteur de vues.
- **Annuaire + édition de profil** : filtres pays/ville/stack/niveau/disponibilité, profil public avec activités récentes, édition en place.
- **Lecture des 4 autres modules** : jobs (filtres pays/type/stack/remote + fiche détaillée), projets (statuts, repo/demo), tutos & events (onglets, RSVP), mentorat (8 mentors, demande avec message et objectif).
- **Notifications in-app** : cloche avec badge, compteur de non-lues, « Tout marquer comme lu », navigation au clic.
- **i18n 4 locales + dark mode + PWA installable + service worker hors-ligne + CI GitHub Actions** (lint → typecheck → build).
- Données de démo réalistes injectées : **30 comptes, 40 questions, 100 réponses, 10 offres, 8 projets, 8 tutos, 6 events, 8 mentors**.

**À dire à voix haute :** « En deux jours de hackathon, c'est un produit utilisable, pas une coquille. »

---

## Slide 6 — Architecture technique

- **Next.js 16 (App Router)** + **React 19** + **TypeScript 5** : une seule application, route handlers en API, build `standalone` prêt pour la prod.
- **Prisma + SQLite** en dev/hackathon, `provider` et `DATABASE_URL` à basculer en **PostgreSQL/Supabase** pour la production (démarche documentée dans le README).
- **Auth maison** : sessions en base (révocables), hash SHA-256 du jeton, PBKDF2 100k itérations, vérification constant-time, anti-énumération.
- **Sécurité en un point** : `src/proxy.ts` (ex-middleware) pose rate limiting (auth 10/min/IP, écritures 30/min), CSP et en-têtes de sécurité sur chaque réponse.
- **Validation zod** sur toutes les entrées, sélecteurs Prisma publics : pas un seul `passwordHash` exposé.
- **État client** : Zustand (navigation par hash + locale + utilisateur), rendu Markdown par `react-markdown`, sections chargées dynamiquement pour alléger le premier octet.
- **Qualité** : ESLint + `tsc --noEmit` + build sur chaque push/PR (une seule exécution annulée par branche, timeout 20 min).

**À dire à voix haute :** « Le choix SQLite est un choix de hackathon, pas un choix d'architecture : le chemin PostgreSQL est écrit et ne change aucune ligne de requête. »

---

## Slide 7 — Trait de différenciation technique

- **Hors-ligne d'abord** : service worker écrit à la main (sans Workbox) — `stale-while-revalidate` sur les assets, `network-first` sur les pages, `/api/*` **jamais** mis en cache, fallback `/offline.html`.
- **Sessions serveur au lieu de JWT stateless** : une ligne supprimée en base = déconnexion immédiate, révocation possible, historique des sessions (UA, IP, expiration).
- **i18n réellement câblée** : 4 locales typées, sélecteur à drapeaux, FR et EN complets (232 clés chacun), le cadre sw/ar prêt — et on annonce **honnêtement** que sw/ar affichent encore l'anglais.
- **Recherche côté serveur** : `q`, catégorie, tag, `solved`, annuaire multi-critères — pas de filtrage cosmétique côté client.
- **Poids maîtrisé** : sections en `next/dynamic`, 12 langages de coloration importés à la demande, objectif de première charge compressé **< 150 Ko** (objectif annoncé dans le code).

**À dire à voix haute :** « Un dev sur réseau 2G peut déjà lire le forum hors-ligne : c'est la contrainte qu'on a prise au sérieux. »

---

## Slide 8 — Traction & métriques cibles du cahier des charges

- **Cibles CDC** : 500 questions / 1 500 réponses · 2 000 profils · 100 offres d'emploi · 100 binômes mentor/menté · première charge **< 100 Ko** · paiement **mobile money**.
- **Où on en est aujourd'hui (mesuré sur la base de démo)** : 40 questions et 100 réponses injectées, 30 profils, 10 offres, 8 projets, 8 mentors — et les compteurs de la home sont lus en direct sur `/api/stats`.
- **Écart assumé sur le poids** : le code vise **< 150 Ko** compressé, le CDC annonce **< 100 Ko** — décision à trancher (découpage supplémentaire du bundle) et à mesurer en CI.
- **Le mobile money n'est pas encore branché** : aucun paiement dans le dépôt, c'est un chantier roadmap (paiement de l'abonnement mentor & boosting des offres).
- Prochaines métriques instrumentables sans nouveau service : `/api/stats` (users, threads, jobs, projects, mentors, tutorials, events, countries) déjà en place et mis en cache 60 s.

**À dire à voix haute :** « Toutes ces cibles sont atteignables : on vous montre les compteurs réels aujourd'hui, pas des projections. »

---

## Slide 9 — Roadmap 12 mois

- **J1–J2 (hackathon)** ✅ : auth sessions, Q&R complet, annuaire, lecture des 4 modules, mentorat, notifications, i18n fr/en, PWA hors-ligne, CI.
- **S1–S4 (beta privée)** ⏳ : traductions sw/ar + RTL, création de contenus jobs/projets/tutos/events, filtre « non résolu » dans l'UI, messagerie entre membres.
- **M2–M3 (beta publique)** ⬜ : OAuth GitHub/Google, e-mails transactionnels, modération communautaire, tests E2E, bascule PostgreSQL/Supabase.
- **M4–M6 (croissance)** ⬜ : paiement mobile money, offres sponsorisées, programme de mentorat certifié, API publique.
- **M7–M12 (consolidation)** ⬜ : applications mobiles légères, analytics communauté, gouvernance et charte d'open-source, extension diaspora.

**À dire à voix haute :** « Le socle est en production-ready technique ; les douze prochains mois sont un travail de produit, pas de fondations. »

---

## Slide 10 — Équipe & besoins

- **Équipe** : développement full-stack (Next.js/Prisma), design produit, animation de communauté — **compléter avec les noms réels de l'équipe avant la projection** (le dépôt ne contient pas de page « équipe »).
- **Ce qu'on a fait nous-mêmes** : schema, 25 endpoints, sécurité (sessions, PBKDF2, rate limiting, CSP), PWA, i18n, seed de démonstration, CI.
- **Besoins immédiats** : 1 designer produit (parcours mobile), 1 community manager (modération + onboarding), 2 mentor·es techniques volontaires.
- **Besoins techniques** : un VPS ou un plan Supabase/PostgreSQL pour la beta, un nom de domaine, un S3 compatible pour les avatars.
- **Besoins business** : 10 recruteurs pilotes pour les premières offres, 1 partenariat hub/communauté par pays.

**À dire à voix haute :** « On cherche des gens qui construisent avec nous : du code, de la modération, et dix recruteurs pour démarrer. »
