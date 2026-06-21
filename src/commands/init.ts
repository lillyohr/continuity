import { Command } from "commander";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Continuity in a project.")
    .argument("<projectPath>", "Path to the project to initialize")
    .action((projectPath: string) => {
      console.log(`Initializing Continuity at: ${projectPath}`);
    });
}
