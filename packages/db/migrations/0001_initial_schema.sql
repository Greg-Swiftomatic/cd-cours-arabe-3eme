-- Migration: Initial schema
-- Created at: 2025-10-20

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'student',
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_fr TEXT,
  body_html_ar TEXT NOT NULL,
  body_html_fr TEXT,
  order_idx INTEGER NOT NULL
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  config_json TEXT NOT NULL
);

-- Attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER REFERENCES quizzes(id),
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  started_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  finished_at INTEGER,
  score REAL,
  detail_json TEXT
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  lesson_id INTEGER REFERENCES lessons(id),
  status TEXT DEFAULT 'incomplete',
  best_score REAL DEFAULT 0,
  last_attempt_id INTEGER REFERENCES attempts(id)
);

-- Login codes table
CREATE TABLE IF NOT EXISTS login_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes(email);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  expires_at INTEGER NOT NULL,
  last_seen INTEGER DEFAULT (strftime('%s','now') * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_unique ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
