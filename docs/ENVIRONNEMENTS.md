# Environnements & plan de tournage (E3 / E4)

## 1. Les environnements

| Environnement | But | Base de données | Commandes | URL |
|---|---|---|---|---|
| **Local (dev)** | développement quotidien, démo live | **SQLite** `prisma/dev.db` | `bun run dev` | `http://localhost:3000` |
| **Local (prod-like)** | vérifier le build, **PWA et hors-ligne** (le service worker est désactivé en dev) | SQLite `prisma/dev.db` | `bun run build` puis `bun run start` | `http://localhost:3000` |
| **Preview** | branche / pull request : build + lint + types, base jetable | SQLite éphémère créée par `prisma db push` | étapes de `.github/workflows/ci.yml` | URL de déploiement du forge (à brancher) |
| **Staging** | pré-production, tests de migration et de seed | **PostgreSQL** (voir « Passer en PostgreSQL/Supabase » du README) | `bunx prisma migrate deploy` puis `bun run scripts/seed.ts`, `bun run build`, `bun run start` | domaine interne, HTTPS |
| **Production** | service public | **PostgreSQL / Supabase** + backups | `bun run build` puis `bun run start` derrière un reverse proxy HTTPS | `https://codexchange.dev` |

### Variables d'environnement (`.env`, jamais versionné)

| Variable | Valeur dev | Valeur prod | Rôle réel dans le code |
|---|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | `postgresql://user:pass@host:5432/codexchange` (ou URL Supabase) | **Seule variable obligatoire** : lue par `prisma/schema.prisma` (`env("DATABASE_URL")`) |
| `COOKIE_SECURE` | `false` | `true` (uniquement derrière HTTPS) | `src/lib/auth.ts` : ajoute `secure` au cookie `cx_session`. **À `true` sur un site en HTTP, le cookie n'est jamais stocké → connexion « acceptée » mais reste déconnecté** |
| `SESSION_SECRET` | `change-me-…` | `openssl rand -hex 32` | Sert de **sel** au hash du jeton de session : `sha256(SECRET:jeton)`. Le changer invalide **toutes les sessions** d'un coup — le geste à faire en cas de suspicion de compromission. Absente en dev local ⇒ valeur de repli utilisée |

Éléments d'infrastructure associés :

- **Reverse proxy** : `Caddyfile` présent dans le dépôt (proxy `:81` → `localhost:3000`, en transmettant
  `X-Forwarded-For` / `X-Real-IP`). Ces en-têtes servent au **rate limiting** et à l'enregistrement de
  l'IP de session (`clientIp()`).
- **HTTPS** : condition de `COOKIE_SECURE=true` et déclencheur du header
  `Strict-Transport-Security` (posé seulement si `NODE_ENV === "production"`).
- **CI** : `.github/workflows/ci.yml` équivaut à l'environnement « preview » aujourd'hui —
  elle ne fait que lint + typecheck + build (pas de déploiement).

### Commandes par environnement

```bash
# --- local dev
cp .env.example .env
bun install
bun run db:push          # schéma SQLite
bun run scripts/seed.ts  # données de démo (destructif)
bun run dev              # port 3000

# --- local prod-like (obligatoire pour la PWA / hors-ligne)
bun run build            # next build + copie static/ et public/ dans .next/standalone/
bun run start            # NODE_ENV=production bun .next/standalone/server.js

# --- staging / prod PostgreSQL
# 1. provider = "postgresql" dans prisma/schema.prisma
# 2. DATABASE_URL=postgresql://…
bunx prisma migrate deploy   # migrations versionnées (à créer : db push seul n'est pas versionné)
bunx prisma generate
bun run scripts/seed.ts      # optionnel : jeu de démonstration
bun run build && bun run start

# --- vérifications (avant toute mise en ligne)
bun run check               # lint + typecheck + build
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
bun run db:push
bun run scripts/seed.ts     # vérifier "✅ Seed complete!"
bun run build               # ← indispensable : le service worker ne s'enregistre qu'en prod
bun run start               # http://localhost:3000
```

Puis, dans l'ordre : ouvrir `http://localhost:3000`, se connecter en second compte dans une fenêtre
privée (`kwame.mensah@codexchange.dev` / `codexchange2026`), visiter Forum et Annuaire (pour remplir
le cache du service worker), DevTools → **Application → Service workers** : vérifier que
`codexchange` est **activated**.

### Plan 1 — Accroche + home (≈ 1 min)

1. Enregistrer à partir de l'onglet vide → taper `localhost:3000` → Entrée.
2. Laisser la home se charger : hero `Le code africain prend sa place.`, les compteurs
   (discussions, offres, projets, mentors issus de `/api/stats`), les 3 profils vedettes.
3. Survoler la navigation : Forum, Jobs, Projets, Mentorat, Tutos & Events, Annuaire.
4. **Ce qu'on dit** (voir §3) : le problème, puis la promesse en une phrase.

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
5. Revenir sur la home, laisser le hero à l'écran, **couper l'enregistrement**.

### Ce qu'on lit si le réseau tombe (texte de secours, à dire tel quel)

> « CodeXchange tourne **entièrement en local** : la base est SQLite dans le dépôt et le serveur de
> production démarre avec `bun run build` puis `bun run start`. Ce que vous venez de voir n'a donc
> **aucune dépendance au réseau** — c'est exactement le cas d'usage visé : des développeurs en
> connexion instable qui lisent le forum hors-ligne grâce au service worker, puis reprennent leurs
> écritures dès le retour du réseau. Les chiffres affichés sur la page d'accueil sont lus en direct
> dans la base, pas codés en dur — sauf « Développeurs » et « Pays représentés », qui sont des
> valeurs de communication. La suite est documentée dans `docs/ROADMAP.md` : traductions swahili et
> arabe, RTL, création de contenus, puis bascule PostgreSQL. Je reprends la démonstration dès que le
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
- [ ] Service worker `activated` dans DevTools → Application
- [ ] Fenêtre privée ouverte pour le second compte, notifications visibles
- [ ] Thème clair, zoom navigateur à 100 %, notifications système coupées
- [ ] Après le tournage : `bun run scripts/seed.ts` pour repartir d'une base propre
