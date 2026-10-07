#!/usr/bin/env bash
# Backup logique (J9) : dump de la base pointée par DATABASE_URL dans
# ./backups/ (gitignoré). La PITR reste chez le provider (Neon) ; ce script
# sert de copie froide / garde-fou.
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Erreur : DATABASE_URL non défini — export DATABASE_URL=... d'abord." >&2
  exit 1
fi

OUT_DIR="$(dirname "$0")/../backups"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [ "${1:-}" = "--plain" ]; then
  OUT="$OUT_DIR/codexchange-$STAMP.sql"
  pg_dump "$DATABASE_URL" --no-owner --no-acl --clean -f "$OUT"
else
  OUT="$OUT_DIR/codexchange-$STAMP.dump"
  pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f "$OUT"
fi

echo "Backup écrit : $OUT"
ls -lh "$OUT"
