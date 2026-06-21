#!/usr/bin/env node
// Called by Claude Code on SessionStart. Records the event and prints attach status.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

const result = spawnSync(process.execPath, [cli, "hook", "session-start", "-p", projectRoot], {
  timeout: 5000,
  encoding: "utf8",
});

if (result.stdout?.trim()) {
  process.stdout.write(result.stdout.trim() + "\n");
}
// failures are silent — never block Claude
