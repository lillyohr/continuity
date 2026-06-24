---
job_id: "18e8ac74-e8bc-4a2c-8ce4-c65c85ea5a97"
slug: "v1-review-and-refactor"
last_updated: "2026-06-24"
---

# Artifacts — v1 review and refactor

Files, documents, outputs, commands, and references that matter for resuming
this job. Only include things a future session would actually need to know about.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after DEC-003 is ART-004.
- Do not list every changed file. List only artifacts needed to resume the job.
- Prefer marking old entries deprecated instead of deleting them. Delete only
  entries that were added by mistake or were never useful for resume.
- Reference ART-* IDs from HANDOFF.md to surface what matters right now.

---

## ART-001 — getDb singleton

**Path:** src/core/db.ts

**Kind:** code

**What it is:** `getDb(projectRoot)` — module-level cached DB connection factory.

**Why it matters:** All production code must use this instead of `openDb`. The distinction matters for any future DB-using feature: don't call `db.close()`, don't import `openDb` in production code.

**Status:** complete

**Last known state:** Exported alongside `openDb`. Cache is `Map<string, Database>`, keyed by `resolve(projectRoot)`. Checks `!db.open` before returning cached instance.

**Related decisions:** DEC-001

---

## ART-002 — Root-level plugin descriptor

**Path:** .claude-plugin/plugin.json

**Kind:** config

**What it is:** Canonical Claude Code plugin descriptor with hooks, commands, and skills declarations.

**Why it matters:** Install path is now `--plugin-dir <repo-root>`. Any changes to hook script paths or plugin metadata go here. `plugin/.claude-plugin/` no longer exists.

**Status:** complete

**Last known state:** Has all 4 hooks pointing to `${CLAUDE_PLUGIN_ROOT}/plugin/hooks/scripts/`. `"commands": "plugin/commands"`, `"skills": "plugin/skills"`.

**Related decisions:** DEC-002

---

## ART-003 — Verify-work findings (full codebase sweep, 2026-06-24)

**Path:** git commit 5eb095a

**Kind:** output

**What it is:** Commit that addresses all issues from the full /verify-work sweep.

**Why it matters:** Records the baseline quality state after V1 hardening. Issues found and fixed: DB leaks (5 helpers), auto-draft ordering, multi-draft orphans, attach readJobId fallback, stale SKILL.md.

**Status:** complete

**Last known state:** 30/30 tests pass. Build clean.

**Related decisions:** DEC-001, DEC-003, DEC-004
