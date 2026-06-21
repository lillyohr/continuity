#!/usr/bin/env node
// Called by Claude Code on PreCompact. Records the event and reminds about checkpoint.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.env.CLAUDE_PROJECT_ROOT ?? process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");
const payload = process.stdin.isTTY ? "" : (() => { let d = ""; process.stdin.setEncoding("utf8"); process.stdin.on("data", c => d += c); return d; })();

try {
  execFileSync(process.execPath, [cli, "hook", "pre-compact", "-p", projectRoot], {
    input: payload,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 5000,
  });
  process.stdout.write("Continuity: compaction observed. Run `continuity checkpoint` if this job needs a handoff update.\n");
} catch {
  // never block Claude
}
