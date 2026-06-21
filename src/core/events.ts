import { appendFileSync, readFileSync, renameSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { eventsPath } from "./paths.js";
import { openDb } from "./db.js";

export type EventType = "session_start" | "stop" | "pre_compact" | "post_tool_use";

export type HookEvent = {
  timestamp: string;
  type: EventType;
  job_id: string | null;
  slug: string | null;
  summary: string;
};

export function appendEvent(
  projectRoot: string,
  type: EventType,
  job: { job_id: string; slug: string } | null,
  summary: string,
  payloadJson?: string,
): void {
  const timestamp = new Date().toISOString();

  try {
    const db = openDb(projectRoot);
    importJsonlIfPresent(db, projectRoot);
    if (job) {
      db.prepare(
        `INSERT OR IGNORE INTO jobs (job_id, slug, title, created_at, status)
         VALUES (?, ?, ?, ?, 'active')`
      ).run(job.job_id, job.slug, job.slug, timestamp);
    }
    db.prepare(
      `INSERT INTO events (timestamp, type, job_id, slug, summary, payload_json)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(timestamp, type, job?.job_id ?? null, job?.slug ?? null, summary, payloadJson ?? null);
    db.close();
  } catch {
    // fallback: append to JSONL so no event is lost
    const event: HookEvent = {
      timestamp,
      type,
      job_id: job?.job_id ?? null,
      slug: job?.slug ?? null,
      summary,
    };
    const path = eventsPath(projectRoot);
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, JSON.stringify(event) + "\n");
  }
}

export type EventSummary = {
  count: number;
  last: HookEvent | null;
};

export function readEvents(projectRoot: string): EventSummary {
  try {
    const db = openDb(projectRoot);
    importJsonlIfPresent(db, projectRoot);

    const count = (
      db.prepare(`SELECT COUNT(*) as n FROM events`).get() as { n: number }
    ).n;

    const last = db
      .prepare(`SELECT * FROM events ORDER BY id DESC LIMIT 1`)
      .get() as (HookEvent & { id: number }) | undefined;

    db.close();
    return {
      count,
      last: last
        ? { timestamp: last.timestamp, type: last.type as EventType, job_id: last.job_id, slug: last.slug, summary: last.summary }
        : null,
    };
  } catch {
    // fallback: read from JSONL if SQLite unavailable
    return readEventsFromJsonl(projectRoot);
  }
}

function readEventsFromJsonl(projectRoot: string): EventSummary {
  const path = eventsPath(projectRoot);
  if (!existsSync(path)) return { count: 0, last: null };

  const lines = readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { count: 0, last: null };

  let last: HookEvent | null = null;
  try {
    last = JSON.parse(lines[lines.length - 1]) as HookEvent;
  } catch { /* malformed last line */ }

  return { count: lines.length, last };
}

function importJsonlIfPresent(db: import("better-sqlite3").Database, projectRoot: string): void {
  const path = eventsPath(projectRoot);
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    renameSync(path, path + ".imported");
    return;
  }

  const upsertJob = db.prepare(
    `INSERT OR IGNORE INTO jobs (job_id, slug, title, created_at, status)
     VALUES (?, ?, ?, ?, 'active')`
  );
  const insert = db.prepare(
    `INSERT INTO events (timestamp, type, job_id, slug, summary) VALUES (?, ?, ?, ?, ?)`
  );

  db.transaction(() => {
    for (const line of lines) {
      try {
        const ev = JSON.parse(line) as HookEvent;
        if (ev.job_id && ev.slug) {
          upsertJob.run(ev.job_id, ev.slug, ev.slug, ev.timestamp);
        }
        insert.run(ev.timestamp, ev.type, ev.job_id ?? null, ev.slug ?? null, ev.summary);
      } catch { /* skip malformed lines */ }
    }
  })();

  renameSync(path, path + ".imported");
}
