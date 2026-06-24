---
description: Detach this session from its current Continuity job
---

Run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/index.js" detach
```

Report the output to the user. If they were attached to a job, remind them that hooks will no longer record activity until they attach again.
