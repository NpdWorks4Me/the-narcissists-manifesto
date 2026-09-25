---
id: "20260925-vault-audit"
title: "VAULT_AUDIT"
type: "moc"
status: "active"
created: "2026-09-25"
updated: "2026-09-25"
tags: [meta, canon, audit, ground-truth]
aliases: ["Vault Audit", "Audit", "Canon"]
resume_point: { last_explored: "2026-09-25", current_thought: "Detail half of the old CRITICAL_FACTS.md, split out to restore the ~150-token session bootstrap", next_step: "- [ ] User confirms whether narcissism-as-performance is still the flagship thesis (see §8)" }
freshness: { type: dated, as_of: "2026-09-25", source: "vault audit" }
---

# VAULT_AUDIT

> **This is the detail document. It is not loaded every session.** For the ~150-token bootstrap, read [[CRITICAL_FACTS]] first, then come here when you need to verify something.
>
> Everything below records **what is verifiably true as of 2026-09-25**, not what the project intends to become.
>
> **How to treat this file:** where this file and a stale document disagree, this file wins. Where this file and [[SOUL]] disagree, that is a known gap — see §8. If you find something here that is no longer true, **update this file in the same commit** rather than silently working around it. This is the only file in the vault allowed to be a plain state snapshot; everything else should link here rather than restate it.

---

## 1. The one-paragraph truth

The Narcissist's Manifesto began as a research pipeline for a thesis about **narcissism as performance** — `00 Inbox → 01 Hyperfixations → 02 Atomic Concepts → 03 Content Lab`, automated by a Node backend that triages, clusters, and drafts. That pipeline is now **largely dormant**, and as of 2026-09-25 the owner has confirmed narcissism-as-performance is **not** the flagship thesis. The work that actually exists and is worth continuing is a **published-adjacent pair of longform books plus an Astro site**, and a small set of therapeutic-skills drafts. As of 2026-09 the vault is a **writing-and-publishing project that still carries the scaffolding of a research pipeline it no longer runs.**

The name survives; the thesis does not. What replaces it is undecided — see §8.1. Both halves of the paragraph above are true. Do not describe this project as purely one or the other, and do not treat the old thesis as settled doctrine.

---

## 2. What actually exists (verified 2026-09-25)

### Shipped / substantially complete

| Asset | Location | State |
|---|---|---|
| *When One Person Feels Like the Answer* | `essays-articles/` | 1,664 lines, 14 chapters, **57 citation hits**, `### Research Sources` at L1632. Thesis: limerence (Tennov) as a **hope loop** where one person is assigned too many psychological jobs. Also exported as DOCX at vault root. |
| *A Collaborative Guide to Different Minds* | `essays-articles/` | 397 lines, 5 chapters + capstone. Neurodivergent relationship handbook built on Milton's **Double Empathy Problem**. **4 citation hits — effectively uncited.** DOCX at root as `neurodivergent-relationships-guide-v2.docx`. |
| *The Brakes That Hit the Gas* | `pink-parallax/` + root | Astro 7 PWA reader, 12 chapters + `glossary.md` + `sources.md` + `start-here.md`. `dist/` builds. EPUB + PUBLICATION_MASTER DOCX at vault root. |
| Backend | `05 Backend/` | Node 22 / TS / vitest. **28 npm scripts**, all `vault:*` commands functional. |

### In progress

`03 Content Lab/` holds **13 files**: three workstreams (Female Psychopathy, Wise Mind, Why Feeling Bad Can Make Some People Act Worse), each with a SPEC + Article + Promo Pack, plus a video script and one parked note.

**Nothing is published.** Status counts across the folder: `12 drafting`, `1 active` (the README), `1 parked`. The project's own rule — *"When a piece ships, flip `status: drafting → published`"* — has never fired.

### The pipeline folders are near-empty

| Folder | Markdown files |
|---|---|
| `00 Inbox` | 1 (just `_INBOX_README.md`) |
| `01 Hyperfixations` | 1 (`Workbook Tool Ideas — Master.md`) |
| `02 Atomic Concepts` | 1 (`_Master — Key Terms.md`) |
| `03 Content Lab` | 13 |
| `04 Atlas & Meta` | 94 |

