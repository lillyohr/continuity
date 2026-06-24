#!/usr/bin/env node
// Called by Claude Code on Stop. Blocks session end when edits need HANDOFF sync.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  const stdin = Buffer.concat(chunks);
  const result = spawnSync(process.execPath, [cli, "hook", "stop", "-p", projectRoot], {
    input: stdin,
    timeout: 5000,
    encoding: "utf8",
  });
  if (result.stdout?.trim()) process.stdout.write(result.stdout.trim() + "\n");
  // failures are silent — never block Claude
});
