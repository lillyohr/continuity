CREATE TABLE checkpoints (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id       TEXT NOT NULL REFERENCES jobs(job_id),
  generated_at TEXT NOT NULL,
  draft_path   TEXT,
  applied_at   TEXT,
  dismissed_at TEXT
);

CREATE INDEX idx_checkpoints_job_id ON checkpoints(job_id);
