#!/usr/bin/env node
// Called by Claude Code on Stop. Records the session end event.
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.env.CLAUDE_PROJECT_ROOT ?? process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

try {
  execFileSync(process.execPath, [cli, "hook", "stop", "-p", projectRoot], {
    input: "",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 5000,
  });
} catch {
  // never block Claude
}
