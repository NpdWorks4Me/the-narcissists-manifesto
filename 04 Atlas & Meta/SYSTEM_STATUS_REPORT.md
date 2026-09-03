---
id: "system-status-20260831"
title: "Initial System Status Report"
type: "moc"
status: "active"
created: "2026-08-31"
updated: "2026-09-02"
tags: [meta, dashboard, report]
aliases: []
resume_point: { last_explored: "2026-09-02", current_thought: "inbox/hyperfixation cleanup + broken-link sweep + wiki-narc-proof link hygiene complete", next_step: "Continue capturing to 00 Inbox; review .trash SPECs and wiki regeneration source" }
content_potential: { suggested_format: "none", confidence_score: 0.0 }
---

# ✅ System Status Report — Autonomous Obsidian Vault Architect

**Generated:** 2026-08-31 · **Updated:** 2026-09-02
**Vault:** `/Users/npdworks4me/Desktop/the-narcissists-manifesto`
**Protocol:** Section 7 — Provisioning & Setup Protocol complete (+ maintenance/cleanup protocol run 2026-09-02)

---

## 1. Folder & File Structure Created ✓

| Path | Status | Purpose |
|---|---|---|
| `00 Inbox/` | ✓ 1 note (+ `_INBOX_README`) | Landing zone for raw captures |
| `01 Hyperfixations/` | ✓ 3 demo notes | Active/parked rabbit holes |
| `02 Atomic Concepts/` | ✓ 1 note + placeholder | Evergreen building blocks |
| `03 Content Lab/` | ✓ 3 specs | Content pipeline |
| `04 Atlas & Meta/` | ✓ | System MOCs |
| `04 Atlas & Meta/Templates/` | ✓ 3 templates | Templater templates |
| `04 Atlas & Meta/Dashboards/` | ✓ 2 dashboards | Command Center + KGI |
| `04 Atlas & Meta/Scripts/` | ✓ 6 scripts + 5 libs | Engines + daemon |
| `04 Atlas & Meta/Logs/` | ✓ 4 files | Audit trails |
| `04 Atlas & Meta/Scripts/lib/` | ✓ | Shared modules |

```bash
vault-root/
├── 00 Inbox/_INBOX_README.md
├── 01 Hyperfixations/{dopamine-loops, hook-model, test-variable-rewards}.md
├── 02 Atomic Concepts/Variable Reward Schedules.md
├── 03 Content Lab/{SPEC — Dopamine Loops, SPEC — Hook Model, SPEC — test variable rewards}.md
├── 04 Atlas & Meta/
│   ├── Templates/{T_Hyperfixation, T_Atomic_Concept, T_Content_Spec}.md
│   ├── Dashboards/{🏠 Command Center, 📈 Knowledge Graph Intelligence}.md
│   ├── Scripts/{provision, health, vault-engine-a, vault-engine-b, vaultd, report, com.*.plist, lib/*}
│   ├── Logs/{tracking.csv, hygiene.json, triage.log, agent-insights.log}
│   ├── SETUP.md
│   └── SYSTEM_STATUS_REPORT.md (this file)
├── package.json + tsconfig.json + .env.example
└── .obsidian/{plugins, community-plugins.json, workspace.json}
```

**Vault health (`npm run vault:check`):** ✅ 0 errors, 1 warning (non-blocking broken links in templates — expected), 15 notes scanned, WIP 4/5 healthy.

---

## 2. Template Provisioning ✓

| Template | Frontmatter | Templater Features | Location |
|---|---|---|---|
| `T_Hyperfixation.md` | `type: hyperfixation, status: active` | `<% tp.file.creation_date %>`, title slug, 7-day Task, Raw Capture/Synthesis/Resume sections | `04 Atlas & Meta/Templates/` |
| `T_Atomic_Concept.md` | `type: atomic-concept, status: synthesized` | Definition/Nuance/Connections, source provenance | same |
| `T_Content_Spec.md` | `type: content-project, status: drafting` | Hook/Thesis/Outline/Assets, format confidence, 3-day Task | same |

