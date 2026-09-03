---
id: "vault-index"
title: "index — Vault Catalog (Claude reads FIRST)"
type: "moc"
status: "active"
created: "2026-08-31"
updated: "2026-09-02"
tags: [meta, index, catalog]
aliases: ["Vault Index", "Catalog"]
resume_point: { last_explored: "2026-09-01", current_thought: "index live", next_step: "keep sorted, no stale entries" }
content_potential: { suggested_format: "none", confidence_score: 0.0 }
freshness: { type: pointer, as_of: "2026-09-01", source: "vault" }
---

# index — Vault Catalog

> **Agent: read this first.** Every query starts here. Follow links, don't grep blind.

## Identity
- [[SOUL]] — who you are, voice, mission, principles
- [[CRITICAL_FACTS]] — 120-token bootstrap (always load)
- [[04 Atlas & Meta/SYSTEM_STATUS_REPORT]] — provisioning snapshot 2026-08-31

## Dashboards (live)
- [[04 Atlas & Meta/Dashboards/🏠 Command Center]] — WIP guard, inbox triage, resume nudges, tracking
- [[04 Atlas & Meta/Dashboards/📈 Knowledge Graph Intelligence]] — clusters, ready ideas, gaps (weekly)

## Pipeline
- `00 Inbox/` — [[00 Inbox/_INBOX_README]] — raw captures (Engine A triages)
- `01 Hyperfixations/` — active research: [[03 Content Lab/borderline_relationship_pain_points]], workbook/DBT summaries
- `02 Atomic Concepts/` — evergreen master notes: [[02 Atomic Concepts/_Master — Key Concepts]], [[02 Atomic Concepts/_Master — Key Terms]]
- `03 Content Lab/` — content specs (`type: content-project`)
- `04 Atlas & Meta/Templates/` — `T_Hyperfixation`, `T_Atomic_Concept`, `T_Content_Spec` (AI-first)
- `04 Atlas & Meta/Logs/` — `tracking.csv`, `hygiene.json`, `agent-insights.log`, `research/`
- `05 Backend/` — all code (`vault-engine-a/b`, `vaultd`, `report`, `research`)

## Commands (run from `05 Backend/`)
- `npm run vault:check` — health (frontmatter, links, WIP, plugins)
- `npm run vault:engine-a -- --apply` — triage inbox
- `npm run vault:engine-b -- --apply` — semantic + atomic + specs
- `npm run vault:report` — regenerate KGI
- `npm run vault:daemon` — watch mode (+ nightly 5-phase)
- `npm run research -- "idea" --max-pages 12` — dual-track harvest
- `npm run vault:reindex` — semantic index refresh
- `npm run vault:eval` — retrieval eval (recall@k/MRR)
- `npm run vault:challenge -- "idea"` / `vault:emerge` — thinking tools

## Freshness Policy
- See `wiki-narc-proof/references/freshness-policy.md` — every fact: **timeless | dated | pointer**. Violations fail `vault:health`.

> For future agent: after reading this, load `SOUL.md` + `CRITICAL_FACTS.md` preamble before answering. Updates to this file must preserve the catalog shape.
