import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { continuityDir } from "../core/paths.js";
import { listJobs } from "../core/context-pack.js";

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Show Continuity state for this project.")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());

      if (!existsSync(continuityDir(root))) {
        console.log(`Not initialized. Run: continuity init`);
        return;
      }

      const jobs = listJobs(root);

      console.log(`Project:  ${root}`);
      console.log(`State:    unattached`);
      console.log(``);

      if (jobs.length === 0) {
        console.log(`No jobs yet. Run: continuity start "<job name>"`);
        return;
      }

      console.log(`Jobs (${jobs.length}):`);
      for (const job of jobs) {
        console.log(`  ${job.slug}`);
      }

      console.log(``);
      console.log(`To resume a job: continuity resume <slug>`);
    });
}