Configured: `.obsidian/plugins/templater-obsidian/data.json` → `templates_folder: 04 Atlas & Meta/Templates`, folder template `00 Inbox → T_Hyperfixation`.

---

## 3. Dashboard & Command Center ✓

### `🏠 Command Center.md`
- **WIP Guard** — DataviewJS gauge (`count active` vs limit 5, banner if exceeded)
- **Inbox Triage** — `LIST FROM "00 Inbox" WHERE status="raw" OR !type`
- **Active Hyperfixations** — table with `resume_point.next_step, content_potential`
- **Resume Nudges (>7d)** — table filtering `date(updated) < today - dur(7 days)` + coaching text
- **High-Confidence Content Candidates** — `WHERE confidence_score > 0.75` + `03 Content Lab` drafting list
- **Stale (>14d), Orphans, Broken Links** — DataviewJS blocks + `Logs/hygiene.json` reference
- **Tasks Queue** — `tasks` code block `not done sort by urgency`
- **Tracker** — `tracker` block reading `Logs/tracking.csv` for velocity
- Fallback static tables generated via `vault:report` if Dataview missing

### `📈 Knowledge Graph Intelligence.md`
- Weekly stub → now populated by `vault:report` (clusters, ready ideas, gaps)
- Last run: 2026-08-31 — **Clusters: 1, Ready ideas: 6, Gaps: 0**
- Cluster 1: `[[dopamine-loops]] · [[Variable Reward Schedules]] · [[test-variable-rewards]] · [[hook-model]]`

---

## 4. Plugin Stack (Authorized) ✓

| Plugin | Version | Status | Role |
|---|---|---|---|
| **dataview** | 0.5.68 | ✓ installed | Dashboards (required) |
| **templater-obsidian** | 2.9.0 | ✓ installed | Templates (required) |
| **obsidian-tasks** | 7.18.3 | ✓ installed | Tracking: next_step Tasks, WIP queue |
| **obsidian-tracker** | 1.19.0 | ✓ installed | Tracking: velocity charts from `tracking.csv` |
| **obsidian-linter** | 1.32.0 | ✓ installed | Tracking: YAML auto-fix on save |
| **obsidian-git** | 2.32.0 | ✓ installed | Backup: auto-commit for undo |
| calendar | — | Removed (upstream deprecated) | Fallback: periodic-notes recommended if needed |

Enabled via `.obsidian/community-plugins.json` + `.obsidian/plugins/{...}/`. Restart Obsidian → Settings → Community plugins → verify 6 enabled.

### Tracking Recommendation (Best)

**Tasks + Tracker + Linter + tracking.csv** — chosen as minimal, portable, Markdown-native:

- Every engine run & file save appends to `04 Atlas & Meta/Logs/tracking.csv` (`date,note_id,title,type,status,wip_count,orphan_count,broken_links,confidence,event`)
- `Tracker` visualizes WIP/history; `Tasks` makes `resume_point.next_step` queryable; `Linter` enforces frontmatter so tracking never breaks
- No SaaS, no proprietary DB — Git gives history

---

## 5. Dual-Engine Background Capabilities — Verification

### Engine A: Meta-Tracking & System Maintenance
- **Inbox Triage:** `00 Inbox/test-variable-rewards.md` (raw dump, no frontmatter) → dry-run suggested `01 Hyperfixations/test-variable-rewards.md`, apply created file with extracted tags `[psychology, behavioral-economics, variable]` + `## Raw Capture` preserved. ✅ **PASS**
- **Resume Point Tracking:** 0 nudges currently (all `updated` today); threshold 7d tested via `Logs/resume-nudges.json`. ✅
- **Stale & Link Hygiene:** `hygiene.json` reports orphans 0, broken 9 (template folder links + demo `Behavioral Economics` stub), stale 0. Orphan detection excludes templates/dashboards. ✅
- **WIP Enforcement:** 4 active (3 hyperfixations + 1 moc) < limit 5 → healthy; alert file `Logs/wip-alert.md` only on exceed. ✅
- **Trigger:** `chokidar` watch on `00 Inbox` (debounced 1.5s) + daily 09:00 via `vaultd.ts` + `launchd` plist. ✅

