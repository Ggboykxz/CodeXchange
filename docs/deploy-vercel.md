# Déploiement Vercel + Neon — runbook

## Prérequis
- Compte Vercel et projet lié au dépôt `Ggboykxz/CodeXchange`.
- Base Neon créée ; sa chaîne `DATABASE_URL` doit commencer par `postgresql://` avec `sslmode=require`.

## Étapes (4 commandes côté local)

```bash
# 1) Basculer le provider Prisma en Postgres
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 2) Appliquer les migrations + seed sur Neon
export DATABASE_URL='postgresql://<user>:<pass>@<host>/neondb?sslmode=require'
npx prisma migrate dev --name init
npm run seed

# 3) Commit & push de la migration Postgres
git add prisma/
git commit -m "chore: postgresql provider + migrations"
git push

# 4) Vercel : Settings -> General -> Build Command = npm run vercel-build
#    Puis Redeploy.
```

Notes :
- `vercel-build` (déjà dans `package.json`) exécute `prisma generate && prisma migrate deploy && next build`.
- `migrate dev` génère les fichiers SQL Postgres dans `prisma/migrations/` ; ne commitez jamais de chaîne secrète.
- Laissez SQLite pour le dev local ; ne commitez pas un schéma Postgres sur `main` si vous voulez garder la CI SQLite.

## Vérification

Après redéploiement, ouvrez : `https://<domaine>/api/sante`.

- `{"ok": true, "utilisateurs": N}` → déploiement OK.
- En cas d'erreur, le JSON renvoyé contient le message Prisma exact (aucun secret).

## Sécurité

- Ne collez jamais de `DATABASE_URL` ni de token Vercel dans un chat ou un commit.
- Si un secret a été exposé, révoquez-le immédiatement (Neon → Security, Vercel → Tokens).
