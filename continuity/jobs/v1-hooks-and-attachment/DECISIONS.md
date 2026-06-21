---
job_id: "cd73a6a0-29f7-4c58-9a29-d6755f6914e1"
slug: "v1-hooks-and-attachment"
last_updated: "2026-06-21"
---

# Decisions — V1 Hooks and Attachment

Durable decisions for this job. Each decision gets a stable DEC-* ID so it
can be referenced from HANDOFF.md, ARTIFACTS.md, and future sessions.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after DEC-001 is DEC-002.
- Only accepted decisions should be treated as constraints during resume.
- Never delete an entry. If a decision is overturned, mark it superseded
  and add the replacement as a new entry.
- Keep entries short. One paragraph per field is enough.
- Do not duplicate current-state content from HANDOFF.md. If a decision is
  currently constraining the work, reference its DEC-* ID from HANDOFF.md instead.

---

## DEC-001 — Hooks first; SQLite deferred to V2; no .5 versions

**Status:** accepted

**Date:** 2026-06-21

**Decision:** V1 ships hooks and flat-file attachment (`active-job.json` +
spool JSONL) with no SQLite. SQLite moves to V2. Version numbers use integers
only — no V1.5, V2.5, etc.

**Why:** Hooks give an immediate feedback loop from real sessions. That signal
is more valuable than storage correctness at this stage. Flat files are
sufficient for attach state and dirty tracking until queries become necessary.
The `.5` versioning was inherited from the original spec but doesn't carry
meaning — each milestone is a distinct capability, not a half-step.

**Consequences:** V1 implementation must not introduce SQLite. Dirty state
is computed from spool JSONL event count. Attach scope is a flat file key,
not a DB row. V2 migrates flat files to SQLite.

**Applies to:** `src/core/active-job.ts`, `src/core/events.ts`, roadmap,
all V1 tickets.

**Supersedes:** none

**Superseded by:** none
