import { resolve, join } from "node:path";
import { Command } from "commander";
import { continuityDir, jobDir, jobsDir } from "../core/paths.js";
import { listJobs } from "../core/context-pack.js";
import { existsSync } from "node:fs";

export function registerResumeCommand(program: Command): void {
  program
    .command("resume")
    .description("Print a resume instruction for a job.")
    .argument("<slug>", "Job slug to resume")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((slug: string, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());

      if (!existsSync(continuityDir(root))) {
        console.error(`Error: Continuity is not initialized in: ${root}`);
        console.error(`Run: continuity init`);
        process.exit(1);
      }

      const dir = jobDir(root, slug);
      if (!existsSync(dir)) {
        const jobs = listJobs(root);
        console.error(`Error: No job found with slug: ${slug}`);
        if (jobs.length > 0) {
          console.error(`\nKnown jobs:`);
          for (const job of jobs) {
            console.error(`  ${job.slug}`);
          }
        } else {
          console.error(`\nNo jobs exist yet. Run: continuity start "<job name>"`);
        }
        process.exit(1);
      }

      const indexPath = join("continuity", "jobs", slug, "INDEX.md");

      console.log(`Resume instruction for: ${slug}`);
      console.log(`---`);
      console.log(`Read ${indexPath} first.`);
      console.log(`Use it as the entry point for this job.`);
      console.log(`Before continuing, state:`);
      console.log(`  - The current goal`);
      console.log(`  - The current state`);
      console.log(`  - The next action`);
      console.log(`Do not revisit items listed under "Avoid / already rejected" unless the user explicitly asks.`);
    });
}
