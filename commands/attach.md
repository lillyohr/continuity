---
description: Attach this session to a Continuity job
argument-hint: <slug>
---

If no slug was provided, first run:

```bash
continuity status
```

Then ask the user which job to attach to. Once you have the slug:

```bash
continuity attach <slug>
```

After attaching, tell the user that hooks will now auto-sync HANDOFF.md at session end.
