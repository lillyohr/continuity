import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { continuityDir } from "../core/paths.js";
import { listJobs, readJobStatus } from "../core/context-pack.js";
import { readActiveJob } from "../core/active-job.js";
import { getDb } from "../core/db.js";
export function registerStatusCommand(program) {
    program
        .command("status")
        .description("Show Continuity state for this project.")
        .option("-p, --project <path>", "Project root (defaults to current directory)")
        .option("-a, --all", "Show all jobs including complete ones")
        .action((opts) => {
        const root = resolve(opts.project ?? process.cwd());
        if (!existsSync(continuityDir(root))) {
            console.log(`Not initialized. Run: continuity init`);
            return;
        }
        const active = readActiveJob(root);
        const allJobs = listJobs(root);
        const jobs = opts.all
            ? allJobs
            : allJobs.filter((j) => readJobStatus(j.dir) !== "complete");
        console.log(`Project:  ${root}`);
        if (active) {
            console.log(`Attached: ${active.slug}`);
            console.log(`Since:    ${active.attached_at}`);
            try {
                const db = getDb(root);
                const session = db.prepare(`SELECT has_edits, stop_sync_requested_at FROM sessions
             WHERE job_id = (SELECT job_id FROM jobs WHERE slug = ?)
               AND ended_at IS NULL
             ORDER BY id DESC LIMIT 1`).get(active.slug);
                if (session) {
                    console.log(`Edits:    ${session.has_edits ? "yes" : "no"} (this session)`);
                    console.log(`Last sync: ${session.stop_sync_requested_at ?? "never"}`);
                }
            }
            catch {
                console.log(`Activity: (state database unavailable)`);
            }
        }
        else {
            console.log(`Attached: none`);
        }
        console.log(``);
        if (jobs.length === 0) {
            if (allJobs.length > 0) {
                console.log(`No active jobs. Run: continuity status --all to see all jobs.`);
            }
            else {
                console.log(`No jobs yet. Run: continuity start "<job name>"`);
            }
            return;
        }
        const label = opts.all ? `Jobs (${jobs.length})` : `Jobs (${jobs.length} active/paused)`;
        console.log(`${label}:`);
        for (const job of jobs) {
            const status = readJobStatus(job.dir);
            const marker = active?.slug === job.slug ? " ← attached" : "";
            const statusTag = status === "complete" ? " [complete]" : status === "paused" ? " [paused]" : "";
            console.log(`  ${job.slug}${statusTag}${marker}`);
        }
        console.log(``);
        console.log(`To resume a job: continuity resume <slug>`);
    });
}
