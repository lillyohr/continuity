import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { Command } from "commander";
import { continuityDir } from "../core/paths.js";
import { listJobs } from "../core/context-pack.js";
import { readActiveJob } from "../core/active-job.js";
import { openDb } from "../core/db.js";

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

        try {
          const db = openDb(root);

          const eventCount = (
            db.prepare(`SELECT COUNT(*) as n FROM events WHERE job_id = (SELECT job_id FROM jobs WHERE slug = ?)`).get(active.slug) as { n: number }
          ).n;

          const lastEvent = db
            .prepare(`SELECT type, timestamp FROM events WHERE job_id = (SELECT job_id FROM jobs WHERE slug = ?) ORDER BY id DESC LIMIT 1`)
            .get(active.slug) as { type: string; timestamp: string } | undefined;

          const sessionCount = (
            db.prepare(`SELECT COUNT(*) as n FROM sessions WHERE job_id = (SELECT job_id FROM jobs WHERE slug = ?)`).get(active.slug) as { n: number }
          ).n;

          db.close();

          if (eventCount > 0) {
            console.log(`Activity: ${eventCount} event${eventCount === 1 ? "" : "s"} across ${sessionCount} session${sessionCount === 1 ? "" : "s"}`);
            if (lastEvent) {
              console.log(`Last:     ${lastEvent.type} at ${lastEvent.timestamp}`);
            }
          } else {
            console.log(`Activity: none since attach`);
          }
        } catch {
          console.log(`Activity: (state database unavailable)`);
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
