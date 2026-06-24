import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stateDir } from "./paths.js";

const DB_FILENAME = "continuity.sqlite";
const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "migrations");

const MIGRATIONS: { version: number; file: string }[] = [
  { version: 1, file: "001_initial.sql" },
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
