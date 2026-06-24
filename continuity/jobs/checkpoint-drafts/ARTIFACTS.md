---
job_id: "1ded18a1-fd21-4ae7-be3b-b1344e4a73e3"
slug: "checkpoint-drafts"
last_updated: "2026-06-23"
---

# Artifacts — Checkpoint Drafts

Files, documents, outputs, commands, and references that matter for resuming
this job. Only include things a future session would actually need to know about.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after ART-003 is ART-004.
- Do not list every changed file. List only artifacts needed to resume the job.
- Prefer marking old entries deprecated instead of deleting them. Delete only
  entries that were added by mistake or were never useful for resume.
- Reference ART-* IDs from HANDOFF.md to surface what matters right now.

---

## ART-001 — Roadmap Checkpoint Drafts section

**Path:** `docs/roadmap.md` (Checkpoint Drafts milestone)

**Kind:** doc

**What it is:** The roadmap spec for this milestone including signal filter
rules, acceptance criteria, and the key invariant (no auto-apply).

**Why it matters:** The signal filter rules (what qualifies as a DECISION vs.
noise) must be embedded verbatim in the generation prompt per DEC-004.

**Status:** active

**Last known state:** Written 2026-06-21, updated 2026-06-23 with filter spec.

**Related decisions:** DEC-004

**Notes:** Read this before writing the generation prompt template.

---

## ART-002 — Inherited constraints from v1-hooks-and-attachment job

**Path:** `continuity/jobs/v1-hooks-and-attachment/DECISIONS.md`

**Kind:** doc

**What it is:** DEC-004 (hooks are dumb recorders), DEC-005 (PreCompact
initiates checkpoint), DEC-006 (bounded payload_json) from the prior job.

**Why it matters:** DEC-005 means PreCompact will trigger `checkpoint draft`
automatically. DEC-006 means the event signal available to the draft generator
is bounded structured facts, not full content.

**Status:** complete

**Last known state:** All decisions accepted, committed to main.

**Related decisions:** DEC-001

**Notes:** The PreCompact hook already outputs the imperative instruction to
run `continuity checkpoint`. This milestone makes that instruction actually
generate a draft rather than print manual instructions.

---

## ART-003 — Current checkpoint command

**Path:** `src/cli/checkpoint.ts`

**Kind:** code

**What it is:** Existing `checkpoint` command that prints manual update
instructions. This will be replaced by `checkpoint draft`, `checkpoint apply`,
and `checkpoint ignore` subcommands.

**Why it matters:** Starting point for implementation. The manual instruction
text is the basis for the generation prompt template.

**Status:** active

**Last known state:** Prints a checklist of which files to update and how.
No subcommand structure yet.

**Related decisions:** DEC-001, DEC-002

**Notes:** Keep the manual instruction fallback in case generation fails.
