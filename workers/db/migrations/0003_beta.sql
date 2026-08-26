-- Closed beta: testers, single-use access tokens, uploaded builds, and the
-- one-time download links a redeemed token mints.

CREATE TABLE IF NOT EXISTS beta_testers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  mc_username TEXT,
  mc_uuid TEXT,
  email TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beta_testers_status ON beta_testers(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_testers_uuid ON beta_testers(mc_uuid) WHERE mc_uuid IS NOT NULL;

CREATE TABLE IF NOT EXISTS beta_tokens (
  id TEXT PRIMARY KEY,
  tester_id TEXT NOT NULL,
  -- Only the SHA-256 of the token is stored; the plaintext is shown once.
  token_hash TEXT NOT NULL UNIQUE,
  token_hint TEXT NOT NULL,
  label TEXT,
  build_id TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  redeemed_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (tester_id) REFERENCES beta_testers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_beta_tokens_tester ON beta_tokens(tester_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_tokens_hash ON beta_tokens(token_hash);

CREATE TABLE IF NOT EXISTS beta_builds (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'universal',
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sha256 TEXT,
  storage_key TEXT NOT NULL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beta_builds_active ON beta_builds(is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS beta_downloads (
  id TEXT PRIMARY KEY,
  token_id TEXT NOT NULL,
  tester_id TEXT NOT NULL,
  build_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  ip_hash TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_beta_downloads_token ON beta_downloads(token_id);
CREATE INDEX IF NOT EXISTS idx_beta_downloads_created ON beta_downloads(created_at DESC);

CREATE TABLE IF NOT EXISTS beta_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  tester_id TEXT,
  token_id TEXT,
  build_id TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_beta_events_created ON beta_events(kind, created_at DESC);
