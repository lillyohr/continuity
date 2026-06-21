---
description: Resume a Continuity job from its resume files
argument-hint: <slug>
---

If no slug was provided, run `continuity status` first to show the user
their jobs, then ask which one to resume.

Once you have the slug, run:

```
continuity resume <slug>
```

Then follow the printed resume instruction exactly:
1. Read `continuity/jobs/<slug>/INDEX.md`.
2. Read `HANDOFF.md` for current goal, state, and next step.
3. Skim accepted decisions in `DECISIONS.md` for constraints.
4. Check referenced artifacts in `ARTIFACTS.md`.
5. State the current goal, current state, and next action before continuing.
6. Do not revisit items under "Avoid / already rejected" unless the user asks.
