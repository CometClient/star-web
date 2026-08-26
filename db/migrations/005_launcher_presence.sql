-- Launcher presence: one row per Minecraft account, refreshed by /api/ping.
-- A player counts as online while last_seen is inside the presence window
-- (see PRESENCE_WINDOW_SECONDS in src/presence.ts).

CREATE TABLE IF NOT EXISTS launcher_presence (
  mc_uuid TEXT PRIMARY KEY,
  mc_username TEXT,
  launcher_version TEXT,
  first_seen TEXT NOT NULL,
  last_seen TEXT NOT NULL,
  name_checked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_launcher_presence_last_seen
  ON launcher_presence(last_seen DESC);
