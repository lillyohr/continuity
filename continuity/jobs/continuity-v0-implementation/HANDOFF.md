---
job_id: "1906391a-d4ac-4c1f-b8b6-08652662d8d1"
slug: "continuity-v0-implementation"
last_updated: "2026-06-21"
status: active
---

# Handoff — Continuity V0 Implementation

<!-- Keep this file short enough to understand in under 60 seconds. -->
<!-- Keep this file current-state focused. Durable decisions go in DECISIONS.md; important files/outputs go in ARTIFACTS.md. -->

## Goal

Build the V0 manual Context Pack CLI and prove that job-scoped Markdown resume
files let a fresh human + agent recover work state correctly, without SQLite,
hooks, or auto-generation.

## Resume summary

- All 12 V0 commits are on `main`. Build is clean, 15 tests pass.
- CLI exposes: `init`, `start`, `status`, `resume`, `checkpoint`.
- Plugin skeleton exists (`plugin.json`, SKILL.md, 5 command files). Hook format confirmed from real plugin examples; hooks go in `plugin.json`, added in V1.5.
- Plugin command invocation naming (`/continuity/resume` vs `/continuity:resume`) is unverified — needs a live install to confirm.
- Next: V0-010 dogfood on a real job, then V1 planning.

## Current state

V0 is feature-complete. All 15 unit tests pass. Docs cover architecture, format,
and the dogfood procedure. The CLI runs correctly via `node dist/cli/index.js`
or after `npm link`. Templates substitute `job_id`, slug, title, and date at
job creation.

## Next step

Run the V0-010 dogfood: pick a real in-progress job, `continuity init`, `continuity start`,
fill HANDOFF.md, do work in Claude, `continuity checkpoint`, update the files, then
open a fresh Claude session and run `continuity resume` — verify the fresh session
states the correct goal, state, and next action in under 60 seconds.

## Plan

1. ~~CLI skeleton~~ ✓
2. ~~Core utilities (slug, paths, markdown, job, context-pack)~~ ✓
3. ~~Context Pack templates~~ ✓
4. ~~Commands (init, start, status, resume, checkpoint)~~ ✓
5. ~~Plugin skeleton~~ ✓
6. ~~Unit tests~~ ✓
7. ~~Docs~~ ✓
8. V0-010 dogfood
9. Plan V1 (SQLite + explicit job attachment)

## Open questions

- Does the plugin command file invoke as `/continuity/resume` or `/continuity:resume`?
  Needs a live Claude Code install to verify. Not a V0 blocker.
- Should the dogfood example be committed to the repo? Depends on whether the
  Continuity-on-Continuity scenario reads clearly for someone evaluating the product.

## Avoid / already rejected

- **Nesting `src/` under `plugin/`** — breaks the npm `bin` path. No benefit. (DEC-001)
- **Global DEC-* / ART-* IDs** — IDs namespace under `job_id`. `job_id + DEC-001`
  is the real identity. (DEC-003)
- **Required path argument for `init`** — cwd default is more ergonomic. Required arg
  caused absolute path to leak into `--help` output.
- **Auto-generating checkpoint drafts in V0** — deferred to V2. V0 proves the artifact
  shape manually first.
- **Profile and Review in core roadmap** — demoted to possible future sidecars. They
  answer different questions than the resume loop. (DEC-004)
- **`milestone` field in Context Pack frontmatter** — adds surface area without helping
  resume. No supporting model (listing, grouping, status) exists yet. (DEC-005)

## References

- DEC-001: CLI at root, `plugin/` for assets only
- DEC-002: `init [projectPath]` optional, defaults to cwd
- DEC-003: `job_id` owns identity; `context-pack.ts` is a pure writer
- DEC-004: Monday Morning Test as scope filter; Profile/Review out of core
- DEC-005: No milestone field in Context Pack frontmatter
- ART-001: `src/cli/index.ts` — CLI entry and command wiring
- ART-002: `plugin/.claude-plugin/plugin.json` — plugin manifest
- ART-003: `docs/v0-manual-context-pack.md` — V0 dogfood procedure
