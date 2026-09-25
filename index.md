---
id: "20260925-index"
title: "index"
type: "moc"
status: "active"
created: "2026-09-25"
updated: "2026-09-25"
tags: [meta, index, moc, map]
aliases: ["Index", "Vault Index", "Map"]
resume_point: { last_explored: "2026-09-25", current_thought: "Created to satisfy the mandatory pre-read in SOUL.md and obsidian-core/SKILL.md; last of the three missing meta files to be restored", next_step: "- [ ] Add dataview queries once 03 Content Lab frontmatter errors are fixed" }
freshness: { type: dated, as_of: "2026-09-25", source: "vault audit" }
---

# index

> **Navigation map of this vault.** Counts, paths, and states below are accurate *as of 2026-09, vault audit* — verify against the filesystem before relying on any number.
>
> This file tells you *where things are*. It does not tell you *what is true* — for that, read [[VAULT_AUDIT]]. It does not tell you *who to be* — for that, read [[SOUL]].
>
> **For future agent:** your read order is [[SOUL]] → [[CRITICAL_FACTS]] → this file, with [[VAULT_AUDIT]] on demand. Sections marked ⚠️ describe state that is known-broken; check `VAULT_AUDIT.md` §4 before trusting them.

---

## Start here

| File | Role | Read it for |
|---|---|---|
| [[SOUL]] | Identity | Voice, principles, project intent. **Not** a state report. |
| [[CRITICAL_FACTS]] | Session bootstrap (~150 tokens) | Load first, every session. Vault path, pipeline, WIP limit, commands, cite-or-claim rule. |
| [[VAULT_AUDIT]] | Authority on state | What exists, what is cited, what is broken, what needs a human decision. **Load on demand, not every session.** |
| `index.md` | This file | Where everything lives. |
| [[writer-elizabeth]] | Binding voice spec | Mandatory for anything published. 7th-grade level, no emojis, fixed sign-off. |

---

## The work

Three longform pieces, plus the site that serves one of them.

### Books

**[[When One Person Feels Like the Answer]]** — `essays-articles/`
14 chapters, 1,664 lines. **The best-sourced document in the vault** (~30 named URLs, tiered evidence system). Thesis: limerence as a *hope loop* where one person is assigned too many psychological jobs. Exported as `When_One_Person_Feels_Like_the_Answer.docx` at vault root.

**[[A Collaborative Guide to Different Minds]]** — `essays-articles/`
5 chapters + capstone, 397 lines. Neurodivergent relationship handbook on Milton's Double Empathy Problem. ⚠️ **Effectively uncited** — 4 citation hits, no source list. Exported as `neurodivergent-relationships-guide-v2.docx`.

**The Brakes That Hit the Gas** — `pink-parallax/src/content/book/`
12 chapters (`ch01`–`ch12`) plus `glossary.md`, `sources.md`, `start-here.md`. Exports at vault root: `The_Brakes_That_Hit_the_Gas_FINAL.epub` (two copies — `" 1"` is a duplicate), `The_Brakes_That_Hit_the_Gas_PUBLICATION_MASTER.docx`. ⚠️ `sources.md` lists authorities by name only, with no titles, years, or URLs.

### The site

**`pink-parallax/`** — Astro 7 PWA, its own git repo, base path `/brakes/`.

```
src/
├── components/   ChapterTemplate.astro + capacity-check, glossary-tip,
│                 prime-timer, safety-exit, weekly-review, workbook-field
├── content/book/ the 12 chapters + glossary + sources + start-here
├── layouts/      BookShell.astro
├── lib/          enhance-book, glossary, storage (localforage)
└── pages/        ch01–ch12.astro
```

`dist/` builds. Scripts: `dev`, `build`, `preview`, `test:pwa`, `test:a11y`, and `content:split` ⚠️ (reads `../thebrakesthathitthegas.md`, which no longer exists — the split pipeline cannot be re-run; the 12 chapter files are the surviving output).

### Drafts

`drafts/The Paradox of Loneliness.md` — ⚠️ **corrupt, do not quote.** 12 lines of raw scrape output with citations truncated mid-word. Concerns suicidal ideation and has no usable provenance. Re-source or delete.

---

## The pipeline

`00 Inbox → 01 Hyperfixations → 02 Atomic Concepts → 03 Content Lab`

⚠️ **The first three stages hold one file each.** The pipeline is largely dormant; the weight of the vault is in `04 Atlas & Meta` and `05 Backend`. Detail in `VAULT_AUDIT.md` §2.

