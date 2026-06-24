---
job_id: "ed8e7937-baaa-424c-8e1e-2121b2d95674"
slug: "automatic-context-maintenance"
last_updated: "2026-06-24"
status: active
---

# Handoff — automatic context maintenance

## Goal

Replace the checkpoint draft/apply cycle with automatic HANDOFF sync at session lifecycle boundaries, so the Context Pack stays current without user intervention.

## Resume summary

- Architecture discussion complete: Stop-first, PreCompact deferred to V1.5, PostToolUse flag only
- Writes split by risk: HANDOFF auto via Stop hook; DECISIONS/ARTIFACTS deliberate via SKILL.md
- Architecture and roadmap docs updated; old checkpoint docs removed
- No implementation code written yet — design only
- First step: write and manually test the stop-sync instruction template

## Current state

Design locked. Documentation current. Old checkpoint code still in codebase (src/cli/checkpoint.ts, checkpoints SQLite table, pending/ in job templates). Nothing new has been built yet.

## Next step

Write `plugin/templates/hooks/stop-sync.md`. Test it manually against this job's context pack before touching any code. Pass criteria are defined in DEC-003.

## Plan

1. Write `plugin/templates/hooks/stop-sync.md`
2. Manual dogfood against this context pack — verify pass criteria
3. Add `has_edits` + `stop_sync_requested_at` to sessions schema (migration)
4. Update PostToolUse hook: flag Edit/Write/MultiEdit only, no event rows
5. Update Stop hook: `stop_hook_active` guard first; block with instruction when conditions met
6. Remove checkpoint draft/apply/ignore commands and their tests
7. Drop checkpoints table (migration)
8. Remove pending/ from job templates and start command
9. Verify Stop hook fires, blocks, and second stop exits cleanly

## Open questions

- Does `decision: "block"` with `reason` actually surface to Claude as an actionable directive? Must be verified by dogfood before trusting this path.
- Should SessionStart re-anchor output mention that Stop will auto-sync HANDOFF, so Claude knows the context pack will be updated at session end?

## Avoid / already rejected

- Per-turn PostToolUse event accumulation — wrong granularity, adds complexity without payoff
- `continuity sync` CLI command in V1 — deferred; manual HANDOFF editing is the fallback
- `stop_sync_completed_at` schema column — false precision, we cannot confirm Claude actually wrote the file
- Keeping checkpoint draft/apply alongside Stop sync — conflicting write paths

## References

- DEC-001: Stop hook is primary; PostToolUse is flag only
- DEC-002: Writes split by risk — HANDOFF auto, DECISIONS/ARTIFACTS deliberate
- DEC-003: Acceptance criteria for the stop-sync instruction
