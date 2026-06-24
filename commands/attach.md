---
description: Attach this session to a Continuity job
argument-hint: <slug>
---

Run the following command, replacing `<slug>` with the argument provided:

```
continuity attach <slug>
```

If no slug was provided, first run `continuity status` to list available jobs,
then ask the user which job to attach to.

After attaching, tell the user they are now tracking that job and that hooks
will record activity against it until they run `continuity detach`.
