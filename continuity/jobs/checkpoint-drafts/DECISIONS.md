---
job_id: "1ded18a1-fd21-4ae7-be3b-b1344e4a73e3"
slug: "checkpoint-drafts"
last_updated: "2026-06-23"
---

# Decisions — Checkpoint Drafts

Durable decisions for this job. Each decision gets a stable DEC-* ID so it
can be referenced from HANDOFF.md, ARTIFACTS.md, and future sessions.

**Rules:**
- Entries are ordered oldest-first. Add new entries at the bottom.
- IDs are sequential: the next entry after DEC-003 is DEC-004.
- Only accepted decisions should be treated as constraints during resume.
- Never delete an entry. If a decision is overturned, mark it superseded
  and add the replacement as a new entry.
- Keep entries short. One paragraph per field is enough.
- Do not duplicate current-state content from HANDOFF.md. If a decision is
  currently constraining the work, reference its DEC-* ID from HANDOFF.md instead.

---

## DEC-001 — Draft generation happens in-session via CLI-output prompt

**Status:** accepted

**Date:** 2026-06-23

**Decision:** `continuity checkpoint draft <slug>` reads the current context
pack and recent SQLite events, then outputs a structured generation prompt to
stdout. Claude (already in session) reads that prompt, generates the draft
content, and writes it to `pending/checkpoint-YYYY-MM-DD-HHMM.md`. The CLI
does not call any LLM directly.

**Why:** Continuity is a Claude Code plugin — generation happening in-session
is the natural model. No API key required, no SDK dependency, no extra cost.
The alternative (Approach B: CLI calls Anthropic SDK directly) requires an API
key, adds a heavy dependency, and moves generation outside the session where
context is already available.

**Consequences:** `checkpoint draft` is not useful outside a Claude session.
The prompt output must be self-contained: it must include all context Claude
needs to generate a quality draft without reading additional files. The CLI
owns the signal gathering; Claude owns the synthesis.

**Applies to:** `src/cli/checkpoint.ts`

**Supersedes:** none

**Superseded by:** none

---

## DEC-002 — Draft format is structured Markdown with append-only sections

**Status:** accepted

**Date:** 2026-06-23

**Decision:** A draft file at `pending/checkpoint-YYYY-MM-DD-HHMM.md` contains
proposed additions to HANDOFF, DECISIONS, and ARTIFACTS as labelled sections.
It does not contain full file replacements. `apply` reads each section and
appends the content to the corresponding canonical file. Existing DEC-* and
ART-* entries are never modified or removed.

Draft structure:
```
## HANDOFF UPDATE
<proposed replacement for Current state, Next step, and Open questions only>

## NEW DECISIONS
<zero or more DEC-* entries to append>

## NEW ARTIFACTS
<zero or more ART-* entries to append>
```

**Why:** Full replacement risks clobbering entries the draft generator didn't
know about. Append-only is safe and idempotent if run twice. HANDOFF current
state sections are the only fields that legitimately get replaced (they describe
now, not history); DECISIONS and ARTIFACTS are always append-only.

**Consequences:** `apply` must parse the draft's labelled sections and know
which HANDOFF fields to replace vs. which to leave alone. The generation prompt
must instruct Claude to produce output in this exact structure.

**Applies to:** `src/cli/checkpoint.ts`, draft format, `pending/` directory

**Supersedes:** none

**Superseded by:** none

---

## DEC-003 — Stale draft detection blocks apply

**Status:** accepted

**Date:** 2026-06-23

**Decision:** A draft is stale if events have been recorded in SQLite after the
draft's creation timestamp. `checkpoint apply` checks the draft timestamp
against the latest event timestamp and refuses to apply a stale draft, printing
a clear error with the option to re-draft or ignore.

**Why:** A draft generated before significant new activity may no longer reflect
the current state. Applying a stale draft could overwrite HANDOFF with outdated
content. The user should re-draft or explicitly ignore.

**Consequences:** `apply` requires access to SQLite. Drafts include a
`generated_at` timestamp in frontmatter. `checkpoint ignore` bypasses the stale
check and deletes the draft.

**Applies to:** `src/cli/checkpoint.ts`

**Supersedes:** none

**Superseded by:** none

---

## DEC-004 — Signal filter is baked into the generation prompt

**Status:** accepted

**Date:** 2026-06-23

**Decision:** The generation prompt output by `checkpoint draft` includes the
signal filter rules verbatim so Claude applies them during synthesis, not after.

