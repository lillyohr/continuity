#!/usr/bin/env node
// Called by Claude Code on SessionStart. Records the event and prints attach status.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.env.CLAUDE_PROJECT_ROOT ?? process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");
const payload = process.stdin.isTTY ? "" : (() => { let d = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", c => d += c); return d; })();

try {
  const result = execFileSync(process.execPath, [cli, "hook", "session-start", "-p", projectRoot], {
    input: payload,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 5000,
  });
  const out = result.toString().trim();
  if (out) process.stdout.write(out + "\n");
} catch {
  // never block Claude
}
