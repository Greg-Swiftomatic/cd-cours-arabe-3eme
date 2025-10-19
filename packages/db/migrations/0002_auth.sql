CREATE TABLE IF NOT EXISTS login_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE INDEX IF NOT EXISTS login_codes_email_idx
  ON login_codes(email);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  expires_at INTEGER NOT NULL,
  last_seen INTEGER DEFAULT (strftime('%s','now') * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique
  ON sessions(token_hash);

CREATE INDEX IF NOT EXISTS sessions_user_idx
  ON sessions(user_id);
