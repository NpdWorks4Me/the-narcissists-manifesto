---
id: knowledge-graph-intelligence
title: "\U0001F4C8 Knowledge Graph Intelligence"
type: moc
status: active
created: '2026-08-31'
updated: '2026-08-31'
tags:
  - dashboard
  - intelligence
  - weekly
aliases:
  - KGI
resume_point:
  last_explored: '2026-08-31'
  current_thought: weekly report stub
  next_step: 'Run vault:report after first cluster forms'
content_potential:
  suggested_format: none
  confidence_score: 0
---
# 📈 Knowledge Graph Intelligence

> *Weekly synthesis by Engine B — emerging clusters, ready-to-build ideas, knowledge gaps. Generated 2026-08-31 (next: 2026-09-06). Run `npm run vault:report` manually anytime.*

**Last run:** `2026-08-31`
**Clusters found:** 1 | **Ready ideas:** 6 | **Gaps:** 0

---

## 🧠 Emerging Conceptual Clusters

1. **Cluster 1 (4 notes):** [[dopamine-loops]] · [[Variable Reward Schedules]] · [[test-variable-rewards]] · [[hook-model]]

```dataview
TABLE length(file.outlinks) as Outgoing, length(file.inlinks) as Incoming, tags as Tags
FROM "01 Hyperfixations" OR "02 Atomic Concepts"
WHERE length(file.inlinks) > 0 OR length(file.outlinks) > 0
SORT length(file.inlinks) DESC
LIMIT 15
```

---

## 💡 Ready-to-Build Content Ideas

- [[dopamine-loops]] — newsletter (conf 0.85)
- [[hook-model]] — guide (conf 0.82)
- [[test-variable-rewards]] — thread (conf 0.78)
- [[SPEC — Dopamine Loops]] — newsletter (conf 0.85)
- [[SPEC — Hook Model]] — guide (conf 0.82)
- [[SPEC — test variable rewards]] — thread (conf 0.78)

```dataview
TABLE content_potential.suggested_format as Format, content_potential.confidence_score as Confidence
FROM "01 Hyperfixations" OR "02 Atomic Concepts" OR "03 Content Lab"
WHERE content_potential.confidence_score > 0.75
SORT content_potential.confidence_score DESC
```

---

## 🕳️ Knowledge Gaps

_No gaps — graph is well connected._

```dataview
TABLE length(file.outlinks) as Links, updated as Updated, tags as Tags
FROM "01 Hyperfixations"
WHERE status = "active" AND length(file.outlinks) < 2
SORT updated ASC
LIMIT 10
```

---

## 📊 Tracker — Weekly Velocity

```tracker
searchType: frontmatter
searchTarget: updated
folder: 01 Hyperfixations
startDate: 2026-07-01
endDate: 2026-09-06
bar:
  title: Weekly Note Creation
  yAxisLabel: Notes
```

---

## 🤖 Recent Agent Insights

```dataview
LIST
FROM "01 Hyperfixations" OR "02 Atomic Concepts"
WHERE contains(file.text, "AGENT INSIGHT")
SORT updated DESC
LIMIT 10
```

---

*Method: cosine (TF-IDF+Jaccard) threshold 0.3, LLM 0.78 if key present. Clusters = connected components. Logs: `04 Atlas & Meta/Logs/`.*
