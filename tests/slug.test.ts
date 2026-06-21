import { test } from "node:test";
import { strict as assert } from "node:assert";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { slugify, uniqueSlug } from "../src/core/slug.js";

test("slugify: lowercases and replaces spaces with hyphens", () => {
  assert.equal(slugify("Context Pack Trigger Design"), "context-pack-trigger-design");
});

test("slugify: strips non-alphanumeric characters", () => {
  assert.equal(slugify("auth & session (v2)"), "auth-session-v2");
});

test("slugify: collapses multiple separators into one hyphen", () => {
  assert.equal(slugify("foo   ---   bar"), "foo-bar");
});

test("slugify: trims leading and trailing hyphens", () => {
  assert.equal(slugify("  --hello--  "), "hello");
});

test("slugify: returns 'job' for empty or whitespace-only input", () => {
  assert.equal(slugify(""), "job");
  assert.equal(slugify("   "), "job");
});

test("uniqueSlug: returns base slug when directory does not exist", () => {
  const dir = mkdtempSync(join(tmpdir(), "cont-test-"));
  assert.equal(uniqueSlug(dir, "my-job"), "my-job");
});

test("uniqueSlug: appends -2 when base slug already exists", () => {
  const dir = mkdtempSync(join(tmpdir(), "cont-test-"));
  mkdirSync(join(dir, "my-job"));
  assert.equal(uniqueSlug(dir, "my-job"), "my-job-2");
});

test("uniqueSlug: increments past existing suffixes", () => {
  const dir = mkdtempSync(join(tmpdir(), "cont-test-"));
  mkdirSync(join(dir, "my-job"));
  mkdirSync(join(dir, "my-job-2"));
  mkdirSync(join(dir, "my-job-3"));
  assert.equal(uniqueSlug(dir, "my-job"), "my-job-4");
});
