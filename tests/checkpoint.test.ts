import { test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "../src/core/db.js";
import { appendEvent } from "../src/core/events.js";
import { writeActiveJob } from "../src/core/active-job.js";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "../dist/cli/index.js");

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "cont-cp-test-"));
}

function cli(args: string[], root: string): { stdout: string; stderr: string; status: number | null } {
  const r = spawnSync(process.execPath, [CLI, ...args, "-p", root], { encoding: "utf8" });
  return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}

function initProject(root: string): void {
  const r = spawnSync(process.execPath, [CLI, "init", root], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`init failed: ${r.stderr}`);
}

function initJob(root: string, slug: string): string {
  cli(["start", slug.replace(/-/g, " ")], root);
  // read job_id from INDEX.md
  const indexPath = join(root, "continuity", "jobs", slug, "INDEX.md");
  const match = readFileSync(indexPath, "utf8").match(/^job_id:\s*"?([^"\n"]+)"?/m);
  return match ? match[1].trim() : slug;
}

function insertCheckpointRow(root: string, slug: string, generatedAt: string): number {
  const db = openDb(root);
  const result = db.prepare(
    `INSERT INTO checkpoints (job_id, generated_at)
     VALUES ((SELECT job_id FROM jobs WHERE slug = ?), ?)`
  ).run(slug, generatedAt);
  const id = result.lastInsertRowid as number;
  db.close();
  return id;
}

function makeDraft(root: string, slug: string): string {
  const dir = join(root, "continuity", "jobs", slug, "pending");
  mkdirSync(dir, { recursive: true });
  const filename = "checkpoint-2026-01-01-0010.md";
  const path = join(dir, filename);
  writeFileSync(path, [
    `---`,
    `generated_at: "2026-01-01T00:10:00.000Z"`,
    `job_id: "test"`,
    `slug: "${slug}"`,
    `---`,
    ``,
    `## HANDOFF UPDATE`,
    ``,
    `### Current state`,
    ``,
    `Implementation is complete.`,
    ``,
    `### Next step`,
    ``,
    `Write tests.`,
    ``,
    `### Open questions`,
    ``,
    ``,
    `## NEW DECISIONS`,
    ``,
    `## NEW ARTIFACTS`,
    ``,
  ].join("\n"));
  return path;
}

// --- stale detection tests (pure SQLite, no CLI needed) ---

test("stale detection: lifecycle event after generated_at is detected", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);
    const generatedAt = "2026-01-01T00:10:00.000Z";
    insertCheckpointRow(root, slug, generatedAt);

    appendEvent(root, "session_start", { job_id: jobId, slug }, "new session");

    const db = openDb(root);
    const row = db.prepare(`
      SELECT e.timestamp FROM events e
      WHERE e.type IN ('session_start', 'stop', 'pre_compact')
        AND e.timestamp > ?
      LIMIT 1
    `).get(generatedAt) as { timestamp: string } | undefined;
    db.close();

    assert.ok(row !== undefined, "lifecycle event after generated_at should be found");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("stale detection: post_tool_use after generated_at is not a lifecycle event", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);
    const generatedAt = "2026-01-01T00:10:00.000Z";
    insertCheckpointRow(root, slug, generatedAt);

    appendEvent(root, "post_tool_use", { job_id: jobId, slug }, "tool fired");

    const db = openDb(root);
    const row = db.prepare(`
      SELECT e.timestamp FROM events e
      WHERE e.type IN ('session_start', 'stop', 'pre_compact')
        AND e.timestamp > ?
      LIMIT 1
    `).get(generatedAt) as { timestamp: string } | undefined;
    db.close();

    assert.equal(row, undefined, "post_tool_use should not count as lifecycle event");
  } finally {
    rmSync(root, { recursive: true });
  }
});

// --- apply / ignore end-to-end via CLI ---

