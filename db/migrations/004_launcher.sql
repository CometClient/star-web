-- Launcher data served to the desktop client

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