The vault's weight is in `04 Atlas & Meta` (OS, logs, loops) and `05 Backend` (code) — **not** in the content pipeline the structure was designed around.

---

## 3. The sourcing ledger — read this before citing anything

This is the highest-value section in the file. The vault's cited material is **bimodal**: one genuinely well-sourced book, and a lot of confident unsourced prose.

| Work | Citation state | Verdict |
|---|---|---|
| *When One Person Feels Like the Answer* | ~30 named sources with URLs, tiered `[Direct Limerence Evidence]` / `[Adjacent Field Evidence]` / `[Safety Warning]` | **Trustworthy.** Its named frameworks (Hope Loop, Five Displacements, Trigger-to-Need Map) are explicitly disclaimed as practical syntheses, not validated instruments — preserve that disclaimer. |
| *A Collaborative Guide to Different Minds* | 4 hits, no source list | **Do not cite as authority.** Real claims (prefrontal cortex offline under flood, masking→burnout, double empathy) are presented as fact with no provenance. |
| `03 Content Lab/Article — Why Feeling Bad…` | 0 | **Unsourced.** Carries clinical claims ("narcissists feel shame but not guilt", two-group typology) with no references. |
| `SPEC — Female Psychopathy` | Partial | Prevalence figures (4.5% general population; 7.9% men / 2.9% women) attributed to Sanz-García et al. 2021, but **no inline DOI/PMID**. The SPEC's own checklist still reads `[ ] Verify citations / add direct links before publishing`. |
| *Brakes That Hit the Gas* `sources.md` | Names only | Cites Tangney, Gilligan, Lewis, Porges, Walker, Karpman, Neff, Pickard — **no titles, years, or URLs.** Unusable as references. |
| `02 Atomic Concepts/_Master — Key Terms` | Sources named per term | Real citations (Flinders, tfcbt.org, betweensessions, archive.org Linehan, dbsalliance, PMC4845754) — but see §4, the upstream files are gone. |
| `drafts/The Paradox of Loneliness.md` | 0 | **Corrupt.** 12 lines of machine scrape output with citations truncated mid-word ("Suicide is abou…lth System"). Unusable; re-source or delete. |
| `borderline_relationship_pain_points.md` | Weak | 13 links scored 0.51–0.63, mostly SEO/pop-psych (NeuroLaunch, The Azb, Psychdom), not research. Its central claim — that FP dynamics are "essentially a variable-reward system" — is an **unsourced assertion**. |

### The narcissism research pipeline produced junk

`04 Atlas & Meta/Logs/research/narcissism-as-performance_*/verification.json` was spot-checked. Entries carry `"usable": false, "reject": true` against URLs including `https://example.com/...` and `jackdanger.github.io/write/narcissistic-software.html`. The stored "claims" entry is a Wikipedia page with empty scrape markers.

**Meaning:** there is no usable primary research base for the project's own flagship thesis. Any narcissism claim you write today must be sourced fresh.

---

## 4. Broken reference chains

These are verified **absent** from the vault. Several live documents still point at them; do not chase these links.

- **`00 Inbox/inbox-*.md` (14 files) — gone.** `_Master — Key Terms.md` declares it was "synthesized from 00 Inbox/inbox-*.md (14 files)". That upstream source is unrecoverable from the vault. The glossary's citations name PDFs that no longer exist on disk.
- **`wiki-narc-proof/` — gone.** `_Master — Key Terms.md` still advertises auto-compilation into `wiki-narc-proof/wiki` via `npm run wiki:compile`. That target does not exist.
- **Driver hyperfixations — gone.** `01 Hyperfixations/{loneliness, narcissism-as-performance, audience-capture, dopamine-loops, hook-model}.md` were all deleted in the 2026-09-02 cleanup. `01 Hyperfixations/` now holds one unrelated file.
- **`02 Atomic Concepts/Narcissism.md` and `Workbook PDFs/` — gone.**
- **`📈 Knowledge Graph Intelligence.md` — gone**, though its `Live.html` export survives and still links to the deleted notes.
- **`🗂️ Delegation Board.base` — gone** (the `.md` board survives).
- **`04 Atlas & Meta/Systems/_Archive/Demo/` — gone**, though `SETUP.md` L64 still claims a README shim exists there.
- **`04 Atlas & Meta/Logs/semantic-index.json` is keyed on deleted paths** — treat retrieval results from it as invalid.
- **`pink-parallax`'s `content:split` script reads `../thebrakesthathitthegas.md`**, which does not exist at the vault root. The split pipeline cannot currently be re-run. The 12 chapter files are the surviving output.

