# Déploiement Vercel + Neon — runbook

## Prérequis
- Compte Vercel avec le repo `Ggboykxz/CodeXchange` lié.
- Base Neon créée ; chaîne `DATABASE_URL` **réelle** (commence par `postgresql://`).
- Variable `DATABASE_URL` dans Vercel (`Settings` → `Environment Variables`).

## Étapes exactes (local)

```bash
cd /home/user/eeee/CodeXchange

# 1) Basculer le provider en Postgres
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
grep 'provider = "postgres' prisma/schema.prisma   # doit afficher postgresql

# 2) URL Neon : sans espaces et entre guillemets doubles (sinon le & met la commande en arrière-plan)
export DATABASE_URL="postgresql://neondb_owner:npg_BWkX13PLINJK@ep-delicate-bread-b5eqhn9i-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 3) Réinitialiser l'historique SQLite et générer le schéma Postgres
rm -rf prisma/migrations
npx prisma migrate dev --name init

# 4) Vérifier la connexion
npx prisma validate

# 5) Seed
npm run seed

# 6) Commit + push
git add prisma/ && git commit -m "chore: postgresql provider + migrations" && git push
```

## Vercel

- `Settings` → `General` → `Build Command` : `npm run vercel-build`
- `Settings` → `Environment Variables` → `DATABASE_URL` = chaîne Neon réelle.
- Redeploy.

`vercel-build` (déjà dans `package.json`) exécute : `prisma generate && prisma migrate deploy && next build`.

## Vérification

Ouvrir `https://<site>/api/sante`.

- `{"ok": true, "utilisateurs": N}` → déploiement OK.
- Sinon le JSON contient le message d'erreur exact (Prisma) — sans secret.

## Sécurité

- Ne colle jamais de mot de passe, de token ou de chaîne DB dans un chat, un commit ou un log.
- Si un secret a été exposé, révoque-le immédiatement dans les dashboards.
