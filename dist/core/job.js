import { randomUUID } from "node:crypto";
import { slugify, uniqueSlug } from "./slug.js";
export function createJobIdentity(jobsDir, jobName) {
    const base = slugify(jobName);
    const slug = uniqueSlug(jobsDir, base);
    return {
        jobId: randomUUID(),
        slug,
        jobName,
        createdAt: new Date().toISOString().slice(0, 10),
    };
}
