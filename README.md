# Bike Auto POS

Self-hosted Point of Sale system with double-entry accounting. Runs fully offline via Docker Compose.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (includes Docker Compose)

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url> point-of-sale
cd point-of-sale

# 2. Create environment file
echo "DATABASE_URL=postgresql://pos_user:pos_password@db:5432/pos_db" > .env.local

# 3. Start everything
docker compose up -d

# 4. Open in browser
open http://localhost
```

The app starts with an empty database (tables are created automatically). To migrate production data from Aiven, see below.

## Services

| Service | Port | Purpose |
|---------|------|---------|
| nginx | 80 | Reverse proxy to app |
| app | 3000 | Next.js POS app |
| db | 5432 | PostgreSQL 17 |

## Managing Data

### Migrate from Aiven (one-time)

```bash
# Dump from Aiven
docker run --rm postgres:17-alpine pg_dump \
  "postgres://avnadmin:<YOUR_AIVEN_PASSWORD>@pg-729ff5c-khoji2448-fa8b.d.aivencloud.com:14835/defaultdb?sslmode=require" \
  -Fc -f /tmp/aiven.dump

# Copy and restore into local DB
docker cp /tmp/aiven.dump point-of-sale-db-1:/tmp/aiven.dump
docker compose exec -T db pg_restore -U pos_user -d pos_db \
  --clean --if-exists --no-owner --no-acl /tmp/aiven.dump
```

### Backup local DB

```bash
docker compose exec -T db pg_dump -U pos_user -d pos_db \
  --no-owner --no-acl -Fc > backup_$(date +%Y%m%d).dump
```

### Restore from backup

```bash
docker compose exec -T db pg_restore -U pos_user -d pos_db \
  --clean --if-exists --no-owner --no-acl < backup_20250101.dump
```

## Day-to-Day Commands

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f app` |
| Restart app | `docker compose restart app` |
| Rebuild app | `docker compose up -d --build app` |
| Stop everything | `docker compose down` |
| Reset database | `docker compose down -v && docker compose up -d` |

## Notes

- `.env.local` is gitignored — create it on every fresh clone
- The login page is a UI stub (no authentication implemented yet)
- First-time DB startup runs `db-init.sql` automatically to create all tables, triggers, and views
- For production, set a static IP on the host machine and use `NEXTAUTH_URL` if authentication is added later





#Backups

1. docker compose exec db sh -c "pg_dump -U pos_user -d pos_db -Fc -f /tmp/local.dump"

2. docker cp point-of-sale-db-1:/tmp/local.dump .\local.dump

3. docker run --rm `  -v "${PWD}:/backup" `  postgres:17-alpine `  pg_restore `  --clean `  --if-exists `  --no-owner `  --no-acl `  -d "postgres://avnadmin:<YOUR_AIVEN_PASSWORD>@pg-729ff5c-khoji2448-fa8b.d.aivencloud.com:14835/defaultdb?sslmode=require" `  /backup/local.dump