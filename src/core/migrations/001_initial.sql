CREATE TABLE schema_migrations (
  version    INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE jobs (
  job_id     TEXT PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE sessions (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id                 TEXT NOT NULL REFERENCES jobs(job_id),
  started_at             TEXT NOT NULL,
  ended_at               TEXT,
  has_edits              INTEGER NOT NULL DEFAULT 0,
  stop_sync_requested_at TEXT
);

CREATE INDEX idx_sessions_job_id ON sessions(job_id);
