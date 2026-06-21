import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { continuityDir } from "../core/paths.js";
import { listJobs } from "../core/context-pack.js";
import { readActiveJob } from "../core/active-job.js";
import { readEvents } from "../core/events.js";

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

      const active = readActiveJob(root);
      const jobs = listJobs(root);

      console.log(`Project:  ${root}`);

      if (active) {
        console.log(`Attached: ${active.slug}`);
        console.log(`Since:    ${active.attached_at}`);

        const { count, last } = readEvents(root);
        if (count > 0) {
          console.log(`Activity: ${count} event${count === 1 ? "" : "s"}`);
          if (last) {
            console.log(`Last:     ${last.type} at ${last.timestamp}`);
          }
        } else {
          console.log(`Activity: none since attach`);
        }
      } else {
        console.log(`Attached: none`);
      }

      console.log(``);

      if (jobs.length === 0) {
        console.log(`No jobs yet. Run: continuity start "<job name>"`);
        return;
      }

      console.log(`Jobs (${jobs.length}):`);
      for (const job of jobs) {
        const marker = active?.slug === job.slug ? " ← attached" : "";
        console.log(`  ${job.slug}${marker}`);
      }

      console.log(``);
      console.log(`To resume a job: continuity resume <slug>`);
    });
}
