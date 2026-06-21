import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { continuityDir, jobDir } from "../core/paths.js";
import { writeActiveJob } from "../core/active-job.js";
import { listJobs } from "../core/context-pack.js";

function readJobId(projectRoot: string, slug: string): string | null {
  const indexPath = join(jobDir(projectRoot, slug), "INDEX.md");
  if (!existsSync(indexPath)) return null;
  const match = readFileSync(indexPath, "utf8").match(/^job_id:\s*"?([^"\n]+)"?/m);
  return match ? match[1].trim() : null;
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

      console.log(`Attached to: ${slug}`);
      console.log(`Run: continuity resume ${slug} to read the context pack.`);
    });
}
