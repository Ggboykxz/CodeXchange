# Runbook — sauvegardes & restauration de la base (J9)

> Contexte : PostgreSQL est managé (Neon en prod, Postgres local en dev,
> Postgres 16 en CI). Aucune sauvegarde artisanale ne remplace la PITR
> managée par Neon ; l'objectif est que la restauration soit
> **documentée, testable et reproductible**.

## 1. Ce que Neon fait déjà (PITR)

Neon conserve un historique continu (point-in-time) sur la durée du plan. Tu
n'as pas à envoyer de dump manuel : il faut juste savoir restaurer.

### Restauration en quelques minutes

1. Neon Console → ton projet → **Backups/Restore**.
2. Choisis un point temporel.
3. Neon crée une **branche éventuellement** ; récupère la nouvelle `DATABASE_URL`.
4. Mets à jour la variable d'env **`DATABASE_URL`** de Vercel (Production).
5. Redéploie (push / Redeploy).
6. Vérifie `https://<host>/api/health` : `{"ok":true,"db":"up"}`.

> ⚠️ Ne restaure pas directement par-dessus la branche de prod. Valide le
> contenu sur une branche temporaire (`restore-*`) avant de basculer le
> `DATABASE_URL` de production.

## 2. Dump manuel

Assure une copie logique hors Neon, utile avant une migration risquée.

```bash
export DATABASE_URL="postgresql://cx:cx_local_dev@127.0.0.1:5432/codexchange"
# Format custom (défaut, pg_restore) :
./scripts/db-backup.sh
#…ou sol SQL (psql -f) :
./scripts/db-backup.sh --plain
# => ./backups/codexchange-YYYYMMDD-HHMMSS.{dump,sql}  (gitignoré)
```

## 3. Restaurer le dump dans un Postgres local

```bash
# format custom :
pg_restore --no-owner --no-acl -d "$DATABASE_URL_LOCAL" backups/*.dump
# format plain :
psql "$DATABASE_URL_LOCAL" -f backups/*.sql
```

Le schéma et les données sont contenus dans le dump : inutile de refaire
`prisma db push` ni le seed. Si le schéma a entre-temps changé, regénère
alors le client avec `npx prisma generate`.

## 4. Vérification (à refaire si le runbook change)

```bash
before=$(psql "$DATABASE_URL" -tA -c "SELECT count(*) FROM \"Thread\"")
./scripts/db-backup.sh \
  && last=$(ls -t backups | head -1) \
  && test "$(grep -c 'CREATE TABLE' "backups/$last")" -gt 0 \
  && echo "dump valide (tables: $(grep -c 'CREATE TABLE' backups/'$last')"
```

La **véritable preuve** reste une restauration PITR sur une branche éphémère
puis `SELECT count(*) FROM "Thread"` : on doit retrouver l'état du point de
restauration.

## 5. Après une restauration

- Regénère le client Prisma si le code/schéma a changé (`npx prisma generate`).
- Des écritures postérieures au point de restauration sont perdues : préviens
  l'équipe avant bascule.
