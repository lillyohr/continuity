---
job_id: "18e8ac74-e8bc-4a2c-8ce4-c65c85ea5a97"
slug: "v1-review-and-refactor"
last_updated: "2026-06-24"
status: complete
---

# Handoff — v1 review and refactor

## Goal

Harden the V1 codebase via a full /verify-work sweep and address all identified issues.

## Resume summary

- Full /verify-work on entire codebase identified: DB connection leaks, wrong auto-draft ordering, stale SKILL.md CLI reference, multi-draft orphan bug, attach readJobId fallback bug
- All issues addressed and committed (commit 5eb095a)
- `getDb(root)` singleton added to `db.ts`; all production callers updated; `openDb` reserved for tests
- `.claude-plugin/plugin.json` moved to repo root (per Claude Code plugin spec); `plugin/.claude-plugin/` removed
- 30/30 tests pass

## Current state

V1 hardening is complete. All verify-work issues from the full codebase review have been resolved. The codebase is in a clean, well-tested state. The one remaining gap is that `attach`, `detach`, `resume`, `status`, and `init` commands have zero test coverage.

## Next step

Manual dogfood: install plugin from repo root (`--plugin-dir /path/to/continuity`) and verify all four hooks fire correctly with the new `.claude-plugin/` location and updated `${CLAUDE_PLUGIN_ROOT}/plugin/hooks/scripts/` paths.

## Plan

1. Manual dogfood to confirm plugin works end-to-end from repo root install
2. Consider adding tests for attach/detach/status/resume/init (currently untested)

## Open questions

- Should `checkpoint draft` prevent creating a second draft when one already exists, or continue warning and allowing overwrite?

## Avoid / already rejected

- Using `plugin/.claude-plugin/` as the plugin descriptor location — Claude Code spec requires `.claude-plugin/` at the plugin root (see DEC-002)
- Calling `db.close()` in production code — use `getDb`, not `openDb` (see DEC-001)

## References

- DEC-001: `getDb` singleton pattern
- DEC-002: Plugin descriptor location
- DEC-003: Multi-draft cleanup scope
- DEC-004: SQLite stamp ordering for auto-draft
