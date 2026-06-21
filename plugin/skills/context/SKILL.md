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

## When resuming a job

1. Run `continuity resume <slug>` to get the resume instruction.
2. Read `INDEX.md` as the entry point.
3. Read `HANDOFF.md` to understand current goal, state, and next step.
4. Skim accepted decisions in `DECISIONS.md` for constraints.
5. Check any ART-* references in `ARTIFACTS.md`.
6. State the current goal, current state, and next action before continuing.
7. Do not revisit items under "Avoid / already rejected" unless the user asks.

## When checkpointing

Run `continuity checkpoint [slug]` to get per-file update instructions.
Then update each file as instructed. Confirm changes with the user before writing.

Rules:
- HANDOFF.md reflects current state only. Durable decisions belong in DECISIONS.md.
- DECISIONS.md is append-only. Never delete entries; mark superseded ones.
- ARTIFACTS.md lists only artifacts a future session needs. Mark old ones deprecated.
- Do not overwrite files without explicit user approval.

## CLI commands

```
continuity init [path]           Initialize in a project (default: cwd)
continuity start "<job name>"    Create a new job
continuity status                Show attached/unattached state and known jobs
continuity resume <slug>         Print resume instruction for a job
continuity checkpoint [slug]     Print checkpoint instruction for a job
```
