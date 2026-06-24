# Continuity Roadmap

## North Star

**Monday Morning Test:** A fresh human + fresh agent can recover the job state
in under 60 seconds and take the correct next action.

**Scope filter:** A feature belongs in core only if it improves checkpoint
quality, resume accuracy, resume speed, or trust in the resumed state.

---

## Milestones

### Manual Context Pack ✓

Prove the artifact shape. No internal state, no hooks, no auto-generation.

**Done:** `init`, `start`, `status`, `resume`, `checkpoint`. Four-file Context
Pack (INDEX, HANDOFF, DECISIONS, ARTIFACTS). Plugin skeleton. 15 unit tests.
Dogfooded on this repo.

---

### Hooks and Attachment ✓

Make the plugin alive. Establish the feedback loop.

**Done:** `attach`/`detach`, `active-job.json` lock file, hook entrypoints
(`session-start`, `stop`, `pre-compact`, `post-tool-use`), hook scripts wired
in `plugin.json` (SessionStart, Stop, PreCompact, PostToolUse), `events.jsonl`
event log, imperative PreCompact checkpoint instruction, `status` shows attached
job and event activity.

---

### SQLite Persistence ✓

Upgrade storage. Enable richer queries.

**Done:** `continuity.sqlite` with `jobs`, `sessions`, `events` tables, inline
migration runner, `PRAGMA foreign_keys = ON` + WAL mode, `start` persists job
row, `attach`/`detach` open/close session rows, JSONL import on first DB open
with JSONL fallback if DB insert fails, `status` reads event + session counts
from SQLite, 20 unit tests pass.

---

### Checkpoint Drafts

Lazy draft generation. Explicit apply.

**Adds:**
- `continuity checkpoint draft` — generate proposed Context Pack update
- `continuity checkpoint apply` — apply draft to canonical Markdown
- `continuity checkpoint ignore` — dismiss dirty window
- Draft written to `pending/checkpoint-YYYY-MM-DD-HHMM.md`
- Stale draft detection

**Key invariant:** Canonical Markdown is never overwritten without explicit apply.

**Signal filter (baked into draft generation prompt):**

A draft must only promote items that pass these tests:

- **DECISIONS:** A choice between alternatives with lasting consequences; something
  that constrains future work or would surprise a reader who only saw the code.
  Exclude: routine operations ("ran tests"), anything visible from git log,
  discussions that didn't conclude.
- **ARTIFACTS:** A completed output a future session would actually reference
  (PR, doc, deployed thing). Not visible from git history alone.
  Exclude: in-progress files, intermediate outputs, files the code already names.
- **HANDOFF:** Current goal and next step only. Not a summary of what was done.
  Exclude: anything that belongs in DECISIONS or is visible from git log.

**Acceptance criteria:**
- Draft captures current goal, new decisions, new artifacts
- Draft excludes routine ops, git-visible changes, and in-progress state
- Apply updates HANDOFF, DECISIONS, ARTIFACTS
- Stale drafts blocked with clear error
- Fresh resume improves after apply

---

### Eval Benchmark

Prove it works before investing further.

**Adds:**
- `evals/scenarios/` — 10+ realistic long-session transcripts with ground truth
- `evals/harness/` — run, score, report
- Baselines: raw transcript, compact summary, manual handoff, Continuity Context Pack
- Metrics: resume accuracy, decision preservation, next-step correctness,
  redundant work avoided

**Gate:** Do not invest in later milestones until the benchmark shows Continuity
outperforms baselines on resume accuracy and decision preservation.

---

### Exit Safety

Strengthen hooks. Protect against losing work at compaction.

**Adds:**
- PreCompact marks dirty attached job as urgent
- Stop/session-end records meaningful work without model tokens
- Hook installer (`continuity hooks install`)
- Urgency scoring separate from dirty score

---

### Compass

Human orientation. Explain-gap.

**Adds:**
- `continuity compass` — goal, state, decisions, uncertainty, next move
- `continuity explain-gap` — mistaken frame vs better frame
- Context consistency check

---

### Later (if validated by benchmark)

**Worktrail:** Chronological trace from event history. Daily trail files.

**Profile / Review:** Possible sidecars. Profile answers "how should the agent
behave?" Review answers "what did I learn?" — adjacent to but distinct from
the resume loop.

---

## What Continuity Is Not

- Not generic memory or a knowledge base
- Not a conversation logger
- Not an auto-committer to canonical Markdown
- Not a replacement for git history or commit messages

---

## Rejected / Deferred

| Idea | Status | Reason |
|------|--------|--------|
| Milestone field in Context Pack frontmatter | rejected | No supporting model until milestone commands exist |
| Auto-attach new conversations | rejected | Core invariant: unattached by default |
| Full Context Pack injected by hooks | rejected | Wrong context is worse than no context |
| Profile / Review in core before eval | deferred | Answers different question than resume loop |
