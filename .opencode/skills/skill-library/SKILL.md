---
name: skill-library
description: Router ECC LIBRARY pour CodeXchange — trouve un skill/command/agent non chargé par défaut (hors stack, situationnel, méta) parmi les 216 items classés LIBRARY par le tri projet (2026-10-26). Charger quand le besoin n'est pas couvert par la surface DAILY (voir .opencode/ecc-sort.md).
---

# Skill Library — CodeXchange (ECC LIBRARY)

Le tri projet est dans **`.opencode/ecc-sort.md`** (source de vérité : stack, preuves, dates).
DAILY = skills/commands/agents chargés par défaut pour ce repo. Ce router indexe le reste (**LIBRARY**) — rien n'est supprimé, tout reste accessible ici et en user-level (`C:\Users\PC\.config\opencode\skills\` et `\commands\`, agents dans `C:\Users\PC\node_modules\ecc-universal\agents\`).

## Quand charger quoi

### Qualité / livraison (pré-release, avant merge)
- `security` (command) — audit OWASP complet. Appui : `security-reviewer` agent (DAILY).
- `production-audit` (skill) — readiness avant lancement / post-merge.
- `santa-method` / `santa-loop` — double review adversarial avant publication/déploi.
- `review-pr` (DAILY) + `pr-test-analyzer` (DAILY) couvrent le cas courant.
- `test-coverage` (command) — **désactivé tant que `@vitest/coverage-v8` n'est pas installé**.

### E2E / navigateur
- `e2e-testing` (skill, Playwright/POM), `e2e` (command), `e2e-runner` (agent) — **promouvoir si Playwright est ajouté au repo**.
- `browser-qa` (skill) — vérification UI post-déploi (console, CWV, axe, screenshots).
- `ego-browser` (skill) — besoin ad hoc d'un navigateur pilotable.
- `windows-desktop-e2e` — OFF (repo web, pas de pywinauto).

### Décision / produit
- `council` / `council-multi-model` — arbitrages à 4 voix, go/no-go.
- `product-lens` — diagnostics produit (brief, PMF, ICE).
- `intent-driven-development` — critère d'acceptation avant changement à fort impact.
- `architecture-decision-records` — si on décide d'ajouter un `docs/adr/` (le repo utilise déjà `docs/design-choices.md`).
- `dev-team` / `plan-canvas` — session multi-rôles / review annotée du plan.

### Recherche / compréhension du code
- `codebase-onboarding`, `code-tour` — onboarding, walkthroughs.
- `code-explorer`, `silent-failure-hunter`, `comment-analyzer`, `type-design-analyzer`, `code-simplifier`, `refactor-cleaner` — audits ponctuels.
- `repo-scan` — audit d'assets cross-stack (bootstrap externe).

### Méta-ECC / harness
- `configure-ecc` — réinstaller/reconfigurer le bundle.
- `context-budget` — audit de la consommation du context window.
- `skill-stocktake` / `skill-health` / `skill-scout` / `skill-comply` — audit de la qualité des skills.
- `config-gc` — nettoyage périodique de la config.
- `unified-memory` / `ck` — handoff/état de session cross-harness.
- `growth-log` / `agent-self-evaluation` (DAILY) / `agent-introspection-debugging` — apprentissage & débogage d'agent.
- `loop-design-check`, `loop-operator`, `harness-optimizer` — boucles autonomes.
- `continuous-learning-v2` (v1 dépréciée) — capture de leçons via hooks.
- `ecc-guide` / `ecc-recipes` — questions sur ECC, cartographie des commandes.
- `update-codemaps`, `update-docs`, `refactor-clean`, `marketing-campaign`, `jira`, `pm2` — situationnels/méta.

### Hors stack (autres langages — uniquement si un repo du compte le demande)
- Commands : `cpp-*`, `go-*`, `rust-*`, `kotlin-*`, `gradle-build`, `flutter-*`, `python-review`, `fastapi-review`, `vue-review`.
- Agents : les 25 reviewers/builders hors stack + `network-*`, `homelab-*`, `healthcare`, `marketing-agent`, `mle-reviewer`, `rag-pipeline-reviewer`, `gan-*`, `opensource-*` (repo en `private: true`).
- Rules : `node_modules\ecc-universal\rules\` — 18 familles hors stack ; sets DAILY = `common/` (générique), `typescript/`, `react/`, `web/`.

### À promouvoir vers DAILY (déclencheurs)
| Item | Déclencheur |
|---|---|
| `e2e` / `e2e-testing` / `e2e-runner` | ajout de Playwright au repo |
| `test-coverage` | ajout de `@vitest/coverage-v8` |
| `browser-qa` | passage en CI post-déploi |
| `production-audit` | avant la mise en prod (démarche hackathon → prod) |
| MCP `vercel` / `github` / `context7` | branchement volontaire dans `opencode.json` |