Run: `npm run vault:engine-a -- --dry-run` (preview) / `--apply` (mutate)

### Engine B: Substance & Pattern Synthesis
- **Semantic Link Discovery:** TF-IDF+Jaccard (threshold 0.30 offline) found 6 pairs, injected 12 `> 🤖 **AGENT INSIGHT:**` blocks idempotently (guard `<!-- AGENT_INSIGHT:* -->`). Example: `dopamine-loops ↔ test-variable-rewards score=0.75 theme=variable`. ✅
- **Atomic Concept Extraction:** Cluster size 3 (`variable` phrase) → drafted `02 Atomic Concepts/Variable Reward Schedules.md` + backlinked to sources. Fixed spurious `> 🤖` artifact by stripping insight blocks before NLP. ✅
- **Format Matching Matrix:** Applied to 3 hyperfixations → `dopamine-loops`→`newsletter 0.85`, `hook-model`→`guide 0.82`, `test-variable-rewards`→`thread 0.78`; each updated frontmatter + generated `03 Content Lab/SPEC — *.md` when `>0.75`. ✅
- **Weekly Report:** `vault:report` overwrites KGI with clusters/ideas/gaps + Tracker bar chart. ✅

Run: `npm run vault:engine-b -- --dry-run` / `--apply`, `npm run vault:report`

---

## 6. Automation Triggers

| Trigger Event | Engine | Action | Mechanism | Status |
|---|---|---|---|---|
| New file in `00 Inbox` | A | Parse, tag, route | `chokidar` watch → `vault-engine-a` | ✅ live via `vaultd` |
| User modifies `resume_point` | A | Bump `updated`, clear nudge | `chokidar` on `01 Hyperfixations` | ✅ |
| Daily 09:00 scan | A&B | WIP, orphans, broken, semantic | `launchd` + `vaultd` `scheduleDaily()` | ✅ plist generated |
| Weekly Sunday 18:00 | B | KGI report | `vaultd` + `report.ts` | ✅ |
| Cluster >3 linked notes | B | Atomic + Spec drafts | Detected in daily scan | ✅ demo cluster 3 triggered |

**Daemon:** `04 Atlas & Meta/Scripts/vaultd.ts` — `npm run vault:daemon` (watch) or `npm run vault:daemon -- --once --dry-run` (single). Plist at `04 Atlas & Meta/Scripts/com.narcissist-manifesto.vault.plist` → copy to `~/Library/LaunchAgents/` + `launchctl load` to persist (requires approval per ask policy).

---

## 7. Execution Workflows & Coaching Principles — Enforced

- **Never Destroy Raw Capture:** Original wrapped under `## Raw Capture`, insights appended after, frontmatter prepended. ✅
- **Low-Friction Coaching:** Nudge text *"This project has been resting for 14 days. Resume from last point, park, or extract key insights?"* + WIP alert offers `park` sorted by `updated`, never auto-archives. ✅
- **Preserve Authentic Voice:** Engine B prompts include contained source excerpts; atomic `Definition` seeded from user's phrasing. ✅
- **Actionable Micro-Steps:** All `next_step` rendered as `- [ ] Open SPEC — <title> and edit section 2 📅 2026-09-07` with Tasks dates. ✅

---

## 8. Commands

