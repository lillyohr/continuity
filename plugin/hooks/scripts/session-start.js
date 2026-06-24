#!/usr/bin/env node
// Called by Claude Code on SessionStart. Records the event and prints attach status.
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

// Add our bin/ to PATH via CLAUDE_ENV_FILE so 'continuity' is available in Bash tool calls
const envFile = process.env.CLAUDE_ENV_FILE;
if (envFile) {
  const binDir = resolve(import.meta.dirname, "../../../bin");
  try {
    appendFileSync(envFile, `PATH=${binDir}:${process.env.PATH}\n`);
  } catch (_) {
    // non-fatal
  }
}

const result = spawnSync(process.execPath, [cli, "hook", "session-start", "-p", projectRoot], {
  timeout: 5000,
  encoding: "utf8",
});

if (result.stdout?.trim()) {
  process.stdout.write(result.stdout.trim() + "\n");
}
// failures are silent — never block Claude
