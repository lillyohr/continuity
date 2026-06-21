import { appendFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { eventsPath } from "./paths.js";

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
): void {
  const event: HookEvent = {
    timestamp: new Date().toISOString(),
    type,
    job_id: job?.job_id ?? null,
    slug: job?.slug ?? null,
    summary,
  };

  const path = eventsPath(projectRoot);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(event) + "\n");
}

export type EventSummary = {
  count: number;
  last: HookEvent | null;
};

export function readEvents(projectRoot: string): EventSummary {
  const path = eventsPath(projectRoot);
  if (!existsSync(path)) return { count: 0, last: null };

  const lines = readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { count: 0, last: null };

  let last: HookEvent | null = null;
  try {
    last = JSON.parse(lines[lines.length - 1]) as HookEvent;
  } catch {
    // malformed last line — ignore
  }

  return { count: lines.length, last };
}
