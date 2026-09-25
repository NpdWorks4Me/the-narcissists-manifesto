---
id: content-readme
title: Content Lab — Pipeline Step 3
type: moc
status: active
created: '2026-09-02'
updated: '2026-09-02'
tags: [summary, meta, spec, content-project]
aliases: ["Content Lab README", "Content Pipeline"]
resume_point:
  last_explored: ''
  current_thought: ''
  next_step: ''
content_potential:
  suggested_format: none
  confidence_score: 0
freshness:
  type: dated
  as_of: '2026-09-02'
  source: vault
relations: []
---

# 📦 03 Content Lab — Pipeline Step 3

> Where finished research becomes **content specs** — the blueprint for published essays, guides, newsletter issues, and threads. This is the **3rd step** of the planning system:

> `00 Inbox` (capture) → `01 Hyperfixations` (research) → `02 Atomic Concepts` (distill) → **`03 Content Lab`** (spec) → `04 Atlas & Meta` (track) → `05 Backend` (automation)

## What lives here

- One `SPEC — <Title>.md` per publishable piece, `type: content-project`.
- **Engine B** generates a spec when a source's `confidence_score > 0.75` (from the `T_Content_Spec` template).
- Each spec carries: **Hook**, **Thesis**, **Outline**, **Source Cluster**, **Format** (essay | video | newsletter | thread | guide | podcast), and **Next Steps** (Tasks checkboxes).

## Lifecycle

1. Source becomes "ready" (confidence > 0.75) → Engine B drops `SPEC — <Title>.md`.
2. Keep **only** specs you are committed to drafting → maybe 3-5 at a time (WIP cap).
3. When a piece ships, flip `status: drafting → published` and update `freshness:`.
4. Parked or redundant specs go to `04 Atlas & Meta/Logs/` or `.trash/` — regenerate on demand, don't let them pile up.

## Commands (run from `05 Backend/`)

- `npm run vault:engine-b -- --apply` — semantic + atomic + specs
- `npm run vault:report` — regenerate Knowledge Graph Intelligence (ready ideas)

## Manual create

`Cmd+P → Templater: Insert template → T_Content_Spec`, or let Engine B generate on harvest.

## Coaching tip

> This folder is a launchpad, not a graveyard. If a spec isn't the next thing you'll draft, discard or park it — a clean Content Lab keeps your "ready to write" queue honest.
