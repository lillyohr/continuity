#!/usr/bin/env node
// Called by Claude Code on PreCompact. Records the event and reminds about checkpoint.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const cli = resolve(import.meta.dirname, "../../../dist/cli/index.js");

spawnSync(process.execPath, [cli, "hook", "pre-compact", "-p", projectRoot], {
  timeout: 5000,
});

process.stdout.write("Continuity: compaction observed. Run `continuity checkpoint` if this job needs a handoff update.\n");
// failures are silent — never block Claude
