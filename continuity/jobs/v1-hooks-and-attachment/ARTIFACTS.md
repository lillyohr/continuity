---
job_id: "cd73a6a0-29f7-4c58-9a29-d6755f6914e1"
slug: "v1-hooks-and-attachment"
last_updated: "2026-06-23"
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

---

## ART-003 — Database module and SQLite schema

**Path:** `src/core/db.ts`

**Kind:** code

**What it is:** `openDb(root)` — opens/creates `continuity.sqlite`, enables WAL
and foreign keys, runs inline migrations. Migration 001 defines `jobs`,
`sessions`, `events`, `schema_migrations` tables with indexes.

**Why it matters:** All event and session queries go through this module. The
schema shape (especially `events.payload_json` and `sessions.job_id` nullable)
is the contract the rest of the codebase depends on.

**Status:** active

**Last known state:** Migration 001 shipped. 20 tests pass. `payload_json`
column present but not yet populated with structured facts (DEC-006 pending).

**Related decisions:** DEC-006

**Notes:** Adding a migration means appending to the `MIGRATIONS` array with the
next version number. The runner is idempotent — safe to run on every `openDb`.

---

## ART-004 — Event writer with SQLite and JSONL fallback

**Path:** `src/core/events.ts`

**Kind:** code

**What it is:** `appendEvent()` writes to SQLite; falls back to `events.jsonl`
if DB insert fails. `readEvents()` reads from SQLite; falls back to JSONL.
JSONL import runs once on first `openDb` and renames the file to
`events.jsonl.imported`.

**Why it matters:** This is the durability layer for hook events. The fallback
means no event is lost even if the DB is unavailable. Needs the 2KB payload
guard from DEC-006 added.

**Status:** active

**Last known state:** SQLite primary, JSONL fallback implemented. `payload_json`
passed through but not yet bounded or structured per DEC-006.

**Related decisions:** DEC-004, DEC-006

**Notes:** The 2KB size guard goes in `appendEvent` before the DB insert.
