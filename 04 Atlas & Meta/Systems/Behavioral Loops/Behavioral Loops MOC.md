---
id: 20260902-loops-moc
title: Behavioral Loops MOC
type: moc
status: active
created: '2026-09-02'
updated: '2026-09-02'
tags:
  - moc
  - loops
  - adhd
  - behavioral-mechanics
aliases:
  - Loops
  - ADHD Loops
resume_point:
  last_explored: '2026-09-02'
  current_thought: 7 loops wired for self-delegation
  next_step: Use loops to shape kanban cards and resume_points
content_potential:
  suggested_format: none
  confidence_score: 0
freshness:
  type: timeless
  as_of: '2026-09-02'
  source: vault
relations: []
---

# Behavioral Loops MOC

> **Your ADHD operating system.** 7 loops + Hook core, each with a job. Pick the loop that matches the friction you feel *right now*. All are atomic concepts in `02 Atomic Concepts/` — one idea per note, linked for Engine B clustering.

## Core Loop (you already had)

- Hook Model — `Trigger → Action → Variable Reward (tribe/hunt/self) → Investment` — for *compounding* habits (4 steps). Use when you want habit to *persist*.
- [[Variable Reward Schedules]] — `Intermittent payoffs > fixed` — the reward engine inside Hook
- [[Habit Loop]] — `Cue → Routine → Reward` — minimal loop for *starting* (3 steps, no Investment). Use when you can't get started.

## 7 New Loops (2026-09-02)

| Loop | Cue → Routine → Reward | ADHD Job | When To Use | Vault Wiring |
|---|---|---|---|---|
| [[Implementation Intentions]] | `If [situation] → Then [action]` | Bypasses executive function | "I know what to do but can't start" | Write cards as `If... Then... 📅` in kanban + `resume_point.next_step` |
| [[Pomodoro Technique]] | `25m focus → 5m → dice-roll reward` | Time blindness, urgency | "3hr block paralyzes me" | `npm run research:25min`, timer + `T_Task` dice |
| [[Seinfeld Chain]] | `Daily → mark → don't break` | Loss aversion, visual dopamine | "I want streak momentum" | `Tracker` reading `tracking.csv` chain chart in Command Center |
| [[Zeigarnik Effect]] | `Open loop → intrusive nag → close` | Leverages hyperfixation | "I forget open threads" | Leave `resume_point.current_thought` unfinished; `Doing` column as open-loop display |
| [[Small Wins]] | `Tiny meaningful progress → momentum` | Overwhelm | "Task too big" | Shard to `VERB + FILE + DONE + 15m + 📅 today` — every card is a win |
| [[Body Doubling]] | `Presence → initiation` | Starting friction | "I need someone there" | `vaultd.ts` 09:00 ping + kanban board as witness |
| [[Habit Loop]] | `Cue → Routine → Reward` | Initiation minimalism | "Hook too heavy" | `Command Center` WIP banner as Cue |

## Self-Delegation Syntax (use on every kanban card)

```
- [ ] If [Cue: file/time/banner], Then [VERB] [FILE/SECTION] until [DONE] for [TIMEBOX] 📅 [DATE] #delegated
```

Example: `- [ ] If I open my active content note at 10am, then draft reward checklist until 5 bullets done for 25m 📅 2026-09-03 #delegated #pomodoro`

## Quick Pick: Which Loop When?

- **Can't start?** → Habit Loop + Implementation Intentions + Body Doubling
- **Can't sustain?** → Pomodoro + Small Wins
- **Can't return?** → Zeigarnik + Seinfeld Chain
- **Can't compound?** → Hook + Variable Rewards

## Delegation Board

- Board: `04 Atlas & Meta/Dashboards/🗂️ Delegation Board.md` (Kanban plugin) + `04 Atlas & Meta/Dashboards/🗂️ Delegation Board.base` (Bases board view)
- Columns: `Inbox → Ready → Doing (WIP ≤3) → Waiting → Done`
- WIRING: Drag card `Ready→Doing` updates `status` → `tracking.csv` → Tracker reward → vaultd sees it

## Graph

```dataview
TABLE status as Status, tags as Tags, resume_point.next_step as Next
FROM "02 Atomic Concepts"
WHERE contains(tags, "adhd") OR id = "20260902-loops-moc"
SORT updated DESC
```

---
#moc #loops #adhd
