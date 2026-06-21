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

---

## DEC-002 — Attach scope is per-project-root; no auto-attach on start

**Status:** accepted

**Date:** 2026-06-21

**Decision:** `active-job.json` lives at `continuity/.state/active-job.json`
and is scoped to the project root. `continuity start` does not auto-attach.
A future `--attach` flag on `start` is fine, but not the default.

**Why:** Per-worktree is premature — it adds git assumptions before we know
users need them. Wrong attachment is dangerous; slight friction is good. The
invariant "creating a job ≠ attaching this session to it" must be preserved.

**Consequences:** Users must run `continuity attach <slug>` explicitly after
`start`. Multiple worktrees in the same project share one `active-job.json`.
Per-worktree scoping can be added later without breaking the current model.

**Applies to:** `src/core/active-job.ts`, `src/cli/attach.ts`, `src/cli/start.ts`

**Supersedes:** none

**Superseded by:** none

---

## DEC-003 — expires_at exists in active-job.json; no auto-expiry in V1

**Status:** accepted

**Date:** 2026-06-21

**Decision:** `active-job.json` includes an `expires_at` field (30 days from
attach) but V1 does not enforce expiry. Expired locks are treated as unattached
only after the status command gains expiry warnings.

**Why:** A 30-day auto-expiry could surprise someone returning to a paused
project. The field gives the concept a home without enforcing behavior prematurely.
The `attach` command can refresh `expires_at` when it runs.

**Consequences:** `active-job.ts` writes `expires_at` but the read path does
not check it in V1. Status and expiry enforcement come in a later pass.

**Applies to:** `src/core/active-job.ts`

**Supersedes:** none

**Superseded by:** none

---

## DEC-004 — Hooks are dumb recorders; no derived status labels in V1 output

**Status:** accepted

**Date:** 2026-06-21

**Decision:** V1 hooks record events faithfully (timestamp, type, job) and
print tiny output (attached/unattached on SessionStart, a checkpoint reminder
on PreCompact). They do not compute scores, generate drafts, or block Claude.
User-facing status shows raw activity count and last event — not a "dirty" label.

**Why:** Hooks that do too much break in surprising ways. "Dirty" implies the
user did something wrong. The honest V1 status is: here is what happened, not
what you should do about it. Derived labels ("dirty", "checkpoint due") belong
in the Checkpoint Drafts milestone when there is something actionable to show.
Internally, `isDirty()` is fine as a function name.

**Consequences:** `continuity status` shows: attached job, event count, last
event timestamp. No checkpoint status line until checkpoint commands exist.
Hook scripts must never block or throw on failure.

**Applies to:** `src/cli/hook.ts`, `src/core/events.ts`, `src/cli/status.ts`,
all hook scripts in `plugin/hooks/scripts/`

**Supersedes:** none

**Superseded by:** none
