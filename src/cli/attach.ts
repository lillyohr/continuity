import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { continuityDir, jobDir } from "../core/paths.js";
import { writeActiveJob } from "../core/active-job.js";
import { listJobs } from "../core/context-pack.js";
import { getDb } from "../core/db.js";

function readJobId(root: string, slug: string): string | null {
  const indexPath = join(jobDir(root, slug), "INDEX.md");
  if (existsSync(indexPath)) {
    const match = readFileSync(indexPath, "utf8").match(/^job_id:\s*"?([^"\n]+)"?/m);
    if (match) return match[1].trim();
  }
  // INDEX.md missing or malformed — check SQLite before falling back to slug
  try {
    const row = getDb(root).prepare(`SELECT job_id FROM jobs WHERE slug = ?`).get(slug) as { job_id: string } | undefined;
    return row?.job_id ?? null;
  } catch {
    return null;
  }
}

export function registerAttachCommand(program: Command): void {
  program
    .command("attach")
    .description("Attach this session to a job.")
    .argument("<slug>", "Job slug to attach")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((slug: string, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());

      if (!existsSync(continuityDir(root))) {
        console.error(`Error: Continuity is not initialized in: ${root}`);
        process.exit(1);
      }

      if (!existsSync(jobDir(root, slug))) {
        const known = listJobs(root).map((j) => `  ${j.slug}`).join("\n");
        console.error(`Error: No job found with slug: ${slug}`);
        if (known) console.error(`Known jobs:\n${known}`);
        process.exit(1);
      }

      const jobId = readJobId(root, slug) ?? slug;
      writeActiveJob(root, { job_id: jobId, slug });

      try {
        const db = getDb(root);
        // ensure job row exists (may have been created before SQLite was added)
        db.prepare(
          `INSERT OR IGNORE INTO jobs (job_id, slug, title, created_at, status)
           VALUES (?, ?, ?, ?, 'active')`
        ).run(jobId, slug, slug, new Date().toISOString());
        db.prepare(
          `INSERT INTO sessions (job_id, started_at) VALUES (?, ?)`
        ).run(jobId, new Date().toISOString());
      } catch {
        // non-fatal: active-job.json is the source of truth for attachment
      }

      console.log(`Attached to: ${slug}`);
      console.log(`Run: continuity resume ${slug} to read the context pack.`);
    });
}
