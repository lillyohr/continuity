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

- V0 is complete. This builds on it. See ART-001.
- V1 scope: `attach`/`detach` (flat file), four hook entrypoints, plugin.json
  wired, spool JSONL for dirty events, improved status.
- No SQLite yet (V2). No checkpoint drafts yet (V3).
- New conversations are unattached by default — core invariant.
- This is a planning job. Rename/close when V1 implementation begins.

## Current state

Planning. Roadmap revised: no .5 versions, hooks move to V1, SQLite to V2,
checkpoint drafts to V3, eval benchmark to V4. No V1 code written yet.

## Next step

Confirm V1 scope and ticket list, then create implementation workstream jobs
for each ticket. See ART-002 for the full V1 plan and roadmap.

## Plan

1. Confirm V1 scope (this planning job) ← here now
2. V1-001: `attach` / `detach` + `active-job.json`
3. V1-002: Hook entrypoints (`continuity hook <event>`)
4. V1-003: Hook scripts in plugin
5. V1-004: `plugin.json` hooks wired
6. V1-005: SessionStart behavior (unattached / attached-clean / attached-dirty)
7. V1-006: Spool JSONL dirty events
8. V1-007: `status` shows attached state + dirty/clean
9. V1-008: Install + dogfood (resolve command naming open question)

## Open questions

- Attach scope: per-project-root (most predictable) vs per-worktree (git-aware)?
  Affects what key goes in `active-job.json`.
- Should `continuity start` auto-attach? Ergonomic but breaks "unattached by
  default." Lean: no — require explicit `attach`.
- Plugin command invocation naming: `/continuity/resume` vs `/continuity:resume`?
  Resolved by V1-008 dogfood.

## Avoid / already rejected

- **`.5` version numbers** — dropped. V1, V2, V3... only. (DEC-001)
- **SQLite in V1** — moved to V2. V1 uses flat files for the feedback loop. (DEC-001)
- **Auto-attaching new conversations** — core invariant: unattached by default.
- **Milestone field in Context Pack frontmatter** — decided in V0. (ART-001, DEC-005)

## References

- ART-001: `continuity/jobs/continuity-v0-implementation/` — V0 context pack; DEC-001–005 inherited
- ART-002: `docs/roadmap.md` — full revised roadmap and V1 ticket list
