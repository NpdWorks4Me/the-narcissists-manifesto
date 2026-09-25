---
name: obsidian-core
description: Vault OS — SOUL, CRITICAL_FACTS, index, freshness policy, AI-first
  write spec. Always load before other skills.
metadata:
  copilot-enabled-agents: opencode
---

# obsidian-core — Vault OS

**Vault:** `the-narcissists-manifesto` — `00 Inbox → 01 Hyperfixations → 02 Atomic Concepts → 03 Content Lab`

## Always-on manual
- Read `SOUL.md`, `CRITICAL_FACTS.md`, `index.md` first.
- AI-first rule: every note starts with `## For future agent` preamble + recency markers `as of YYYY-MM, source.com` + citations.
- OKM freshness: `freshness: {type: timeless|dated|pointer, as_of: YYYY-MM-DD, source}` — see `references/freshness-policy.md`.
- Never delete `## Raw Capture`. Append insights with `<!-- AGENT_INSIGHT:* -->` or `<!-- INGEST:* -->`.

## Commands (run from `05 Backend/`)
- `vault:check` / `vault:health` / `vault:freshness` — lint
- `vault:reindex` / `vault:eval` — semantic index
- `vault:reconcile` / `vault:synthesize` / `vault:heal` — nightly phases
- Nested skill `obsidian-ingest`, `obsidian-challenge`, `obsidian-emerge`, `obsidian-recall` below call into this core.

## Paths via $OBSIDIAN_VAULT_PATH or cwd.
