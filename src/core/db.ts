import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { stateDir } from "./paths.js";
import { join } from "node:path";

const DB_FILENAME = "continuity.sqlite";

const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
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
    `,
  },
];

export function openDb(projectRoot: string): Database.Database {
  const dir = stateDir(projectRoot);
  mkdirSync(dir, { recursive: true });

  const db = new Database(join(dir, DB_FILENAME));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  runMigrations(db);
  return db;
}

function runMigrations(db: Database.Database): void {
  // schema_migrations may not exist yet on a fresh DB
  const tableExists = db
    .prepare(
      `SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'`
    )
    .get();

  const applied = new Set<number>();
  if (tableExists) {
    const rows = db.prepare(`SELECT version FROM schema_migrations`).all() as {
      version: number;
    }[];
    rows.forEach((r) => applied.add(r.version));
  }

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    db.transaction(() => {
      db.exec(migration.sql);
      db.prepare(
        `INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`
      ).run(migration.version, new Date().toISOString());
    })();
  }
}