```bash
npm install --cache /tmp/npm-cache   # if fresh clone (workaround for npm cache perms)
npm run vault:setup-plugins         # (re)install plugins
npm run vault:check                 # health check
npm run vault:engine-a -- --dry-run # preview triage
npm run vault:engine-a -- --apply   # apply triage + hygiene
npm run vault:engine-b -- --dry-run # preview insights
npm run vault:engine-b -- --apply   # apply insights + atomics + specs
npm run vault:report                # regenerate KGI weekly report
npm run vault:daemon                # start file watcher daemon (persistent)
npm run vault:daemon -- --once --dry-run  # single scan preview
```

Open Obsidian → verify `🏠 Command Center` renders (Dataview/Tasks/Tracker). Create new note in `00 Inbox` with raw text → within 2s daemon adds frontmatter, or run `vault:engine-a --apply`.

---

## 9. Blocks & Mitigations Applied

| Block | Mitigation Applied |
|---|---|
| Obsidian cannot run background daemons | External Node `vaultd` + `chokidar` + `launchd` plist |
| Dataview/Templater not preinstalled | Auto-fetched to `.obsidian/plugins/`; fallback static tables |
| No `OPENAI_API_KEY` | Offline TF-IDF+Jaccard (threshold 0.30) + capped confidence; upgrade path via `.env` |
| Calendar plugin deprecated (404) | Removed from stack; documented as optional periodic-notes |
| Destructive inbox moves | Default `--dry-run`, `--apply` required; raw preserved under `## Raw Capture` |
| `~/Library/LaunchAgents` needs approval | Plist generated inside vault, manual `launchctl load` instruction |
| Spurious atomic `> 🤖` | Stripped insight markers before NLP; filter `agent insight` phrase |

---

## 10. Maintenance Log — 2026-09-02 (Vault Cleanup & Link Hygiene)

Scope: content pipeline tidy-up plus a broken-link sweep across the main vault and the `wiki-narc-proof/` sub-wiki.

### 10.1 Pipeline Reorganization

- **Moved into `03 Content Lab/`:** `borderline_relationship_pain_points.md` (`01 Hyperfixations/` → `03 Content Lab/`), frontmatter `type` updated `hyperfixation` → `content-project`. Re-pointed `index.md` pipeline link to `[[03 Content Lab/borderline_relationship_pain_points]]`.
- **Archived to `.trash/03 Content Lab/` (recoverable):** 8 draft content specs — `SPEC — Dopamine Loops`, `SPEC — Hook Model`, `SPEC — Narcissism`, `SPEC — Variable Reward Schedules`, `SPEC — Variable`, `SPEC — audience capture`, `SPEC — narcissism as performance`, `SPEC — test variable rewards`.
- **Deleted notes (user-initiated, confirmed removed from active FS):** `01 Hyperfixations/{loneliness, narcissism-as-performance, personality-disorders-narcissism}.md`, `01 Hyperfixations/borderline_relationship_pain_points.md` (moved, above), `02 Atomic Concepts/Narcissism.md`. Companion `.html` scratch exports remain under `01 Hyperfixations/` (`loneliness Live.html`, `narcissism-as-performance Live.html`).
- **Empty root stubs removed:** `narcissism-as-performance.md`, `Ego-syntonic.md`, `Psychopathy.md` (0 bytes).
- **Parked dedup candidates (not yet removed):** `01 Hyperfixations/Key Concepts — Summaries.md` and `Key Terms — Definitions.md` overlap `02 Atomic Concepts/_Master — Key Concepts.md` / `_Master — Key Terms.md`.

### 10.2 Main-Vault Link Hygiene

All dangling wikilinks to the deleted notes were unlinked to plain text (prose preserved) across live user-facing files:

