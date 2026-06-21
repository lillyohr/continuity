---
job_id: "cd73a6a0-29f7-4c58-9a29-d6755f6914e1"
slug: "v1-hooks-and-attachment"
last_updated: "2026-06-21"
status: active
---

# Handoff — V1 Hooks and Attachment

<!-- Keep this file short enough to understand in under 60 seconds. -->
<!-- Keep this file current-state focused. Durable decisions go in DECISIONS.md; important files/outputs go in ARTIFACTS.md. -->

## Goal

Make the plugin installable and alive: add explicit attach/detach backed by a
flat `active-job.json`, wire SessionStart/Stop/PreCompact hooks, and establish
a real feedback loop from working sessions.

## Resume summary

- Scope locked. All design decisions recorded in DEC-001–004.
- Hooks are dumb recorders in V1 — faithful event log, tiny output, never block.
- `active-job.json` scoped per-project-root. No auto-attach. No SQLite.
- Status shows: attached job, event count, last event. No derived labels.
- Implementation starts at commit 1: state directory paths.

## Current state

Scope locked. No V1 code written yet. Starting implementation.

## Next step

Commit 1: add `.state/` paths to `src/core/paths.ts` — `stateDir()`,
`activeJobPath()`, `spoolDir()`.

## Plan

1. ~~Confirm V1 scope~~ ✓
2. `feat: add state directory paths` ← next
3. `feat: implement attach and detach`
4. `feat: add spool event log`
5. `feat: add hook entrypoints`
6. `feat: add hook scripts to plugin`
7. `feat: wire hooks in plugin.json`
8. `feat: update status with attached state`
9. `chore: install and dogfood`

## Open questions

- Plugin command invocation naming: `/continuity/resume` vs `/continuity:resume`?
  Resolved by step 9 dogfood.

## Avoid / already rejected

- **Auto-attach on `start`** — creates a job ≠ attaches this session. (DEC-002)
- **Per-worktree attach scope** — premature; per-project-root is correct for now. (DEC-002)
- **Auto-expiry of active-job.json in V1** — `expires_at` exists but is not enforced yet. (DEC-003)
- **Derived status labels ("dirty")** — user-facing output shows raw events only. (DEC-004)
- **Hooks that block or generate** — hooks record and report; nothing more. (DEC-004)
- **SQLite in V1** — moved to SQLite Persistence milestone. (DEC-001)

## References

- ART-001: `continuity/jobs/continuity-v0-implementation/` — V0 context pack; DEC-001–005 inherited
- ART-002: `docs/roadmap.md` — full milestone plan
