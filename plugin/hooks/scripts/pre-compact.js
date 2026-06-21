#!/usr/bin/env node
// Called by Claude Code on PreCompact. Records the event and issues a checkpoint
// instruction if a job is attached. Output is imperative — Claude should act on it.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

const result = spawnSync(process.execPath, [cli, "hook", "pre-compact", "-p", projectRoot], {
  timeout: 5000,
  encoding: "utf8",
});

if (result.stdout?.trim()) {
  process.stdout.write(result.stdout.trim() + "\n");
}
// failures are silent — never block Claude
