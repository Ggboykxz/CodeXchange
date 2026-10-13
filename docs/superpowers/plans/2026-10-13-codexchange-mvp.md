# CodeXchange MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer avant le 25 octobre une plateforme africaine de développeurs (forum, jobs, projets, annuaire, tutos, événements, mentorat) en ligne, en français, sans page vide.

**Architecture:** Un seul projet Next.js 15 (App Router) : les pages consomment une couche métier dans `src/lib/*.ts`, les route handlers `src/lib/api` ne font que valider et mapper les erreurs. Prisma/SQLite en dev, Postgres en prod. Auth par cookie `httpOnly` signé.

**Tech Stack:** Next.js 15, TypeScript strict, Tailwind CSS, Prisma (SQLite→Postgres), bcryptjs, Vitest, ESLint+Prettier, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-13-codexchange-design.md`

## Global Constraints

- **Français obligatoire** : copy, messages d'erreur, tests d'interface. Aucune chaîne anglaise visible à l'écran.
- **Échéance** : 2026-10-25 ; **budget 0 €** ; Node ≥ 20.18, npm ≥ 10.8.
- **Qualité** : `npm run lint` et `npm test` à 0 échec avant chaque commit ; aucune étape `continue-on-error`.
- **DB** : dev = `file:./dev.db` ; la migration prod (1 ligne `provider`) est documentée, pas exécutée avant le 21 oct.
- **Zéro page vide** : toute liste possède un état vide actionnable (lien vers « écrire le premier sujet ») et le seed est exécuté en dev et en prod.
- **Erreurs typées** : code exact dans `src/lib/errors.ts`, statuts 401/403/409/422, corps `{ error: Code }`.
- **Identifiants** : `slug` auto-généré (`slugify(nom)` + suffixe numérique si collision) ; e-mails uniques, insensibles à la casse.

## Review Focus

*Cinq classes d'entrées/failles que la spec implique et qu'aucun test de tâche ne couvre naturellement.*

1. **Concurrence des likes/postulations/RSPV** — deux requêtes simultanées ne doivent pas compter deux fois : test d'idempotence dans chaque `toggle`/`apply` (Task 3, 5, 6).
2. **Session expirée ou cookie forgé** — `getSessionUserId()` doit retourner `null` (401) plutôt que lever : test `tests/auth.test.ts::session_expiree`.
3. **Injection dans le markdown des tutos/corps** — le rendu doit échapper le HTML : test `tests/tutorials.test.ts::corps_escaped`.
4. **Filtres combinés** (remote + pays + recherche) — chaque combinaison ne doit retourner qu'un sous-ensemble exact : tests de table dans `tests/jobs.test.ts`, `tests/members.test.ts`.
5. **Seed non reproductible / dates figées** — les événements « passés » doivent être passés au jour d'exécution : test `tests/seed.test.ts::evenements_coherents`.

Chaque ligne ci-dessus possède son test dans la tâche qui en est propriétaire.

---

### Task 1: Squelette Next.js + tooling

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `.github/workflows/ci.yml`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: `src/lib/*.ts` importables, script `npm test` (Vitest), `npm run lint`.

- [ ] **Step 1: Écrire le test fumée**

```ts
// tests/smoke.test.ts
import { expect, test } from "vitest";
test("la couche métier est importable", async () => {
  const lib = await import("../src/lib/errors");
  expect(Object.keys(lib)).toContain("AppError");
});
```

- [ ] **Step 2: Lancer le test, vérifier l'échec** — `npm test` → FAIL (`Cannot find module`).
- [ ] **Step 3: Créer le projet** — `npm create next-app@latest . -- --typescript --tailwind --eslint --app --src-dir --no-import-alias` (répondre aux prompts par flags), installer `vitest`, `@vitejs/plugin-react`, `bcryptjs`, `@prisma/client`, `prisma`, `prettier`.
- [ ] **Step 4: Écrire `src/lib/errors.ts`** — `export type Code = "AUTH_INVALID" | "AUTH_DUPLICATE_EMAIL" | "FORUM_VALIDATION" | "JOB_DUPLICATE_APPLICATION" | "MENTOR_SELF_REQUEST" | "MENTOR_DUPLICATE";` et `export class AppError extends Error { constructor(public code: Code, public status: 401|403|409|422) }`.
- [ ] **Step 5: `npm test` → PASS.**
- [ ] **Step 6: CI** — `.github/workflows/ci.yml` : `npm ci` → `npm run lint` → `npm test` sur push/PR, **sans** `continue-on-error`.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: squelette Next.js + Vitest + CI bloquante"`.

### Task 2: Schéma Prisma + accès DB

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`
- Test: `tests/db.test.ts`

**Interfaces:**
- Produces: `export const prisma: PrismaClient` ; modèles `User, Session, Post, Reply, Like, Job, Application, Project, ProjectMember, Event, Rsvp, Tutorial, MentorRequest` avec les champs listés dans le spec.

- [ ] **Step 1: Test fuites de schéma** (`tests/db.test.ts`) : `prisma.user.count()` se résout et `prisma.$disconnect()` existe.
- [ ] **Step 2: `npm test` → FAIL.**
- [ ] **Step 3: Écrire `schema.prisma`** (provider `sqlite`) : champs du spec, `User.email @unique`, `User.slug @unique`, contraintes uniques `@@unique([userId, postId])`, `@@unique([jobId, userId])`, `@@unique([eventId, userId])`, `@@unique([projectId, userId])`, `@@unique([mentorId, requesterId])`.
- [ ] **Step 4: `npx prisma migrate dev --name init`** puis `src/lib/db.ts` : singleton `PrismaClient` avec `globalThis` cache (dév HMR).
- [ ] **Step 5: `npm test` → PASS.**
- [ ] **Step 6: Commit** — `feat: schéma Prisma + client singleton`.

### Task 3: Auth (inscription, connexion, session)

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/session.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/inscription/page.tsx`, `src/app/connexion/page.tsx`
- Test: `tests/auth.test.ts`

**Interfaces:**
- Produces: `hashPassword(p: string): Promise<string>` ; `verifyPassword(p: string, h: string): Promise<boolean>` ; `registerUser(i: {email, password, nom, ville, pays, titre}): Promise<User>` (throw `AppError("AUTH_DUPLICATE_EMAIL", 409)`) ; `loginUser(email, password): Promise<User>` (throw `AppError("AUTH_INVALID", 401)`) ; `createSession(userId: number): Promise<string>` ; `getSessionUserId(): Promise<number | null>` ; `destroySession(): Promise<void>` ; `slugify(nom: string): string`.

- [ ] **Step 1: Tests** — inscription crée un membre + slug ; e-mail dupliqué (casse différente) → `AUTH_DUPLICATE_EMAIL` ; mauvais mot de passe → `AUTH_INVALID` ; mot de passe < 8 car. → `FORUM_VALIDATION` *(code réutilisé, 422)* ; session créée → `getSessionUserId()` = id ; `destroySession()` → `null`.
- [ ] **Step 2: `npm test` → FAIL.**
- [ ] **Step 3: Implémenter `auth.ts`** (bcryptjs cost 10) et **`session.ts`** (cookie `cx_session` = token aléatoire 32 octets stocké en `Session`, expiration 14 j ; lecture via `cookies()` de `next/headers`).
- [ ] **Step 4: `npm test` → PASS.**
- [ ] **Step 5: Route handlers + pages** — POST register/login, DELETE logout ; pages d'inscription/connexion avec messages d'erreur FR.
- [ ] **Step 6: Commit** — `feat: auth e-mail/mot de passe + session cookie`.

### Task 4: Forum

**Files:**
- Create: `src/lib/forum.ts`, `src/app/api/forum/route.ts`, `src/app/api/forum/[id]/route.ts`, `src/app/api/forum/[id]/replies/route.ts`, `src/app/api/forum/[id]/like/route.ts`, `src/app/forum/page.tsx`, `src/app/forum/nouveau/page.tsx`, `src/app/forum/[id]/page.tsx`
- Test: `tests/forum.test.ts`

**Interfaces:**
- Consumes: `getSessionUserId()`, `AppError`.
- Produces: `listPosts(f?: {tag?: string; q?: string}): Promise<Post[]>` ; `getPost(id: number): Promise<PostDetail | null>` ; `createPost(authorId: number, i: {titre; corps; tags: string[]}): Promise<number>` (throw `AppError("FORUM_VALIDATION", 422)`) ; `addReply(postId, authorId, corps): Promise<void>` ; `toggleLike(postId, userId): Promise<boolean>`.

- [ ] **Step 1: Tests** — création valide → id > 0 ; titre < 8 car. → 422 ; tags > 3 → 422 ; `listPosts({q:"FLUTTER"})` trouve « Bug Flutter » (insensible à la casse) ; `listPosts({tag:"gabon"})` filtre ; `toggleLike` deux fois → `true` puis `false` ; `addReply` sans session → `AUTH_INVALID`.
- [ ] **Step 2: `npm test` → FAIL.**
- [ ] **Step 3: Implémenter `forum.ts`** (requêtes Prisma + filtres).
- [ ] **Step 4: `npm test` → PASS.**
- [ ] **Step 5: Routes + pages** (liste avec recherche, formulaire, détail avec réponses + bouton like, état vide « Écrire le premier sujet »).
- [ ] **Step 6: Commit** — `feat: forum (sujets, réponses, likes, recherche)`.

### Task 5: Jobs

**Files:**
- Create: `src/lib/jobs.ts`, `src/app/api/jobs/route.ts`, `src/app/api/jobs/[id]/apply/route.ts`, `src/app/jobs/page.tsx`, `src/app/jobs/[id]/page.tsx`
- Test: `tests/jobs.test.ts`

**Interfaces:**
- Produces: `listJobs(f?: {remote?: boolean; pays?: string; contrat?: string; q?: string}): Promise<Job[]>` ; `createJob(authorId, i): Promise<number>` ; `applyToJob(jobId, userId): Promise<number>` (throw `AppError("JOB_DUPLICATE_APPLICATION", 409)`), retourne le nouveau compteur.

- [ ] **Step 1: Tests** — table de combos (remote+pays+contrat+q) avec résultat exact ; postulation 1 → compteur 1 ; postulation 2 → `JOB_DUPLICATE_APPLICATION` ; contrat hors liste → `FORUM_VALIDATION`.
- [ ] **Step 2: FAIL → 3. Implémenter → 4: PASS.**
- [ ] **Step 5: Routes + page** (filtres persistés en query string, badge remote/contrat, bouton postuler désactivé après).
- [ ] **Step 6: Commit** — `feat: offres d'emploi + postulation`.

### Task 6: Projets

**Files:**
- Create: `src/lib/projects.ts`, `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/join/route.ts`, `src/app/projets/page.tsx`, `src/app/projets/[id]/page.tsx`
- Test: `tests/projects.test.ts`

**Interfaces:**
- Produces: `listProjects(f?: {stack?: string; q?: string}): Promise<Project[]>` ; `createProject(authorId, i): Promise<number>` ; `joinProject(projectId, userId): Promise<number>` (idempotent : 2ᵉ appel retourne le même compteur sans erreur).

- [ ] **Step 1: Tests** — création + liste ; `joinProject` deux fois → même compteur (idempotent) ; auteur qui rejoint son propre projet → compteur inchangé *(règle : autorisée, pas d'erreur)* ; `cherche` CSV exposé en tableau.
- [ ] **Step 2: FAIL → 3. Implémenter → 4: PASS.**
- [ ] **Step 5: Pages** avec état vide « Lancer le premier projet ».
- [ ] **Step 6: Commit** — `feat: projets + rejoindre`.

### Task 7: Annuaire + profil

**Files:**
- Create: `src/lib/members.ts`, `src/app/api/members/route.ts`, `src/app/annuaire/page.tsx`, `src/app/membres/[slug]/page.tsx`
- Test: `tests/members.test.ts`

**Interfaces:**
- Produces: `listMembers(f?: {pays?: string; stack?: string; q?: string}): Promise<Member[]>` ; `getMemberBySlug(slug: string): Promise<Member | null>` ; `listCountries(): Promise<string[]>`.

- [ ] **Step 1: Tests** — filtre pays ; filtre stack (une stack parmi plusieurs) ; recherche sur nom/titre/ville ; slug inexistant → `null` ; pays retournés triés.
- [ ] **Step 2: FAIL → 3. Implémenter → 4: PASS.**
- [ ] **Step 5: Pages** — cartes avec drapeau (`🏳️` ou emoji pays), pastille de couleur déterministe à partir du slug, lien vers le profil.
- [ ] **Step 6: Commit** — `feat: annuaire + profils publics`.

### Task 8: Événements, Tutos, Mentorat

**Files:**
- Create: `src/lib/events.ts`, `src/lib/tutorials.ts`, `src/lib/mentorat.ts`, les routes `api/events`, `api/events/[id]/rsvp`, `api/tutorials`, `api/mentorat`, les pages `evenements/`, `tutos/[slug]/`, `mentorat/`
- Test: `tests/events.test.ts`, `tests/tutorials.test.ts`, `tests/mentorat.test.ts`

**Interfaces:**
- Produces: `listEvents()` (tri par date) ; `rsvp(eventId, userId): Promise<number>` (unique, throw 409 sur doublon) ; `listTutorials()` ; `getTutorial(slug)` ; `listMentors()` ; `requestMentor(mentorId, requesterId, message)` (throw `MENTOR_SELF_REQUEST` 403 / `MENTOR_DUPLICATE` 409).

- [ ] **Step 1: Tests** — événements triés par date ; RSVP doublon → 409 ; tuto inexistant → `null` ; **corps markdown échappé** (HTML intrusif rendu textuel) ; mentorat : soi-même → 403, doublon → 409.
- [ ] **Step 2: FAIL → 3. Implémenter → 4: PASS.**
- [ ] **Step 5: Pages** (badges « Passé »/« À venir », compteur RSVP, rendu markdown sans `dangerouslySetInnerHTML` non assaini).
- [ ] **Step 6: Commit** — `feat: événements + tutos + mentorat`.

### Task 9: Design system + landing (ui-ux-pro-max)

**Files:**
- Create: `src/components/{Header,Footer,Card,Badge,EmptyState,SearchBar,Avatar}.tsx`, `src/app/globals.css` (tokens), `src/app/page.tsx` (landing)
- Test: `tests/components.test.tsx`

**Interfaces:**
- Consumes: les pages des tâches 4–8.
- Produces: `<EmptyState titre description lien/>`, `<Badge variant/>`, `<Avatar nom slug/>` importables partout.

- [ ] **Step 1: Choisir dans le skill `ui-ux-pro-max`** un style, une palette (clair+sombre) et une paire de polices ; consigner le choix dans `docs/design-choices.md` (style, palette hex, polices).
- [ ] **Step 2: Test** — `EmptyState` rend le titre, le lien et le libellé du CTA (RTL non requis).
- [ ] **Step 3: FAIL → implémenter les composants + tokens CSS → PASS.**
- [ ] **Step 4: Landing** — hero FR (« La plateforme africaine des devs, par les devs »), 6 cartes de fonctionnalités, chiffres du seed, CTA inscription, 3 cartes d'actualités tirées du vrai forum.
- [ ] **Step 5: Responsive** — vérifié à 360 px, 768 px, 1280 px ; navigation mobile (menu burger).
- [ ] **Step 6: Commit** — `feat: design system + landing`.

### Task 10: Seed de démonstration

**Files:**
- Create: `prisma/seed.ts`, `src/lib/seed-data.ts`
- Test: `tests/seed.test.ts`

**Interfaces:**
- Produits: `npm run seed` → 30 membres, 15 sujets, 10 jobs, 8 projets, 6 événements (4 à venir / 2 passés), 8 tutos, 6 mentors.

- [ ] **Step 1: Tests** — `seed.test.ts` : après `runSeed(db)`, comptes exacts ; au moins 4 événements à venir, 2 passés (dates calculées depuis `new Date()`) ; au moins 3 pays distincts ; tous les slugs uniques.
- [ ] **Step 2: FAIL → 3. Implémenter `seed-data.ts` (données FR réalistes) + `seed.ts` idempotent (wipe puis insert) → PASS.**
- [ ] **Step 4: `npm run seed`** et vérifier les pages remplies.
- [ ] **Step 5: Commit** — `feat: base de démonstration (30 membres, forum, jobs…)`.

### Task 11: Déploiement + CI définitive

**Files:**
- Create: `vercel.json`, `.github/workflows/ci.yml` (ajout `prisma migrate deploy` + `seed`), `docs/deployment.md`, `scripts/demo.sh`

**Interfaces:**
- Consomme: Task 2 (`provider` à basculer en `postgresql`), Task 10 (seed).

- [ ] **Step 1: Documenter l'échelle** (Vercel+Neon / tunnel cloudflared / Pages statique) avec les commandes exactes et le point de bascule au 21 oct. *(Aucun compte n'est créé sans le commanditaire.)*
- [ ] **Step 2: Préparer la prod** — `DATABASE_URL` en variable d'env, `prisma migrate deploy` + `npm run seed` dans la CI de déploiement, `scripts/demo.sh` = build + seed + serveur local (vérification avant démo).
- [ ] **Step 3: CI** — lint + tests bloquants sur chaque push (vérifier qu'elle tourne verte sur GitHub).
- [ ] **Step 4: Commit** — `chore: déploiement documenté + CI verte`.

### Task 12: Polish + livrables du hackathon

**Files:**
- Modify: `src/app/**` (meta, OG, favicon, 404, accessibilité), `README.md`, `docs/pitch.md`

- [ ] **Step 1: Meta/SEO** — `title`/`description` FR, image OG, favicon, `sitemap.ts`.
- [ ] **Step 2: Accessibilité** — labels sur tous les formulaires, contrastes AA, focus visibles, `prefers-reduced-motion`.
- [ ] **Step 3: Performance** — `next build` sans erreur, pages liste rendues serveur, images dimensionnées.
- [ ] **Step 4: README** — présentation, captures, seed, run local, déploiement.
- [ ] **Step 5: `docs/pitch.md`** — script de 3 minutes + plan B (vidéo de secours) + checklist du 25.
- [ ] **Step 6: Commit final + push** — `docs: livrables hackathon (README, pitch, métas)`.

---

## Self-review (auteur)

- **Couverture spec** : goals 1–11 → T1 (squelette/CI), T3 (comptes), T4 (forum), T5 (jobs), T6 (projets), T7 (annuaire), T8 (tutos/événements/mentorat), T9 (landing/design), T10 (seed), T11 (déploiement), T12 (README/pitch). Aucun goal orphelin.
- **Steps** : chaque step n'impose qu'une action vérifiable ; les corps de fonction restent à l'implémenteur, sauf signatures et valeurs du spec.
- **Cohérence de types** : `AppError(code, status)` identique en T1/T3/T4/T5/T8 ; `getSessionUserId(): Promise<number | null>` partout ; `slugify` défini en T3 et réutilisé en T7/T10.
- **Review Focus** : les 5 lignes ont chacune leur test (T3 session, T4/T5 likes+postulations, T5/T7 filtres combinés, T8 markdown, T10 dates).
- **Proportion** : le plan reste plus court que le code produit ; aucune ligne « TBD ».
