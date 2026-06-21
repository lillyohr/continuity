---
description: Create a new Continuity job
argument-hint: "<job name>"
---

Ask the user for a job name if not provided. Then run:

```
continuity start "<job name>"
```

After running, tell the user their next step is to fill in
`continuity/jobs/<slug>/HANDOFF.md` with the current goal and state,
then use `continuity checkpoint` to update it after meaningful progress.
