---
job_id: "ed8e7937-baaa-424c-8e1e-2121b2d95674"
slug: "automatic-context-maintenance"
last_updated: "2026-06-24"
---

# Decisions — automatic context maintenance

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

## DEC-001 — Stop hook is the primary sync mechanism; PostToolUse is a flag only

**Status:** accepted

**Date:** 2026-06-24

**Decision:** The Stop hook is responsible for HANDOFF sync. It fires at session end, checks `stop_hook_active` as its first branch (exits 0 immediately if set), then blocks with a sync instruction if the session had meaningful edits (`has_edits = 1`). PostToolUse sets `has_edits = 1` on the current session when an Edit/Write/MultiEdit fires — nothing else. No event rows are accumulated.

**Why:** The alternative (per-turn PostToolUse updates) adds loop complexity, latency, and can only produce structural data without a model call. Stop fires at the natural session boundary when context is warm — this is the right moment for a semantic HANDOFF update. PreCompact is the deferred safety net (V1.5) for long sessions that compact before Stop fires.

**Consequences:** The Stop hook must handle `stop_hook_active` correctly or it creates an infinite loop. Meaningful-work detection is conservative: only Edit/Write/MultiEdit trigger `has_edits`, not Read/Bash/Grep. Sessions with no file edits (informational conversations) do not trigger a sync.

**Applies to:** `plugin/hooks/scripts/stop.js`, `plugin/hooks/scripts/post-tool-use.js`, `src/core/db.ts` (sessions schema)

**Supersedes:** none

**Superseded by:** none

---

## DEC-002 — Writes split by risk: HANDOFF auto, DECISIONS/ARTIFACTS deliberate

**Status:** accepted

**Date:** 2026-06-24

**Decision:** HANDOFF.md is updated automatically by the Stop hook. DECISIONS.md and ARTIFACTS.md are updated deliberately by Claude during its work, following SKILL.md guidance. The Stop hook sync instruction explicitly forbids touching DECISIONS or ARTIFACTS.

**Why:** HANDOFF is mutable current state — wrong entries are annoying but recoverable. DECISIONS are durable constraints; a bad auto-written entry could cause goal drift in future sessions. ARTIFACTS is a durable reference index; bad entries mislead future sessions about what exists. The risk profile is different, so the update mechanism should be different. SKILL.md instructs Claude to add DEC-* entries before relying on consequential decisions and ART-* entries when outputs are complete.

**Consequences:** DECISIONS and ARTIFACTS quality depends on Claude following SKILL.md guidance reliably. This is a behavioral reliability risk to monitor during dogfood. If important decisions consistently go unrecorded, a deliberate trigger (like a periodic SKILL.md prompt) may be needed.

**Applies to:** `plugin/templates/hooks/stop-sync.md`, `plugin/skills/context/SKILL.md`

**Supersedes:** "Explicit apply" from original architecture (checkpoint draft/apply required user action for all writes — superseded by this decision for HANDOFF; DECISIONS/ARTIFACTS remain deliberate but via SKILL.md, not the apply command)

**Superseded by:** none

---

## DEC-003 — Stop-sync instruction is a first-class artifact; must pass manual test before wiring hooks

**Status:** accepted

**Date:** 2026-06-24

**Decision:** The sync instruction in `plugin/templates/hooks/stop-sync.md` is written and tested manually against a real Context Pack before any hook code is written. Pass criteria must be defined before testing (not "looked good to me").

**Why:** The instruction quality determines whether Continuity feels useful or annoying. It is easier to iterate on the instruction in isolation (paste it into Claude manually) than to debug it through hook machinery. Without explicit pass criteria, manual tests produce false confidence.

**Consequences:** Build order is: write instruction → manual dogfood → hook code → removal of old checkpoint machinery. Do not wire the hook until the instruction passes all criteria.

**Pass criteria:**
- Goal section unchanged
- Current state accurate
- Next step specific and actionable
- Open questions: answered ones removed, new ones added, unchanged ones preserved
- Changed content under 10 lines total
- DECISIONS.md untouched
- ARTIFACTS.md untouched
- No changelog added
- Fresh session reads Context Pack and states goal + next step correctly (Monday Morning Test)

**Applies to:** `plugin/templates/hooks/stop-sync.md`, Stop hook implementation

**Supersedes:** none

**Superseded by:** none
