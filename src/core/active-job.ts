import { readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { activeJobPath } from "./paths.js";

export type ActiveJob = {
  job_id: string;
  slug: string;
  project_root: string;
  attached_at: string;
};

export function writeActiveJob(projectRoot: string, job: Pick<ActiveJob, "job_id" | "slug">): ActiveJob {
  const record: ActiveJob = {
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

export function readActiveJob(projectRoot: string): ActiveJob | null {
  const path = activeJobPath(projectRoot);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ActiveJob;
  } catch {
    return null;
  }
}

export function clearActiveJob(projectRoot: string): void {
  const path = activeJobPath(projectRoot);
  if (existsSync(path)) rmSync(path);
}
