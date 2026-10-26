# Contribuer à CodeXchange

## Prérequis
- **Node.js** (v22 recommandé) et **npm**.
- **Docker** (optionnel, pour le service Redis/Upstash en dev).
- Un **fork** du dépôt et une branche de travail (ex. `feature/ma-nouvelle-fonction`).

## Installation locale
```bash
git clone https://github.com/your‑username/CodeXchange.git
cd CodeXchange
npm install
npm run db:generate   # génère le client Prisma
npm run db:migrate    # crée la base SQLite dev.db
npm run seed          # charge les données de démonstration
npm run dev           # http://localhost:3000
```

## Tests et qualité du code
- **Lint** : `npm run lint` (ESLint). Aucun warning ne doit rester.
- **Type‑checking** : `npx tsc --noEmit`.
- **Tests unitaires & d’intégration** : `npm test` (Vitest). Tous les tests doivent passer.
- **Tests de design** : les tests dans `tests/design‑baseline.test.ts` valident les contraintes d’UI (boutons arrondis, temps de transition, accessibilité, etc.).

## Processus de Pull Request
1. Créez une branche descriptive depuis `main`.
2. Implémentez votre fonctionnalité ou correctif.
3. Assurez‑vous que **tout** le code passe les étapes CI (lint, type‑check, tests, build).
4. Ouvrez une PR avec une description claire :
   - Pourquoi ? (problème / amélioration)
   - Comment ? (résumé de l’implémentation)
   - Screenshots/vidéos si l’UI change.
5. Une révision par au moins **un** autre contributeur est requise (voir la protection de branche).
6. Une fois approuvée, la PR sera mergée automatiquement.

## Style de code
- Utilisez **Tailwind** via les utilities déjà présentes. Les valeurs doivent passer par les tokens (`--cx-…`) ou `RAYON.pill` pour les bordures.
- Pas de `<div>` « bare » : privilégiez les composants du design‑system (Astryx/Base UI) ou créez‑les via `astryx component`.
- Aucun style en ligne (`style=`) – utilisez les classes Tailwind ou les tokens.
- Respectez le linting et les règles ESLint/Prettier configurées.

## Documentation
- Mettez à jour le `README.md`, `docs/design‑choices.md` ou tout autre fichier concerné.
- Ajoutez des captures d’écran dans `docs/screenshots/` avec un descriptif.

## Sécurité
- Reportez tout problème de sécurité via le fichier `SECURITY.md`.

---
Merci de votre contribution ! 🎉