---
job_id: "1906391a-d4ac-4c1f-b8b6-08652662d8d1"
slug: "continuity-v0-implementation"
last_updated: "2026-06-21"
---

# Artifacts — Continuity V0 Implementation

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

## ART-001 — CLI entry point

**Path:** `src/cli/index.ts`

**Kind:** code

**What it is:** The Commander program wiring — registers all five V0 commands and
sets up version, help, and unknown-command error behavior.

**Why it matters:** Starting point for understanding the CLI structure or adding
new commands. The shebang on this file is what makes the installed `continuity`
binary directly executable.

**Status:** active

**Last known state:** Registers init, start, status, resume, checkpoint. Reads
version from `package.json` at runtime. `showHelpAfterError` enabled.

**Related decisions:** DEC-001

**Notes:** `bin` in `package.json` points to `dist/cli/index.js` (compiled output).

---

## ART-002 — Plugin manifest

**Path:** `plugin/.claude-plugin/plugin.json`

**Kind:** config

**What it is:** The Claude Code plugin manifest — name, description, author. No
hooks in V0; hooks will be added in V1.5 using the inline `SessionStart`/`Stop`/
`PreCompact` format confirmed from the caveman plugin example.

**Why it matters:** Defines how Claude Code recognizes this as a plugin. Hook
format locked in here affects V1.5 implementation.

**Status:** active

**Last known state:** Contains name, description, author only. No `skills` or
`commands` fields — those appear to be auto-discovered based on real plugin examples.
`marketplace.json` sits alongside it.

**Related decisions:** none

**Notes:** Command invocation naming (e.g. `/continuity/resume` vs
`/continuity:resume`) is unverified. Needs a live Claude Code install to confirm
before documenting in the skill/command files.

---

## ART-003 — V0 dogfood procedure

**Path:** `docs/v0-manual-context-pack.md`

**Kind:** doc

**What it is:** Step-by-step procedure for validating V0 — the manual loop, acceptance
criteria, and the exact dogfood test (V0-010).

**Why it matters:** Defines what "V0 is done" means. If a fresh Claude session
can't pass the Monday Morning Test after following this procedure, V0 is not done.

**Status:** active

**Last known state:** Written and committed. Covers the full loop, what V0 does not
do, and the dogfood test steps.

**Related decisions:** DEC-004

**Notes:** The dogfood example (if committed) goes in `examples/basic/` and should
be produced by actually running this procedure, not by hand-authoring stubs.
