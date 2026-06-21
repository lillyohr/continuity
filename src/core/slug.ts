import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Convert an arbitrary job name into a lowercase, filesystem-safe slug.
 *
 * "Context Pack Trigger Design" -> "context-pack-trigger-design"
 */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics become single hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens

  return slug || "job";
}

/**
 * Return a slug that does not yet exist as a directory under `jobsDir`,
 * appending -2, -3, ... to the base slug until a free name is found.
 */
export function uniqueSlug(jobsDir: string, base: string): string {
  if (!existsSync(join(jobsDir, base))) return base;

  let n = 2;
  while (existsSync(join(jobsDir, `${base}-${n}`))) n++;
  return `${base}-${n}`;
}
