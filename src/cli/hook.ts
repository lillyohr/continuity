import { resolve, join } from "node:path";
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { readActiveJob } from "../core/active-job.js";
import { getDb } from "../core/db.js";
import { hooksTemplateDir } from "../core/paths.js";

const HOOK_EVENTS = new Set(["session-start", "stop", "pre-compact", "post-tool-use"]);

const EDIT_TOOLS = new Set(["Edit", "Write", "MultiEdit"]);

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) { resolve(""); return; }
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
  });
}

function currentSessionId(root: string, slug: string): number | null {
  try {
    const row = getDb(root).prepare(
      `SELECT id FROM sessions
       WHERE job_id = (SELECT job_id FROM jobs WHERE slug = ?)
         AND ended_at IS NULL
       ORDER BY id DESC LIMIT 1`
    ).get(slug) as { id: number } | undefined;
    return row?.id ?? null;
  } catch {
    return null;
  }
}

function flagSessionHasEdits(root: string, slug: string): void {
  try {
    const id = currentSessionId(root, slug);
    if (id == null) return;
    getDb(root).prepare(`UPDATE sessions SET has_edits = 1 WHERE id = ?`).run(id);
  } catch { /* non-fatal */ }
}

function resetSessionHasEdits(root: string, slug: string): void {
  try {
    const id = currentSessionId(root, slug);
    if (id == null) return;
    getDb(root).prepare(`UPDATE sessions SET has_edits = 0 WHERE id = ?`).run(id);
  } catch { /* non-fatal */ }
}

function getSessionHasEdits(root: string, slug: string): boolean {
  try {
    const id = currentSessionId(root, slug);
    if (id == null) return false;
    const row = getDb(root).prepare(`SELECT has_edits FROM sessions WHERE id = ?`).get(id) as { has_edits: number } | undefined;
    return (row?.has_edits ?? 0) === 1;
  } catch {
    return false;
  }
}

function recordStopSyncRequested(root: string, slug: string): void {
  try {
    const id = currentSessionId(root, slug);
    if (id == null) return;
    getDb(root).prepare(
      `UPDATE sessions SET stop_sync_requested_at = ? WHERE id = ?`
    ).run(new Date().toISOString(), id);
  } catch { /* non-fatal */ }
}

function renderSyncInstruction(slug: string): string {
  const tpl = readFileSync(join(hooksTemplateDir(), "stop-sync.md"), "utf8");
  return tpl.replaceAll("{{SLUG}}", slug);
}

export function registerHookCommand(program: Command): void {
  program
    .command("hook <event>")
    .description("Record a hook event (called by plugin hook scripts).")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action(async (event: string, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());

      if (!HOOK_EVENTS.has(event)) {
        console.error(`Unknown hook event: ${event}`);
        console.error(`Known events: ${[...HOOK_EVENTS].join(", ")}`);
        process.exit(1);
      }

      const raw = await readStdin();
      let payload: Record<string, unknown> = {};
      if (raw.trim()) {
        try { payload = JSON.parse(raw) as Record<string, unknown>; } catch { /* ignore */ }
      }

      const active = readActiveJob(root);
      const job = active ? { job_id: active.job_id, slug: active.slug } : null;

      if (event === "stop") {
        // Loop guard: Claude Code sets stop_hook_active when retrying after a block.
        if (payload.stop_hook_active === true) process.exit(0);
        if (!job) process.exit(0);
        if (!getSessionHasEdits(root, job.slug)) process.exit(0);

        recordStopSyncRequested(root, job.slug);
        const instruction = renderSyncInstruction(job.slug);
        console.log(JSON.stringify({ decision: "block", reason: instruction }));
        process.exit(0);
      }

      if (event === "session-start") {
        if (job) {
          resetSessionHasEdits(root, job.slug);
          process.stdout.write(
            `Continuity: attached to ${job.slug}. Read continuity/jobs/${job.slug}/HANDOFF.md before continuing.\n`
          );
        }
        return;
      }

      if (event === "post-tool-use") {
        if (!job) return;
        const toolName = String(payload.tool_name ?? "");
        if (EDIT_TOOLS.has(toolName)) {
          flagSessionHasEdits(root, job.slug);
        }
        return;
      }

      if (event === "pre-compact" && job) {
        process.stdout.write(
          `[CONTINUITY] Compaction detected for job "${job.slug}". Update HANDOFF.md if needed before context is lost.\n`
        );
      }
    });
}
