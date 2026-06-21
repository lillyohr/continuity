import { resolve } from "node:path";
import { Command } from "commander";
import { readActiveJob, clearActiveJob } from "../core/active-job.js";

export function registerDetachCommand(program: Command): void {
  program
    .command("detach")
    .description("Detach this session from the current job.")
    .option("-p, --project <path>", "Project root (defaults to current directory)")
    .action((opts: { project?: string }) => {
      const root = resolve(opts.project ?? process.cwd());
      const active = readActiveJob(root);

      if (!active) {
        console.log(`Already unattached.`);
        return;
      }

      clearActiveJob(root);
      console.log(`Detached from: ${active.slug}`);
    });
}
