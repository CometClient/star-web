# Comet DB Worker (Cloudflare D1)

REST API backed by Cloudflare D1. Deploy this first, then point the Astro frontend at the worker URL.

## First-time setup

```bash
cd workers/db
pnpm install

# Create D1 database (copy database_id into wrangler.toml)
pnpm d1:create

# Apply schema locally for dev
pnpm d1:migrate:local
pnpm d1:seed:local

# Deploy
wrangler secret put DB_API_SECRET   # shared with frontend — keep private
pnpm deploy

# Apply schema + seed on production D1
pnpm d1:migrate:remote
pnpm d1:seed:remote
```

After deploy, note the worker URL (e.g. `https://comet-db.<account>.workers.dev`).

## Frontend connection

In the site `.env`:

```env
DB_API_URL=https://comet-db.<account>.workers.dev
DB_API_SECRET=same-secret-as-worker
PUBLIC_DB_API_URL=https://comet-db.<account>.workers.dev
```

- **`DB_API_URL`** — server-side reads/writes from Astro
- **`DB_API_SECRET`** — authorizes CMS writes and session storage on the worker
- **`PUBLIC_DB_API_URL`** — optional; browser can call launcher endpoints directly

When `DB_API_URL` is unset, the site uses local SQLite (`db/data/comet.db`).

## API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/news` | — | List news (`?all=1` includes drafts) |
| GET | `/news/:slug` | — | Published post |
| POST | `/news` | secret | Create/update post |
| PUT | `/news/:slug` | secret | Update post |
| DELETE | `/news/:slug` | secret | Delete post |
| GET | `/staff` | — | List staff |
| POST | `/staff` | secret | Add staff |
| PUT | `/staff/:id` | secret | Update staff |
| DELETE | `/staff/:id` | secret | Remove staff |
| GET | `/launcher/announcements` | — | Active announcements |
| GET | `/launcher/version` | — | Latest version (`?all=1` for list) |
| POST | `/internal/sessions` | secret | Store staff session |
| POST | `/internal/sessions/validate` | secret | Validate session |
| DELETE | `/internal/sessions` | secret | Revoke session |

Protected routes require header: `X-Comet-Secret: <DB_API_SECRET>`
