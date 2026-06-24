import { openDb } from "./db.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { jobDir, pendingDir } from "./paths.js";

export type SessionActivity = {
  toolUseCount: number;
  filesModified: string[];  // Edit events
  filesCreated: string[];   // Write events
};

export function getSessionActivity(root: string, slug: string): SessionActivity {
  let db;
  try {
    db = openDb(root);

    // Bound by the current session's start — gives only this session's tool uses,
    // not accumulated activity from prior sessions without an applied checkpoint.
    const sessionStart = db.prepare(`
      SELECT e.timestamp FROM events e
      JOIN jobs j ON e.job_id = j.job_id
      WHERE j.slug = ? AND e.type = 'session_start'
      ORDER BY e.id DESC LIMIT 1
    `).get(slug) as { timestamp: string } | undefined;

    if (!sessionStart) return { toolUseCount: 0, filesModified: [], filesCreated: [] };

    const rows = db.prepare(`
      SELECT e.type, e.payload_json FROM events e
      JOIN jobs j ON e.job_id = j.job_id
      WHERE j.slug = ?
        AND e.type = 'post_tool_use'
        AND e.timestamp > ?
      ORDER BY e.id ASC
    `).all(slug, sessionStart.timestamp) as { type: string; payload_json: string | null }[];

    const filesModified: string[] = [];
    const filesCreated: string[] = [];
    const seen = new Set<string>();

    for (const row of rows) {
      if (!row.payload_json) continue;
      try {
        const p = JSON.parse(row.payload_json) as { tool_name?: string; path?: string };
        const path = p.path;
        if (!path || seen.has(path)) continue;
        seen.add(path);
        if (p.tool_name === "Write") filesCreated.push(path);
        else if (p.tool_name === "Edit") filesModified.push(path);
      } catch { /* skip malformed */ }
    }

    return { toolUseCount: rows.length, filesModified, filesCreated };
  } catch {
    return { toolUseCount: 0, filesModified: [], filesCreated: [] };
  } finally {
    db?.close();
  }
}

export function hasPendingDraft(root: string, slug: string): boolean {
  const dir = pendingDir(root, slug);
  if (!existsSync(dir)) return false;
  try {
    return readdirSync(dir).some(f => f.startsWith("checkpoint-") && f.endsWith(".md"));
  } catch {
    return false;
  }
}

export function buildAutoCheckpointDraft(root: string, slug: string, jobId: string, generatedAt: string, activity: SessionActivity): string {
  const currentHandoff = readHandoffSection(root, slug, "Current state");
  const nextStep = readHandoffSection(root, slug, "Next step");
  const openQuestions = readHandoffSection(root, slug, "Open questions");

  // Build the session log line — appended to existing state, not replacing it.
  const sessionParts: string[] = [`Session ended (${generatedAt.slice(0, 10)}).`];
  if (activity.toolUseCount > 0) sessionParts.push(`${activity.toolUseCount} tool use(s).`);
  if (activity.filesModified.length > 0) sessionParts.push(`Files modified: ${activity.filesModified.join(", ")}.`);
  if (activity.filesCreated.length > 0) sessionParts.push(`Files created: ${activity.filesCreated.join(", ")}.`);
  const sessionLog = sessionParts.join(" ");

  // Preserve existing semantic state; append structural session log below it.
  const currentStateLines = currentHandoff ? `${currentHandoff}\n\n${sessionLog}` : sessionLog;

  return [
    `---`,
    `generated_at: "${generatedAt}"`,
    `job_id: "${jobId}"`,
    `slug: "${slug}"`,
    `auto_generated: true`,
    `---`,
    ``,
    `## HANDOFF UPDATE`,
    ``,
    `### Current state`,
    ``,
    currentStateLines,
    ``,
    `### Next step`,
    ``,
    nextStep || "",
    ``,
    `### Open questions`,
    ``,
    openQuestions || "",
    ``,
    `## NEW DECISIONS`,
    ``,
    `## NEW ARTIFACTS`,
    ``,
  ].join("\n");
}

function readHandoffSection(root: string, slug: string, heading: string): string {
  const path = join(jobDir(root, slug), "HANDOFF.md");
  if (!existsSync(path)) return "";
  try {
    const content = readFileSync(path, "utf8");
    const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
    const m = content.match(re);
    if (!m) return "";
    // strip nested ### subsections — just want flat text
    const raw = m[1].replace(/### [^\n]+\n/g, "").trim();
    return raw;
  } catch {
    return "";
  }
}
