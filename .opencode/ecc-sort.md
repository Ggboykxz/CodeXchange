# ECC Project Sort — CodeXchange

- **Date :** 2026-10-26
- **Méthode :** skill `agent-sort` (ECC 2.2.3) — 4 passes de review en parallèle (skills, commands, agents, rules/hooks/extras), chaque décision citant des preuves du repo.
- **Source du bundle :** `C:\Users\PC\node_modules\ecc-universal` (v2.2.3), install user-level dans `C:\Users\PC\.config\opencode` (opencode-home, partagé par TOUS les projets du compte).
- **Périmètre :** ce fichier + `.opencode/agents/` + `.opencode/skills/skill-library/` sont **en scope projet**. L'install user-level n'a PAS été modifiée (les items LIBRARY appartiennent aux autres repo du compte : Rust, Flutter, Swift, Python…).

## STACK (preuves)

| Axe | Valeur | Preuve |
|---|---|---|
| Langage | TypeScript strict (~161 `.tsx` + ~152 `.ts`) | `tsconfig.json` (`strict: true`), compteurs d'extensions |
| Framework | Next.js 16 (App Router) + React 19 | `package.json` (next ^16.4.3, react ^19) |
| UI | Tailwind CSS v4, Base UI, Astryx (design system) | `package.json` (`@astryxdesign/core`), `AGENTS.md` |
| Données | Prisma 6 — SQLite dev → Postgres (Vercel) | `prisma/schema.prisma`, `scripts/switch-to-postgres.mjs` |
| Tests | Vitest 4 + Testing Library (jsdom), ~40 fichiers, CI bloquante | `vitest.config.mjs`, `tests/`, `.github/workflows/ci.yml` |
| Qualité | ESLint 9 flat + Prettier, `tsc --noEmit` ; CI : lint → typecheck → test → build | `eslint.config.mjs`, `ci.yml` |
| Auth | bcryptjs, cookie httpOnly, rate-limiting, ~30 API routes | `src/app/api/**/route.ts` |
| Déploiement | Vercel | `vercel.json` (`npm run vercel-build`) |
| Hors stack (vérifié) | Aucun Python/Rust/Go/Kotlin/Java/Flutter/Swift/Vue/C++/Docker/Playwright | greps d'extensions + `package.json` |

## DAILY (45 items — chargés/utilisés par défaut sur ce projet)

