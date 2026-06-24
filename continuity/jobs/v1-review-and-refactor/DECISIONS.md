---
job_id: "18e8ac74-e8bc-4a2c-8ce4-c65c85ea5a97"
slug: "v1-review-and-refactor"
last_updated: "2026-06-24"
---

# Decisions — v1 review and refactor

Durable decisions for this job. Each decision gets a stable DEC-* ID so it
can be referenced from HANDOFF.md, ARTIFACTS.md, and future sessions.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after DEC-003 is DEC-004.
- Only accepted decisions should be treated as constraints during resume.
- Never delete an entry. If a decision is overturned, mark it superseded
  and add the replacement as a new entry.
- Keep entries short. One paragraph per field is enough.
- Do not duplicate current-state content from HANDOFF.md. If a decision is
  currently constraining the work, reference its DEC-* ID from HANDOFF.md instead.

---

## DEC-001 — getDb singleton: one cached connection per process per root

**Status:** accepted

**Date:** 2026-06-24

**Decision:** `db.ts` exports `getDb(projectRoot: string)` which returns a cached `better-sqlite3` connection keyed by `resolve(projectRoot)`. Migrations run on first open. The connection is reused for the lifetime of the process. Production code must use `getDb` and must NOT call `db.close()`. `openDb` remains exported for tests that need explicit connection control.

**Why:** Production code was calling `openDb + close` independently in every helper function. Besides unnecessary repeated open/migrate/close overhead, this created a pattern where exceptions between `openDb` and `db.close()` silently leaked connections. A per-process singleton eliminates both problems. CLIs are short-lived (one process per hook invocation), so a module-level Map gives exactly the right lifetime.

**Consequences:** Any new DB-using code must import `getDb`, not `openDb`. Tests that call `openDb` directly (and close the connection) are unaffected — the singleton cache is bypassed by test code calling `openDb` directly. If `getDb` is ever called after an explicit `close` (e.g. a test leaking), the `!db.open` check re-opens cleanly.

**Applies to:** `src/core/db.ts`, all production callers in `src/cli/` and `src/core/`

**Supersedes:** none

**Superseded by:** none

---

## DEC-002 — Plugin descriptor lives at repo root, not in plugin/ subdirectory

**Status:** accepted

**Date:** 2026-06-24

**Decision:** `.claude-plugin/plugin.json` lives at the repository root. `${CLAUDE_PLUGIN_ROOT}` resolves to the plugin installation root (same level as `.claude-plugin/`). Hook command paths are `${CLAUDE_PLUGIN_ROOT}/plugin/hooks/scripts/<name>.js`. Commands are declared via `"commands": "plugin/commands"` in `plugin.json`. Skills via `"skills": "plugin/skills"`.

**Why:** Claude Code plugin spec requires `.claude-plugin/` at the plugin root. The previous location (`plugin/.claude-plugin/`) was a mistake from early project setup. With it in a subdirectory, users had to install with `--plugin-dir plugin/` instead of `--plugin-dir <repo-root>`. After the fix, `${CLAUDE_PLUGIN_ROOT}/plugin/hooks/scripts/` correctly reaches the hook scripts because `import.meta.dirname` from inside a hook script resolves three levels up to the package root.

**Consequences:** Plugin is now installed via `--plugin-dir <repo-root>` (not `--plugin-dir <repo-root>/plugin`). Any documentation or install instructions must reflect this. `plugin/` remains the directory for all plugin assets (commands, hooks, skills, templates); only the descriptor moves.

**Applies to:** `.claude-plugin/plugin.json`, `plugin/hooks/scripts/*.js`, install instructions

**Supersedes:** none

**Superseded by:** none

---

## DEC-003 — checkpoint ignore and apply clear ALL pending drafts

**Status:** accepted

**Date:** 2026-06-24

**Decision:** `checkpoint ignore` removes all `checkpoint-*.md` files from `pending/` and marks all unapplied checkpoint rows in SQLite as dismissed. `checkpoint apply` applies the most recent draft, marks its row as applied, then removes any remaining draft files and marks their rows as dismissed.

**Why:** The previous implementation used `findPendingDraft` (most-recent-only) for both operations. If two draft files somehow existed (e.g. the user ran `checkpoint draft` twice without applying), `ignore` would only remove the newest one, leaving the older file and its SQLite row with `applied_at = NULL` and `dismissed_at = NULL`. The orphaned row would permanently block stale detection for future checkpoints. Clearing all drafts on any ignore/apply is always correct: after applying or discarding, there is no scenario where an older pending draft should be preserved.

**Consequences:** `dismissAllPendingCheckpoints` replaces the old `markCheckpointDismissed`. `findAllPendingDrafts` is the canonical way to get all pending files; `findPendingDraft` delegates to it.

**Applies to:** `src/cli/checkpoint.ts`

**Supersedes:** none

**Superseded by:** none

---

## DEC-004 — SQLite checkpoint row must be stamped before the draft file is written

**Status:** accepted

**Date:** 2026-06-24

**Decision:** Both `checkpoint draft` (explicit) and `tryWriteAutoCheckpoint` (auto on Stop) must insert the `checkpoints` row with `generated_at` into SQLite BEFORE calling `writeFileSync` to write the draft file. The file write itself triggers a PostToolUse event; if the row were stamped after, that event's timestamp would postdate `generated_at` and immediately mark the fresh draft as stale.

**Why:** DEC-005 in the `checkpoint-drafts` job established this constraint for the explicit draft path. The auto-draft (`tryWriteAutoCheckpoint` in `hook.ts`) initially stamped SQLite AFTER writing the file, violating the same invariant. Fixed in this job.

**Consequences:** If the SQLite insert succeeds but the file write fails, a checkpoint row exists with no corresponding file. This orphaned row is benign — `checkpoint apply` will fail to find the draft file and exit cleanly; the row stays in the DB with `applied_at = NULL`. Acceptable: the alternative (file before DB) causes silent stale false-positives on every auto-draft.

**Applies to:** `src/cli/hook.ts:tryWriteAutoCheckpoint`, `src/cli/checkpoint.ts` (draft subcommand)

**Supersedes:** none

**Superseded by:** none
