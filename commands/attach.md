---
description: Attach this session to a Continuity job
argument-hint: <slug>
---

If no slug was provided, first run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/index.js" status
```

Then ask the user which job to attach to. Once you have the slug:

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/index.js" attach <slug>
```

After attaching, tell the user that hooks will now auto-sync HANDOFF.md at session end.
