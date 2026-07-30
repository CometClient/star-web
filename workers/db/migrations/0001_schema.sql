-- Comet CMS + launcher (D1)

CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
  mc_author_username TEXT,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_published ON news_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_pinned ON news_posts(pinned DESC, published_at DESC);

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

CREATE TABLE IF NOT EXISTS launcher_announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  announcement TEXT NOT NULL,
  redirect_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_launcher_announcements_active
  ON launcher_announcements(is_active, published_at DESC);

CREATE TABLE IF NOT EXISTS launcher_versions (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'stable',
  download_url TEXT,
  notes TEXT,
  published INTEGER NOT NULL DEFAULT 1,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_launcher_versions_published
  ON launcher_versions(published, published_at DESC);
