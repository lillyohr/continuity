---
name: context
description: Use Continuity to resume a job or checkpoint work in progress
---

# Continuity

Continuity preserves AI-assisted software work across sessions using job-scoped
resume files called a Context Pack. Each job has four files:

| File | Purpose |
|------|---------|
| `INDEX.md` | Entry point. Read this first when resuming. |
| `HANDOFF.md` | Current goal, state, next step, decisions in use, open questions. |
| `DECISIONS.md` | Durable decisions with stable DEC-* IDs, oldest-first. |
| `ARTIFACTS.md` | Files, outputs, and references that matter, with ART-* IDs. |

All files live at: `continuity/jobs/<slug>/`

**The context pack is the authoritative record of this job. It takes precedence
over your memory of what happened in this session. When in doubt, read the file.**

---

## When resuming a job

1. Run `continuity resume <slug>` to get the resume instruction.
2. Read `INDEX.md` as the entry point.
3. Read `HANDOFF.md` fully — goal, current state, next step, open questions.
4. Read all accepted decisions in `DECISIONS.md`. These are constraints on future work.
5. Check any ART-* references in `ARTIFACTS.md` before assuming file states.
6. State the current goal, current state, and next action before continuing.
7. Do not revisit items listed under "Avoid / already rejected" unless the user explicitly asks.

---

## During a session

**Before making any consequential decision** (architectural, structural, or one
that constrains future work): read DECISIONS.md first. The decision may already
be made. If you make a new consequential decision that will constrain future work,
append a DEC-* entry before relying on it later.

**If the work feels like it is drifting** from the original goal: stop and re-read
the Goal section of HANDOFF.md. Re-state the goal and current state before continuing.

**After compaction or at the start of a resumed session:** immediately re-read
HANDOFF.md before continuing any work. If the context pack was not updated
before compaction, update it before making further progress.

**Before assuming a file or output exists or is in a specific state:** check
ARTIFACTS.md. If it is not listed there with an active status, verify by reading
the file directly.

---

## Updating the context pack

### HANDOFF.md — update when state changes

HANDOFF.md reflects current state only. It is not a history log. Update it when:
- The current goal changes
- The approach changes significantly
- The next step changes
- A new open question appears

**Pruning rule:** If Current state has more than 5-6 entries or lines, compress
them into 2-3 sentences before adding more. HANDOFF should be readable in under
60 seconds. It is not a change log.

### DECISIONS.md — update when consequential decisions are made

A consequential decision is a choice between alternatives with lasting consequences
that would constrain future work or surprise a reader who only saw the code.

Rules:
- Append-only. Never delete, merge, or rewrite existing entries.
- If a decision is overturned, mark it superseded and add the replacement as a new entry.
- Do not record routine operations, anything visible from git log, or discussions that did not conclude.
- Assign the next sequential DEC-* ID.

### ARTIFACTS.md — update when meaningful outputs are completed

An artifact is a completed file, output, or reference that a future session
would actually need to know about.

Rules:
- Only list things a future session needs. Do not list every changed file.
- Do not rewrite existing ART-* entries. Mark status changes (deprecated, superseded) by appending to the entry.
- Do not add in-progress work. Add when complete.

---

## CLI commands

```
continuity init [path]           Initialize in a project (default: cwd)
continuity start "<job name>"    Create a new job
continuity status                Show attached/unattached state and known jobs
continuity resume <slug>         Print resume instruction for a job
continuity attach <slug>         Attach this session to a job
continuity detach                Detach from the current job
continuity checkpoint draft <slug>   Generate a checkpoint draft (synthesis prompt)
continuity checkpoint apply          Apply the pending draft to the context pack
continuity checkpoint ignore         Dismiss the pending draft without applying
```