---

## 5. The archive — and why the narcissism work is gone

`.trash/03 Content Lab/` holds **8 archived SPECs**: Narcissism, narcissism as performance, Dopamine Loops, Hook Model, Variable Reward Schedules, Variable, audience capture, test variable rewards. All `status: archived`.

The stated reasons are **triage, not rejection**:

- 5 × `"WIP cap — archived during 14→5 triage. Regenerate when [X] is committed as the next published piece."`
- `"Atomic-pair newsletter — no live driver hyperfixation."`
- `"Duplicate of [[SPEC — Variable Reward Schedules]]"`
- `"Test-stub spec for archived hyperfixation."`

**This matters:** the narcissism thesis was not abandoned as an idea — it was set aside because the WIP cap forced a choice, and the source hyperfixations were then deleted. §3 shows the research behind it never produced usable sources either. So: the thesis is *unproven and unbacked*, not *refuted*. The archived SPECs are also **empty templates** (their Thesis fields still read the placeholder `"Single claim this piece will prove."`), so there is no lost work to recover — only intent.

---

## 6. Voice canon — non-negotiable

`writer-elizabeth.md` (45 lines) defines the house voice. Treat it as binding on all published prose.

- **7th-grade reading level.** Define any clinical term immediately in plain language.
- **Compassionate Authority** — trained clinician's confidence, peer's warmth. Never condescending, never pity.
- **Normalizing** — "This is widely experienced by…", "It's not uncommon to…"
- **Paragraphs first.** Bullets only for genuinely actionable step breakdowns.
- **DON'T use emojis.** No pet names ("friend", "honey", "sweetheart"). Don't center yourself ("I've been there"). Don't be sterile.
- **Mandatory sign-off**, one of exactly two: *"Don't forget to take good care of yourself. — Elizabeth"* or *"Stay strong and take care. — Elizabeth."*

**Known violations as of 2026-09:** both files in `essays-articles/` contain emoji (💡 U+1F4A1, 🧠 U+1F9E0, ✨ U+2728, ⚠️ U+26A0, 🏛️ U+1F3DB, 🧰 U+1F9F0, 🦉 U+1F989, 📊 U+1F4CA, 📐 U+1F4D0, 📝 U+1F4DD). `03 Content Lab/Article — Wise Mind.md` is clean. Decide before publishing whether to strip or to amend the rule.

The book's deeper thesis voice — "clinical but lived-in, Sam Vaknin as anchor, no pop-psych gloss" — lives in `SOUL.md` §2. **These two voice definitions are not obviously reconciled**; see §8.

Note: `writer-elizabeth.md` is agent config, not Obsidian content, and is duplicated byte-identically in `~/Desktop/theinsanebrain/20 - playbook/` and `~/Desktop/LSWSPA-shop-release/.agent/rules/`. Edit the vault copy and the copies will drift.

---

## 7. Infrastructure

