CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  window_key TEXT NOT NULL,  -- e.g. "2026-03-14T21:30" (per minute)
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, window_key)
);
-- Clean up entries older than 2 hours periodically
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_key);
