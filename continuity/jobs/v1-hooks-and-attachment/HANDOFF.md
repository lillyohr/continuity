---
job_id: "cd73a6a0-29f7-4c58-9a29-d6755f6914e1"
slug: "v1-hooks-and-attachment"
last_updated: "2026-06-23"
status: complete
---

# Handoff — V1 Hooks and Attachment

<!-- Keep this file short enough to understand in under 60 seconds. -->
<!-- Keep this file current-state focused. Durable decisions go in DECISIONS.md; important files/outputs go in ARTIFACTS.md. -->

## Goal

Ship the full hooks + attachment + SQLite storage layer so that every session
records real activity and the context pack has a queryable signal to build on.

## Resume summary

- Hooks and Attachment milestone: complete and committed.
- SQLite Persistence milestone: complete and committed. 20 tests pass.
- DEC-006 accepted: bounded payloads, references not content (2KB max).
- Next: update hook scripts to extract structured payload_json facts, then
  move to Checkpoint Drafts milestone.
- `active-job.json` stays as the lock file. SQLite is the event/session store.

## Current state

Both milestones shipped to `main`. The events table exists and is populated by
all four hooks (SessionStart, Stop, PreCompact, PostToolUse). `payload_json`
column exists in schema but hook scripts don't yet extract structured facts —
they pass raw stdin or nothing. DEC-006 defines what to capture; implementation
pending.

## Next step

1. Update `pre-compact.js` to extract `conversation_tokens_estimate` from stdin.
2. Update `post-tool-use.js` to extract `tool_name` + `path` from stdin.
3. Add 2KB size guard to `appendEvent` in `events.ts`.
4. Then open Checkpoint Drafts job and plan that milestone.

## Plan

1. ~~Confirm V1 scope~~ ✓
2. ~~State directory paths~~ ✓
3. ~~attach / detach + active-job.json~~ ✓
4. ~~Event log (events.jsonl)~~ ✓
5. ~~Hook entrypoints~~ ✓
6. ~~Hook scripts + plugin.json~~ ✓
7. ~~Status with attach state~~ ✓
8. ~~SQLite Persistence~~ ✓
9. Bounded payload_json in hook scripts ← next
10. Open Checkpoint Drafts job

## Avoid / already rejected

- **Auto-attach on `start`** — creates a job ≠ attaches this session. (DEC-002)
- **Per-worktree attach scope** — premature; per-project-root is correct for now. (DEC-002)
- **`expires_at` in active-job.json** — removed; explicit attach/detach is enough. (DEC-003)
- **Derived status labels ("dirty")** — user-facing output shows raw events only. (DEC-004)
- **Hooks that block or generate** — hooks record and report; nothing more. (DEC-004)
- **Full content in payload_json** — store references, not content; 2KB max. (DEC-006)
- **node:sqlite** — requires `--experimental-sqlite` on Node 22; better-sqlite3 used instead.

## References

- ART-001: `continuity/jobs/continuity-v0-implementation/` — V0 context pack
- ART-002: `docs/roadmap.md` — full milestone plan (Hooks ✓, SQLite ✓, Drafts next)
- ART-003: `src/core/db.ts` — migration runner and schema
- ART-004: `src/core/events.ts` — event writer with SQLite + JSONL fallback
