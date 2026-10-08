# Script de démo scénarisée — CodeXchange

> Script de passage devant un jury. Trois parcours chronométrés + une démonstration hors-ligne.
> **Chaque intitulé cité ici est celui réellement affiché par l'interface** (dictionnaire
> `src/i18n/dictionaries.ts` + JSX des sections).

---

## Préparation commune (à faire **avant** l'entrée en scène)

**Durée :** 3 min (une seule fois) · **Prérequis :** Bun installé.

```bash
bun install                 # dépendances (postinstall = prisma generate)
cp .env.example .env        # DATABASE_URL PostgreSQL locale
bun run db:deploy          # applique les migrations versionnées sur la base `codexchange`
bun run scripts/seed.ts     # ⚠️ `bunx prisma db seed` ne sait pas quoi exécuter (pas de `prisma.seed`)
bun run dev                 # http://localhost:3000
```

Le seed se termine par `✅ Seed complete!` et `📊 Counts: { users: 31, threads: 40, posts: 100,
jobs: 10, projects: 8, tutorials: 8, events: 6, mentors: 8, … }` (les votes sont aléatoires, les
compteurs `upvotes` sont recalculés).

**Comptes utilisés pendant la démo** (mot de passe unique `codexchange2026`, constante
`SEED_PASSWORD`) :

| Rôle dans le scénario | Email |
|---|---|
| Compte « B » (répond, mentor) | `kwame.mensah@codexchange.dev` |
| Compte « A » (créé pendant la démo) | au choix du présentateur |

> La modale de connexion affiche `Compte démo : … / codexchange2026`, identique au vrai mot de
> passe du seed (`scripts/seed.ts`, constante `SEED_PASSWORD`).

---

## Parcours 1 — Du zéro à la meilleure réponse

**Durée : 8 min** · **Objectif :** montrer le cycle complet Q&R (inscription, profil, Markdown,
votes, réputation).
**Prérequis :** le serveur est lancé et le seed a été exécuté (ci-dessus). Deux fenêtres (ou un
navigateur + une fenêtre privée) sur `http://localhost:3000`.

### 1. S'inscrire (2 min)

