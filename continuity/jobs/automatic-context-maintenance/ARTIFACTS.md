---
job_id: "ed8e7937-baaa-424c-8e1e-2121b2d95674"
slug: "automatic-context-maintenance"
last_updated: "2026-06-24"
---

# Artifacts — automatic context maintenance

Files, documents, outputs, commands, and references that matter for resuming
this job. Only include things a future session would actually need to know about.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after ART-001 is ART-002.
- Do not list every changed file. List only artifacts needed to resume the job.
- Prefer marking old entries deprecated instead of deleting them.
- Reference ART-* IDs from HANDOFF.md to surface what matters right now.

---

## ART-001 — Architecture doc (new design)

**Path:** docs/architecture.md

**Kind:** doc

**What it is:** Canonical description of the new Continuity architecture — Stop-first HANDOFF sync, PostToolUse flag, minimal SQLite, lifecycle hook table.

**Why it matters:** Source of truth for all implementation decisions in this job. Read before making any structural changes to hooks or schema.

**Status:** active

**Last known state:** Fully updated to reflect the locked V2 design. Describes hooks, SQLite tables, Stop hook flow, and all design decisions.

**Related decisions:** DEC-001, DEC-002

---

## ART-002 — Roadmap doc (updated milestones)

**Path:** docs/roadmap.md

**Kind:** doc

**What it is:** Internal roadmap with "Automatic Context Maintenance" milestone replacing "Checkpoint Drafts."

**Why it matters:** Defines V1 scope (Stop sync), V1.5 (PreCompact experiment), and V2 (effect fields). Check before adding scope to V1.

**Status:** active

**Last known state:** Checkpoint Drafts milestone replaced. Automatic Context Maintenance section includes acceptance criteria and V1.5/V2 deferred items.

**Related decisions:** DEC-001, DEC-002, DEC-003

---

## ART-003 — Stop-sync instruction template

**Path:** plugin/templates/hooks/stop-sync.md

**Kind:** config

**What it is:** The instruction string the Stop hook sends Claude when it blocks the session. The Stop hook reads this file at runtime and substitutes `{{SLUG}}`.

**Why it matters:** Instruction quality determines whether HANDOFF updates are useful or noisy. Must be manually dogfooded to verify DEC-003 pass criteria.

**Status:** active

**Last known state:** Written and committed. Wired into Stop hook. Not yet dogfooded — `decision: "block"` behavior unverified.

**Related decisions:** DEC-003
