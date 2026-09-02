---
id: knowledge-graph-intelligence
title: "\U0001F4C8 Knowledge Graph Intelligence"
type: moc
status: active
created: '2026-08-31'
updated: '2026-09-02'
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
freshness:
  type: timeless
  as_of: '2026-08-31'
  source: vault
relations: []
---
# 📈 Knowledge Graph Intelligence

> *Weekly synthesis by Engine B — emerging clusters, ready-to-build ideas, knowledge gaps. Generated 2026-09-02 (next: 2026-09-06). Run `npm run vault:report` manually anytime.*

**Last run:** `2026-09-02`
**Clusters found:** 0 | **Ready ideas:** 3 | **Gaps:** 0

---

## 🧠 Emerging Conceptual Clusters

_No clusters yet. Create 3+ linked notes sharing a theme._

```dataview
TABLE length(file.outlinks) as Outgoing, length(file.inlinks) as Incoming, tags as Tags
FROM "01 Hyperfixations" OR "02 Atomic Concepts"
WHERE status = "active" AND (length(file.inlinks) > 0 OR length(file.outlinks) > 0)
SORT length(file.inlinks) DESC
LIMIT 15
```

---

## 💡 Ready-to-Build Content Ideas

- [[loneliness]] — essay (conf 0.85)
- [[narcissism-as-performance]] — guide (conf 0.82)
- [[Narcissism]] — newsletter (conf 0.85)

```dataview
TABLE content_potential.suggested_format as Format, content_potential.confidence_score as Confidence
FROM "01 Hyperfixations" OR "02 Atomic Concepts" OR "03 Content Lab"
WHERE status = "active" AND content_potential.confidence_score > 0.75
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
startDate: 2026-07-02
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
WHERE status = "active" AND contains(file.text, "AGENT INSIGHT")
SORT updated DESC
LIMIT 10
```

---

*Method: cosine (TF-IDF+Jaccard) threshold 0.3, LLM 0.78 if key present. Clusters = connected components. Logs: `04 Atlas & Meta/Logs/`.*