1. Dans la **fenêtre 1**, cliquer sur le bouton **`Rejoindre`** (en haut à droite du header).
2. La modale **`Rejoindre CodeXchange`** s'ouvre (sous-titre `Une plateforme, par les devs pour les devs`).
3. Remplir :
   - **`Nom complet`** → `Aminata Demo`
   - **`Nom d'utilisateur`** → `aminata.demo` (unique, minuscules/chiffres/`.`/`_`/`-`, 3 à 30 caractères)
   - **`Email`** → `aminata.demo@codexchange.dev`
   - **`Mot de passe`** → `demo2026pass` (**8 caractères minimum, avec au moins une lettre ET un
     chiffre** — règle zod ; le champ HTML n'indique que 6)
   - **`Pays`** → `Sénégal` · **`Ville`** → `Dakar`
   - **`Stack principale (ex: React, Go)`** → `React, TypeScript`
   - **`Niveau`** → `Junior`
4. Cliquer **`Créer mon compte`**.

**Résultat attendu :** toast `Bienvenue sur CodeXchange, Aminata Demo !`, le header remplace
`Connexion` / `Rejoindre` par l'avatar + `aminata.demo`, et la cloche de notification apparaît.

**Ce qu'on montre au jury :** l'inscription ouvre une **session serveur** (cookie `cx_session`
`httpOnly`) ; le mot de passe est haché en PBKDF2-SHA512 (100 000 itérations) ; un nom d'utilisateur
pris renvoie `409 Username already taken`.

### 2. Compléter son profil (1 min 30)

1. Cliquer sur **l'avatar + `aminata.demo`** en haut à droite → l'application ouvre l'espace personnel
   (section **Annuaire**).
2. La carte du nouveau profil est **en première position** (l'annuaire est trié du plus récent au plus
   ancien). Cliquer dessus.
3. Sur la page profil, cliquer **`Modifier mon profil`**.
4. Dans la modale, remplir **`Accroche`** (`Frontend junior · je code pour le terrain`),
   **`Bio`**, laisser **`Pays`** = `Sénégal`, cocher l'interrupteur **`Dispo pour opportunités`**.
5. Cliquer **`Enregistrer`**.

**Résultat attendu :** toast `Profil mis à jour !`, le bandeau `Dispo pour opportunités` (fond plein)
s'affiche sur la carte, la bio apparaît sous la rubrique **`Bio`**.

**Ce qu'on montre :** `PATCH /api/profiles/me` — champs whitelistés par zod, identité prise dans la
session (`?username=` ne servirait à rien), impossible de modifier `role` ni `passwordHash`.

### 3. Poser une question en Markdown avec bloc de code (2 min)

1. Dans le header, cliquer **`Forum`**.
2. Cliquer **`Nouvelle discussion`** → modale **`Lancer une discussion`**.
3. Remplir :
   - **`Titre`** → `useEffect se rejoue en boucle : quelle stratégie en React 19 ?` (8 caractères minimum — le champ HTML plafonne à **120**, le serveur accepte jusqu'à 180)
   - **`Catégorie`** → `Frontend`
   - **`Détails`** (Markdown) → coller :

     ````markdown
     J'ai ce composant qui boucle et je ne comprends pas pourquoi.

     ```tsx
     useEffect(() => {
       load();
     }, [load]);
     ```

     - `load` est issue de `useCallback`
     - j'ai essayé un flag `hasLoaded`

     **Merci pour vos retours.**
     ````
   - **`Tags`** → `react,nextjs,react-19`
4. Cliquer **`Publier`**.

**Résultat attendu :** toast `Discussion publiée !`, la modale se ferme et la question s'ouvre
automatiquement (`#forum/<slug>` généré côté serveur) : corps rendu en Markdown (gras, liste),
**bloc de code coloré avec bouton `Copier`**, tags colorés, ligne
`0 upvotes · N vues · 0 réponses`, catégorie `Frontend` en pastille.

**Ce qu'on montre :** le Markdown est rendu par `react-markdown` **sans interpréter le HTML brut**
(pas de `rehype-raw`) ; le slug est dérivé du titre avec un suffixe aléatoire (pas de course
`check-then-act`).

### 4. Quelqu'un répond depuis un second compte (1 min 30)

1. Ouvrir la **fenêtre 2** sur `http://localhost:3000`.
2. Cliquer **`Connexion`**, saisir `kwame.mensah@codexchange.dev` / `codexchange2026`, puis
   **`Se connecter`** → toast `Bon retour, Kwame Mensah !`.
3. Aller sur **`Forum`**, ouvrir la question fraîchement posée (première carte de la liste).
4. Dans le champ sous l'intitulé de rubrique **`Répondre`** (placeholder `Ta réponse, avec code et
   exemples si besoin...`), écrire une réponse avec un bloc de code.
5. Cliquer **`Répondre`** → toast `Réponse publiée !`.

**Résultat attendu :** la réponse apparaît sous `1 réponses`, signée **Kwame Mensah**.
Dans la **fenêtre 1**, recharger la page (les réponses ne sont pas en temps réel) : la réponse est là,
et **la cloche de notification affiche un badge `1`** — au clic : `Kwame Mensah a répondu à « useEffect
se rejoue en boucle… »` avec l'aperçu du texte et `now`.

**Ce qu'on montre :** notifications in-app créées côté serveur, sans auto-notification, sans e-mail.

### 5. Voter +1 puis marquer la meilleure réponse (1 min)

**Fenêtre 1 (Aminata, auteur de la question) :**

1. Sur la réponse de Kwame, cliquer le **chevron `↑`** (libellé accessible `Voter pour cette réponse`).
   → le compteur passe de `0` à `1`.
2. Cliquer le bouton **`Accepter`** (visible uniquement pour l'auteur de la question ou un
   modérateur) → toast `Meilleure réponse marquée`.

**Résultat attendu :** le bouton devient **`Meilleure réponse`** (fond plein), un bandeau `Résolu`
s'affiche en tête de la question, la réponse acceptée passe en premier, le compteur de réponses reste
affiché.

**Fenêtre 2 (Kwame) :** la cloche affiche `1` → clic → `Ta réponse a été acceptée`.

### 6. Montrer la réputation (30 s)

Le score s'affiche **dans l'interface** : badge `★ réputation` sur le profil de l'annuaire, et
`★ n` à côté du nom de l'auteur sous chaque réponse.

1. Ouvrir `Annuaire` → profil de Kwame : le badge de réputation.
2. Revenir au forum, ouvrir la réponse acceptée : `★ n` près de l'auteur.
3. (Option, pour la transparence) `http://localhost:3000/api/profiles/kwame.codes` → `user.reputation`.

**Règles réellement codées** (`src/app/api/votes/route.ts`, `src/app/api/posts/[id]/route.ts`) :
`acceptedAnswer: 10`, `answerUpvoted: 2`, `questionDownvoted: -1`.

> ✅ **Vérifié en séance** : le `+10` de la réponse acceptée, le `+2` de la réponse votée et le
> `−1` de la question downvotée reviennent tous à **l'auteur du contenu**, jamais au votant. On peut
> le prouver en votant puis en relisant le profil de l'auteur.

### 7. Vérification de l'e-mail et badge (1 min)

Un profil vérifié porte un badge **`profil vérifié`** (coche émeraude) à côté du nom, avant la
réputation.

1. Fenêtre privée → inscription avec une adresse neuve : le toast affiche **« Ouvrir le lien de
   vérification »** (il est aussi dans le terminal, ligne `[verify]`).
2. Clic → la page `/verify` valide le jeton → retour accueil → `Annuaire` → **le badge est là**.
3. Avant le clic, le même profil n'affiche rien : montrez la différence, puis rechargez.

> ⚠️ **Seul `bun run dev` rend le lien.** En build de production la réponse ne le contient pas :
> c'est voulu — renvoyer le jeton à celui qui saisit l'adresse prouverait exactement ce que la
> vérification doit établir (voir `exposesVerificationLink()`). Les comptes du seed sont déjà
> vérifiés, donc aucun n'affiche d'état vide.

**Bilan du parcours :** inscription → profil éditable → e-mail vérifié (badge) → contenu Markdown →
 réponse → vote → meilleure réponse → réputation serveur. **Tout est persisté en base PostgreSQL, révocable, et relisible au
 prochain démarrage.**

---

## Parcours 2 — Recherche plein-texte et filtres

**Durée : 4 min** · **Objectif :** montrer que la recherche et les filtres sont **côté serveur**.
**Prérequis :** seed lancé (40 questions dont **24 résolues et 16 non résolues**), serveur démarré,
compte démo connecté (facultatif sauf pour l'étape de réponse).

1. Header → **`Forum`**.
2. Dans le champ à loupe (placeholder **`Rechercher dans le forum...`**), taper `flutter`.
   → après **250 ms de debounce**, la liste se réduit à **4 questions** (titres Flutter offline-first,
   Flutter 2G, React Native vs Flutter, Flutter Web).
   *Montre l'onglet Réseau : la requête est `GET /api/threads?q=flutter` — la recherche porte sur le
   titre, le corps ET les tags.*
3. Dans le sélecteur de catégorie (défaut **`Toutes catégories`**), choisir **`Mobile`**.
   → **5 questions**, toutes en catégorie Mobile.
4. Dans le sélecteur de tags (défaut **`Tous les tags`**), choisir `flutter`.
   → **4 questions** : filtre catégorie ∩ tag, toujours envoyé au serveur (`category=mobile&tag=flutter`).
5. Remettre **`Toutes catégories`** et **`Tous les tags`**, puis vider le champ de recherche
   (il n'y a **pas de bouton « Réinitialiser »** : on repart à la main) → liste complète restaurée.
6. **Filtre « non résolu »** : il n'existe **pas de sélecteur** dans l'interface aujourd'hui. Ouvrir
   `http://localhost:3000/api/threads?solved=false` → JSON `total: 16`, puis
   `?solved=true` → `total: 24`. Revenir au forum et montrer les pastilles **`Résolu`** (✓) en tête
   des questions traitées.
7. Ouvrir une question **non résolue** (sans pastille), répondre en 1 phrase → `Réponse publiée !`
   → puis, si le compte connecté est l'auteur de la question, cliquer **`Accepter`** pour faire
   basculer la question en `Résolu`.

**Ce qu'on montre au jury :** les filtres sont des `WHERE` Prisma (`category`, `tags contains`,
`solved`, `OR [title, body, tags] contains`) — pas un filtrage JavaScript côté client ; la pagination
est bornée (`limit` max 100, défaut 20) ; les tags proposés par le sélecteur sont dérivés des
questions chargées.

---

## Parcours 3 — Annuaire, filtres, mentorat et cloche

**Durée : 5 min** · **Objectif :** parcourir l'annuaire, ouvrir un profil, déclencher une demande de
mentorat et voir la notification tomber.
**Prérequis :** seed lancé (8 mentors, tous avec des places libres) et **le parcours 1 exécuté**
(pour disposer d'un compte qui n'est pas mentor — sinon créer un compte rapide). **Deux fenêtres** :
la fenêtre 1 connectée sur `aminata.demo@codexchange.dev` (compte non mentor), la fenêtre 2
connectée sur `kwame.mensah@codexchange.dev` (**lui est mentor** du seed).

### A. Filtrer l'annuaire (1 min 30)

1. Header → **`Annuaire`** (titre `Annuaire des développeurs`).
2. Dans la carte de filtres :
   - sélecteur **`Tous les pays`** → `Sénégal`
   - sélecteur **`Toutes villes`** → `Dakar` (filtrage local sur la page chargée)
   - sélecteur **`Toutes stacks`** → `React` (le cas échéant)
   - sélecteur **`Tous niveaux`** → `Senior`
   - interrupteur **`Disponibles uniquement`** → activer
3. Observer la grille qui se met à jour (debounce 150 ms) ; désactiver les filtres pour tout revoir.

**Résultat attendu :** cartes avec avatar, nom, accroche, ville/pays, pastilles de stack ; état vide
`Aucun·e dev trouvé·e avec ces filtres.` si l'intersection est vide.

### B. Ouvrir un profil (1 min)

1. Cliquer sur la carte de **Kwame Mensah** (ou de n'importe quel dev).
2. La page profil affiche : nom, accroche, `Accra, Ghana`, pastilles de stack, liens
   `GitHub` / `Twitter` / `Site`, rubrique **`Bio`**, puis les trois colonnes
   **`Discussions récentes`**, **`Projets récents`**, **`Tutos récents`**.

**Ce qu'on montre :** `GET /api/profiles/[username]` renvoie le profil **avec** `reputation` et les
activités, mais **jamais** `passwordHash` (sélecteur Prisma explicite + filtre `json()`).

> À signaler : le bouton **`Demander un mentorat`** est disponible directement depuis le profil public d'un mentor (carte dédiée avec expertise et tarif) : on peut aussi bien y accéder depuis la section **Mentorat**.

### C. Demander un mentorat (1 min 30)

1. Header → **`Mentorat`**.
2. Repérer la carte **Kwame Mensah** : expertise `Go`, `Backend Architecture`…, note `★ 5.0`,
   `15` avis, `1/2` places, tarif `Free`.
3. Cliquer **`Demander un mentorat`** (le bouton affiche `Complet` si `slotsTaken >= capacity`).
4. Dans la modale **`Demander un mentorat`** (« Avec **Kwame Mensah** — Backend Engineer · Go ·
   Distributed Systems ») :
   - **`Ton objectif`** → `Passer de junior à mid backend`
   - **`Message au mentor`** → `Salut Kwame, je monte une API Go à Accra et je bloque sur la
     gestion des idempotency keys. 30 min de ton temps me changeraient.`
     (**10 caractères minimum**)
5. Cliquer **`Envoyer la demande`**.

**Résultat attendu :** toast **`Demande envoyée ! Le mentor te répondra sous 48h.`**, la modale se
ferme. En base : ligne `Mentorship` avec `status: "pending"`.

**Erreurs à connaître (elles prouvent la validation) :** `422 You cannot request yourself as a mentor`
(si le compte connecté est le mentor), `409 You already have a pending request with this mentor`,
`409 This mentor has no free slot right now`.

### D. La notification tombe chez le mentor (1 min)

1. **Fenêtre 2** (Kwame, le mentor) : recharger la page ou attendre le **polling de 60 s**.
2. La **cloche** du header affiche le badge `1`.
3. Cliquer la cloche → panneau **`Notifications`** (`1 non lues`) : ligne
   `Aminata Demo demande un mentorat` avec l'aperçu du message et `now`.
4. Cliquer la ligne → le panneau se ferme et l'application navigue vers **`#mentorat`**, la
   notification passe en lu (compteur décrémenté, `PATCH /api/notifications`).
5. Cliquer **`Tout marquer comme lu`** → le badge disparaît (`POST /api/notifications/read-all`).

**Ce qu'on montre au jury :** notification écrite côté serveur (`src/lib/notify.ts`, fire-and-forget,
jamais vers soi-même), cloche avec badge + compteur de non-lues, navigation in-app au clic, et
l'absence totale d'e-mail (tout est in-app pour l'instant).

---

## Encadré — Démonstration hors-ligne (PWA)

**Durée : 2 min** · **Prérequis indispensable :** le service worker **ne s'enregistre qu'en
production** (`src/components/sw-register.tsx` teste `NODE_ENV === "production"`), il faut donc
**build + start** : `bun run dev` ne suffit pas.

```bash
bun run build     # next build + copie static/ et public/ dans .next/standalone/
bun run start     # NODE_ENV=production, http://localhost:3000
```

1. Ouvrir `http://localhost:3000`, visiter **Forum**, ouvrir **une question**, puis **Annuaire** —
   chaque page consultée est écrite dans le cache `codexchange-pages-v1`.
2. DevTools → onglet **Réseau** → cocher **`Offline`**.
3. **Recharger** la page : la question déjà consultée s'affiche normalement (servie depuis le cache),
   les assets depuis `codexchange-static-v1`.
4. Naviguer vers une **page jamais visitée** : taper dans la barre d'adresse une URL inconnue
   (ex. `http://localhost:3000/pas-visit` — inutile de cliquer dans le menu, la navigation interne
   est en hash et ne déclenche aucune requête réseau) → la page **`/offline.html`** s'affiche :
   titre `Hors ligne — CodeXchange`, gros titre `Hors ligne. Connexion requise.`, boutons
   `Réessayer` et `Retour à l'accueil`.
5. Tenter une action nécessitant l'API (vote, réponse) → toast **`Erreur réseau. Réessaie.`** :
   **`/api/*` n'est jamais mis en cache** (données fraîches, sessions, tokens).
6. **Décocher `Offline`** → recharger : le site revient normalement, les écritures repartent.

**Ce qu'on montre au jury :** un service worker **écrit à la main** (sans Workbox), deux stratégies —
`stale-while-revalidate` sur les assets statiques, `network-first` avec repli cache sur les
navigations — un manifest PWA installable (icônes 192/512/maskable) et un scope de cache versionné
(`v1`, purge à l'activation). Vérification rapide : DevTools → **Application → Service workers →
codexchange** et **Application → Cache storage**.

---

## Encadré — Pièges à éviter

| Piège | Symptôme | Contournement |
|---|---|---|
| **Seed non lancé** | Listes vides, `Aucune discussion trouvée. Sois le premier à en lancer une !` | `bun run scripts/seed.ts` (avant le jury, jamais pendant) |
| **Mauvaise commande de seed** | `bunx prisma db seed` ne sait pas quoi exécuter : aucun champ `prisma.seed` dans `package.json` | `bun run scripts/seed.ts` |
| **Serveur pas démarré** | `Erreur réseau. Réessaie.` partout | `bun run dev` (port 3000) ; vérifier `curl -I http://localhost:3000` |
| **`.env` absent** | `Environment variable not found: DATABASE_URL` | `cp .env.example .env` |
| **`COOKIE_SECURE="true"` en HTTP** | Connexion acceptée (200) mais l'utilisateur reste déconnecté : le cookie `secure` n'est pas stocké en HTTP | `COOKIE_SECURE="false"` en local, `true` derrière Caddy/HTTPS |
| **Mot de passe de démo** | `401 Invalid credentials` | `codexchange2026` (affiché tel quel dans la modale de connexion) |
| **Mot de passe trop faible** | `400 Invalid registration payload` à l'inscription | 8+ caractères, **une lettre ET un chiffre** |
| **Auto-vote** | `422 You cannot vote on your own answer` | faire voter un **autre** compte |
| **Le vote semble revenir à zéro** | Après rechargement, plus aucun bouton en surbrillance | normal si on était déconnecté : `myVote` vient de la session. Se reconnecter, voter, recharger |
| **Réponses non temps réel** | La 2e fenêtre ne voit pas la nouvelle réponse | recharger la page |
| **Cloche vide tout de suite** | Polling toutes les **60 s** | recharger la page avant de montrer la notification |
| **Demande de mentorat refusée** | `422` (c'est le mentor connecté) ou `409` (doublon / complet) | se connecter sur un **autre** compte, prendre un mentor avec `places restantes > 0` |
| **Démo hors-ligne qui ne marche pas** | Pas de Service worker dans DevTools | passer par `bun run build` + `bun run start` (le SW est désactivé en dev) |
| **Rate limiting pendant la démo** | `429 Too many requests` après ~10 logins en 1 min (IP) ou 5 tentatives / 5 min sur un même email | ne pas spammer le formulaire ; relancer le serveur si besoin (compteur en mémoire) |
| **Seed lancé en cours de séance** | Tout le contenu de démo disparaît | le seed **purge intégralement** la base : à lancer uniquement en préparation |
| **Réputation qui « ne bouge pas »** | L'upvote d'une **question** ne change rien : le barème ne sanctionne que le downvote de question | voter une **réponse** (+2) ou downvoter une question (−1), puis recharger le profil |
| **Bascule de langue qui affiche l'anglais** | `Kiswahili` / `العربية` montrent l'anglais | normal : `sw` et `ar` héritent du dictionnaire anglais (traduction à venir) |
| **Pays absent du filtre annuaire** | Un pays du seed ne se trouve pas dans la liste | les **21 pays** du seed sont désormais proposés ; au-delà, alimenter la liste via un `SELECT DISTINCT country` (TODO dans `annuaire-section.tsx`) |
