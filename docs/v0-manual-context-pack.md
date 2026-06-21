# V0 — Manual Context Pack

V0 is the narrowest possible slice: a manual Context Pack workflow with no
SQLite, no hooks, no dirty tracking, and no auto-apply. Its goal is to prove
the artifact shape works before building anything else.

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
- `continuity start` creates all four Context Pack files + `pending/`
- `continuity status` lists known jobs without SQLite
- `continuity resume <slug>` prints a resume instruction (does not dump files)
- `continuity checkpoint [slug]` prints per-file update instructions with explicit-approval guard
- A fresh Claude session can read the Context Pack and correctly state current goal and next step
- No auto-generate, no auto-overwrite, no hooks

## What V0 does not do

- No SQLite or internal state
- No job attachment (new conversations are always unattached)
- No dirty tracking
- No checkpoint drafts in `pending/`
- No automatic context injection

## Dogfood test (V0-010)

To validate V0, run the full loop on a real job:

1. `continuity init` in a real project
2. `continuity start "<real job name>"`
3. Fill HANDOFF.md with current goal and state
4. Work in a Claude session; run `continuity checkpoint` at a natural stopping point
5. Have Claude update the Context Pack files; confirm each change
6. Open a fresh Claude conversation
7. Run `continuity resume <slug>`; paste the output into the fresh session
8. Verify: fresh Claude can state the current goal, current state, and correct next action

The result of this dogfood becomes the `examples/basic/` artifact.
