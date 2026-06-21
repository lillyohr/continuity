# Context Pack Format

A Context Pack is four Markdown files that together let a fresh human + agent
recover a job's current state and take the correct next action.

Files live at: `continuity/jobs/<slug>/`

## INDEX.md

Entry point. Read this first. Contains:

- YAML frontmatter: `job_id`, `slug`, `title`, `created`, `status`
- Links to the other three files
- Resume sequence (5 steps)
- Current status (active / paused / blocked / complete)

## HANDOFF.md

Optimized for the 60-second resume test. Keep it short.

Sections (in order):

| Section | Purpose |
|---------|---------|
| Goal | One sentence: what this job is trying to accomplish |
| Resume summary | 3–5 bullets for fast recovery |
| Current state | What is working, what is not, where we left off |
| Next step | The single most important next action |
| Plan | Current approach and remaining steps |
| Open questions | Unresolved questions before continuing |
| Avoid / already rejected | Tried and ruled out; link DEC-* where possible |
| References | DEC-* and ART-* IDs to check before continuing |

Rules:
- Keep it current-state focused. Durable decisions go in DECISIONS.md.
- If an entry is outdated, update it — do not leave stale state.

## DECISIONS.md

Durable decisions with stable DEC-* IDs. Oldest-first, append-only.

Entry format:

```md
## DEC-001 — Title

**Status:** accepted

**Date:** 2026-06-21

**Decision:** What was decided.

**Why:** The reason, constraints, tradeoffs, and rejected alternatives.

**Consequences:** What this makes easier/harder; what future work must respect.

**Applies to:** Files, modules, behaviors, or docs affected.

**Supersedes:** none

**Superseded by:** none
```

Rules:
- Only `accepted` decisions are constraints during resume.
- Never delete. Mark overturned decisions `superseded`; add a new entry.
- Add `Superseded by: DEC-*` to the old entry.
- Do not duplicate current-state content from HANDOFF.md.

## ARTIFACTS.md

Files, outputs, references, and commands that a future session needs.
Oldest-first, ART-* IDs.

Entry format:

```md
## ART-001 — Title

**Path:** relative/path or URL

**Kind:** code | doc | command | output | research | config

**What it is:** One sentence.

**Why it matters:** Why a future session should care.

**Status:** draft | active | complete | deprecated

**Last known state:** What was true at last checkpoint.

**Related decisions:** DEC-001 or none

**Notes:** How to use or interpret it.
```

Rules:
- Do not list every changed file. Only what a future session needs.
- Prefer marking entries deprecated over deleting them.
- Reference ART-* IDs from HANDOFF.md to surface what matters now.

## Tokens substituted at job creation

| Token | Value |
|-------|-------|
| `{{JOB_ID}}` | UUID generated at job creation |
| `{{JOB_NAME}}` | The name passed to `continuity start` |
| `{{SLUG}}` | Filesystem-safe slug derived from job name |
| `{{DATE}}` | ISO date of job creation (YYYY-MM-DD) |
