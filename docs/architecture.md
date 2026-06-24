# Architecture

## Product statement

> **Continuity keeps AI coding sessions grounded in job state — during work and across sessions.**

It does this through two mechanisms:

- **Mid-session grounding:** A SKILL.md skill tells Claude to consult the Context Pack before consequential decisions and to re-anchor from it after compaction.
- **Lifecycle sync:** Hooks update HANDOFF.md at session boundaries so the next session always resumes from current state.

## Overview

Continuity is a Claude Code plugin + CLI that preserves AI-assisted software
work across sessions using job-scoped resume files called a Context Pack.

The core loop:

```
init → start job → attach → work → [Stop syncs HANDOFF] → resume
```

The core trust loop:

```
status → attach → Stop hook syncs HANDOFF at session end → resume from Context Pack
```

## Layout

```
continuity/              ← this repo (the plugin + CLI package)
  src/
    cli/                 ← command entry points
    core/                ← job identity, path resolution, slug, template rendering
  plugin/
    commands/            ← slash command markdown files
    hooks/scripts/       ← hook scripts (SessionStart, Stop, PreCompact, PostToolUse)
    skills/context/      ← context skill (system prompt injection)
    templates/           ← Markdown templates for Context Pack files and hook instructions
  .claude-plugin/        ← Claude Code plugin manifest (at repo root per spec)
  tests/                 ← node:test unit tests (run via tsx, not compiled)
  dist/                  ← compiled output (bin entry: dist/cli/index.js)
```

Runtime folder created inside a user's project:

```
<project>/
  continuity/
    jobs/
      <slug>/
        INDEX.md         ← entry point; read first when resuming
        HANDOFF.md       ← current goal, state, next step, open questions
        DECISIONS.md     ← durable decisions with DEC-* IDs (oldest-first)
        ARTIFACTS.md     ← files/outputs that matter, with ART-* IDs
    .state/              ← internal state (lock file, SQLite)
```

## Hooks

Four hooks fire at lifecycle boundaries:

| Hook | Purpose |
|---|---|
| SessionStart | Detect attached job; output re-anchor instruction if job is attached |
| PostToolUse | Set `has_edits = 1` on current session if tool was Edit/Write/MultiEdit |
| Stop | If attached + `has_edits` + not `stop_hook_active`: block with HANDOFF sync instruction |
| PreCompact | Deferred (V1.5): block compaction and trigger HANDOFF sync before context is lost |

### Stop hook flow

The Stop hook is the primary HANDOFF sync mechanism.

```
1. if stop_hook_active → exit 0 immediately (no logging, no DB, nothing)
2. if no attached job → exit 0
3. if has_edits = 0 → exit 0
4. set stop_sync_requested_at
5. return { "decision": "block", "reason": <sync instruction> }
```

The sync instruction tells Claude exactly what to update and what to leave alone.
Claude performs the write as normal tool use. On the next stop attempt,
`stop_hook_active = true` and the hook exits 0.

The sync instruction lives in `plugin/templates/hooks/stop-sync.md` and is
tested manually before hooks are wired, against real Context Pack files,
with explicit pass criteria.

### PostToolUse behavior

PostToolUse sets a session-level boolean only. It does not record event rows.

```
if tool_name in { Edit, Write, MultiEdit }:
  UPDATE sessions SET has_edits = 1 WHERE id = current_session_id
```

## SQLite

SQLite is used for coordination and bookkeeping. The Context Pack is the record.

| Table | Purpose |
|---|---|
| `jobs` | Job identity: job_id, slug, title, created_at |
| `sessions` | Session lifecycle: id, job_id, started_at, ended_at, has_edits, stop_sync_requested_at |

No events table. No checkpoints table. No accumulated post_tool_use rows.

## Design decisions

**Job, not conversation or repo.** The job is the unit of continuity. A job can
span many conversations and sessions. Same repo ≠ same job. New conversations
are unattached by default — this prevents wrong context from being loaded silently.

**Markdown is the user-facing source of truth.** SQLite tracks coordination state;
canonical context lives in the Markdown files. Wrong context is worse than no context.

**Lifecycle sync over explicit apply.** HANDOFF.md is updated automatically at
session end (Stop hook). The old "explicit apply" gate required user action at
every sync; it is removed. DECISIONS.md and ARTIFACTS.md remain deliberate —
Claude adds entries as part of its work following SKILL.md guidance. Auto-writing
durable constraints carries more risk than requiring a deliberate choice.

**Stop is the primary sync moment.** Stop fires when context is warm. The block
mechanism surfaces a sync instruction to Claude before the session closes.
PreCompact is the safety net for long sessions that compact before Stop fires (V1.5).

**SQLite is coordination, not a transcript.** The Context Pack is the semantic
record of the job. SQLite tracks only what cannot be derived from it: job identity
and whether the current session had meaningful edits.

**Token-free dirty tracking.** Whether to sync is determined by a boolean flag
set during the session, not by a model call. The sync cost is one tool use
(Claude writes HANDOFF); there is no pre-sync analysis step.

## North-star test (Monday Morning Test)

A fresh human + fresh agent can recover the job state in under 60 seconds and
take the correct next action, with fewer wrong assumptions and less repeated work
than raw chat history, /compact, or ad hoc notes.
