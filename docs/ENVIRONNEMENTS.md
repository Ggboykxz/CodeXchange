# Environnements & plan de tournage (E3 / E4)

## 1. Les environnements

| Environnement | But | Base de données | Commandes | URL |
|---|---|---|---|---|
| **Local (dev)** | développement quotidien, démo live | **PostgreSQL 16** local — base `codexchange`, rôle `cx` | `bun run dev` | `http://localhost:3000` |
| **Local (prod-like)** | vérifier le build, **PWA et hors-ligne** (le service worker est désactivé en dev) | même base locale | `bun run build` puis `bun run start` | `http://localhost:3000` |
| **CI (preview)** | lint, tests, typecheck, build à chaque push et PR | service **`postgres:16`** éphémère monté par GitHub Actions | étapes de `.github/workflows/ci.yml` | — |
| **Staging** | pré-production, tests de migration et de seed | PostgreSQL dédié | `bunx prisma migrate deploy`, seed, `bun run build`, `bun run start` | domaine interne, HTTPS |
| **Production (Vercel)** | service public, déployé à chaque push sur `main` | **Neon** (PostgreSQL 18, managé) | `npx prisma generate && next build` (imposé par `vercel.json`) | `https://code-xchange-nine.vercel.app` |

**Base locale — à faire une seule fois** (en tant que superutilisateur, ex.
`sudo -u postgres psql` ; sur ce conteneur, `sudo sh -c "su postgres -c 'psql'"`):

```sql
CREATE ROLE cx LOGIN PASSWORD 'cx_local_dev' CREATEDB;
CREATE DATABASE codexchange OWNER cx;
```

Puis `bun run db:deploy` (les migrations versionnées de `prisma/migrations/`
s'appliquent — baseline `0_init` puis les évolutions, même parcours que la CI
et la production).

SQLite n'est plus utilisé du tout : `file:./dev.db` ne peut pas fonctionner sur
Vercel (disque des fonctions en lecture seule, éphémérique par instance).

### Variables d'environnement (`.env`, jamais versionné)

| Variable | Valeur dev | Valeur prod | Rôle réel dans le code |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://cx:cx_local_dev@127.0.0.1:5432/codexchange` | URL du service managé (Neon / Supabase / Vercel Postgres) | **Seule variable obligatoire** : lue par `prisma/schema.prisma` (`env("DATABASE_URL")`). Sans elle, toutes les routes `/api/*` qui lisent la base répondent 500 |
| `COOKIE_SECURE` | `false` | `true` (uniquement derrière HTTPS) | `src/lib/auth.ts` : ajoute `secure` au cookie `cx_session`. **À `true` sur un site en HTTP, le cookie n'est jamais stocké → connexion « acceptée » mais reste déconnecté** |
| `SESSION_SECRET` | `change-me-…` | `openssl rand -hex 32` | Sert de **sel** au hash du jeton de session : `sha256(SECRET:jeton)`. Le changer invalide **toutes les sessions** d'un coup — le geste à faire en cas de suspicion de compromission. Absente en dev local ⇒ valeur de repli utilisée |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://…` (domaine réel) | `src/lib/site.ts` : `metadataBase` (aperçus Open Graph), `robots.ts` et `sitemap.xml`. Repli `VERCEL_URL`, puis `localhost:3000` |

Éléments d'infrastructure associés :

- **Reverse proxy** : `Caddyfile` présent dans le dépôt (proxy `:81` → `localhost:3000`, en transmettant
  `X-Forwarded-For` / `X-Real-IP`). Ces en-têtes servent au **rate limiting** et à l'enregistrement de
  l'IP de session (`clientIp()`).
- **HTTPS** : condition de `COOKIE_SECURE=true` et déclencheur du header
  `Strict-Transport-Security` (posé seulement si `NODE_ENV === "production"`).
- **CI** : `.github/workflows/ci.yml` monte un service `postgres:16` (base jetable) et tourne
  lint → tests → typecheck → build. Elle ne déploie rien : Vercel se déploie de son côté, à chaque
  push sur `main`.

### Commandes par environnement

```bash
# --- local dev (base PostgreSQL locale, cf. « à faire une seule fois » ci-dessus)
cp .env.example .env
bun install               # postinstall = prisma generate
bun run db:deploy        # migrations versionnées PostgreSQL
bun run scripts/seed.ts   # données de démo (destructif)
bun run dev               # port 3000

# --- local prod-like (obligatoire pour la PWA / hors-ligne)
bun run build             # next build + copie static/ et public/ dans .next/standalone/
bun run start             # NODE_ENV=production bun .next/standalone/server.js

# --- production Vercel
# 1. poser dans Settings → Environment Variables :
#    DATABASE_URL (service managé), SESSION_SECRET, COOKIE_SECURE=true, NEXT_PUBLIC_SITE_URL
# 2. le build applique les migrations :  npx prisma migrate deploy (inclus dans vercel.json)
# 3. git push origin main  →  build Vercel (vercel.json : generate + next build)

# --- vérifications (avant toute mise en ligne)
bun run check             # lint + tests + typecheck + build
```

---

## 2. Plan de tournage — vidéo de secours (E4)

**Durée cible : 5 minutes** · **4 plans** · **Matériel** : un seul écran, navigateur Chrome/Chromium,
DevTools ouvertes à droite, enregistreur d'écran (OBS, `⌘⇧R` sur macOS, `Ctrl+Shift+R` sous Windows/Linux),
micro coupé du système.

### Préparation (hors vidéo, 5 min)

