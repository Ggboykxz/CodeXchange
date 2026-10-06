# CodeXchange

> La plateforme d'échange pour les développeurs africains — par les devs, pour les devs.

CodeXchange réunit les développeurs africains et de la diaspora autour de 6 modules : forum, jobs, projets open-source, mentorat, tutos/events et annuaire. Pensé pour le contexte africain (multi-devises, multi-langues, offline-friendly), avec une exigence de qualité et une charte éditoriale monospace inspirée d'[opencode.ai](https://opencode.ai).

## Stack technique

- **Next.js 16** (App Router) + **TypeScript 5**
- **Prisma ORM** + **SQLite** (facile à étendre vers PostgreSQL)
- **Tailwind CSS 4** + **shadcn/ui** (New York style)
- **Zustand** (state client + persist) pour i18n et auth
- **next-themes** pour le mode sombre/clair
- **IBM Plex Mono** partout (typographie signature)
- **lucide-react** pour les icônes

## Démarrage rapide

```bash
# 1. Installer les dépendances
bun install   # ou npm install / pnpm install

# 2. Configurer la base de données
cp .env.example .env          # ajuster DATABASE_URL si besoin
bun run db:push               # créer le schéma SQLite
bun run db:generate           # générer le client Prisma

# 3. Seeder la base avec des données réalistes
bun run scripts/seed.ts

# 4. Lancer le serveur dev
bun run dev
```

L'app tourne sur `http://localhost:3000`.

## Modules livrés

| Module | Description |
|---|---|
| **Forum & Q&A** | Discussions taggées par techno, catégories claires, réponses votées, marquage résolu |
| **Jobs & Missions** | Offres vérifiées (full-time, freelance, stages, remote) avec filtres pays/stack/type |
| **Projets & Collab** | Projets open-source africains, recherche de coéquipiers, statut (idea/MVP/beta/live) |
| **Mentorat** | Mentors seniors africains, sessions gratuites pour devs locaux, demande de mentorat |
| **Tutos & Events** | Articles techniques + agenda des meetups et conférences africaines |
| **Annuaire Devs** | Profils dev par pays/ville/stack/niveau, profil détaillé avec activités récentes |

## Authentification

- Routes API : `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Hash **PBKDF2** + cookie `cx_session` httpOnly
- Modale d'inscription/connexion avec switch login ↔ register

## Internationalisation

4 langues disponibles (FR/EN pleinement traduits, SW/AR framework en place) :
- 🇫🇷 Français (défaut)
- 🇬🇧 English
- 🇰🇪 Kiswahili
- 🇪🇬 العربية

Switcher de langue dans le header avec drapeaux.

## Routes API

```
GET    /api/threads              Lister / filtrer les discussions
POST   /api/threads              Créer une discussion (session requise)
GET    /api/threads/[slug]       Détail d'une discussion
POST   /api/threads/[slug]/posts Répondre à une discussion (session requise)

GET    /api/jobs                 Lister / filtrer les offres
GET    /api/projects             Lister / filtrer les projets
GET    /api/mentors              Lister les mentors
POST   /api/mentors/[id]/request Demander un mentorat (session requise)
GET    /api/tutorials            Lister les tutos
GET    /api/tutorials/[slug]     Détail d'un tuto
GET    /api/events               Lister les events
GET    /api/profiles             Lister / filtrer les profils dev
GET    /api/profiles/[username]   Détail d'un profil dev

GET    /api/notifications           Notifications + non-lues
PATCH  /api/notifications           Marquer une notification comme lue
POST   /api/notifications/read-all  Tout marquer comme lu

POST   /api/auth/register        Créer un compte
POST   /api/auth/login           Se connecter
GET    /api/auth/me              Utilisateur courant (token HMAC vérifié)
DELETE /api/auth/me              Se déconnecter
GET    /api/stats                Stats globales de la plateforme
```

Les réponses publiques ne contiennent jamais `passwordHash` ni `email`
(`src/lib/api.ts`). L'auteur d'une écriture est toujours lu dans le cookie
de session, jamais dans le corps de la requête.

## Structure du projet

```
src/
├── app/
│   ├── api/                    # 15 endpoints API (route handlers)
│   ├── globals.css             # Palette opencode + IBM Plex Mono
│   ├── layout.tsx              # Layout root + ThemeProvider
│   └── page.tsx                # Shell SPA avec navigation par état
├── components/
│   ├── sections/               # 6 sections + home
│   ├── shared/                 # Avatar, Tag, AuthForm, etc.
│   └── shell/                  # Header, Footer
├── i18n/dictionaries.ts        # Traductions FR/EN/SW/AR
├── lib/db.ts                   # Client Prisma
├── store/                      # Zustand (app-store + auth-store)
prisma/
└── schema.prisma               # 11 modèles (User, Profile, Thread, Post, Job, Project, Mentor, Mentorship, Tutorial, Event)
scripts/
└── seed.ts                     # Seed données réalistes (réutilisable)
```

## Données de seed

12 développeurs africains (Sénégal, Côte d'Ivoire, Nigeria, Kenya, Ghana, Mali, Gabon, Egypt, RD Congo, Burkina Faso), 10 discussions, 8 offres d'emploi (Wave, Paystack, Orange Money, Jumia, Twiga, Andela, Polygon...), 6 projets open-source (BaobabUI, Paybridge, KolaLearn...), 5 mentors, 6 tutos et 5 events.

Compte démo : `aicha.diallo@codexchange.dev`, mot de passe `codexchange`.
Les 12 comptes du seed partagent le même mot de passe démo.

## Notifications in-app

- Modèle Prisma `Notification` (recipient, actor, type, href, read)
- `GET /api/notifications` → 30 dernières + compteur non-lues
- `PATCH /api/notifications` → marquer une notification comme lue
- `POST /api/notifications/read-all` → tout marquer comme lu
- Cloche dans le header (badge, polling 60 s, navigation in-app au clic)
- Déclenchées par : réponse à une discussion, demande de mentorat
- Jamais d'auto-notification quand on agit sur soi-même

## Roadmap

- [ ] Notifications in-app
- [ ] Messagerie privée entre devs
- [ ] OAuth GitHub / Google (NextAuth)
- [ ] PostgreSQL pour la production
- [ ] Tests E2E (Playwright)
- [ ] Internationalisation complète SW/AR
- [ ] Modération communautaire

## Licence

MIT — voir [LICENSE](./LICENSE).

## Code de conduite

CodeXchange est une plateforme communautaire. Tout participant s'engage à respecter les autres développeurs, indépendamment de leur niveau, origine, genre ou religion.

---

**built in africa, by devs · for devs**
