-- News extras: pinned posts, MC author username for avatars

ALTER TABLE news_posts ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE news_posts ADD COLUMN mc_author_username TEXT;

CREATE INDEX IF NOT EXISTS idx_news_pinned ON news_posts(pinned DESC, published_at DESC);
