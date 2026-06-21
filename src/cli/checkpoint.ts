import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { continuityDir, jobDir, jobsDir } from "../core/paths.js";
import { listJobs } from "../core/context-pack.js";

export function registerCheckpointCommand(program: Command): void {
  program
    .command("checkpoint")
    .description("Print a checkpoint instruction for the current job.")
    .argument("[slug]", "Job slug (required if more than one job exists)")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((slug: string | undefined, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());

      if (!existsSync(continuityDir(root))) {
        console.error(`Error: Continuity is not initialized in: ${root}`);
        console.error(`Run: continuity init`);
        process.exit(1);
      }

      const jobs = listJobs(root);

      let resolvedSlug: string;

      if (slug) {
        if (!existsSync(jobDir(root, slug))) {
          console.error(`Error: No job found with slug: ${slug}`);
          if (jobs.length > 0) {
            console.error(`\nKnown jobs:`);
            for (const job of jobs) console.error(`  ${job.slug}`);
          }
          process.exit(1);
        }
        resolvedSlug = slug;
      } else if (jobs.length === 1) {
        resolvedSlug = jobs[0].slug;
      } else if (jobs.length === 0) {
        console.error(`Error: No jobs exist yet. Run: continuity start "<job name>"`);
        process.exit(1);
      } else {
        console.error(`Error: Multiple jobs exist. Specify a slug:`);
        for (const job of jobs) console.error(`  continuity checkpoint ${job.slug}`);
        process.exit(1);
      }

      const packPath = `continuity/jobs/${resolvedSlug}`;

      console.log(`Checkpoint instruction for: ${resolvedSlug}`);
      console.log(`---`);
      console.log(`Update the resume files for this job. Write only what has changed.`);
      console.log(``);
      console.log(`${packPath}/HANDOFF.md`);
      console.log(`  - Update "Current state" to reflect where we are now.`);
      console.log(`  - Update "Next step" to the single most important next action.`);
      console.log(`  - Update "Plan" if the approach changed.`);
      console.log(`  - Add anything new to "Open questions".`);
      console.log(`  - Add anything tried and rejected to "Avoid / already rejected".`);
      console.log(`  - Update "References" if new DEC-* or ART-* IDs are relevant.`);
      console.log(``);
      console.log(`${packPath}/DECISIONS.md`);
      console.log(`  - Add any new durable decisions at the bottom with a new DEC-* ID.`);
      console.log(`  - Mark superseded decisions as superseded; add "Superseded by: DEC-*".`);
      console.log(`  - Do not rewrite or delete existing entries.`);
      console.log(``);
      console.log(`${packPath}/ARTIFACTS.md`);
      console.log(`  - Add any new artifacts at the bottom with a new ART-* ID.`);
      console.log(`  - Update "Last known state" for artifacts that changed.`);
      console.log(`  - Mark deprecated artifacts as deprecated; do not delete entries.`);
      console.log(``);
      console.log(`After updating, confirm the changes with the user before saving.`);
      console.log(`Do not overwrite files without explicit approval.`);
    });
}
