import { resolve, join, basename } from "node:path";
import { existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { Command } from "commander";
import { continuityDir, jobDir, pendingDir } from "../core/paths.js";
import { listJobs } from "../core/context-pack.js";
import { openDb } from "../core/db.js";

export function registerCheckpointCommand(program: Command): void {
  const checkpoint = program
    .command("checkpoint")
    .description("Manage context pack checkpoints.");

  checkpoint
    .command("draft [slug]")
    .description("Output a generation prompt for a checkpoint draft.")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((slug: string | undefined, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());
      requireInit(root);
      const resolvedSlug = resolveSlug(root, slug, "checkpoint draft");

      const packPath = `continuity/jobs/${resolvedSlug}`;
      const handoff = readPackFile(root, resolvedSlug, "HANDOFF.md");
      const decisions = readPackFile(root, resolvedSlug, "DECISIONS.md");
      const artifacts = readPackFile(root, resolvedSlug, "ARTIFACTS.md");
      const events = getRecentEvents(root, resolvedSlug);
      const jobId = readJobId(root, resolvedSlug);
      const generatedAt = new Date().toISOString();
      const filename = draftFilename();
      const draftPath = `${packPath}/pending/${filename}`;

      const pendingDraft = findPendingDraft(root, resolvedSlug);
      const existingDraftNote = pendingDraft
        ? `\nNote: a draft already exists at ${packPath}/pending/${basename(pendingDraft)}. You may overwrite it or apply it first.\n`
        : "";

      console.log(`Generate a checkpoint draft for job "${resolvedSlug}" and write it to:`);
      console.log(`  ${draftPath}`);
      console.log(existingDraftNote);
      console.log(`=== HANDOFF.md ===`);
      console.log(handoff);
      console.log(`=== DECISIONS.md (last 500 chars — do not duplicate existing entries) ===`);
      console.log(decisions.slice(-500));
      console.log(`=== ARTIFACTS.md (last 500 chars — do not duplicate existing entries) ===`);
      console.log(artifacts.slice(-500));
      console.log(`=== Recent activity ===`);
      console.log(events);
      console.log(`\n=== Draft format — write EXACTLY this structure ===`);
      console.log(`---`);
      console.log(`generated_at: "${generatedAt}"`);
      console.log(`job_id: "${jobId ?? resolvedSlug}"`);
      console.log(`slug: "${resolvedSlug}"`);
      console.log(`---`);
      console.log(``);
      console.log(`## HANDOFF UPDATE`);
      console.log(``);
      console.log(`### Current state`);
      console.log(``);
      console.log(`<1-3 sentences on where work stands now>`);
      console.log(``);
      console.log(`### Next step`);
      console.log(``);
      console.log(`<The single most important next action>`);
      console.log(``);
      console.log(`### Open questions`);
      console.log(``);
      console.log(`<New unresolved questions, or leave blank if none>`);
      console.log(``);
      console.log(`## NEW DECISIONS`);
      console.log(``);
      console.log(`<Zero or more complete DEC-* entries. Omit content if no new decisions.>`);
      console.log(``);
      console.log(`## NEW ARTIFACTS`);
      console.log(``);
      console.log(`<Zero or more complete ART-* entries. Omit content if no new artifacts.>`);
      console.log(``);
      console.log(`=== Signal filter — only include items that pass ALL of these ===`);
      console.log(`DECISIONS: A choice between alternatives with lasting consequences that`);
      console.log(`  constrains future work or would surprise a reader who only saw the code.`);
      console.log(`  Exclude: routine ops, anything visible from git log, discussions that`);
      console.log(`  didn't conclude.`);
      console.log(`ARTIFACTS: A completed output a future session would actually reference.`);
      console.log(`  Exclude: in-progress files, things visible from git history.`);
      console.log(`HANDOFF: Current state and next step only. Not a summary of what was done.`);
      console.log(`  Exclude: anything that belongs in DECISIONS or is visible from git log.`);
      console.log(``);
      console.log(`After writing the file, confirm:`);
      console.log(`  "Draft written to ${draftPath}. Run \`continuity checkpoint apply\` to apply."`);
    });

  checkpoint
    .command("apply [draft-file]")
    .description("Apply a pending checkpoint draft to the context pack.")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .option("-s, --slug <slug>", "Job slug")
    .action((draftFile: string | undefined, opts: { project?: string; slug?: string }) => {
      const root = resolve(opts.project ?? process.cwd());
      requireInit(root);
      const resolvedSlug = resolveSlug(root, opts.slug, "checkpoint apply --slug");

      const draftPath = draftFile
        ? resolve(draftFile)
        : findPendingDraft(root, resolvedSlug);

      if (!draftPath || !existsSync(draftPath)) {
        console.error(`Error: No pending draft found for job: ${resolvedSlug}`);
        console.error(`Run: continuity checkpoint draft ${resolvedSlug}`);
        process.exit(1);
      }

      const draftContent = readFileSync(draftPath, "utf8");

      // stale check: use file mtime so the Write event that created the draft
      // doesn't falsely trigger staleness (generated_at predates that Write)
      const draftMtime = new Date(statSync(draftPath).mtimeMs).toISOString();
      const latestEvent = getLatestEventTimestamp(root, resolvedSlug);
      if (latestEvent && latestEvent > draftMtime) {
        console.error(`Error: Draft is stale. New activity occurred after it was written.`);
        console.error(`  Draft written:   ${draftMtime}`);
        console.error(`  Latest event:    ${latestEvent}`);
        console.error(`Re-run: continuity checkpoint draft ${resolvedSlug}`);
        console.error(`Or discard: continuity checkpoint ignore --slug ${resolvedSlug}`);
        process.exit(1);
      }

      const handoffUpdate = parseSection(draftContent, "HANDOFF UPDATE");
      const newDecisions = parseSection(draftContent, "NEW DECISIONS");
      const newArtifacts = parseSection(draftContent, "NEW ARTIFACTS");

      if (handoffUpdate) {
        const handoffPath = join(jobDir(root, resolvedSlug), "HANDOFF.md");
        let handoff = readFileSync(handoffPath, "utf8");
        handoff = replaceHandoffSubsection(handoff, "Current state", extractSubsection(handoffUpdate, "Current state"));
        handoff = replaceHandoffSubsection(handoff, "Next step", extractSubsection(handoffUpdate, "Next step"));
        handoff = replaceHandoffSubsection(handoff, "Open questions", extractSubsection(handoffUpdate, "Open questions"));
        handoff = updateFrontmatterDate(handoff);
        writeFileSync(handoffPath, handoff);
        console.log(`Updated: HANDOFF.md`);
      }

      if (newDecisions.trim()) {
        const decisionsPath = join(jobDir(root, resolvedSlug), "DECISIONS.md");
        const decisions = readFileSync(decisionsPath, "utf8");
        writeFileSync(decisionsPath, decisions.trimEnd() + "\n\n---\n\n" + newDecisions.trim() + "\n");
        console.log(`Updated: DECISIONS.md`);
      }

      if (newArtifacts.trim()) {
        const artifactsPath = join(jobDir(root, resolvedSlug), "ARTIFACTS.md");
        const artifacts = readFileSync(artifactsPath, "utf8");
        writeFileSync(artifactsPath, artifacts.trimEnd() + "\n\n---\n\n" + newArtifacts.trim() + "\n");
        console.log(`Updated: ARTIFACTS.md`);
      }

      unlinkSync(draftPath);
      console.log(`Applied and removed: ${basename(draftPath)}`);
    });

  checkpoint
    .command("ignore")
    .description("Dismiss the pending checkpoint draft without applying it.")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .option("-s, --slug <slug>", "Job slug")
    .action((opts: { project?: string; slug?: string }) => {
      const root = resolve(opts.project ?? process.cwd());
      requireInit(root);
      const resolvedSlug = resolveSlug(root, opts.slug, "checkpoint ignore --slug");

      const draftPath = findPendingDraft(root, resolvedSlug);
      if (!draftPath) {
        console.log(`No pending draft for job: ${resolvedSlug}`);
        return;
      }
      unlinkSync(draftPath);
      console.log(`Dismissed: ${basename(draftPath)}`);
    });
}