### Skills (5) — déjà présents en user-level, usage prioritaire ici
`verification-loop` (6 phases = gates ci.yml), `tdd-workflow` (40+ tests, `npm test` bloquant), `error-handling` (TS strict, auth, rate-limit, Prisma), `git-workflow` (CI push main + PR), `agent-self-evaluation` (mandatée par le SELF-CHECK d'AGENTS.md).

### Commands (12) — présents en user-level, boucle quotidienne
`react-build`, `react-review`, `react-test`, `build-fix`, `verify`, `quality-gate`, `code-review`, `pr`, `prp-pr`, `prp-commit`, `review-pr`, `tdd`.

### Agents (14) — **installés ici, scope projet** : `.opencode/agents/`
`typescript-reviewer`, `react-reviewer`, `react-build-resolver`, `build-error-resolver`, `code-reviewer`, `tdd-guide`, `pr-test-analyzer`, `planner`, `security-reviewer`, `database-reviewer`, `a11y-architect` (le repo a déjà `tests/contraste.test.ts`), `performance-optimizer`, `doc-updater`, `seo-specialist` (dossier `seo/` actif).
Copiés depuis `ecc-universal/agents` (v2.2.3), ligne `model:` retirée (hérite du modèle de session — provider ovhcloud-free).

### Rules (4 sets) — référencés, pas copiés (AGENTS.md du repo porte déjà l'essentiel)
`rules/common/` générique (coding-style, testing, security, patterns, git-workflow, code-review…), `rules/typescript/`, `rules/react/` (couvre App Router/RSC), `rules/web/` (8 fichiers dont design-quality, performance). Chemin : `C:\Users\PC\node_modules\ecc-universal\rules\<set>\`.

### Hooks / Scripts / Tools (10 + stubs) — installés en user-level, compatibles et inactifs/coûteux-zéro
Tools : `run-tests` (vitest✓), `check-coverage` (JS/lcov✓), `lint-check` (ESLint 9✓), `format-code` (Prettier✓), `security-audit` (npm audit✓), `dependency-analyzer` (npm✓), `git-summary`✓, `changed-files`✓ + `index.ts` (barrel), `setup-package-manager.js` (npm✓).
Plugins `ecc-hooks.ts` : stubs inerts `() => ({})` — chargés, zéro comportement.
⚠️ Caveat wiring : `opencode.json` (home) n'a ni clé `plugin` ni `instructions` → ces tools et `INSTRUCTIONS.md` sont inertes tant qu'ils ne sont pas branchés (décision à prendre, voir Open Questions — impacte TOUS les projets si fait en home).

## LIBRARY (216 items — accessibles via le router `skill-library`, pas chargés par défaut)

| Surface | Count | Contenu |
|---|---|---|
| Skills | 44 | dont notables : `e2e-testing` (Playwright absent), `windows-desktop-e2e` (web, pas pywinauto), `browser-qa`, `production-audit`, `santa-method`, `council`, `intent-driven-development`, `unified-memory`, skills méta-ECC (`configure-ecc`, `context-budget`, `skill-stocktake`…), `continuous-learning` (v1 dépréciée) |
| Commands | 88 | dont notables : 36 hors stack (cpp/go/rust/kotlin/gradle/flutter/python/fastapi/vue), `e2e` (Playwright non installé), `test-coverage` (`@vitest/coverage-v8` absent), `security` (audit pré-release), `pm2`/`jira` (inexistants), `epic-*`/`orch-*`/`multi-*`/`gan-*`/`loop-*` (orchestration situationnelle), `hookify*` (pas de `.opencode/` hookify), `save/resume-session` (chemins `~/.claude/` Codex) |
| Agents | 54 | 25 hors stack (cpp/csharp/dart/django/fastapi/flutter/fsharp/go/harmonyos/java/kotlin/php/pytorch/python/rust/swift/vue), `e2e-runner` (à promouvoir si Playwright arrive), `architect`/`code-architect`/`code-explorer` (on-demand), `opensource-*` (repo `private: true`), `healthcare`/`network-*`/`homelab`/`marketing`/`gan-*`/`mle`/`rag` |
| Rules | 19 sets | 18 familles hors stack (angular, arkts, cpp, csharp, dart, fsharp, golang, java, kotlin, nuxt, perl, php, python, react-native, ruby, rust, swift, vue) + `common/agents.md`/`common/hooks.md` (primitives Claude Code non portées) |
| Hooks | 4 | `.pi/` (adapter Pi, bon OS mais mauvais harness), `hooks/hooks.json` (Claude Code), `codex-hooks.json` (Codex), `memory-persistence/` (réf. Claude) |
| Scripts/Plugins | 4 | `auto-update.js`, `harness-audit.js`, `skills-health.js` (méta-ECC), `reason-network.ts` (infra perso non liée au repo) |
| Extras | 3 | `mcp-configs/mcp-servers.json` (catalogue 35 serveurs, rien enregistré), `INSTRUCTIONS.md` (cohérent avec la stack mais non branché), `dist/` (artefacts de build) |

## INSTALL PLAN (appliqué le 2026-10-26)

1. ✅ `.opencode/agents/` : 14 agents DAILY copiés (source ecc-universal 2.2.3, `model:` retirée) — **uniques agents du projet** (aucun agent n'était installé en home).
2. ✅ `.opencode/skills/skill-library/SKILL.md` : router LIBRARY (trigger keywords + emplacement des références user-level).
3. ✅ `.opencode/ecc-sort.md` : ce manifeste (source de vérité du tri projet).
4. ➖ Pas de copie des rules DAILY dans le repo (AGENTS.md couvre déjà ; chemins référencés ci-dessus).
5. ➖ Pas de modification de l'install user-level (partagée avec les 89 autres repos).

## VERIFICATION

- [x] 14/14 agents présents dans `.opencode/agents/` (vérifié par liste)
- [x] 0 ligne `model:` résiduelle dans les agents copiés
- [x] Aucun agent/rule/script hors stack installé en scope projet
- [x] Aucune règle de langage inerte laissée "active" (les sets hors stack ne sont référencés que comme LIBRARY)
- [x] Hooks incompatibles (Pi, Claude Code, Codex) non branchés, restés LIBRARY

## OPEN QUESTIONS

1. **Wiring user-level** : brancher `plugin` (tools) + `instructions` (INSTRUCTIONS.md) dans `opencode.json` de home ? Actuellement inerts ; l'activer concerne TOUS les projets du compte, pas seulement CodeXchange.
2. **E2E** : si une suite Playwright est ajoutée → promouvoir `e2e` (command), `e2e-testing` (skill), `e2e-runner` (agent), et `test-coverage` (+ `@vitest/coverage-v8`).
3. **MCP** : sous-ensemble potentiellement utile pour ce repo : `vercel` (cible de déploiement), `github`, `context7`. Non enregistrés à ce jour.
4. **Token GitHub** exposé dans la conversation du 2026-10-25 → à révoquer/régénérer sur github.com/settings/tokens.
