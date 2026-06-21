import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

export const CONTINUITY_DIR = "continuity";
export const JOBS_DIR = "jobs";
export const STATE_DIR = ".state";

export function continuityDir(projectRoot: string): string {
  return join(projectRoot, CONTINUITY_DIR);
}

export function jobsDir(projectRoot: string): string {
  return join(continuityDir(projectRoot), JOBS_DIR);
}

export function jobDir(projectRoot: string, slug: string): string {
  return join(jobsDir(projectRoot), slug);
}

export function pendingDir(projectRoot: string, slug: string): string {
  return join(jobDir(projectRoot, slug), "pending");
}

/** Absolute path to plugin/templates/context-pack/, resolved package-relative. */
export function templatesDir(): string {
  // __file = dist/core/paths.js → package root is two levels up
  const packageRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
  return join(packageRoot, "plugin", "templates", "context-pack");
}
