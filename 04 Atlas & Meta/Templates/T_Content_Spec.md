---
id: "<% tp.file.creation_date('YYYYMMDDHHmmss') %>-spec"
title: "<% tp.file.title %>"
type: "content-project"
status: "drafting"
created: "<% tp.file.creation_date('YYYY-MM-DD') %>"
updated: "<% tp.file.creation_date('YYYY-MM-DD') %>"
tags: []
aliases: []
resume_point:
  last_explored: ""
  current_thought: ""
  next_step: "Draft hook and thesis"
content_potential:
  suggested_format: "essay"
  confidence_score: 0.0
freshness: { type: dated, as_of: "<% tp.file.creation_date('YYYY-MM-DD') %>", source: "vault" }
relations: []
---

# <% tp.file.title %>

## For future agent

> **Summary:** Content spec `<% tp.file.title %>` — pipeline artifact generated when `confidence_score > 0.75`. Mirrors voice from source hyperfixation(s). Hook/Thesis/Outline are draft scaffolding; Source Cluster lists provenance links. All claims should preserve `as of` markers from sources.
> **Load:** When drafting, read Hook + Thesis + Source Cluster. Update `freshness:` when spec ships (`published`).

> Content pipeline spec — generated when `confidence_score > 0.75`. Mirrors your voice from source notes.

## Hook

> Open with tension, question, or story. 1-2 lines.

-

## Thesis

> Single claim this piece will prove or explore.

-

## Outline

1. **Section 1 —**
   - [ ] Key point
2. **Section 2 —**
   - [ ] Key point
3. **Section 3 —**
   - [ ] CTA / next step

## Source Cluster

- Hyperfixations:
- Atomic concepts: [[]]
- Typed edges (`relations:`): `supports | contradicts | derived_from`

## Format

- Suggested: `essay | video | newsletter | thread | guide | podcast`
- Confidence: `0.0`
- Alternatives:

## Assets

- [ ] Script / draft: `03 Content Lab/`
- [ ] Thumbnail / cover
- [ ] Research links (with `as of` stamps)

## Next Steps

- [ ] Draft hook and thesis 📅 <% tp.date.now("YYYY-MM-DD", 3) %>
- [ ] Open outline and write section 1

## Freshness

> `dated` — spec reflects source state at `created`. When published, flip to `timeless` if evergreen or keep `dated`.
