import { Command } from "commander";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Initialize Continuity in a project.")
    .argument("[projectPath]", "Path to the project to initialize (defaults to current directory)")
    .action((projectPath: string | undefined) => {
      const root = projectPath ?? process.cwd();
      console.log(`Initializing Continuity at: ${root}`);
    });
}
