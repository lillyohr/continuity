import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "commander";
import { continuityDir, jobsDir } from "../core/paths.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Continuity in a project.")
    .argument("[projectPath]", "Path to the project to initialize (defaults to current directory)")
    .action((projectPath: string | undefined) => {
      const root = resolve(projectPath ?? process.cwd());
      const contDir = continuityDir(root);
      const jobs = jobsDir(root);

      if (existsSync(contDir)) {
        console.log(`Continuity already initialized at: ${contDir}`);
        console.log(`Run: continuity start "<job name>" to create a new job.`);
        return;
      }

      mkdirSync(jobs, { recursive: true });
      writeFileSync(join(jobs, ".gitkeep"), "");

      console.log(`Initialized Continuity at: ${contDir}`);
      console.log(`\nNext: continuity start "<job name>"`);
    });
}
