# @comet/db

SQLite migrations for the Comet CMS (news, staff, sessions).

## Usage

```bash
# From repo root
pnpm db:migrate
pnpm db:seed

# Or from this folder
pnpm migrate
pnpm seed
```

## Deploying to production

**Cloudflare D1 (recommended):** use the DB worker in `../workers/db/`. From repo root:

```bash
pnpm db:worker:deploy
pnpm db:d1:migrate:remote
pnpm db:d1:seed:remote
```

Set `DB_API_URL` and `DB_API_SECRET` on the frontend host — see root `README.md`.

**Manual:** run SQL in `migrations/` against your production SQLite/D1 when schema changes.

## Tables

| Table | Purpose |
|-------|---------|
| `news_posts` | News/blog articles (markdown body) |
| `staff_members` | Public team page entries |
| `staff_sessions` | Admin login sessions |
| `launcher_announcements` | In-launcher announcement banners |
| `launcher_versions` | Published launcher builds |
