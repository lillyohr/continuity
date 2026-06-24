# Manual Context Pack

The manual Context Pack workflow is the foundation of Continuity. It has no
automatic hooks, no internal state, and no auto-apply. Its goal is to prove
the artifact shape: can structured job-scoped Markdown files let a fresh
human + agent recover work in under 60 seconds?

## The loop

```
continuity init
continuity start "<job name>"
→ work in Claude
continuity checkpoint          ← prints per-file update instructions
→ update files with Claude, confirm with user
continuity resume <slug>       ← paste instruction into fresh session
→ fresh Claude reads INDEX.md, states current goal and next step
```

## Acceptance criteria

- `continuity init` creates `continuity/jobs/` (idempotent)
- `continuity start` creates all four Context Pack files
- `continuity status` lists known jobs
- `continuity resume <slug>` prints a resume instruction (does not dump files)
- `continuity checkpoint [slug]` prints per-file update instructions with explicit-approval guard
- A fresh Claude session can read the Context Pack and correctly state current goal and next step

## Dogfood test

To validate the loop, run it on a real job:

1. `continuity init` in a real project
2. `continuity start "<real job name>"`
3. Fill HANDOFF.md with current goal and state
4. Work in a Claude session; run `continuity checkpoint` at a natural stopping point
5. Have Claude update the Context Pack files; confirm each change
6. Open a fresh Claude conversation
7. Run `continuity resume <slug>`; paste the output into the fresh session
8. Verify: fresh Claude can state the current goal, current state, and correct next action
