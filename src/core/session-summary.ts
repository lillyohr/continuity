import { openDb } from "./db.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { jobDir, pendingDir } from "./paths.js";

export type SessionActivity = {
  toolUseCount: number;
  filesModified: string[];  // Edit events
  filesCreated: string[];   // Write events
  since: string | null;
};

export function getSessionActivity(root: string, slug: string): SessionActivity {
  try {
    const db = openDb(root);

    // Use the most recent applied checkpoint as lower bound; fall back to epoch
    const lastApplied = db.prepare(`
      SELECT c.applied_at FROM checkpoints c
      JOIN jobs j ON c.job_id = j.job_id
      WHERE j.slug = ? AND c.applied_at IS NOT NULL
      ORDER BY c.applied_at DESC LIMIT 1
    `).get(slug) as { applied_at: string } | undefined;

    const since = lastApplied?.applied_at ?? null;

    const rows = db.prepare(`
      SELECT e.type, e.payload_json FROM events e
      JOIN jobs j ON e.job_id = j.job_id
      WHERE j.slug = ?
        AND e.type = 'post_tool_use'
        ${since ? "AND e.timestamp > ?" : ""}
      ORDER BY e.id ASC
    `).all(...(since ? [slug, since] : [slug])) as { type: string; payload_json: string | null }[];

    db.close();

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

    return { toolUseCount: rows.length, filesModified, filesCreated, since };
  } catch {
    return { toolUseCount: 0, filesModified: [], filesCreated: [], since: null };
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

export function buildAutoCheckpointDraft(root: string, slug: string, jobId: string, generatedAt: string): string {
  const activity = getSessionActivity(root, slug);

  const currentHandoff = readHandoffSection(root, slug, "Current state");
  const nextStep = readHandoffSection(root, slug, "Next step");
  const openQuestions = readHandoffSection(root, slug, "Open questions");

  const lines: string[] = [];
  lines.push(`Session ended (${generatedAt.slice(0, 10)}).`);
  if (activity.toolUseCount > 0) {
    lines.push(`${activity.toolUseCount} tool use(s) recorded.`);
  }
  if (activity.filesModified.length > 0) {
    lines.push(`Files modified: ${activity.filesModified.join(", ")}.`);
  }
  if (activity.filesCreated.length > 0) {
    lines.push(`Files created: ${activity.filesCreated.join(", ")}.`);
  }
  if (lines.length === 1) {
    // No activity beyond the stop event — preserve existing state
    lines.push(currentHandoff || "No tool activity recorded this session.");
  }

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
    lines.join(" "),
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
