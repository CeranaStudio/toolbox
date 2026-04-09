CREATE TABLE IF NOT EXISTS post_cache (
  hash TEXT PRIMARY KEY,
  structured_result TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hit_count INTEGER NOT NULL DEFAULT 1
);
