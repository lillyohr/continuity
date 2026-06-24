import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDb } from "../src/core/db.js";
import { appendEvent, readEvents } from "../src/core/events.js";

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
    assert.ok(names.includes("events"));
    assert.ok(names.includes("schema_migrations"));

    const version = db
      .prepare(`SELECT version FROM schema_migrations ORDER BY version`)
      .all() as { version: number }[];
    assert.equal(version.length, 2);
    assert.equal(version[0].version, 1);
    assert.equal(version[1].version, 2);
    assert.ok(names.includes("checkpoints"));
    db.close();

    // idempotent — second open should not re-apply migrations
    const db2 = openDb(root);
    const version2 = db2
      .prepare(`SELECT version FROM schema_migrations`)
      .all() as { version: number }[];
    assert.equal(version2.length, 2);
    db2.close();
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("appendEvent and readEvents round-trip via SQLite", () => {
  const root = makeTmp();
  try {
    appendEvent(root, "session_start", { job_id: "job-1", slug: "my-job" }, "started");
    appendEvent(root, "stop", { job_id: "job-1", slug: "my-job" }, "stopped");

    const { count, last } = readEvents(root);
    assert.equal(count, 2);
    assert.equal(last?.type, "stop");
    assert.equal(last?.slug, "my-job");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("appendEvent without attached job records null job_id", () => {
  const root = makeTmp();
  try {
    appendEvent(root, "session_start", null, "unattached session");
    const { count, last } = readEvents(root);
    assert.equal(count, 1);
    assert.equal(last?.job_id, null);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("JSONL import on first DB open", () => {
  const root = makeTmp();
  try {
    // simulate V1 state: JSONL exists, no DB
    const stateDir = join(root, "continuity", ".state");
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(
      join(stateDir, "events.jsonl"),
      [
        JSON.stringify({ timestamp: "2026-01-01T00:00:00.000Z", type: "session_start", job_id: "old-id", slug: "old-job", summary: "old event" }),
        JSON.stringify({ timestamp: "2026-01-02T00:00:00.000Z", type: "stop", job_id: "old-id", slug: "old-job", summary: "old stop" }),
      ].join("\n") + "\n"
    );

    appendEvent(root, "session_start", { job_id: "old-id", slug: "old-job" }, "new event");

    const { count } = readEvents(root);
    assert.equal(count, 3); // 2 imported + 1 new

    // JSONL renamed
    assert.ok(existsSync(join(stateDir, "events.jsonl.imported")));
    assert.ok(!existsSync(join(stateDir, "events.jsonl")));
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
