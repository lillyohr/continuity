---
job_id: "1ded18a1-fd21-4ae7-be3b-b1344e4a73e3"
slug: "checkpoint-drafts"
last_updated: "2026-06-23"
status: complete
---

# Handoff — Checkpoint Drafts

## Goal

Implement lazy draft generation for context pack updates. `checkpoint draft`
produces a proposed update; `checkpoint apply` writes it to canonical Markdown.
Canonical files are never modified without explicit apply.

## Resume summary

- Generation happens in-session (DEC-001): CLI outputs a structured prompt,
  Claude generates the draft and writes it to `pending/`.
- Draft format: structured Markdown with per-file proposed additions (not full replacements). (DEC-002)
- `apply` is append-only — new DEC-* and ART-* entries only; never overwrites existing ones.
- Signal filter from roadmap must be baked into the generation prompt.
- Stale draft detection: compare draft timestamp to latest event in SQLite.
- No code written yet.

## Current state

Job created. Decisions being locked. No implementation started.

## Next step

Lock DEC-001 through DEC-004, then implement `checkpoint draft <slug>`.

## Plan

1. Lock decisions ← now
2. `feat: implement checkpoint draft command`
3. `feat: implement checkpoint apply command`
4. `feat: implement checkpoint ignore command`
5. `feat: add stale draft detection`
6. `test: add checkpoint draft and apply tests`

## Open questions

- What exactly does the draft file look like? (decide in DEC-002)
- Does `draft` write the file itself, or does Claude write it after reading the prompt?
- How does `apply` identify which sections to append to without clobbering existing content?

## Avoid / already rejected

- **Approach B (SDK-based generation)** — requires API key, wrong model for a plugin. (DEC-001)
- **Auto-apply** — core invariant; canonical files never modified without explicit user action.
- **Full file replacement in apply** — append-only; never overwrite existing DEC-* or ART-* entries.

## References

- ART-001: `docs/roadmap.md` — Checkpoint Drafts section with signal filter spec
- ART-002: `continuity/jobs/v1-hooks-and-attachment/DECISIONS.md` — inherited constraints (DEC-004, DEC-005, DEC-006)
- ART-003: `src/cli/checkpoint.ts` — current command (prints manual instructions; to be replaced)
