# Architecture

## Overview

Continuity is a Claude Code plugin + CLI that preserves AI-assisted software
work across sessions using job-scoped resume files.

The core loop:

```
init → start job → work → checkpoint → resume
```

The core trust loop:

```
status → attached/unattached → explicit resume → explicit apply
```

## Layout

```
continuity/              ← this repo (the plugin + CLI package)
  src/
    cli/                 ← command entry points
    core/                ← job identity, path resolution, slug, template rendering
  plugin/
    .claude-plugin/      ← Claude Code plugin manifest
    commands/continuity/ ← slash command markdown files
    skills/context/      ← context skill (system prompt injection)
    templates/           ← Markdown templates for Context Pack files
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
        pending/         ← checkpoint drafts (V2+)
    .state/              ← SQLite + lock file (V1+)
```

## Design decisions

**Job, not conversation or repo.** The job is the unit of continuity. A job can
span many conversations and sessions. Same repo ≠ same job. New conversations
are unattached by default — this prevents wrong context from being loaded silently.

**Markdown is the user-facing source of truth.** SQLite tracks internal state
(V1+); canonical context lives in the Markdown files. Wrong context is worse than
no context.

**Explicit apply.** The checkpoint workflow requires explicit user approval before
writing to canonical files. Continuity should feel like autosave + pull request,
not autocommit to main.

**Token-free dirty tracking.** Checkpoint status is derived from events (V1.5+),
not from model calls. Drafts are lazy — only generated on demand.

## Version roadmap

```
V0   — Manual Context Pack (current)
V1   — SQLite + explicit job attachment
V1.5 — Token-free dirty tracking via hooks
V2   — Lazy checkpoint drafts
V2.25 — Resume eval benchmark
V2.5 — PreCompact / exit safety
V3+  — Compass, Worktrail (if validated by benchmark)
```

## North-star test (Monday Morning Test)

A fresh human + fresh agent can recover the job state in under 60 seconds and
take the correct next action, with fewer wrong assumptions and less repeated work
than raw chat history, /compact, or ad hoc notes.
