import { randomUUID } from "node:crypto";
import { slugify, uniqueSlug } from "./slug.js";

export type JobIdentity = {
  jobId: string;
  slug: string;
  jobName: string;
  createdAt: string;
};

export function createJobIdentity(jobsDir: string, jobName: string): JobIdentity {
  const base = slugify(jobName);
  const slug = uniqueSlug(jobsDir, base);
  return {
    jobId: randomUUID(),
    slug,
    jobName,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
