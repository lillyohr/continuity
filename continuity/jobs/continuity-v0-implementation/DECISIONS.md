---
job_id: "1906391a-d4ac-4c1f-b8b6-08652662d8d1"
slug: "continuity-v0-implementation"
last_updated: "2026-06-21"
---

# Decisions — Continuity V0 Implementation

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

## DEC-001 — CLI at root; `plugin/` for Claude assets only

**Status:** accepted

**Date:** 2026-06-21

**Decision:** Keep `src/`, `dist/`, and `bin` at the repo root. Put only
Claude-plugin-facing assets under `plugin/` (manifest, command markdown,
skill, templates).

**Why:** The npm package *is* the CLI. Nesting `src/` under `plugin/` forces
awkward `rootDir`/`outDir` config and breaks the `bin` path
(`dist/cli/index.js` would become `plugin/dist/cli/index.js`). The plugin
assets reference the installed CLI binary, so they don't care where the source lives.
The handoff doc listed this as an open question; this resolves it.

**Consequences:** The `plugin/` directory is a self-contained Claude Code plugin.
The CLI reads templates from `plugin/templates/context-pack/` at runtime via a
package-relative path. The `package.json` `files` field ships both `dist/` and `plugin/`.

**Applies to:** `tsconfig.json` (`rootDir`, `outDir`), `package.json` (`bin`, `files`),
`src/core/paths.ts` (`templatesDir()`).

**Supersedes:** none

**Superseded by:** none

---

## DEC-002 — `init [projectPath]` optional, defaults to cwd

**Status:** accepted

**Date:** 2026-06-21

**Decision:** `continuity init` takes an optional path argument defaulting to
the current working directory at runtime (not at import time).

**Why:** A CLI run inside a project should not require passing its own path.
Resolving cwd at import time caused the absolute path to leak into `--help` output,
which is confusing and noisy.

**Consequences:** The action resolves `projectPath ?? process.cwd()` at call time.
The `--help` output stays clean.

**Applies to:** `src/cli/init.ts`

**Supersedes:** none

**Superseded by:** none

---

## DEC-003 — `job_id` owns identity; `context-pack.ts` is a pure writer

**Status:** accepted

**Date:** 2026-06-21

**Decision:** Job identity (UUID `job_id`, slug, collision handling) lives in
`core/job.ts`. `core/context-pack.ts` accepts a `CreateContextPackInput` object
and only writes files — it does not generate IDs.

**Why:** DEC-* and ART-* IDs namespace under `job_id`, not globally. The correct
identity is `job_id + DEC-001`, not a global `DEC-001`. Separating identity creation
from file writing makes each module testable independently and prepares for V1
SQLite persistence where `job_id` will be stored in the database.

**Consequences:** `start.ts` calls `createJobIdentity()` then `createContextPack()`.
All four template files carry `{{JOB_ID}}` in their frontmatter. The `wx` flag on
`writeFileSync` prevents silent overwrites after the directory check.

**Applies to:** `src/core/job.ts`, `src/core/context-pack.ts`, `src/core/markdown.ts`,
`plugin/templates/context-pack/*.md`

**Supersedes:** none

**Superseded by:** none

---

## DEC-004 — Monday Morning Test as scope filter; Profile/Review out of core

**Status:** accepted

**Date:** 2026-06-21

**Decision:** The north-star test is: "A fresh human + fresh agent can recover
the job state in under 60 seconds and take the correct next action." A feature
belongs in core only if it improves checkpoint quality, resume accuracy, resume
speed, or trust in the resumed state. Profile and Review are demoted to possible
future sidecars.

**Why:** Profile answers "how should the agent behave?" and Review answers "what
did I learn?" — adjacent to but not identical to "how do I resume this interrupted
job?" Pre-building V3–V6 as inevitable roadmap items risks scope creep before the
core loop is validated. The eval benchmark (V2.25) should gate further investment.

**Consequences:** Revised roadmap: V0 → V1 → V1.5 → V2 → V2.25 (eval) → V2.5 →
then Compass/Worktrail as hypotheses only. Do not add Profile or Review to the
plugin or CLI before the benchmark validates the core loop.

**Applies to:** Roadmap, plugin command files, any future feature proposals.

**Supersedes:** none

**Superseded by:** none

---

## DEC-005 — No milestone field in Context Pack frontmatter

**Status:** accepted

**Date:** 2026-06-21

**Decision:** Do not add a `milestone` field to Context Pack templates or
`TemplateVars`. Version labels (V0, V1, etc.) belong in the job goal or resume
summary as plain text, not in frontmatter.

**Why:** A `milestone: "V0"` string in frontmatter does nothing unless Continuity
has milestone-aware behavior — grouping, listing by milestone, status tracking.
The field adds conceptual surface area without improving the resume loop. The
stronger model is a milestone object (`continuity/milestones/V0.md`) that
references job slugs; that can be built later if the need is real. Jobs map to
resumable workstreams; versions are planning labels.

**Consequences:** When mentioning what version a job belongs to, write it in the
goal or resume summary as prose. If a milestone model is added later, it lives
as a separate file or command — not as a dangling string in every Context Pack.

**Applies to:** `plugin/templates/context-pack/*.md`, `src/core/markdown.ts`,
`src/core/context-pack.ts`

**Supersedes:** none

**Superseded by:** none
