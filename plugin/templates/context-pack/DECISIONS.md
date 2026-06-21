---
job_id: "{{JOB_ID}}"
slug: "{{SLUG}}"
last_updated: "{{DATE}}"
---

# Decisions — {{JOB_NAME}}

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

<!-- Copy this block for each new decision. Increment the ID.

## DEC-001 — Title

**Status:** proposed | accepted | superseded | rejected

**Date:** YYYY-MM-DD

**Decision:** What was decided.

**Why:** The reason, constraints, tradeoffs, and rejected alternatives.

**Consequences:** What this makes easier/harder, or what future work must respect.

**Applies to:** Files, modules, behaviors, or docs affected.

**Supersedes:** DEC-000 or none

**Superseded by:** DEC-000 or none

-->
