-- Seed content (idempotent via INSERT OR IGNORE)

INSERT OR IGNORE INTO news_posts (id, slug, title, excerpt, body_md, cover_url, published, published_at, author, mc_author_username, pinned, created_at, updated_at)
VALUES (
  'news-welcome',
  'welcome-to-comet',
  'Welcome to Comet',
  'Our new site is live — here is what we are building.',
  '# Welcome to Comet

Comet is a **Fabric-first Minecraft launcher** focused on performance, curated mods, and a clean native UI.

![Comet concept art](/hero-concept.png)

## What ships today

- Sodium + Iris pre-configured
- 15+ curated Fabric mods
- Native desktop UI
- Free cosmetics

We will post updates here as development continues.',
  '/hero-concept.png',
  1,
  datetime('now', '-2 days'),
  'rxym',
  'rxym',
  1,
  datetime('now', '-2 days'),
  datetime('now', '-1 hour')
);

INSERT OR IGNORE INTO news_posts (id, slug, title, excerpt, body_md, published, published_at, author, mc_author_username, pinned)
VALUES (
  'news-beta',
  'closed-beta-update',
  'Closed beta rolling out',
  'Invite tokens are going out to early supporters this week.',
  '# Closed beta

We are inviting the first wave of testers through Discord.

> Comet is in closed beta — use your invite link to download builds.

Stay tuned for more slots opening soon.',
  1,
  datetime('now', '-5 days'),
  'Ray',
  'RayDev',
  0
);

INSERT OR IGNORE INTO launcher_announcements (id, announcement, redirect_url, is_active, published_at)
VALUES (
  1,
  'Welcome to Comet! Check out the latest update.',
  '/news',
  1,
  datetime('now', '-1 day')
);

INSERT OR IGNORE INTO launcher_versions (id, version, channel, download_url, notes, published, published_at)
VALUES (
  'v0-1-0-beta',
  '0.1.0-beta.1',
  'beta',
  NULL,
  'Closed beta build — invite required.',
  1,
  datetime('now', '-3 days')
);

INSERT OR IGNORE INTO staff_members (id, display_name, mc_username, role, role_tier, bio, sort_order, published)
VALUES
  ('staff-ray', 'Ray', 'rxym', 'Lead Developer', 'developer', NULL, 0, 1),
  ('staff-benji', 'Benji', 'Spencs', 'Community Lead', 'admin', NULL, 1, 1),
  ('staff-naibuu', 'Naibuu', 'HS50', 'Designer & UI Lead', 'developer', NULL, 2, 1),
  ('staff-lily', 'Lily', 'mrrpmeowfurry', 'Hosting & Backend Lead', 'developer', NULL, 3, 1),
  ('staff-syxles', 'Syxles', 'Syxles', 'Backend Developer', 'developer', NULL, 4, 1),
  ('staff-comet', 'Comet Team', 'MHF_Question', 'Support', 'support', NULL, 10, 1);
