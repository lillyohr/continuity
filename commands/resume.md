---
description: Resume a Continuity job from its context files
argument-hint: <slug>
---

If no slug was provided, first run:

```bash
continuity status
```

Then ask the user which job to resume. Once you have the slug:

```bash
continuity resume <slug>
```

Then follow the printed resume instruction exactly:
1. Read `continuity/jobs/<slug>/INDEX.md`.
2. Read `HANDOFF.md` for current goal, state, and next step.
3. Skim accepted decisions in `DECISIONS.md` for constraints.
4. Check referenced artifacts in `ARTIFACTS.md`.
5. State the current goal, current state, and next action before continuing.
6. Do not revisit items under "Avoid / already rejected" unless the user asks.
