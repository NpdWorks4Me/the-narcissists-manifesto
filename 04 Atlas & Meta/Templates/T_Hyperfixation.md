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
freshness: { type: dated, as_of: "<% tp.file.creation_date('YYYY-MM-DD') %>", source: "vault" }
relations: []
---

# <% tp.file.title %>

## For future agent

> **Summary:** Hyperfixation on `<% tp.file.title %>` — active research thread. Status `active` as of `<% tp.file.creation_date('YYYY-MM-DD') %>`. See `## Research Question` for sharp question, `## Raw Capture` for verbatim sources (immutable), `## Synthesis` for distilled claims with `as of` markers. Relations in frontmatter `relations:` are typed edges for graph lint.
> **Load:** Read this preamble + `SOUL.md` + `CRITICAL_FACTS.md` before synthesizing. Preserve `## Raw Capture` verbatim on rewrites.

> [!TIP] Resume Point — Self-Delegation
> **Last explored:** `<% tp.file.creation_date('YYYY-MM-DD') %>`
> **Next step:** Define research question and capture first sources
> - [ ] If I open this note, then define research question for <% tp.file.title %> for 15m until 1 sharp question under ## Research Question 📅 <% tp.date.now("YYYY-MM-DD", 3) %> #delegated
> *Loops: [[Habit Loop]] + [[Implementation Intentions]] + [[Body Doubling]] — vaultd 09:00 is your double. See [[Behavioral Loops MOC]] to pick loop.*

## Research Question

> What am I trying to understand? One sharp question.

-

## Raw Capture

> Paste raw clips, transcripts, bookmarks here. Engine A will preserve this block verbatim. Never delete — add synthesis below.

-

## Synthesis

> Distill patterns, contradictions, and connections. Link to atomic concepts (e.g. `[[Variable Reward Schedules]]`) as they emerge. Every claim needs `as of YYYY-MM, source` or `timeless`.

-

## Connections

- Links to: `02 Atomic Concepts/` (add wikilinks as you synthesize)
-

## Resume Point — Zeigarnik Fuel

| Field | Value |
|---|---|
| `last_explored` | `<% tp.file.creation_date('YYYY-MM-DD') %>` |
| `current_thought` | *Leave unfinished sentence fragment — Zeigarnik will pull you back* |
| `next_step` | If I open this note, then define research question for 15m until 1 sharp question 📅 <% tp.date.now("YYYY-MM-DD", 3) %> #delegated |

> Engine A reads `resume_point` to generate nudges if `status: active` and `updated > 7 days` without activity. Tip: end sessions with `current_thought` unfinished — `[[Zeigarnik Effect]]`. Delegation board: `🗂️ Delegation Board` → drag Ready→Doing. Every next_step is a [[Small Wins|Small Win]] (15m, 1 verb, 1 done).

## Provenance & Freshness

> `freshness:` in frontmatter is OKM-compliant: `timeless | dated | pointer`. When adding dated facts, include `as of YYYY-MM` inline. Pointer facts must include link, not copied value.

## Agent Insights

<!-- AGENT_INSIGHTS_BELOW — Engine B appends semantic links here idempotently -->
