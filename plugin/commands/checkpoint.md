---
description: Generate and apply a checkpoint draft for a Continuity job
argument-hint: [draft|apply|ignore] [slug]
---

Run `continuity status` first if you don't know which job is attached.

**To generate a draft:**

```
continuity checkpoint draft <slug>
```

Read the output carefully. It is a generation prompt — follow it to produce
the draft content and write it to the path shown (`pending/checkpoint-*.md`).
Apply the signal filter: only include decisions with lasting consequences and
artifacts a future session would actually reference.

**To apply the draft:**

```
continuity checkpoint apply --slug <slug>
```

Show the user a summary of what changed before running this. If the draft is
stale (new activity since generation), re-draft first.

**To dismiss without applying:**

```
continuity checkpoint ignore --slug <slug>
```
