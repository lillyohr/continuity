# Architecture

## Overview

Continuity is a Claude Code plugin + CLI that preserves AI-assisted software
work across sessions using job-scoped resume files.

The core loop:

```
init → start job → attach → work → checkpoint → resume
```

The core trust loop:

```
status → attach → hooks record activity → explicit resume → explicit apply
```

## Layout

```
continuity/              ← this repo (the plugin + CLI package)
  src/
    cli/                 ← command entry points
    core/                ← job identity, path resolution, slug, template rendering
  plugin/
    .claude-plugin/      ← Claude Code plugin manifest
    commands/            ← slash command markdown files
    hooks/scripts/       ← hook scripts (SessionStart, Stop, PreCompact, PostToolUse)
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
        pending/         ← checkpoint drafts (when available)
    .state/              ← internal state (lock file, event log, SQLite)
```

## Design decisions

**Job, not conversation or repo.** The job is the unit of continuity. A job can
span many conversations and sessions. Same repo ≠ same job. New conversations
are unattached by default — this prevents wrong context from being loaded silently.

**Markdown is the user-facing source of truth.** Internal state tracks sessions
and events; canonical context lives in the Markdown files. Wrong context is worse
than no context.

**Explicit apply.** The checkpoint workflow requires explicit user approval before
writing to canonical files. Continuity should feel like autosave + pull request,
not autocommit to main.

**Token-free dirty tracking.** Checkpoint status is derived from events, not from
model calls. Drafts are lazy — only generated on demand.

## North-star test (Monday Morning Test)

A fresh human + fresh agent can recover the job state in under 60 seconds and
take the correct next action, with fewer wrong assumptions and less repeated work
than raw chat history, /compact, or ad hoc notes.
