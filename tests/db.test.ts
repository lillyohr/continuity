import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/core/db.js";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "cont-db-test-"));
}

test("openDb creates tables and runs migration once", () => {
  const root = makeTmp();
  try {
    const db = openDb(root);
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    assert.ok(names.includes("jobs"));
    assert.ok(names.includes("sessions"));
    assert.ok(names.includes("schema_migrations"));
    assert.ok(!names.includes("events"), "events table must not exist");
    assert.ok(!names.includes("checkpoints"), "checkpoints table must not exist");

    const version = db
      .prepare(`SELECT version FROM schema_migrations ORDER BY version`)
      .all() as { version: number }[];
    assert.equal(version.length, 1);
    assert.equal(version[0].version, 1);
    db.close();

    // idempotent — second open should not re-apply migrations
    const db2 = openDb(root);
    const version2 = db2
      .prepare(`SELECT version FROM schema_migrations`)
      .all() as { version: number }[];
    assert.equal(version2.length, 1);
    db2.close();
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("sessions table has has_edits and stop_sync_requested_at columns", () => {
  const root = makeTmp();
  try {
    const db = openDb(root);
    db.prepare(
      `INSERT INTO jobs (job_id, slug, title, created_at) VALUES (?, ?, ?, ?)`
    ).run("job-1", "test-job", "Test Job", new Date().toISOString());

    db.prepare(
      `INSERT INTO sessions (job_id, started_at) VALUES (?, ?)`
    ).run("job-1", new Date().toISOString());

    const session = db.prepare(`SELECT * FROM sessions LIMIT 1`).get() as {
      has_edits: number;
      stop_sync_requested_at: string | null;
    };
    assert.equal(session.has_edits, 0);
    assert.equal(session.stop_sync_requested_at, null);

    db.prepare(`UPDATE sessions SET has_edits = 1 WHERE id = 1`).run();
    const updated = db.prepare(`SELECT has_edits FROM sessions WHERE id = 1`).get() as { has_edits: number };
    assert.equal(updated.has_edits, 1);

    db.close();
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("openDb resets legacy DB that has events table", async () => {
  const root = makeTmp();
  try {
    const stateDir = join(root, "continuity", ".state");
    mkdirSync(stateDir, { recursive: true });
    const dbPath = join(stateDir, "continuity.sqlite");

    const { default: Database } = await import("better-sqlite3");
    const legacy = new Database(dbPath);
    legacy.exec(`
      CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE jobs (job_id TEXT PRIMARY KEY, slug TEXT, title TEXT, created_at TEXT, status TEXT DEFAULT 'active');
      CREATE TABLE events (id INTEGER PRIMARY KEY, timestamp TEXT, type TEXT, job_id TEXT, slug TEXT, summary TEXT);
      INSERT INTO schema_migrations VALUES (1, '2026-01-01T00:00:00.000Z');
      INSERT INTO schema_migrations VALUES (2, '2026-01-01T00:00:00.000Z');
      INSERT INTO events VALUES (1, '2026-01-01', 'session_start', 'j1', 'old-job', 'started');
    `);
    legacy.close();

    const db = openDb(root);
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    assert.ok(!names.includes("events"), "events table removed after reset");
    assert.ok(names.includes("sessions"));

    const versions = db
      .prepare(`SELECT version FROM schema_migrations ORDER BY version`)
      .all() as { version: number }[];
    assert.equal(versions.length, 1);
    assert.equal(versions[0].version, 1);
    db.close();
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("foreign_keys pragma is enabled", () => {
  const root = makeTmp();
  try {
    const db = openDb(root);
    const result = db.pragma("foreign_keys") as { foreign_keys: number }[];
    assert.equal(result[0].foreign_keys, 1);
    db.close();
  } finally {
    rmSync(root, { recursive: true });
  }
});
