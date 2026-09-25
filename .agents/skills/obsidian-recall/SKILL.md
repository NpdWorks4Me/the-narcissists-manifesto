---
name: obsidian-recall
description: Bounded vault recall — max 4 notes, ~900 chars, abstain if low confidence. Maps to vault:recall.
---

# obsidian-recall

```bash
npm run vault:recall -- "prompt" [--json]
npm run vault:recall -- --hook-install  # writes 05 Backend/hooks/recall.hook.example.json
```

Opt-in via `OBSIDIAN_RECALL_ENABLED=1`. Injects brief on `UserPromptSubmit` hook, logs to `.claude-runs/recall.log`. Fail-closed, read-only. Threshold 0.12 — abstains rather than hallucinate.
