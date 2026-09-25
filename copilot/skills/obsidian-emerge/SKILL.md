---
name: obsidian-emerge
description: Surfaces unnamed patterns from last 30 days. Maps to vault:emerge.
metadata:
  copilot-enabled-agents: opencode
---

# obsidian-emerge

```bash
npm run vault:emerge [--days 30] [--json]
```

Scans notes updated in window, counts phrase/tag co-occurrence ≥2/3 notes. Reports patterns without a dedicated atomic concept. Suggests `Create [[phrase]] atomic?`. Promote with `vault:synthesize --apply`.
