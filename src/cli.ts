import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";

const program = new Command();

program
  .name("continuity")
  .description("Project-scoped continuity layer for AI coding sessions.")
  .version("0.0.0");

registerInitCommand(program);

program.parse(process.argv);
