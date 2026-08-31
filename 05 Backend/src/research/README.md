# Manifesto Research Engine — Generic for Any Idea

Self-contained automation for this notebook. Search any idea → get hyperfixation + insights, without touching `content-brain`.

## Why separate from content-brain?

- `content-brain` keeps its Y2K `y2k_psych_horror` pipeline (6 Y2K queries + 0.30 boost) as originally designed.
- This vault (`the-narcissists-manifesto`) gets a **generic** pipeline: 6 queries covering any idea, 0 thematic boost, writes directly to `01 Hyperfixations/`.

## How it works (one-shot, generic)

```
idea → 6 queries:
  1. "<idea>"
  2. "<idea> lived experience personal story"
  3. "<idea> history research archive"
  4. "<idea> tools templates resources"
  5. "<idea> criticism counter perspective"
  6. "<idea> step by step guide framework"
→ DuckDuckGo (3 per query, no API key, html parse, stub fallback) → Fetcher (cache 86400, file .cache) → scoring (weighted 0.4/0.25/0.2/0.15, no boost) → dedupe → insights.json (7 fields)
```

**No Y2KTerms, no thematic boost.** For Y2K-like research in this vault, add `--theme y2k` (future).

## Outputs (per every idea, consistent)

```
01 Hyperfixations/<slug>.md  # hyperfixation note with frontmatter, Raw Capture, Synthesis, resume_point
04 Atlas & Meta/Logs/research/<slug>_<id>/
  package.json   # counts, ranked/reference, all_assets
  insights.json  # {summary, claims[5], patterns[domains], counterpoints[3], gaps, nextQueries[3], topAssets[5]}
  report.md      # human report
```

## Usage

```bash
cd "05 Backend"

# Any idea
npm run research -- "narcissism as performance"
npm run research -- "audience capture and parasocial dynamics" --max-pages 6
npm run research -- "remote work loneliness" --no-publish  # only log, no hyperfixation

# Watch inbox for briefs (drop .md with idea as first line)
npm run research:watch

# Check health (vault + research)
npm run vault:check
```

## Examples tested

- `narcissism as performance` → 4 assets (Frontiers, PMC, Springer, lived experience) → `01 Hyperfixations/narcissism-as-performance.md` ✅
- `creator burnout portfolio` → 18 assets (content-brain) / 4-6 assets (manifesto) ✅
- `remote work loneliness and community building` → 29 assets ✅

## Future automations

This folder is the home for all manifesto automations. Next patterns to watch for:
- When you create 3+ linked hyperfixations → Engine B will auto-create `02 Atomic Concepts/` + `03 Content Lab/SPEC`
- When you edit `resume_point` → Engine A nudges after 7d
- Add new scripts under `05 Backend/src/research/` or `05 Backend/src/automations/` — keep vault root pure Markdown.

## Tech

- Node (tsx), fetch, file cache (`04 Atlas & Meta/Logs/research/.cache`), no API keys required
- Reuses vault `frontmatter` schema (type: hyperfixation, content_potential)
- Second run on same idea → cache HIT (X-Cache) → no duplicate hyperfixation (appends update instead)