Rules included in every prompt:
- DECISIONS: only choices between alternatives with lasting consequences; never
  routine ops, git-visible changes, or discussions that didn't conclude.
- ARTIFACTS: only completed outputs a future session would actually reference;
  never in-progress files or things visible from git log.
- HANDOFF: current goal and next step only; never a summary of what was done.

**Why:** Injecting filter rules into the prompt is more reliable than
post-processing the draft. It prevents noisy entries from appearing in the
draft at all rather than requiring a separate review step.

**Consequences:** The generation prompt is longer but self-contained. Future
changes to the filter rules require updating the prompt template in
`checkpoint.ts`, not a separate filter module.

**Applies to:** `src/cli/checkpoint.ts` (prompt template)

**Supersedes:** none

**Superseded by:** none

---

## DEC-005 — Stale detection: SQLite-stamped generated_at, lifecycle events only

**Status:** accepted

**Date:** 2026-06-24

**Decision:** `checkpoint apply` determines staleness by comparing the checkpoint's `generated_at` (stored in SQLite before Claude writes the draft file) against lifecycle events only (`session_start`, `stop`, `pre_compact`). `post_tool_use` events are excluded.

**Why:** Two interacting problems forced this design. First, if `generated_at` were derived from the file's mtime or frontmatter, the Write tool call that creates the draft would produce a `post_tool_use` event postdating it — immediately flagging the draft as stale. Stamping `generated_at` in SQLite before the Write call prevents this. Second, even with pre-Write stamping, any subsequent `post_tool_use` (from the checkpoint skill's own tool calls) would still cause false positives. Scoping to lifecycle events eliminates that noise: lifecycle events only fire on genuine session boundaries, not within the checkpoint workflow.

**Consequences:** The `checkpoints` table stores `generated_at` and is the source of truth for stale detection — the frontmatter `generated_at` in the draft file is informational only. Future event types intended to trigger re-draft must be added to the lifecycle allowlist in `getLatestLifecycleEventTimestamp`.

**Applies to:** `src/cli/checkpoint.ts` (`getLatestLifecycleEventTimestamp`, `getLatestCheckpoint`), `src/core/migrations/002_checkpoints.sql`

**Supersedes:** none

**Superseded by:** none

---

## DEC-006 — Checkpoint trigger model and synthesis direction

**Status:** accepted

**Date:** 2026-06-24

**Decision:** Three checkpoint triggers, two synthesis modes:

| Trigger | Mode | Cost | When |
|---------|------|------|------|
| Stop | assembly (V2) | cheap | every session end |
| PreCompact | synthesis (V1 current) | expensive | context window full |
| Explicit | synthesis (V1 current) | expensive | user-requested |

PreCompact-only is too infrequent — it fires only when context fills up, which
may be once every few sessions. Stop fires on every session close and is the
right default trigger. But Stop-triggered synthesis-on-read is too expensive to
run on every session.

The solution: synthesis-on-write. PostToolUse events capture a semantic `effect`
field while context is fresh, so Stop-triggered checkpoints become cheap
query-and-assemble with no model call. PreCompact keeps the expensive synthesis
as a safety net before context loss.

Target PostToolUse payload (V2):
`{ "tool_name": "Edit", "path": "src/cli/checkpoint.ts", "effect": "fixed stale detection to use lifecycle events only" }`

**Why:** Frequent checkpoints require cheap checkpoints. Cheap checkpoints
require structured semantic facts captured at write time, not synthesized at
read time. The `effect` field is the key: it captures meaning when context is
hot, so assembly at Stop time costs nothing extra.

**Consequences:**
- V1 (current): PreCompact and explicit triggers only. Synthesis-on-read via
  `checkpoint draft`. Stop hook records an event but does not checkpoint.
- V2: Stop hook triggers lightweight assembly checkpoint. PostToolUse payloads
  include `effect` field populated during the session. `checkpoint draft` becomes
  fallback for the assembly path only.
- The `effect` field must be added to `src/cli/hook.ts` PostToolUse payload
  extraction and to `plugin/hooks/scripts/post-tool-use.js`.

**Applies to:** `plugin/hooks/scripts/stop.js`, `plugin/hooks/scripts/post-tool-use.js`,
`src/cli/hook.ts`, future checkpoint assembly logic.

**Supersedes:** DEC-005 in `v1-hooks-and-attachment` job (PreCompact initiates
checkpoint) — that decision is correct for V1 but incomplete; Stop is the
primary V2 trigger.

**Superseded by:** none
