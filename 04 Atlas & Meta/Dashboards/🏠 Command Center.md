---
id: command-center
title: "\U0001F3E0 Command Center"
type: moc
status: active
created: '2026-08-31'
updated: '2026-08-31'
tags:
  - dashboard
  - moc
aliases:
  - Command Center
resume_point:
  last_explored: '2026-08-31'
  current_thought: dashboard live
  next_step: Capture to 00 Inbox
content_potential:
  suggested_format: none
  confidence_score: 0
freshness:
  type: timeless
  as_of: '2026-08-31'
  source: vault
relations: []
---

# 🏠 Command Center

> *Your workspace cockpit — auto-updated by Engine A & B. Click buttons → act live. Drag Kanban → delegate.*

```meta-bind-button
label: "📥 Capture idea"
id: capture-idea
style: primary
action:
  type: templaterCreateNote
  templateFile: "04 Atlas & Meta/Templates/T_Hyperfixation.md"
  folderPath: "00 Inbox"
  fileName: "new idea"
```

```meta-bind-button
label: "🗂️ Open Delegation Board"
id: open-kanban
style: default
action:
  type: open
  link: "04 Atlas & Meta/Dashboards/🗂️ Delegation Board.md"
```

> **Live controls (Meta Bind 1.4.15):** Buttons create/open files above. Below edit your 2 active projects inline — no need to open the notes. 

---

## 🚨 WIP Guard

```dataviewjs
const active = dv.pages().where(p => p.status === "active" && (p.type === "hyperfixation" || p.type === "content-project"));
const count = active.length;
const limit = 5;
if (count > limit) {
  dv.paragraph(`> [!WARNING] **WIP Limit Exceeded — ${count}/${limit}**\n> You have ${count} active projects. Consider parking one. See triage list below.`);
} else {
  dv.paragraph(`> [!SUCCESS] **WIP ${count}/${limit}** — Healthy. ${limit - count} slot(s) free.`);
}
dv.paragraph(`*Active projects: ${count} | Limit: ${limit} | Updated: ${new Date().toISOString().slice(0,10)}*`);
```

```dataview
TABLE status as Status, updated as Updated, resume_point.next_step as NextStep
FROM "01 Hyperfixations" OR "03 Content Lab"
WHERE status = "active"
SORT updated DESC
```

### Tasks — Next Steps Queue

```tasks
not done
sort by urgency
limit 15
```

### 🗂️ Delegation — Kanban Quick View

> Your self-delegation board: `04 Atlas & Meta/Dashboards/🗂️ Delegation Board.md` (Kanban plugin, drag to delegate) + `🗂️ Delegation Board.base` (Bases board, file-level). Every card is a [[Small Wins|Small Win]] with If-Then + 25m.

```tasks
not done
tags include #delegated
sort by urgency
limit 10
```

*Full board:* Open `🗂️ Delegation Board` → drag `Ready → Doing (WIP ≤3)` → timer 25m → dice-roll reward (Hunt/Self/Tribe per [[04 Atlas & Meta/Systems/Behavioral Loops/Behavioral Loops MOC|Behavioral Loops MOC]]). See `[[Body Doubling]]` — vaultd is your double.

---

## 📥 Inbox — Requires Triage

*Raw captures awaiting Engine A. If you see items here, run `npm run vault:engine-a -- --apply` or let the daemon handle it.*

```dataview
LIST
FROM "00 Inbox"
WHERE status = "raw" OR !type
SORT created DESC
LIMIT 20
```

> [!TIP] How triage works
> Engine A extracts `#tags`, wikilinks (double-bracket notation), entities → adds frontmatter → wraps original under `## Raw Capture` → suggests `01 Hyperfixations/` target. Run `vault:engine-a --dry-run` to preview.

---

## 🔬 Active Hyperfixations Needing Attention

```dataview
TABLE resume_point.next_step as NextStep, updated as Updated, content_potential.suggested_format as Format, content_potential.confidence_score as Confidence
FROM "01 Hyperfixations"
WHERE status = "active"
SORT updated DESC
LIMIT 10
```

### Resume Nudges (>7 days without activity)

```dataview
TABLE resume_point.last_explored as LastExplored, resume_point.current_thought as Thought, resume_point.next_step as NextStep
FROM "01 Hyperfixations"
WHERE status = "active" AND date(updated) < date(today) - dur(7 days)
SORT updated ASC
```