- `index.md` — removed stale "Key Concepts (graph hubs)" section; pipeline updated.
- `04 Atlas & Meta/Dashboards/{📈 Knowledge Graph Intelligence, 🗂️ Delegation Board}.md` — removed stale "Ready-to-Build" / deleted-note task entries.
- `04 Atlas & Meta/Logs/wip-alert.md` — cleared stale WIP references.
- `03 Content Lab/borderline_relationship_pain_points.md` — unlinked `[[compulsive-attachment-favorite-person-and-limerenc]]`, `[[loneliness]]`, `[[narcissism-as-performance]]`, `[[Narcissism]]`, `[[personality-disorders-narcissism]]`.
- `02 Atomic Concepts/_Master — Key Concepts.md`, `_Master — Key Terms.md`; `01 Hyperfixations/Workbook Tool Ideas — Master.md`.
- `04 Atlas & Meta/Systems/Behavioral Loops/*.md` — unlinked `[[hook-model]]`, `[[Hook Model]]`, `[[dopamine-loops]]`, `[[Narcissism]]`, `[[SPEC — Dopamine Loops]]`, `[[atomic-concept]]`.
- `04 Atlas & Meta/Templates/T_Delegated_Task.md` — unlinked `[[hook-model]]` / `[[Hook Model]]`.

**Loose end:** `Variable Reward Schedules` wikilinks in Behavioral Loops notes/templates still resolve to the archived note under `04 Atlas & Meta/Systems/_Archive/Demo/` — points at an archive, not a deletion.

### 10.3 `wiki-narc-proof/` Sub-Wiki Link Hygiene

- Audited the auto-compiled sub-wiki (`wiki/index.md` + `wiki/concepts/*.md`) against the active filesystem.
- **Unlinked 576 broken concept links across 90 files** (all under `wiki-narc-proof/wiki/concepts/`): `[[Title Case / space-separated]]` targets with no matching note were de-wikified to plain text; aliases (`[[target|alias]]`) preserved as the display text.
- **Preserved all valid cross-references** to existing concept notes (114 index links + 94 in-concept links retained).
- Source transcripts (`sources/yt-*`), `references/`, and `.llmwiki/` metadata untouched.
- `wiki/index.md` auto-compiled tail ("auto-compiled from 02 masters 2026-09-02") left intact.
- **Result:** 0 broken links remain in the sub-wiki (re-scan verified).

**Caveat:** the sub-wiki is auto-generated; if the generator re-emits title-case/space-separated links on the next compile, they will reappear. Worth confirming the generator only emits links to notes that exist.

---

## 11. Initial State Snapshot (2026-08-31 — historical)

- Notes: 15 scanned (7 vault-native + 3 hyperfixations + 1 atomic + 3 specs + 1 inbox routed)
- Frontmatter errors: 0
- WIP: 4/5 healthy
- Orphans: 0, Broken: 9 (non-blocking), Stale: 0
- Tracking rows: 4 (`engine-a` ×2, `engine-b` ×2)
- Ready-to-build ideas: 6 (3 hyperfixations + 3 specs >0.75)

**Next human action:** Capture a new raw idea to `00 Inbox/` — the system will triage, cluster, and propose format automatically. Or run `npm run vault:daemon` to keep watcher alive.

---

## 12. Current State (2026-09-02)

- **Content pipeline:** `00 Inbox` → `01 Hyperfixations` → `02 Atomic Concepts` → `03 Content Lab` → `04 Atlas & Meta` intact; `03 Content Lab` holds `_CONTENT_README.md` + `borderline_relationship_pain_points.md` (content-project).
- **Broken links:** main vault live files clean; `wiki-narc-proof/` sub-wiki 0 broken (576 unlinked 2026-09-02).
- **Archived (recoverable):** 8 draft content specs in `.trash/03 Content Lab/`.
- **Loose ends:** `Variable Reward Schedules` link points to an archived note; dedup candidates parked under `01 Hyperfixations/`.

**Next human action:** Capture a new raw idea to `00 Inbox/` (system will triage). Optionally review/recover `.trash/03 Content Lab/` SPECs or reconcile the dedup master notes.

---

*System Status Report — Provisioning & Setup Protocol complete per Section 3; maintenance/cleanup protocol run 2026-09-02. Historical snapshot (2026-08-31) preserved under Section 11. Engines live. Vault is autonomous.*
