import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createContextPack, listJobs } from "../src/core/context-pack.js";
import { jobsDir } from "../src/core/paths.js";
import { mkdirSync, writeFileSync } from "node:fs";

function makeProject(): string {
  const root = mkdtempSync(join(tmpdir(), "cont-test-"));
  const jobs = jobsDir(root);
  mkdirSync(jobs, { recursive: true });
  writeFileSync(join(jobs, ".gitkeep"), "");
  return root;
}

const TEST_INPUT = {
  projectRoot: "",
  jobId: "test-job-id-1234",
  slug: "my-test-job",
  jobName: "My Test Job",
  createdAt: "2026-06-21",
};

test("createContextPack: creates job directory", () => {
  const root = makeProject();
  createContextPack({ ...TEST_INPUT, projectRoot: root });

  assert.ok(existsSync(join(root, "continuity", "jobs", "my-test-job")));
});

test("createContextPack: writes all four files", () => {
  const root = makeProject();
  createContextPack({ ...TEST_INPUT, projectRoot: root });

  const dir = join(root, "continuity", "jobs", "my-test-job");
  for (const file of ["INDEX.md", "HANDOFF.md", "DECISIONS.md", "ARTIFACTS.md"]) {
    assert.ok(existsSync(join(dir, file)), `${file} should exist`);
  }
});

test("createContextPack: substitutes JOB_ID, JOB_NAME, SLUG, and DATE tokens", () => {
  const root = makeProject();
  createContextPack({ ...TEST_INPUT, projectRoot: root });

  const index = readFileSync(
    join(root, "continuity", "jobs", "my-test-job", "INDEX.md"),
    "utf8",
  );

  assert.ok(index.includes("test-job-id-1234"), "JOB_ID should be substituted");
  assert.ok(index.includes("My Test Job"), "JOB_NAME should be substituted");
  assert.ok(index.includes("my-test-job"), "SLUG should be substituted");
  assert.ok(index.includes("2026-06-21"), "DATE should be substituted");
  assert.ok(!index.includes("{{"), "No unreplaced tokens should remain");
});

test("createContextPack: throws if job directory already exists", () => {
  const root = makeProject();
  createContextPack({ ...TEST_INPUT, projectRoot: root });

  assert.throws(
    () => createContextPack({ ...TEST_INPUT, projectRoot: root }),
    /Job already exists/,
  );
});

test("listJobs: returns empty array when jobs directory has no subdirectories", () => {
  const root = makeProject();
  assert.deepEqual(listJobs(root), []);
});

test("listJobs: returns sorted job summaries after creating jobs", () => {
  const root = makeProject();
  createContextPack({ ...TEST_INPUT, projectRoot: root, slug: "beta-job", jobId: "id-1" });
  createContextPack({ ...TEST_INPUT, projectRoot: root, slug: "alpha-job", jobId: "id-2" });

  const jobs = listJobs(root);
  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].slug, "alpha-job");
  assert.equal(jobs[1].slug, "beta-job");
});

test("listJobs: returns empty array when continuity directory does not exist", () => {
  const root = mkdtempSync(join(tmpdir(), "cont-test-"));
  assert.deepEqual(listJobs(root), []);
});
