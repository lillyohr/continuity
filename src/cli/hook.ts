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
          process.stdout.write(`Continuity: attached to ${job.slug}. Run \`continuity resume ${job.slug}\` to load context.\n`);
        }
      }

      if (eventType === "pre_compact" && job) {
        process.stdout.write(`[CONTINUITY] Job "${job.slug}" has unsaved activity. Run \`continuity checkpoint draft ${job.slug}\` now before this compaction proceeds.\n`);
      }
    });
}