// --- helpers ---

function requireInit(root: string): void {
  if (!existsSync(continuityDir(root))) {
    console.error(`Error: Continuity is not initialized. Run: continuity init`);
    process.exit(1);
  }
}

function resolveSlug(root: string, slug: string | undefined, command: string): string {
  const jobs = listJobs(root);
  if (slug) {
    if (!existsSync(jobDir(root, slug))) {
      console.error(`Error: No job found with slug: ${slug}`);
      if (jobs.length > 0) {
        console.error(`Known jobs:`);
        for (const job of jobs) console.error(`  ${job.slug}`);
      }
      process.exit(1);
    }
    return slug;
  }
  if (jobs.length === 1) return jobs[0].slug;
  if (jobs.length === 0) {
    console.error(`Error: No jobs exist yet. Run: continuity start "<job name>"`);
    process.exit(1);
  }
  console.error(`Error: Multiple jobs exist. Specify a slug:`);
  for (const job of jobs) console.error(`  continuity ${command} ${job.slug}`);
  process.exit(1);
}

function readPackFile(root: string, slug: string, filename: string): string {
  const path = join(jobDir(root, slug), filename);
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function readJobId(root: string, slug: string): string | null {
  const content = readPackFile(root, slug, "INDEX.md");
  const match = content.match(/^job_id:\s*"?([^"\n]+)"?/m);
  return match ? match[1].trim() : null;
}

