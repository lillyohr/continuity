---
description: Checkpoint work in progress for a Continuity job
argument-hint: [slug]
---

If multiple jobs exist and no slug was provided, run `continuity status`
and ask the user which job to checkpoint.

Once you have the slug (or there is only one job), run:

```
continuity checkpoint <slug>
```

Then follow the printed instructions to update each file.
Confirm the proposed changes with the user before writing anything.
Do not overwrite files without explicit approval.