test("checkpoint apply updates HANDOFF and removes draft", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    initJob(root, slug);
    insertCheckpointRow(root, slug, "2026-01-01T00:10:00.000Z");
    const draftPath = makeDraft(root, slug);

    const result = cli(["checkpoint", "apply", "--slug", slug], root);
    assert.equal(result.status, 0, `apply failed: ${result.stderr}`);

    const handoff = readFileSync(join(root, "continuity", "jobs", slug, "HANDOFF.md"), "utf8");
    assert.ok(handoff.includes("Implementation is complete."), "current state should be updated");
    assert.ok(handoff.includes("Write tests."), "next step should be updated");
    assert.ok(!existsSync(draftPath), "draft file should be removed after apply");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("checkpoint apply marks applied_at in checkpoints table", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    initJob(root, slug);
    const id = insertCheckpointRow(root, slug, "2026-01-01T00:10:00.000Z");
    makeDraft(root, slug);

    cli(["checkpoint", "apply", "--slug", slug], root);

    const db = openDb(root);
    const row = db.prepare(`SELECT applied_at FROM checkpoints WHERE id = ?`).get(id) as { applied_at: string | null };
    db.close();

    assert.ok(row.applied_at !== null, "applied_at should be set after apply");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("checkpoint ignore removes draft and marks dismissed_at", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    initJob(root, slug);
    const id = insertCheckpointRow(root, slug, "2026-01-01T00:10:00.000Z");
    const draftPath = makeDraft(root, slug);

    const result = cli(["checkpoint", "ignore", "--slug", slug], root);
    assert.equal(result.status, 0, `ignore failed: ${result.stderr}`);
    assert.ok(!existsSync(draftPath), "draft file should be removed after ignore");

    const db = openDb(root);
    const row = db.prepare(`SELECT dismissed_at FROM checkpoints WHERE id = ?`).get(id) as { dismissed_at: string | null };
    db.close();
    assert.ok(row.dismissed_at !== null, "dismissed_at should be set after ignore");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("checkpoint apply is blocked by stale lifecycle event", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);
    insertCheckpointRow(root, slug, "2026-01-01T00:10:00.000Z");
    makeDraft(root, slug);

    // new session after draft was generated
    appendEvent(root, "session_start", { job_id: jobId, slug }, "new session");

    const result = cli(["checkpoint", "apply", "--slug", slug], root);
    assert.notEqual(result.status, 0, "apply should fail when draft is stale");
    assert.ok(result.stderr.includes("stale"), "error should mention stale");
  } finally {
    rmSync(root, { recursive: true });
  }
});

// --- auto-draft on stop ---

test("stop hook auto-creates draft when tool activity exists", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);

    writeActiveJob(root, { job_id: jobId, slug });
    appendEvent(root, "session_start", { job_id: jobId, slug }, "session started");
    appendEvent(root, "post_tool_use", { job_id: jobId, slug }, "edit",
      JSON.stringify({ tool_name: "Edit", path: "src/cli/hook.ts" }));

    const result = cli(["hook", "stop"], root);
    assert.equal(result.status, 0, `hook stop failed: ${result.stderr}`);

    const pending = join(root, "continuity", "jobs", slug, "pending");
    const drafts = readdirSync(pending).filter(f => f.startsWith("checkpoint-") && f.endsWith(".md"));
    assert.equal(drafts.length, 1, "should have one auto-generated draft");

    const content = readFileSync(join(pending, drafts[0]), "utf8");
    assert.ok(content.includes("auto_generated: true"), "draft should be marked auto-generated");
    assert.ok(content.includes("src/cli/hook.ts"), "draft should list the edited file");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("stop hook preserves existing HANDOFF current state in draft", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);

    // Write a meaningful current state to HANDOFF
    const handoffPath = join(root, "continuity", "jobs", slug, "HANDOFF.md");
    const handoff = readFileSync(handoffPath, "utf8");
    writeFileSync(handoffPath, handoff.replace(
      /## Current state[\s\S]*?(?=\n## )/,
      "## Current state\n\nAll three subcommands are working.\n\n"
    ));

    writeActiveJob(root, { job_id: jobId, slug });
    appendEvent(root, "session_start", { job_id: jobId, slug }, "session started");
    appendEvent(root, "post_tool_use", { job_id: jobId, slug }, "edit",
      JSON.stringify({ tool_name: "Edit", path: "src/core/db.ts" }));

    cli(["hook", "stop"], root);

    const pending = join(root, "continuity", "jobs", slug, "pending");
    const drafts = readdirSync(pending).filter(f => f.startsWith("checkpoint-") && f.endsWith(".md"));
    const content = readFileSync(join(pending, drafts[0]), "utf8");

    assert.ok(content.includes("All three subcommands are working."), "existing state should be preserved");
    assert.ok(content.includes("src/core/db.ts"), "session log should be appended");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("stop hook does not overwrite existing pending draft", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);
    const existingDraftPath = makeDraft(root, slug);

    writeActiveJob(root, { job_id: jobId, slug });
    appendEvent(root, "session_start", { job_id: jobId, slug }, "session started");
    appendEvent(root, "post_tool_use", { job_id: jobId, slug }, "edit",
      JSON.stringify({ tool_name: "Edit", path: "src/cli/hook.ts" }));

    cli(["hook", "stop"], root);

    const pending = join(root, "continuity", "jobs", slug, "pending");
    const drafts = readdirSync(pending).filter(f => f.startsWith("checkpoint-") && f.endsWith(".md"));
    assert.equal(drafts.length, 1, "should still have exactly one draft (no overwrite)");
    assert.ok(existsSync(existingDraftPath), "original draft should be untouched");
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("session_start hook notifies about pending draft", () => {
  const root = makeTmp();
  try {
    initProject(root);
    const slug = "my-test-job";
    const jobId = initJob(root, slug);
    writeActiveJob(root, { job_id: jobId, slug });
    makeDraft(root, slug);

    const result = cli(["hook", "session-start"], root);
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes("checkpoint draft is pending"), "should notify about pending draft");
    assert.ok(result.stdout.includes("checkpoint apply"), "should suggest apply command");
  } finally {
    rmSync(root, { recursive: true });
  }
});
