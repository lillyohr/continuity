import { readFileSync, mkdirSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { jobDir, jobsDir, templatesDir } from "./paths.js";
import { render } from "./markdown.js";
const TEMPLATE_FILES = ["INDEX.md", "HANDOFF.md", "DECISIONS.md", "ARTIFACTS.md"];
export function createContextPack(input) {
    const { projectRoot, jobId, slug, jobName, createdAt } = input;
    const dir = jobDir(projectRoot, slug);
    if (existsSync(dir)) {
        throw new Error(`Job already exists: ${dir}`);
    }
    const tplDir = templatesDir();
    const vars = {
        JOB_ID: jobId,
        JOB_NAME: jobName,
        SLUG: slug,
        DATE: createdAt,
    };
    mkdirSync(dir, { recursive: true });
    for (const file of TEMPLATE_FILES) {
        const tpl = readFileSync(join(tplDir, file), "utf8");
        writeFileSync(join(dir, file), render(tpl, vars), { flag: "wx" });
    }
}
export function listJobs(projectRoot) {
    const dir = jobsDir(projectRoot);
    if (!existsSync(dir))
        return [];
    return readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => ({ slug: e.name, dir: join(dir, e.name) }))
        .sort((a, b) => a.slug.localeCompare(b.slug));
}
export function readJobStatus(dir) {
    try {
        const content = readFileSync(join(dir, "INDEX.md"), "utf8");
        const m = content.match(/^status:\s*(\S+)/m);
        return m?.[1] ?? "active";
    }
    catch {
        return "active";
    }
}
