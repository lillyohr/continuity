#!/usr/bin/env node
// Called by Claude Code on PostToolUse. Records the tool event — token-free signal
// for future SQLite scoring. Always silent; never blocks Claude.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  const stdin = Buffer.concat(chunks);
  spawnSync(process.execPath, [cli, "hook", "post-tool-use", "-p", projectRoot], {
    input: stdin,
    timeout: 5000,
  });
  // failures are silent — never block Claude
});
