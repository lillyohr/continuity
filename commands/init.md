---
description: Initialize Continuity in a project
argument-hint: [path]
---

Run in the terminal:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/index.js" init
```

If a path argument was provided, append it. After running, tell the user their next step is `continuity:start "<job name>"`.
