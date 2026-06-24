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
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id     TEXT REFERENCES jobs(job_id),
  started_at TEXT NOT NULL,
  ended_at   TEXT
);

CREATE TABLE events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp    TEXT NOT NULL,
  type         TEXT NOT NULL,
  job_id       TEXT REFERENCES jobs(job_id),
  session_id   INTEGER REFERENCES sessions(id),
  slug         TEXT,
  summary      TEXT NOT NULL,
  payload_json TEXT
);

CREATE INDEX idx_sessions_job_id   ON sessions(job_id);
CREATE INDEX idx_events_job_id     ON events(job_id);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_timestamp  ON events(timestamp);
CREATE INDEX idx_events_type       ON events(type);
