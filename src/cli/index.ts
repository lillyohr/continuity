#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { registerInitCommand } from "./init.js";
import { registerStartCommand } from "./start.js";
import { registerStatusCommand } from "./status.js";
import { registerResumeCommand } from "./resume.js";
import { registerCheckpointCommand } from "./checkpoint.js";
import { registerAttachCommand } from "./attach.js";
import { registerDetachCommand } from "./detach.js";
import { registerHookCommand } from "./hook.js";

const pkg = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as { version: string };

const program = new Command();

program
  .name("continuity")
  .description("Project-scoped continuity layer for AI coding sessions.")
  .version(pkg.version)
  .showHelpAfterError("(add --help for usage)");

registerInitCommand(program);
registerStartCommand(program);
registerStatusCommand(program);
registerResumeCommand(program);
registerCheckpointCommand(program);
registerAttachCommand(program);
registerDetachCommand(program);
registerHookCommand(program);

program.parse(process.argv);
