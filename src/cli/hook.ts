import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { readActiveJob } from "../core/active-job.js";
import { appendEvent, type EventType } from "../core/events.js";
import { pendingDir } from "../core/paths.js";
import { buildAutoCheckpointDraft, hasPendingDraft, getSessionActivity, type SessionActivity } from "../core/session-summary.js";
import { openDb } from "../core/db.js";

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

function buildPayload(eventType: EventType, payload: Record<string, unknown>): string | undefined {
  if (eventType === "pre_compact") {
    const tokens = payload.conversation_token_count ?? payload.conversation_tokens_estimate;
    if (tokens !== undefined) {
      return JSON.stringify({ conversation_tokens_estimate: Number(tokens) });
    }
    return undefined;
  }

  if (eventType === "post_tool_use") {
    const toolName = String(payload.tool_name ?? "unknown");
    const path = deriveToolPath(toolName, payload.tool_input);
    const facts: Record<string, string> = { tool_name: toolName };
    if (path) facts.path = path;
    return JSON.stringify(facts);
  }

  return undefined;
}

function tryWriteAutoCheckpoint(root: string, slug: string, jobId: string, activity: SessionActivity): void {
  try {
    if (hasPendingDraft(root, slug)) return; // don't overwrite an existing unapplied draft

    const generatedAt = new Date().toISOString();
    const dir = pendingDir(root, slug);
    mkdirSync(dir, { recursive: true });

    const date = generatedAt.slice(0, 10);
    const time = generatedAt.slice(11, 16).replace(":", "");
    const filename = `checkpoint-${date}-${time}.md`;
    const draftContent = buildAutoCheckpointDraft(root, slug, jobId, generatedAt, activity);
    writeFileSync(`${dir}/${filename}`, draftContent);

    const db = openDb(root);
    try {
      db.prepare(
        `INSERT INTO checkpoints (job_id, generated_at, draft_path)
         VALUES ((SELECT job_id FROM jobs WHERE slug = ?), ?, ?)`
      ).run(slug, generatedAt, `continuity/jobs/${slug}/pending/${filename}`);
    } finally {
      db.close();
    }
  } catch { /* non-fatal — never block session stop */ }
}

function deriveToolPath(toolName: string, toolInput: unknown): string | null {
  if (!toolInput || typeof toolInput !== "object") return null;
  const input = toolInput as Record<string, unknown>;
  if (typeof input.file_path === "string") return input.file_path;
  if (toolName === "Bash" && typeof input.command === "string") {
    return input.command.slice(0, 80);
  }
  return null;
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

      const toolName = String(payload.tool_name ?? "unknown");
      const summaries: Record<EventType, string> = {
        session_start: job ? `session started, attached to ${job.slug}` : "session started, unattached",
        stop: job ? `session stopped, attached to ${job.slug}` : "session stopped, unattached",
        pre_compact: job ? `compaction observed, attached to ${job.slug}` : "compaction observed, unattached",
        post_tool_use: job ? `tool use in ${job.slug}: ${toolName}` : `tool use, unattached: ${toolName}`,
      };

      const payloadJson = buildPayload(eventType, payload);
      appendEvent(root, eventType, job, summaries[eventType], payloadJson);

      if (eventType === "session_start") {
        if (job) {
          let msg = `Continuity: attached to ${job.slug}. Run \`continuity resume ${job.slug}\` to load context.\n`;
          if (hasPendingDraft(root, job.slug)) {
            msg += `[CONTINUITY] A checkpoint draft is pending from your last session.\n`;
            msg += `  Apply: continuity checkpoint apply --slug ${job.slug}\n`;
            msg += `  Discard: continuity checkpoint ignore --slug ${job.slug}\n`;
          }
          process.stdout.write(msg);
        }
      }

      if (eventType === "pre_compact" && job) {
        process.stdout.write(`[CONTINUITY] Job "${job.slug}" has unsaved activity. Run \`continuity checkpoint draft ${job.slug}\` now before this compaction proceeds.\n`);
      }

      if (eventType === "stop" && job) {
        const activity = getSessionActivity(root, job.slug);
        if (activity.toolUseCount > 0) {
          tryWriteAutoCheckpoint(root, job.slug, job.job_id, activity);
        }
      }
    });
}