- **All backend commands run from `05 Backend/`**, never the vault root. The vault-root `package.json` contains only `open-webui` and is unrelated.
- Lint: `vault:check`, `vault:health`, `vault:freshness`. Index: `vault:reindex`, `vault:eval`. Nightly: `vault:reconcile`, `vault:synthesize`, `vault:heal`. Daemon: `vault:daemon`.
- **Freshness is machine-enforced.** `05 Backend/src/vault/lib/freshness.ts` lints only notes typed `hyperfixation`, `atomic-concept`, `content-project`, or `moc`, requiring `freshness: {type: timeless|dated|pointer, as_of, source}` and an `as of YYYY-MM` marker.
- `.opencode/skills/*` are **absolute symlinks** into `copilot/skills/`. They will break if the vault moves or is cloned elsewhere. `obsidian-recall` lives separately in `.agents/skills/`.
- `obsidian-core/SKILL.md` points at `references/freshness-policy.md`, **which does not exist** — `obsidian-core/` contains only `SKILL.md`. The real policy is `freshness.ts` (§7).
- Git history is 5 commits, all authored `manifesto-architect <architect@manifesto.local>`, ending 2026-09-02. **The most recent content work — the `_Master — Key Terms` edit and the `pink-parallax` book — is uncommitted.**
- `obsidian-core`, `obsidian-emerge`, `obsidian-ingest`, `obsidian-recall`, `obsidian-challenge` and `symposium-publish` all map to `vault:*` commands that exist. `T_Hyperfixation.md` L26 instructs reading `CRITICAL_FACTS.md` — that reference is now valid again.

---

## 8. Known contradictions — do not resolve these unilaterally

1. **RESOLVED 2026-09-25 — narcissism-as-performance is NOT the flagship.** The owner has ruled. It remains the vault's name and its origin story, but it is not the thesis to build forward from. **What replaces it is not yet decided** — the evidence in §2 points at three candidates the owner has not yet chosen between: (a) limerence and attachment dynamics, (b) neurodivergent relationships, (c) therapeutic-skill literacy (DBT / TF-CBT / Behavioural Activation). Until one is named, do not invent a new thesis. Ask.
2. **`SOUL.md` vs `writer-elizabeth.md`.** Two voice definitions, different in emphasis (Vaknin-anchored clinical vs. 7th-grade normalizing). Nothing states which governs a given piece.
3. **RESOLVED 2026-09-25 — all three meta files now exist.** `CRITICAL_FACTS.md` (bootstrap), `VAULT_AUDIT.md` (this file), and `index.md` were all rebuilt; the two documents that mandated them now resolve. *Remaining:* `obsidian-core/SKILL.md` still names `references/freshness-policy.md`, which does not exist — see §7.
4. **`_CONTENT_README.md` and `SYSTEM_STATUS_REPORT.md` are stale** — the latter claims 3 templates when 4 exist, and its §11 self-labels as a historical snapshot.
5. **`SETUP.md` and `🏠 Command Center.md` are frozen at 2026-08-31** and still describe demo data (`dopamine-loops`, `hook-model`, `audience-capture`) that was deleted.
6. **The self-delegation loop has never run.** `🗂️ Delegation Board.md` is empty apart from its setup marker; the ADHD behavioral-loop system in `04 Atlas & Meta/Systems/Behavioral Loops/` (8 notes) documents a process that produced zero cards.

---

## 9. Recommended next actions

In priority order, for a human decision:

- [ ] ~~**Answer the §8.1 thesis question**~~ **Done 2026-09-25** — narcissism-as-performance ruled out as flagship.
- [ ] **Name the replacement thesis** — pick one of the three candidates in §8.1, or state a different one. Everything else routes through this.
- [ ] ~~**Decide §8.3** — create `index.md` or repoint `SOUL.md` + `obsidian-core/SKILL.md`.~~ **Done 2026-09-25** — all three meta files exist.
- [ ] **Write `references/freshness-policy.md`** or repoint `obsidian-core/SKILL.md` at `05 Backend/src/vault/lib/freshness.ts`, which is the real policy.
- [ ] **Decide the publication question**: 12 drafts sit at `drafting`, none published. Either promote or archive.
- [ ] **Re-source or delete `drafts/The Paradox of Loneliness.md`** — it is corrupt and concerns suicide; it should not be left where an agent may quote it.
- [ ] **Decide whether to fix citations in *A Collaborative Guide to Different Minds*** or downgrade its framing to explicitly personal-essay.
- [ ] **Commit the uncommitted work** — the book and `_Master — Key Terms` are not in git.
- [ ] **Restore or re-scrape the 14 `00 Inbox` source files**, or accept that the glossary's citations are permanently unverifiable.
