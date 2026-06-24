import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { activeJobPath } from "./paths.js";
export function writeActiveJob(projectRoot, job) {
    const record = {
        job_id: job.job_id,
        slug: job.slug,
        project_root: projectRoot,
        attached_at: new Date().toISOString(),
    };
    const path = activeJobPath(projectRoot);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(record, null, 2) + "\n");
    return record;
}
export function readActiveJob(projectRoot) {
    const path = activeJobPath(projectRoot);
    if (!existsSync(path))
        return null;
    try {
        return JSON.parse(readFileSync(path, "utf8"));
    }
    catch {
        return null;
    }
}
export function clearActiveJob(projectRoot) {
    const path = activeJobPath(projectRoot);
    if (existsSync(path))
        rmSync(path);
}