| Stage | Files | Notes |
|---|---|---|
| `00 Inbox/` | 1 | `_INBOX_README.md` only. ⚠️ The 14 `inbox-*.md` source scrapes it once held are **gone** — unrecoverable from the vault. |
| `01 Hyperfixations/` | 1 | `Workbook Tool Ideas — Master.md` (3 app/tool ideas from the lost scrapes). ⚠️ All five original driver hyperfixations deleted. |
| `02 Atomic Concepts/` | 1 | `_Master — Key Terms.md` — the canonical glossary, 13 terms, **DBT / TF-CBT / Behavioural Activation oriented, not narcissism-oriented.** ⚠️ Its upstream sources are the lost `00 Inbox` files; it advertises compilation into a `wiki-narc-proof/` target that no longer exists. |
| `03 Content Lab/` | 13 | Three workstreams, **0 published** (12 `drafting`, 1 `parked`). See below. |

### Content Lab workstreams

Each is SPEC → Article → Promo Pack, plus extras:

- **Female Psychopathy** — [[SPEC — Female Psychopathy]] · [[Article — Female Psychopathy]] · [[Outline — Female Psychopathy]] · [[Promo Pack — Female Psychopathy]]
- **Wise Mind** — [[SPEC — Wise Mind]] · [[Article — Wise Mind]] · [[Promo Pack — Wise Mind]] · [[Script — Wise Mind (Video)]]
- **Why Feeling Bad Can Make Some People Act Worse** — [[SPEC — Why Feeling Bad Can Make Some People Act Worse]] · [[Article — Why Feeling Bad Can Make Some People Act Worse]] · [[Promo Pack — Why Feeling Bad Can Make Some People Act Worse]]
- **Parked** — `borderline_relationship_pain_points.md` (handwritten BPD essay, confidence 0.6)

⚠️ This folder holds the vault's frontmatter debt: 51 of the 110 scanned notes' errors live here, plus most of the 51 broken links. Nearly all Content Lab files are missing `freshness:` entirely.

---

## The OS — `04 Atlas & Meta/`

94 files. Dashboards, templates, logs, and the behavioral-loop system.

**Dashboards**
- `Dashboards/🏠 Command Center.md` ⚠️ **frozen at 2026-08-31**, still queries demo data that was deleted
- `Dashboards/🗂️ Delegation Board.md` ⚠️ **empty** — setup marker only; the self-delegation loop has never produced a card
- `📈 Knowledge Graph Intelligence` — the `.md` is **deleted**; only its `Live.html` export survives, still linking to removed notes

**Behavioral Loops** — `Systems/Behavioral Loops/` (8 notes + MOC)
[[Behavioral Loops MOC]] · [[Implementation Intentions]] · [[Pomodoro Technique]] · [[Seinfeld Chain]] · [[Zeigarnik Effect]] · [[Small Wins]] · [[Body Doubling]] · [[Habit Loop]]
⚠️ The MOC claims all seven loops exist as atomic concepts in `02 Atomic Concepts/`, which holds one file. `Behavior Loops MOC.md` also references a `T_Task` template that does not exist.

**Templates** — `Templates/`
[[T_Hyperfixation]] · [[T_Atomic_Concept]] · [[T_Content_Spec]] · [[T_Delegated_Task]]
⚠️ `SYSTEM_STATUS_REPORT.md` claims 3 templates; there are 4.

**Logs** — `Logs/`
`hygiene.json` (last run 2026-09-02) · `tracking.csv` (25 rows, ends 2026-09-02) · `wip-alert.md` · `triage.log` · `ingest.log` (one line, `src=https://example.com`) · `wiki-compile.log` · `agent-insights.log` (stale, 2026-08-31) · `semantic-index.json` ⚠️ **keyed on deleted paths — treat its retrieval results as invalid** · `retrieval-eval-2026-09-01.json` (recall@5 0.857)

`Logs/research/` holds **43 run directories** across 8 topics — mostly `test-*` and `*-test-*` scratch runs from 2026-08-31/09-01, then dead. ⚠️ The `narcissism-as-performance_*` verification files record `"usable": false, "reject": true`; the pipeline returned essentially nothing. Each run has a `report.md`, `verification.json`, `insights.json`, and `assets/stories/`.

**Stale docs** — [[SETUP]] ⚠️ frozen 2026-08-31, describes a `Systems/Scripts/` shim that doesn't exist · [[SYSTEM_STATUS_REPORT]] ⚠️ its §11 self-labels historical; most of its wikilinks point to deleted notes

---

## The engine — `05 Backend/`

Node 22 · TypeScript · vitest. **All `vault:*` commands run from here**, never the vault root.

```
src/
├── vault/lib/     freshness.ts (OKM linter), health.ts, frontmatter.ts
└── research/      adapters/ + lib/  (SearXNG, Crawl4AI, Freesound, Pexels)
```

**Commands** — 28 scripts in `package.json`:

