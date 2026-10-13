# CodeXchange — Design

> 2026-10-13 · dépôt `github.com/Ggboykxz/CodeXchange` · hackathon, échéance **2026-10-25**
> Décisions prises par l'agent avec l'accord « gères tout » du commanditaire (2026-10-13).
> Tout marqué *(mon choix)* est un arbitrage de l'agent, révocable en une phrase.

## Intent

CodeXchange est **la plateforme africaine pour les développeurs, par les développeurs** : un dev à Libreville, Dakar, Abidjan ou Nairobi y pose une question, trouve une mission, un co-fondateur, un mentor, un événement ou un tuto — en français, sur mobile.

Pourquoi maintenant : un hackathon qui finit le **25 octobre**. La plateforme repart de zéro (l'ancien dépôt a été supprimé le 2026-10-13, accord du commanditaire).

**Succès** : le jury ouvre une URL publique le 25, clique partout sur un téléphone, et ne tombe jamais sur une page vide. **Échec** : un joli site qui ne montre aucun usage réel.

## Goals — ce qui existe le 25 octobre

1. Site public, mobile-first, entièrement **en français**, identité visuelle africaine contemporaine.
2. Comptes : inscription, connexion, déconnexion, session en cookie.
3. **Forum** : sujets (titre, corps, tags), réponses, likes, recherche, page par tag.
4. **Jobs** : offres (titre, entreprise, contrat, remote, pays, lien), filtres, postulation.
5. **Projets** : annonces co-fondateur (cherche quoi), bouton « je veux rejoindre ».
6. **Annuaire** : annuaire des membres, filtres pays / stack / recherche, profil public.
7. **Tutos** : articles lisibles avec tags et durée.
8. **Événements** : liste, détail, RSVP avec compteur.
9. **Mentorat v1** : profils de mentors + formulaire « demander un mentorat » (enregistré, pas de messagerie).
10. **Démo jamais vide** : base de démonstration générée (voir *Données de démo*).
11. Déploiement public + README + script de pitch de 3 minutes.

## Non-goals (v1 — hors périmètre, à afficher en « Bientôt » si demandé)

- Messagerie temps réel, notifications, e-mails transactionnels (aucun SMTP).
- Visio, paiements, abonnements.
- Application native, mode hors-ligne, i18n multi-langues (FR seul ; EN plus tard).
- Back-office d'administration complet (le seed + le SQL suffisent).
- Modération automatique.

## Anti-goals (échec même si techniquement ça marche)

- Une page vide, un « no data », un spinner bloquant pendant la démo.
- Une UI générique (thème Tailwind par défaut) sans identité.
- Une interface en anglais.
- Une démo qui dépend d'un service payant ou d'un compte qui expire le 26.

## Constraints

- Échéance **2026-10-25** (12 jours à compter du 13).
- Budget **0 €** : hébergement et base de données gratuits uniquement.
- Machine : Node 20.18.1, npm 10.8.2, Python 3.11, 2 vCPU, 8,3 Go libres.
- Repo **public**, push à chaque tâche terminée.
- Token GitHub : l'actuel (`ghp_…`, scopes quasi totaux) est exposé ; **fine-grained limité** à créer avant le déploiement.
- Toute l'UI, le copy et les tests visibles sont **en français**.

## Decisions (comment ça se fait)

- **Front/back** : Next.js 15 App Router + TypeScript strict + Tailwind CSS, un seul projet (route handlers = API).
- **Base de données** : Prisma — SQLite en dev (`file:./dev.db`), Postgres en prod (Neon, offert par Vercel). Migration prod = changer `provider` dans `schema.prisma` + `prisma migrate deploy`.
- **Auth** : e-mail + mot de passe, `bcryptjs`, session = cookie `httpOnly` signé côté serveur (table `Session`). Aucun service tiers.
- **Logique métier** : tout le raisonnement vit dans `src/lib/*.ts` (testable sans HTTP) ; les route handlers restent minces. *(mon choix : pour que les tests soient rapides et sans serveur.)*
- **Tests** : Vitest sur `src/lib/**` + un test de route par domaine ; `npm test` et `npm run lint` **bloquants**. Playwright (E2E) en option le 21 octobre si le temps le permet.
- **Design** : skill `ui-ux-pro-max` installé → choix d'un style, d'une palette et d'une paire de polices dans ses bases de données, puis composants maison. Mobile-first, clair/sombre.
- **Déploiement** (échelle, à trancher le **21 oct.**) :
  1. **Vercel + Neon** si le commanditaire crée le compte (10 min, je guide) — URL publique stable ;
  2. sinon **tunnel cloudflared** depuis cette machine (0 compte, URL valable tant que la machine tourne) ;
  3. dernier recours : export statique sur GitHub Pages avec données dans le navigateur.
- **CI** : GitHub Actions — lint + tests bloquants à chaque push (pas de `continue-on-error`).

## Périmètre fonctionnel (règles verbatim)

- **Membre** : `nom`, `slug` unique, `email` unique, `titre` (ex. « Développeur Flutter »), `ville`, `pays` (avec drapeau affiché), `stack` (liste CSV, ex. `React,Node,Postgres`), `bio` (140 car. max), liens (`github`, `linkedin`, `site`), `role` (`MEMBER` | `MENTOR`). Inscription : e-mail valide, mot de passe ≥ 8 car., nom, ville, pays, titre.
- **Session** : cookie `cx_session`, 14 jours, détruite à la déconnexion ; `getSessionUserId()` retourne `null` sans session.
- **Forum** : sujet = `titre` (8–120 car.), `corps` (max 5 000 car.), `tags` (1 à 3, CSV). Réponse = `corps` (1–2 000 car.). Like = opération idempotente : 1ᵉre passe `true`, 2ᵉ `false`. Recherche : sous-chaîne insensible à la casse sur titre ou corps.
- **Jobs** : `titre`, `entreprise`, `contrat` (`CDI` | `Freelance` | `Stage` | `Alternance`), `remote` booléen, `pays`, `lien` (URL). Postulation : enregistre `(jobId, userId)` unique et incrémente le compteur ; une 2ᵉ postulation est rejetée.
- **Projets** : `titre`, `description`, `stack` (CSV), `cherche` (CSV, ex. `Designer,Mobile`), rejoindre = table de jointure unique `(projectId, userId)`.
- **Événements** : `titre`, `date` (ISO), `format` (`Présentiel` | `En ligne`), `ville`, `pays` ou `lien`, `description`. RSVP unique par membre, compteur décrémentable *(mon choix : pas de désinscription en v1, compteur monotone)*.
- **Tutos** : `slug`, `titre`, `resume`, `corps` (markdown léger), `tags`, `dureeMin`.
- **Mentorat** : `requestMentor(mentorId, requesterId, message)` — rejet si `mentorId === requesterId` ou si une demande identique existe déjà.
- **Codes d'erreur** : `AUTH_INVALID`, `AUTH_DUPLICATE_EMAIL`, `FORUM_VALIDATION`, `JOB_DUPLICATE_APPLICATION`, `MENTOR_SELF_REQUEST`, `MENTOR_DUPLICATE` — typer ces erreurs dans `src/lib/errors.ts`, les route handlers répondent en `{ error: Code }` avec le bon statut (401/403/409/422).

## Données de démo (obligatoires pour le 25)

Seed reproductible (`prisma/seed.ts`, `npm run seed`) :

- **30 membres** — prénoms et villes d'Afrique francophone et anglophone (Libreville, Port-Gentil, Douala, Dakar, Abidjan, Accra, Nairobi, Kigali, Casablanca…), stack variée, 6 avec `role = MENTOR`.
- **15 sujets** de forum réalistes (« Bug Flutter Android 14 », « Freelance : facturer depuis le Gabon », « Retour sur mon premier portfolio ») avec 1 à 8 réponses et likes.
- **10 offres** d'emploi/missions (remote ou africaines), **8 projets** à recruter, **6 événements** (dont 2 passés, 4 à venir), **8 tutos**, **6 mentors**.
- Chaque entité a une date cohérente (les événements passés sont dans le passé par rapport au jour d'exécution).

## Calendrier (12 jours)

| Jour | Livrable |
|---|---|
| 13 oct (J1) | spec + plan + squelette Next.js + auth + schéma DB |
| 14–15 (J2–3) | forum + profils + annuaire |
| 16–17 (J4–5) | jobs + projets |
| 18 (J6) | événements + tutos + mentorat |
| 19–20 (J7–8) | design (ui-ux-pro-max), responsive, états vides, seed complet |
| 21 (J9) | **choix de l'hébergement + mise en ligne** + CI |
| 22–23 (J10–11) | tests, perfs, meta/OG, polish, README |
| 24 (J12) | répétition du pitch, script, captures, vidéo de secours |
| **25** | **Démo** |

## Ce qu'il reste au builder

Structure des fichiers exacte, ordre des tâches, implémentation, choix des composants, copy des pages, le code et ses tests. Le plan d'implémentation est dans `docs/superpowers/plans/2026-10-13-codexchange-mvp.md`.
