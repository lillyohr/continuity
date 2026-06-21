---
job_id: "{{JOB_ID}}"
slug: "{{SLUG}}"
title: "{{JOB_NAME}}"
created: "{{DATE}}"
status: active
---

# {{JOB_NAME}}

This is the entry point for this job.

## Current status

active

## Files

| File | Purpose |
|------|---------|
| [HANDOFF.md](HANDOFF.md) | Current state, next step, open questions, and avoid list |
| [DECISIONS.md](DECISIONS.md) | Durable decisions with DEC-* IDs |
| [ARTIFACTS.md](ARTIFACTS.md) | Files, docs, outputs, and references that matter |

## How to resume

1. Read `HANDOFF.md`.
2. Skim accepted decisions in `DECISIONS.md` for constraints.
3. Check referenced artifacts in `ARTIFACTS.md`.
4. State the current goal, current state, and next action before continuing.
5. Do not revisit items listed under `Avoid / already rejected` unless the user explicitly asks.
