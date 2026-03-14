CREATE TABLE IF NOT EXISTS lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT,
  price INTEGER,
  deposit TEXT,
  district TEXT,
  address TEXT,
  size REAL,
  room_type TEXT,
  floor TEXT,
  features TEXT, -- JSON array stored as string
  contact TEXT,
  move_in_date TEXT,
  original_text TEXT,
  extracted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_records_list_id ON records(list_id);
