-- users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'student',
  created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
);

-- lessons table
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

-- quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  config_json TEXT NOT NULL
);

-- attempts table
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE SET NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  started_at INTEGER DEFAULT (strftime('%s','now') * 1000),
  finished_at INTEGER,
  score REAL,
  detail_json TEXT
);

-- progress table
CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'incomplete',
  best_score REAL DEFAULT 0,
  last_attempt_id INTEGER REFERENCES attempts(id) ON DELETE SET NULL
);
