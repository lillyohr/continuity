import { resolve } from "node:path";
import { Command } from "commander";
import { readActiveJob } from "../core/active-job.js";
import { appendEvent, type EventType } from "../core/events.js";

const HOOK_EVENTS: Record<string, EventType> = {
  "session-start": "session_start",
  "stop": "stop",
  "pre-compact": "pre_compact",
  "post-tool-use": "post_tool_use",
};

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) { resolve(""); return; }
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
  });
}

export function registerHookCommand(program: Command): void {
  program
    .command("hook <event>")
    .description("Record a hook event (called by plugin hook scripts).")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action(async (event: string, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());
      const eventType = HOOK_EVENTS[event];

      if (!eventType) {
        console.error(`Unknown hook event: ${event}`);
        console.error(`Known events: ${Object.keys(HOOK_EVENTS).join(", ")}`);
        process.exit(1);
      }

      const raw = await readStdin();
      let payload: Record<string, unknown> = {};
      if (raw.trim()) {
        try { payload = JSON.parse(raw) as Record<string, unknown>; } catch { /* ignore */ }
      }

      const active = readActiveJob(root);
      const job = active ? { job_id: active.job_id, slug: active.slug } : null;

      const summaries: Record<EventType, string> = {
        session_start: job ? `session started, attached to ${job.slug}` : "session started, unattached",
        stop: job ? `session stopped, attached to ${job.slug}` : "session stopped, unattached",
        pre_compact: job ? `compaction observed, attached to ${job.slug}` : "compaction observed, unattached",
        post_tool_use: job ? `tool use in ${job.slug}: ${String(payload.tool_name ?? "unknown")}` : "tool use, unattached",
      };

      appendEvent(root, eventType, job, summaries[eventType]);
    });
}
