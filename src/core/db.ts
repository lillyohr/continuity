import Database from "better-sqlite3";
import { mkdirSync, readFileSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stateDir } from "./paths.js";

const DB_FILENAME = "continuity.sqlite";
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "migrations");

const MIGRATIONS: { version: number; file: string }[] = [
  { version: 1, file: "001_initial.sql" },
];

const _cache = new Map<string, Database.Database>();

/**
 * Return a cached connection for this project root. Migrations run once on
 * first open. Do NOT call db.close() on the returned instance — the connection
 * is reused for the lifetime of the process.
 */
export function getDb(projectRoot: string): Database.Database {
  const key = resolve(projectRoot);
  let db = _cache.get(key);
  if (!db || !db.open) {
    db = openDb(projectRoot);
    _cache.set(key, db);
  }
  return db;
}

/** Open a fresh connection with migrations applied. Caller owns the close. */
export function openDb(projectRoot: string): Database.Database {
  const dir = stateDir(projectRoot);
  mkdirSync(dir, { recursive: true });

  const dbPath = join(dir, DB_FILENAME);
  let db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // One-time reset: pre-V2 DBs have an events table. Drop and recreate with
  // the clean schema — events/checkpoints data is not user-facing.
  const legacy = db.prepare(
    `SELECT 1 FROM sqlite_master WHERE type='table' AND name='events'`
  ).get();
  if (legacy) {
    db.close();
    unlinkSync(dbPath);
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }

  runMigrations(db);
  return db;
}

function runMigrations(db: Database.Database): void {
  const tableExists = db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'`)
    .get();

  const applied = new Set<number>();
  if (tableExists) {
    const rows = db.prepare(`SELECT version FROM schema_migrations`).all() as { version: number }[];
    rows.forEach((r) => applied.add(r.version));
  }

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;

    const sql = readFileSync(join(MIGRATIONS_DIR, migration.file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare(`INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`)
        .run(migration.version, new Date().toISOString());
    })();
  }
}
