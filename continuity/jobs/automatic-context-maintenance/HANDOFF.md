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

- All implementation shipped (8 commits): template, schema reset, hook rewrite, checkpoint removal, status update, tests
- 32/32 tests pass — hook behavior verified at unit level
- `pending/` directories deleted from all existing jobs
- One gap remaining: manual dogfood to verify `decision: "block"` actually surfaces to Claude

## Current state

Implementation complete. Stop hook blocks on `has_edits = 1` and outputs `{"decision": "block", "reason": ...}` with the stop-sync instruction. PostToolUse flags edits. SessionStart resets the flag and prints re-anchor message. All old checkpoint code removed. 32/32 tests pass.

Not yet dogfooded: unknown whether Claude Code actually presents the `reason` text as an actionable directive to the model. This is the critical open question (DEC-003 pass criteria).

## Next step

Manual dogfood: attach to this job, make some edits, end the session. Verify Stop hook fires, Claude sees the sync instruction, and HANDOFF.md is updated correctly per the DEC-003 pass criteria.

## Open questions

- Does `decision: "block"` with `reason` actually surface to Claude as an actionable directive? The entire architecture depends on this. Must verify before trusting the path.

## Avoid / already rejected

- Per-turn PostToolUse event accumulation — wrong granularity, adds complexity without payoff
- `continuity sync` CLI command in V1 — deferred; manual HANDOFF editing is the fallback
- `stop_sync_completed_at` schema column — false precision, we cannot confirm Claude actually wrote the file
- Keeping checkpoint draft/apply alongside Stop sync — conflicting write paths

## References

- DEC-001: Stop hook is primary; PostToolUse is flag only
- DEC-002: Writes split by risk — HANDOFF auto, DECISIONS/ARTIFACTS deliberate
- DEC-003: Acceptance criteria for the stop-sync instruction
