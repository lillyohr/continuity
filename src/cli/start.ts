import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { continuityDir, jobsDir } from "../core/paths.js";
import { createJobIdentity } from "../core/job.js";
import { createContextPack } from "../core/context-pack.js";

export function registerStartCommand(program: Command): void {
  program
    .command("start")
    .description("Create a new job and its resume files.")
    .argument("<jobName>", "Name for the job (e.g. \"auth refactor\")")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((jobName: string, opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());

      if (!existsSync(continuityDir(root))) {
        console.error(`Error: Continuity is not initialized in: ${root}`);
        console.error(`Run: continuity init`);
        process.exit(1);
      }

      const identity = createJobIdentity(jobsDir(root), jobName);

      createContextPack({
        projectRoot: root,
        jobId: identity.jobId,
        slug: identity.slug,
        jobName: identity.jobName,
        createdAt: identity.createdAt,
      });

      console.log(`Created job: ${identity.slug}`);
      console.log(`\nResume files:`);
      console.log(`  continuity/jobs/${identity.slug}/INDEX.md`);
      console.log(`  continuity/jobs/${identity.slug}/HANDOFF.md`);
      console.log(`  continuity/jobs/${identity.slug}/DECISIONS.md`);
      console.log(`  continuity/jobs/${identity.slug}/ARTIFACTS.md`);
      console.log(`\nNext: continuity resume ${identity.slug}`);
    });
}
