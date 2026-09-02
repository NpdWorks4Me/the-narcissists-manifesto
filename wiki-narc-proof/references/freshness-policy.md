# OKM — Open Knowledge Metabolism: Freshness Policy

> **One-page spec.** Enforcement via `npm run vault:health` + `npm run vault:freshness`.
> Companion to storage: OKF standardizes *how* agent knowledge is written, OKM keeps it *true*.

## The Rule

**Every stored fact must be exactly one of:**

1. **timeless** — how things work, definitions, frameworks, decisions, ownership. No expiry.
   - *Example:* `Variable rewards intermittent > fixed for habit formation.` → timeless
2. **dated** — any fact that can change, with `as of YYYY-MM` + source domain inline + `freshness.as_of`.
   - *Example:* `Sam Vaknin has 1.2M YouTube subs as of 2026-08, youtube.com.` → `freshness: {type: dated, as_of: 2026-08-01, source: youtube.com}`
3. **pointer** — fast-changing value stored elsewhere; we store *link*, never the value.
   - *Example:* `See tracking.csv for current WIP.` → `freshness: {type: pointer, source: 04 Atlas & Meta/Logs/tracking.csv}`

## Frontmatter Contract

```yaml
freshness:
  type: timeless | dated | pointer   # required on type hyperfixation|atomic-concept|content-project|moc
  as_of: "2026-09-01"                 # YYYY-MM-DD, required if dated, optional if timeless
  source: "vault | domain.com | path" # where truth lives
```

- `timeless` → `as_of` = creation date, `source: vault` ok
- `dated` → must have `as_of` and inline `as of YYYY-MM, domain` in body
- `pointer` → `source` must be a link/path, body must not duplicate the value

## Lint Rules (enforced)

- Missing `freshness` on vault notes → error
- `dated` without `as_of` or without inline `as of` marker → warning
- `pointer` where body contains a copy-pasted number that belongs at source → warning
- `timeless` containing obvious time-bound phrasing (`currently`, `as of`, `latest`) → warning
- Typed edges in `relations:` must be `supports|contradicts|elaborates|example_of|derived_from` and targets must exist

## Bi-temporal Extension

Each edit records *two* times:
- **valid time** — when fact was true (`freshness.as_of`)
- **transaction time** — when vault learned it (`updated` field)

History is `git log` + `tracking.csv`. Never overwrite without updating `updated`.

## Where It Runs

- `05 Backend/src/vault/lib/frontmatter.ts` — schema validation
- `05 Backend/src/vault/health.ts` — typed-edge lint + freshness violations
- `05 Backend/src/vault/lib/freshness.ts` — `lintFreshness(content, data) → violations[]`
- `npm run vault:health` — fails on freshness errors
- `npm run vault:freshness` — alias to health's freshness section

## Grace

Templates ship compliant (`T_Hyperfixation` → dated, `T_Atomic_Concept` → timeless, `T_Content_Spec` → dated). Engine B sets freshness on generation. Existing notes without `freshness` are backfilled as `timeless` with a warning, not an error, for 30 days (until 2026-10-01), then error.

---

*Spec version: 1.0 — 2026-09-01 — ported from obsidian-second-brain OKM.*
