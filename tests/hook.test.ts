import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { openDb } from "../src/core/db.js";
import { jobsDir } from "../src/core/paths.js";

const CLI = new URL("../dist/cli/index.js", import.meta.url).pathname;

function makeProject(slug?: string): string {
  const root = mkdtempSync(join(tmpdir(), "cont-hook-test-"));
  // Init DB
  const db = openDb(root);
  if (slug) {
    db.prepare(`INSERT INTO jobs (job_id, slug, title, created_at) VALUES (?, ?, ?, ?)`).run(
      "job-1", slug, "Test Job", new Date().toISOString()
    );
    db.prepare(`INSERT INTO sessions (job_id, started_at) VALUES (?, ?)`).run(
      "job-1", new Date().toISOString()
    );
    // Write active-job.json
    const stateDir = join(root, "continuity", ".state");
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, "active-job.json"), JSON.stringify({
      job_id: "job-1", slug, attached_at: new Date().toISOString()
    }));
    // Write minimal HANDOFF.md for stop-sync template test
    const jobDir = join(root, "continuity", "jobs", slug);
    mkdirSync(jobDir, { recursive: true });
    writeFileSync(join(jobDir, "HANDOFF.md"), `## Goal\nTest goal.\n\n## Current state\nWorking.\n\n## Next step\nNext.\n\n## Open questions\nNone.\n`);
  }
  db.close();
  return root;
}

function runHook(root: string, event: string, payload?: Record<string, unknown>): { stdout: string; stderr: string; status: number | null } {
  const input = payload ? JSON.stringify(payload) : "";
  const result = spawnSync(process.execPath, [CLI, "hook", event, "-p", root], {
    input,
    encoding: "utf8",
    timeout: 5000,
  });
  return { stdout: result.stdout ?? "", stderr: result.stderr ?? "", status: result.status };
}

function getSessionRow(root: string): { has_edits: number; stop_sync_requested_at: string | null } | undefined {
  const db = openDb(root);
  const row = db.prepare(`SELECT has_edits, stop_sync_requested_at FROM sessions LIMIT 1`).get() as
    { has_edits: number; stop_sync_requested_at: string | null } | undefined;
  db.close();
  return row;
}

test("PostToolUse Edit sets has_edits = 1", () => {
  const root = makeProject("my-job");
  try {
    assert.equal(getSessionRow(root)?.has_edits, 0);
    runHook(root, "post-tool-use", { tool_name: "Edit", tool_input: { file_path: "foo.ts" } });
    assert.equal(getSessionRow(root)?.has_edits, 1);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("PostToolUse Write sets has_edits = 1", () => {
  const root = makeProject("my-job");
  try {
    runHook(root, "post-tool-use", { tool_name: "Write", tool_input: { file_path: "bar.ts" } });
    assert.equal(getSessionRow(root)?.has_edits, 1);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("PostToolUse Read does NOT set has_edits", () => {
  const root = makeProject("my-job");
  try {
    runHook(root, "post-tool-use", { tool_name: "Read", tool_input: { file_path: "foo.ts" } });
    assert.equal(getSessionRow(root)?.has_edits, 0);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("PostToolUse Bash does NOT set has_edits", () => {
  const root = makeProject("my-job");
  try {
    runHook(root, "post-tool-use", { tool_name: "Bash", tool_input: { command: "ls" } });
    assert.equal(getSessionRow(root)?.has_edits, 0);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("PostToolUse with no attached job exits cleanly", () => {
  const root = makeProject(); // no slug → no active-job.json
  try {
    const { status } = runHook(root, "post-tool-use", { tool_name: "Edit" });
    assert.equal(status, 0);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("Stop exits 0 when stop_hook_active = true (loop guard)", () => {
  const root = makeProject("my-job");
  try {
    // Set has_edits so the guard is the only thing preventing a block
    const db = openDb(root);
    db.prepare(`UPDATE sessions SET has_edits = 1`).run();
    db.close();

    const { status, stdout } = runHook(root, "stop", { stop_hook_active: true });
    assert.equal(status, 0);
    assert.equal(stdout.trim(), "", "must not output block JSON when stop_hook_active");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("Stop exits 0 when unattached", () => {
  const root = makeProject(); // no active-job.json
  try {
    const { status, stdout } = runHook(root, "stop", {});
    assert.equal(status, 0);
    assert.equal(stdout.trim(), "");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("Stop exits 0 when attached but has_edits = 0", () => {
  const root = makeProject("my-job");
  try {
    const { status, stdout } = runHook(root, "stop", {});
    assert.equal(status, 0);
    assert.equal(stdout.trim(), "");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("Stop outputs block JSON when attached and has_edits = 1", () => {
  const root = makeProject("my-job");
  try {
    const db = openDb(root);
    db.prepare(`UPDATE sessions SET has_edits = 1`).run();
    db.close();

    const { status, stdout } = runHook(root, "stop", {});
    assert.equal(status, 0);
    const parsed = JSON.parse(stdout.trim()) as { decision: string; reason: string };
    assert.equal(parsed.decision, "block");
    assert.ok(parsed.reason.length > 0, "reason must be non-empty");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("Stop block JSON contains slug in reason", () => {
  const root = makeProject("my-job");
  try {
    const db = openDb(root);
    db.prepare(`UPDATE sessions SET has_edits = 1`).run();
    db.close();

    const { stdout } = runHook(root, "stop", {});
    const parsed = JSON.parse(stdout.trim()) as { reason: string };
    assert.ok(parsed.reason.includes("my-job"), "reason must contain the job slug");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("Stop sets stop_sync_requested_at when blocking", () => {
  const root = makeProject("my-job");
  try {
    const db = openDb(root);
    db.prepare(`UPDATE sessions SET has_edits = 1`).run();
    db.close();

    assert.equal(getSessionRow(root)?.stop_sync_requested_at, null);
    runHook(root, "stop", {});
    assert.ok(getSessionRow(root)?.stop_sync_requested_at != null, "stop_sync_requested_at must be set");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("SessionStart resets has_edits to 0", () => {
  const root = makeProject("my-job");
  try {
    const db = openDb(root);
    db.prepare(`UPDATE sessions SET has_edits = 1`).run();
    db.close();

    assert.equal(getSessionRow(root)?.has_edits, 1);
    runHook(root, "session-start", {});
    assert.equal(getSessionRow(root)?.has_edits, 0);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("SessionStart prints re-anchor message when attached", () => {
  const root = makeProject("my-job");
  try {
    const { stdout } = runHook(root, "session-start", {});
    assert.ok(stdout.includes("my-job"), "must mention the attached job slug");
    assert.ok(stdout.includes("HANDOFF.md"), "must mention HANDOFF.md");
  } finally {
    rmSync(root, { recursive: true });
  }
});
