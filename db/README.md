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

Run the SQL in `migrations/` against your production database when deploying CMS schema updates. This folder is a standalone sub-repo so DB changes can ship independently of the site.

## Tables

| Table | Purpose |
|-------|---------|
| `news_posts` | News/blog articles (markdown body) |
| `staff_members` | Public team page entries |
| `staff_sessions` | Admin login sessions |
| `launcher_announcements` | In-launcher announcement banners |
| `launcher_versions` | Published launcher builds |
