---
name: obsidian-challenge
description: Vault argues against your idea using your own history. Maps to vault:challenge.
metadata:
  copilot-enabled-agents: opencode
---

# obsidian-challenge

Your vault holds you accountable.

```bash
npm run vault:challenge -- "your idea" [--json]
```

Scans hyperfixations/atomic concepts for past failures, reversed decisions, `contradicts` edges. Ranks by TF-IDF + boost for `failed|contradicts|risk` phrasing. Returns 1-5 counterpoints with snippet + `→ revisit [[note]]` + synthesis verdict. Use before big decisions.
