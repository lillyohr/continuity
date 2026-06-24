---
description: Create a new Continuity job
argument-hint: "<job name>"
---

Ask the user for a job name if not provided. Then run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/index.js" start "<job name>"
```

After running, tell the user to fill in `continuity/jobs/<slug>/HANDOFF.md` with the current goal and state, then attach with `continuity:attach <slug>`.
