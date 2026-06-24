# continuity

A Claude Code plugin that keeps AI coding sessions grounded across context resets.

---

When a Claude session ends or compacts, work state is lost. Continuity fixes this with a per-job **Context Pack** — four Markdown files that hold the current goal, state, decisions, and artifacts. The Stop hook automatically updates them at session end so the next session always resumes correctly.

## How it works

Each job has a Context Pack at `continuity/jobs/<slug>/`:

| File | Purpose |
|---|---|
| `INDEX.md` | Entry point. Read this first. |
| `HANDOFF.md` | Current goal, state, next step, open questions. Auto-updated on Stop. |
| `DECISIONS.md` | Durable decisions with `DEC-*` IDs. |
| `ARTIFACTS.md` | Files and outputs that matter, with `ART-*` IDs. |

When you end a session with edits, the Stop hook blocks and tells Claude to update `HANDOFF.md` before closing. The next session reads the Context Pack and picks up exactly where you left off.

## Install

```bash
claude plugin install github:lillyohr/continuity
```

## Setup

```bash
# In your project:
continuity init
continuity start "my job name"
continuity attach my-job-name
```

That's it. Hooks run automatically from that point.

## Per-session flow

```
attach → work → [Stop auto-syncs HANDOFF.md] → resume
```

To start a new session on an existing job:

```bash
continuity resume <slug>   # prints a re-anchor instruction — paste into Claude
```

## Commands

| Command | What it does |
|---|---|
| `continuity init` | Initialize in a project |
| `continuity start "<name>"` | Create a new job and Context Pack |
| `continuity attach <slug>` | Link this session to a job |
| `continuity detach` | Unlink |
| `continuity resume <slug>` | Print resume instruction for a fresh session |
| `continuity status` | Show attached job, edit state, active jobs |
| `continuity status --all` | Include completed jobs |
