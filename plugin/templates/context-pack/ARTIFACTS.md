---
job_id: "{{JOB_ID}}"
slug: "{{SLUG}}"
last_updated: "{{DATE}}"
---

# Artifacts — {{JOB_NAME}}

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

<!-- Copy this block for each new artifact. Increment the ID.

## ART-001 — Title or filename

**Path:** Relative path from project root, URL, or command.

**Kind:** code | doc | command | output | research | config

**What it is:** One sentence.

**Why it matters:** Why a future session should care.

**Status:** draft | active | complete | deprecated

**Last known state:** What was true about this artifact at last checkpoint.

**Related decisions:** DEC-001, DEC-002, or none

**Notes:** Anything important about how to use or interpret it.

-->
