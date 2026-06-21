#!/usr/bin/env node
// Called by Claude Code on Stop. Records the session end event.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

spawnSync(process.execPath, [cli, "hook", "stop", "-p", projectRoot], {
  timeout: 5000,
});
// failures are silent — never block Claude
