# Comet Web

Modern Minecraft launcher marketing site with CMS backed by SQLite locally or Cloudflare D1 in production.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/news` | News listing |
| `/news/[slug]` | News article |
| `/staff` | Public team page |
| `/local/staff` | Staff CMS |
| `/api/*` | Site API (proxies to local DB or remote DB worker) |

## Local development

```bash
pnpm install
pnpm db:seed
cp .env.example .env
pnpm dev
```

Uses **local SQLite** at `db/data/comet.db` when `DB_API_URL` is not set.

## Deploy DB worker (Cloudflare D1)

Deploy the database API first:

```bash
cd workers/db
pnpm install

# Create D1 — paste database_id into wrangler.toml
pnpm d1:create

pnpm d1:migrate:local   # optional local D1 dev
wrangler secret put DB_API_SECRET
pnpm deploy

pnpm d1:migrate:remote
pnpm d1:seed:remote
```

Note the worker URL (e.g. `https://comet-db.<account>.workers.dev`).

Full details: [workers/db/README.md](workers/db/README.md)

## Deploy frontend

Build and run the Astro server (Node adapter):

```bash
# .env
DB_API_URL=https://comet-db.<account>.workers.dev
DB_API_SECRET=<same as worker secret>
STAFF_EMAIL=...
STAFF_PASSWORD=...

pnpm build
node ./dist/server/entry.mjs
```

The site reads/writes CMS data through the DB worker when `DB_API_URL` is set. Staff sessions are stored in D1 via the worker’s internal session API.

## Staff CMS

- **URL:** `/local/staff`
- Credentials via `STAFF_EMAIL` / `STAFF_PASSWORD` in `.env`

## Database (local)

```bash
pnpm db:migrate
pnpm db:seed
```

Migrations: `db/migrations/` · Worker D1 migrations: `workers/db/migrations/`
