# Comet Web

Modern Minecraft launcher marketing site with local CMS.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with concept art hero |
| `/news` | News listing |
| `/news/[slug]` | News article |
| `/staff` | Public team page |
| `/local/staff` | Staff CMS (news + team editor) |
| `/api/launcher/announcements` | Launcher API (proxies external DB) |
| `/api/news`, `/api/staff` | CMS read/write API |

## Setup

```bash
pnpm install
pnpm db:seed          # migrate + seed SQLite
cp .env.example .env  # optional overrides
pnpm dev
```

## Staff CMS login

- **URL:** `/local/staff`
- **Email:** `ray.dev@cometclient.dev`
- **Password:** `Cm7t_Xk9pR2mNwQ4` (override via `STAFF_PASSWORD` in `.env`)

## Database

Migrations live in `db/` as a deployable sub-repo. Local SQLite defaults to `db/data/comet.db`.

```bash
pnpm db:migrate   # apply migrations
pnpm db:seed      # migrate + seed sample content
```

## Design assets

Replace `public/hero-concept.png` with your own Minecraft concept art. The hero uses a bottom gradient fade into `#09090c`.