> [!NOTE] Coaching
> *This project has been resting for X days. Resume from last point, park, or extract key insights?* — No judgment, just options.

---

## 💎 High-Confidence Content Candidates

*Clusters with `confidence_score > 0.75` → auto-generates spec in `03 Content Lab/`*

```dataview
TABLE content_potential.suggested_format as SuggestedFormat, content_potential.confidence_score as Confidence, updated as Updated
FROM "01 Hyperfixations" OR "02 Atomic Concepts"
WHERE content_potential.confidence_score > 0.75
SORT content_potential.confidence_score DESC
LIMIT 10
```

```dataview
LIST
FROM "03 Content Lab"
WHERE status = "drafting"
SORT created DESC
LIMIT 10
```

---

## 🕸️ Link Hygiene & Orphans

### Stale Projects (>14 days, dashboard threshold)

```dataview
TABLE status as Status, updated as Updated, type as Type
FROM "01 Hyperfixations" OR "03 Content Lab"
WHERE date(updated) < date(today) - dur(14 days) AND status != "archived" AND status != "parked"
SORT updated ASC
```

### Orphan Notes (zero incoming + outgoing links)

```dataviewjs
const pages = dv.pages();
const exclude = new Set(["command-center", "knowledge-graph-intelligence", "setup-guide", "inbox-readme"]);
let orphans = [];
for (let p of pages) {
  let incoming = 0, outgoing = 0;
  // Dataview exposes file.inlinks/file.outlinks
  try {
    outgoing = p.file.outlinks.length;
    incoming = p.file.inlinks.length;
  } catch {}
  if (outgoing === 0 && incoming === 0 && !exclude.has(p.file.name.toLowerCase().replace(/\s+/g, "-"))) {
    orphans.push(p);
  }
}
if (orphans.length === 0) dv.paragraph("*No orphans — graph is healthy.*");
else dv.table(["Note", "Type", "Status"], orphans.slice(0,15).map(p => [p.file.link, p.type || "—", p.status || "—"]));
```

### Broken Links (Engine A also logs to `Logs/hygiene.json`)

```dataviewjs
// Dataview can't directly show broken links; Engine A populates Logs/hygiene.json
const hygienePath = "04 Atlas & Meta/Logs/hygiene.json";
dv.paragraph(`See \`${hygienePath}\` for broken-link report. Run \`npm run vault:check\` to refresh.`);
```

---

## 📈 Tracking — Velocity & History

### WIP & Activity over Time (Tracker)

```tracker
searchType: frontmatter
searchTarget: updated
folder: 01 Hyperfixations
startDate: 2026-08-01
endDate: 2026-12-31
line:
  title: Hyperfixation Activity
  yAxisLabel: Active Notes
  showLegend: true
```

### Tracking CSV (raw event log for Tracker)

```dataview
TABLE date as Date, title as Title, type as Type, status as Status, wip_count as WIP, event as Event
FROM "04 Atlas & Meta/Logs"
SORT date DESC
LIMIT 10
```

> Logs live in `04 Atlas & Meta/Logs/tracking.csv` (append-only, rotated at 10k rows → `tracking-YYYY.csv`). Tracker reads this CSV for charts. See `📈 Knowledge Graph Intelligence` for weekly rollup.

---

## 🛠️ Quick Actions — Live Inline Edits

> Edit your 2 active projects *without opening them* — changes write to frontmatter instantly:

**`loneliness`** — Next step: INPUT[textArea:01 Hyperfixations/loneliness.md__resume_point.next_step]  `updated: 2026-09-01`

**`narcissism-as-performance`** — Next step: INPUT[textArea:01 Hyperfixations/narcissism-as-performance.md__resume_point.next_step]

> Tip: Keep it to 1 sentence, 15m, with 📅 date — e.g. `Write 1 sentence under ## Synthesis 📅 2026-09-03`

```meta-bind-button
label: "▶️ Refresh Dataview"
id: refresh
style: default
action:
  type: command
  command: dataview:dataview-force-refresh
```

- **Delegate:** Open `🗂️ Delegation Board` → drag `To Do → Doing` (1-2 max)
- **Loops:** `[[04 Atlas & Meta/Systems/Behavioral Loops/Behavioral Loops MOC|Behavioral Loops MOC]]`
- **Health:** `npm run vault:check` / **Report:** `npm run vault:report` in `05 Backend/`

---

*Last generated by provision script. Engine A/B will keep this cockpit alive — your job is to create, not to organize.*
