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

## DEC-003 — No expires_at in active-job.json

**Status:** accepted

**Date:** 2026-06-21

**Decision:** `active-job.json` has no `expires_at` field. The lock is replaced
on next `attach` and cleared by `detach` — time-based expiry adds no value.
Context Pack files are never deleted; done jobs get `status: archived` in
frontmatter instead.

**Why:** Expiry only matters when sessions auto-attach and locks can go stale
without user action. Since attach/detach is always explicit, the lock is always
intentional. A date field with no enforcement is misleading. Context Packs are
tiny (even 100 jobs is ~2MB) so deletion is never necessary — archiving is enough.

**Consequences:** `active-job.ts` schema has no expiry field. Future job lifecycle
management uses `status: archived` in INDEX.md frontmatter, not file deletion.

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

---

## DEC-005 — PreCompact initiates checkpoint, not suggests it

**Status:** accepted

**Date:** 2026-06-21

**Decision:** The PreCompact hook outputs an imperative instruction to Claude:
`[CONTINUITY] Job "<slug>" has unsaved activity. Run 'continuity checkpoint <slug>' now before this compaction proceeds.`
If no job is attached, it outputs nothing. Session-start outputs attach status
only when a job is attached; silent when unattached.

**Why:** "Consider running checkpoint" has near-zero adoption — nobody acts on
suggestions during a compaction flow. The hook's output is processed by Claude
before compaction; framing it as imperative means Claude executes it rather than
skipping it. Silent when unattached avoids noise in sessions that don't use Continuity.

**Consequences:** PreCompact hook must read active-job.json to determine whether
to output anything. When checkpoint draft generation lands, PreCompact becomes
the trigger for auto-generation, not just a reminder. The checkpoint command
must be safe to run mid-session without user pre-approval.

**Applies to:** `src/cli/hook.ts`, `plugin/hooks/scripts/pre-compact.js`,
`plugin/hooks/scripts/session-start.js`

**Supersedes:** none

**Superseded by:** none
