---
job_id: "cd73a6a0-29f7-4c58-9a29-d6755f6914e1"
slug: "v1-hooks-and-attachment"
last_updated: "2026-06-21"
---

# Artifacts — V1 Hooks and Attachment

Files, documents, outputs, commands, and references that matter for resuming
this job. Only include things a future session would actually need to know about.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after ART-002 is ART-003.
- Do not list every changed file. List only artifacts needed to resume the job.
- Prefer marking old entries deprecated instead of deleting them. Delete only
  entries that were added by mistake or were never useful for resume.
- Reference ART-* IDs from HANDOFF.md to surface what matters right now.

---

## ART-001 — V0 context pack

**Path:** `continuity/jobs/continuity-v0-implementation/`

**Kind:** doc

**What it is:** The completed V0 context pack. Contains DEC-001 through DEC-005 —
the foundational decisions that V1 inherits as constraints.

**Why it matters:** V1 builds directly on V0. Key inherited constraints: CLI at
root (DEC-001), job_id owns identity (DEC-003), Monday Morning Test as scope
filter (DEC-004), no milestone field (DEC-005).

**Status:** complete

**Last known state:** All 5 decisions accepted. V0 dogfood complete. Committed
to `main` on 2026-06-21.

**Related decisions:** none (source, not consumer)

**Notes:** Run `continuity resume continuity-v0-implementation` to read full V0
state before starting V1 implementation sessions.

---

## ART-002 — Revised roadmap and V1 plan

**Path:** `docs/roadmap.md`

**Kind:** doc

**What it is:** Full revised roadmap (V0–V7) and V1 ticket list with acceptance
criteria.

**Why it matters:** Defines what V1 is and what done looks like. Tickets map to
implementation workstream jobs.

**Status:** active

**Last known state:** Written 2026-06-21. V1 = hooks + flat-file attachment.
V2 = SQLite. V3 = checkpoint drafts. V4 = eval benchmark.

**Related decisions:** DEC-001

**Notes:** Commit this before starting V1 implementation so it is versioned
alongside the code.