| Purpose | Commands |
|---|---|
| Lint | `vault:check` · `vault:health` · `vault:freshness` |
| Index | `vault:reindex` · `vault:eval` |
| Nightly | `vault:reconcile` · `vault:synthesize` · `vault:heal` |
| Run | `vault:daemon` · `vault:engine-a` · `vault:engine-b` · `vault:report` |
| Content | `wiki:compile` · `vault:challenge` · `vault:emerge` · `vault:recall` · `vault:ingest` |
| Setup | `vault:setup` · `vault:setup-plugins` · `vault:nightly` |
| Research | `research` · `research:deep` · `research:watch` · `research:25min` · `research:10min` · `research:scrape-websites` |

⚠️ **Freshness is machine-enforced** by `src/vault/lib/freshness.ts`, which lints only `hyperfixation`, `atomic-concept`, `content-project`, and `moc` notes, requiring `freshness: {type: timeless|dated|pointer, as_of, source}` and an inline `as of YYYY-MM` marker. This is the linter that emits the `references/freshness-policy.md` pointer in its own error text — **that file does not exist**; `freshness.ts` is the real policy.

Also present: a Python venv at `05 Backend/.venv/`, plus `README.md`, `LOCAL-LLM-SETUP-SIGNOFF.md`, `src/research/README.md`.

---

## Skills

`.opencode/skills/` — 14 entries, all **absolute symlinks** into `copilot/skills/`. ⚠️ They break if the vault moves or is cloned elsewhere.

**Core:** `obsidian-core` (vault OS — mandatory entry point) · `obsidian-markdown` · `obsidian-cli` · `json-canvas` · `obsidian-bases`
**Pipeline:** `obsidian-ingest` · `obsidian-emerge` · `obsidian-challenge` · `symposium-publish`
**Research:** `copilot-web-search` · `copilot-web-fetch` · `copilot-fetch-x` · `copilot-read-pdf` · `copilot-youtube-transcript`
**Elsewhere:** `obsidian-recall` lives in `.agents/skills/`, *not* `.opencode/skills/` ⚠️

`copilot-web-*` skills require an active Copilot Plus licence; `obsidian-cli` needs the running Obsidian app.

---

## Ignore these

Not project content. Don't index it, don't quote it, don't let it inflate a search:

| Path | What it is |
|---|---|
| `05 Backend/.venv/` | Python venv. Its `seed_knowledge/wisdom_cards/` holds ~120 Chinese-language knowledge-overview files — **library data, unrelated to this project.** |
| `**/node_modules/` | Dependencies (three separate trees) |
| `.trash/` | 8 archived SPECs — Narcissism, narcissism as performance, Dopamine Loops, Hook Model, Variable Reward Schedules, Variable, audience capture, test variable rewards. All `status: archived`, most as **empty templates**. Archive reasons are WIP-cap triage, not rejection. See `VAULT_AUDIT.md` §5. |
| `05 Backend/copilot/` | Copilot conversation transcripts |
| `.claude-runs/` | Prior agent run logs |
| `copilot/` | Skill source tree (the symlink target) |
| `*.epub` / `*.docx` / `* Live.html` | Export artifacts and scratch HTML renders |

---

## Where do I look for X?

| Looking for | Go to |
|---|---|
| What's actually true right now | `VAULT_AUDIT.md` |
| Voice / style rules for writing | `writer-elizabeth.md` |
| Project intent and principles | `SOUL.md` |
| The best-sourced writing | `essays-articles/When One Person Feels Like the Answer.md` |
| Therapeutic-skill definitions (DBT, TF-CBT, BA) | `02 Atomic Concepts/_Master — Key Terms.md` |
| ADHD productivity frameworks | `04 Atlas & Meta/Systems/Behavioral Loops/` |
| The website / book reader | `pink-parallax/` |
| Note templates | `04 Atlas & Meta/Templates/` |
| Automation commands | `05 Backend/package.json` |
| Research run history | `04 Atlas & Meta/Logs/research/` |
| What got archived and why | `.trash/03 Content Lab/` + `VAULT_AUDIT.md` §5 |
| Why a link is broken | `VAULT_AUDIT.md` §4 |

---

## Keeping this file honest

`index.md` is a **map**, so it rots the moment a file moves. When you add, move, archive, or delete anything:

- **Moving or deleting a note** → update the affected line here, and check §4 of `VAULT_AUDIT.md` for now-stale inbound links.
- **Adding a pipeline stage** → add it to the pipeline table.
- **Adding a book or site** → add it under The work.
- **Changing a count** (files, chapters, drafts) → update the number.

A `[[wikilink]]` in this file that Obsidian renders as unresolved means this map is out of date — fix it in the same commit. Files that are known-absent are written in `backticks` rather than linked, deliberately, so they don't register as broken links.