function draftFilename(): string {
  const iso = new Date().toISOString();
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 16).replace(":", "");
  return `checkpoint-${date}-${time}.md`;
}

function findPendingDraft(root: string, slug: string): string | null {
  const dir = pendingDir(root, slug);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter(f => f.startsWith("checkpoint-") && f.endsWith(".md"))
    .sort()
    .reverse();
  return files.length > 0 ? join(dir, files[0]) : null;
}

function getRecentEvents(root: string, slug: string): string {
  try {
    const db = openDb(root);
    const rows = db.prepare(`
      SELECT e.timestamp, e.type, e.summary, e.payload_json
      FROM events e JOIN jobs j ON e.job_id = j.job_id
      WHERE j.slug = ? ORDER BY e.id DESC LIMIT 50
    `).all(slug) as { timestamp: string; type: string; summary: string; payload_json: string | null }[];
    db.close();
    if (rows.length === 0) return "No recorded events.";
    return rows.reverse().map(r => {
      const p = r.payload_json ? ` ${r.payload_json}` : "";
      return `- ${r.timestamp} [${r.type}] ${r.summary}${p}`;
    }).join("\n");
  } catch {
    return "Event log unavailable.";
  }
}

function getLatestEventTimestamp(root: string, slug: string): string | null {
  try {
    const db = openDb(root);
    const row = db.prepare(`
      SELECT e.timestamp FROM events e JOIN jobs j ON e.job_id = j.job_id
      WHERE j.slug = ? ORDER BY e.id DESC LIMIT 1
    `).get(slug) as { timestamp: string } | undefined;
    db.close();
    return row?.timestamp ?? null;
  } catch {
    return null;
  }
}

function parseFrontmatter(content: string, key: string): string | null {
  const match = content.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?`, "m"));
  return match ? match[1].trim() : null;
}

function parseSection(content: string, heading: string): string {
  const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = content.match(re);
  return match ? match[1] : "";
}

function extractSubsection(content: string, heading: string): string {
  const re = new RegExp(`### ${heading}\\s*\\n([\\s\\S]*?)(?=\\n### |$)`, "i");
  const match = content.match(re);
  return match ? match[1].trim() : "";
}

function replaceHandoffSubsection(handoff: string, heading: string, newContent: string): string {
  if (!newContent) return handoff;
  const re = new RegExp(`(## ${heading}\\n)([\\s\\S]*?)(?=\\n## |$)`, "i");
  return handoff.replace(re, `$1\n${newContent}\n\n`);
}

function updateFrontmatterDate(content: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return content.replace(/^(last_updated:\s*)"[^"]*"/m, `$1"${today}"`);
}
