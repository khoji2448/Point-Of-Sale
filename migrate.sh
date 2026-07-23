#!/usr/bin/env bash
# Runs pending migrations/*.sql in order against $DATABASE_URL (falls back to .env).
# Existing DBs (cloud, deployed local) already have the schema: baseline is
# auto-marked applied. Fresh DBs get everything from 000_baseline.sql up.
set -e
cd "$(dirname "$0")"
[ -z "$DATABASE_URL" ] && source .env

psql "$DATABASE_URL" -qc "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now());"

# DB predates this runner? Mark baseline applied instead of re-running it.
if psql "$DATABASE_URL" -tAc "SELECT 1 FROM information_schema.tables WHERE table_name='products'" | grep -q 1; then
  psql "$DATABASE_URL" -qc "INSERT INTO schema_migrations(name) VALUES ('000_baseline.sql') ON CONFLICT DO NOTHING;"
fi

for f in migrations/*.sql; do
  n=$(basename "$f")
  psql "$DATABASE_URL" -tAc "SELECT 1 FROM schema_migrations WHERE name='$n'" | grep -q 1 && continue
  echo "applying $n"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$f"
  psql "$DATABASE_URL" -qc "INSERT INTO schema_migrations(name) VALUES ('$n');"
done
echo "up to date"
