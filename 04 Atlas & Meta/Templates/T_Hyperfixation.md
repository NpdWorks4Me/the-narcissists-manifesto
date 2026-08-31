---
id: "<% tp.file.creation_date('YYYYMMDDHHmmss') %>-<% tp.file.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 12) %>"
title: "<% tp.file.title %>"
type: "hyperfixation"
status: "active"
created: "<% tp.file.creation_date('YYYY-MM-DD') %>"
updated: "<% tp.file.creation_date('YYYY-MM-DD') %>"
tags: []
aliases: []
resume_point:
  last_explored: "<% tp.file.creation_date('YYYY-MM-DD') %>"
  current_thought: ""
  next_step: "Define research question and capture first sources"
content_potential:
  suggested_format: "none"
  confidence_score: 0.0
---

# <% tp.file.title %>

> [!TIP] Resume Point
> **Last explored:** `<% tp.file.creation_date('YYYY-MM-DD') %>`
> **Next step:** Define research question and capture first sources
> - [ ] Define research question for <% tp.file.title %> 📅 <% tp.date.now("YYYY-MM-DD", 7) %>

## Research Question

> What am I trying to understand? One sharp question.

-
## Raw Capture

> Paste raw clips, transcripts, bookmarks here. Engine A will preserve this block verbatim. Never delete — add synthesis below.

-
## Synthesis

> Distill patterns, contradictions, and connections. Link to [[Atomic Concepts]] as they emerge.

-
## Connections

- Links to: [[02 Atomic Concepts/]]
-

## Resume Point

| Field | Value |
|---|---|
| `last_explored` | `<% tp.file.creation_date('YYYY-MM-DD') %>` |
| `current_thought` |  |
| `next_step` | Define research question and capture first sources |

> Engine A reads `resume_point` to generate nudges if `status: active` and `updated > 7 days` without activity.

## Agent Insights

<!-- AGENT_INSIGHTS_BELOW — Engine B appends semantic links here idempotently -->
