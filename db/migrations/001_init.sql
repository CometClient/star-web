-- Comet CMS schema v1

CREATE TABLE IF NOT EXISTS news_posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body_md TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  author TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_posts(slug);

CREATE TABLE IF NOT EXISTS staff_members (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  mc_username TEXT,
  mc_uuid TEXT,
  role TEXT NOT NULL,
  role_tier TEXT NOT NULL DEFAULT 'support',
  bio TEXT,
  avatar_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_staff_tier ON staff_members(role_tier, sort_order);

CREATE TABLE IF NOT EXISTS staff_sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON staff_sessions(token_hash);