```bash
bun install
cp .env.example .env
bun run db:deploy
bun run scripts/seed.ts     # vérifier "✅ Seed complete!"
bun run build               # ← indispensable : le service worker ne s'enregistre qu'en prod
bun run start               # http://localhost:3000
```

Puis, dans l'ordre : ouvrir `http://localhost:3000`, se connecter en second compte dans une fenêtre
privée (`kwame.mensah@codexchange.dev` / `codexchange2026`), visiter Forum et Annuaire (pour remplir
le cache du service worker), DevTools → **Application → Service workers** : vérifier que
`codexchange` est **activated**.

### Plan 1 — Accroche + fil (≈ 1 min)

1. Enregistrer à partir de l'onglet vide → taper `localhost:3000` → Entrée.
2. Laisser le **fil d'accueil** se charger : tri `Récents / Populaires / Actifs`, cartes avec
   vote `↑↓`, auteur et temps relatif, puis la colonne de droite — CTA, **compteurs réels**
   (membres, discussions, offres, pays, issus de `/api/stats`), modules.
3. Cliquer `Populaires` → le fil se retricote ; cliquer `Charger plus` → la suite arrive.
4. Survoler la navigation : Forum, Jobs, Projets, Mentorat, Tutos & Events, Annuaire.
5. **Ce qu'on dit** (voir §3) : le problème, puis la promesse en une phrase.

### Plan 2 — Le cœur Q&R (≈ 1 min 30)

1. Header → **`Forum`** → montrer la liste et la recherche : taper `flutter` (pause de 250 ms).
2. Sélecteur de catégorie → **`Mobile`** → résultat réduit.
3. Ouvrir une question → montrer le rendu Markdown et le **bloc de code coloré**.
4. Cliquer le **`↑`** d'une réponse (compte connecté) → compteur +1.
5. Cliquer **`Accepter`** → toast `Meilleure réponse marquée` → badge **`Résolu`**.
6. Ouvrir un onglet → `localhost:3000/api/profiles/kwame.codes` → pointer `user.reputation`.

### Plan 3 — Annuaire, mentorat, notification (≈ 1 min 30)

1. Header → **`Annuaire`** → sélecteur **`Tous les pays`** → `Sénégal`, interrupteur
   **`Disponibles uniquement`**.
2. Ouvrir une carte → montrer la bio, la stack, **`Discussions récentes`**.
3. Header → **`Mentorat`** → bouton **`Demander un mentorat`** → remplir `Ton objectif` +
   `Message au mentor` → **`Envoyer la demande`** → toast `Demande envoyée ! Le mentor te répondra sous 48h.`
4. Basculer sur la **seconde fenêtre** (le mentor) → recharger → **cloche** avec badge → clic →
   ligne `<Nom> demande un mentorat` → clic → navigation `#mentorat`.

### Plan 4 — Hors-ligne + clôture (≈ 1 min)

1. DevTools → onglet **Réseau** → cocher **`Offline`**.
2. **Recharger** : la page s'affiche depuis le cache (`codexchange-pages-v1`).
3. Naviguer vers une page jamais vue → `/offline.html`.
4. **Décocher `Offline`** → recharger → le site revient.
5. Revenir sur le fil d'accueil, le laisser à l'écran, **couper l'enregistrement**.

### Ce qu'on lit si le réseau tombe (texte de secours, à dire tel quel)

> « CodeXchange tourne **entièrement en local** : une PostgreSQL locale (base `codexchange`) et le
> serveur de production démarre avec `bun run build` puis `bun run start`. Ce que vous venez de voir n'a donc
> **aucune dépendance au réseau** — c'est exactement le cas d'usage visé : des développeurs en
> connexion instable qui lisent le forum hors-ligne grâce au service worker, puis reprennent leurs
> écritures dès le retour du réseau. Les chiffres affichés sur la page d'accueil sont lus en direct
> dans la base, pas codés en dur — sauf « Développeurs » et « Pays représentés », qui sont des
> valeurs de communication. La suite est documentée dans `docs/ROADMAP.md` : traductions swahili et
> arabe, RTL, création de contenus. Je reprends la démonstration dès que le
> réseau revient. »

Si c'est **l'application** qui plante (pas le réseau) : lire à la place le paragraphe suivant

> « Cette étape dépend d'une donnée de démonstration précise. Les mêmes parcours, avec les intitulés
> exacts des boutons et les erreurs attendues, sont écrits dans `docs/DEMO.md` : inscription, question
> en Markdown, vote, meilleure réponse, filtres de l'annuaire, demande de mentorat et notification.
> Rien de tout cela n'est une maquette : les 25 endpoints sont listés dans le README. »

### Check-list avant d'appuyer sur « Enregistrer »

- [ ] `bun run check` vert (lint + types + build)
- [ ] `bun run scripts/seed.ts` exécuté et `✅ Seed complete!` affiché
- [ ] Serveur démarré avec `bun run start` (**pas** `bun run dev`, sinon pas de service worker)
- [ ] `COOKIE_SECURE="false"` en local (sinon la connexion semble marcher puis se perd)
- [ ] Compte de démo testé : `kwame.mensah@codexchange.dev` / `codexchange2026`
- [ ] Badge `profil vérifié` visible sur un profil du seed ; en dev, la ligne `[verify] …` apparaît
      dans le terminal lors d'une inscription
- [ ] Service worker `activated` dans DevTools → Application
- [ ] Fenêtre privée ouverte pour le second compte, notifications visibles
- [ ] Thème clair, zoom navigateur à 100 %, notifications système coupées
- [ ] Après le tournage : `bun run scripts/seed.ts` pour repartir d'une base propre
