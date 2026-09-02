---
id: 20260902-body-doubling
title: Body Doubling
type: atomic-concept
status: synthesized
created: '2026-09-02'
updated: '2026-09-02'
tags:
  - atomic
  - body-doubling
  - accountability
  - adhd
aliases:
  - Accountability Loop
  - Social Presence
resume_point:
  last_explored: '2026-09-02'
  current_thought: External presence as cue — vaultd is your double
  next_step: Wire 09:00 and 19:00 vaultd pings as doubling cues
content_potential:
  suggested_format: essay
  confidence_score: 0.8
freshness:
  type: timeless
  as_of: '2026-09-02'
  source: vault
relations:
  - { type: supports, target: Habit Loop }
  - { type: supports, target: Implementation Intentions }
---

# Body Doubling

## For future agent

> **Summary:** Atomic on Body Doubling — presence of other (human or system) reduces initiation friction. Status `synthesized` as of `2026-09-02`. Vaultd watcher + Inbox auto-triage + nightly reports *are* the double — use as Implementation Intention trigger.
> **Load:** Read `SOUL.md`.

## Definition

**Body Doubling (ADHD community, timeless)** — `Presence of another (person or system) → reduced initiation friction → task starts.` Not accountability (judgment), just *witnessing*. The double's quiet activity signals "we are working" — mirror neurons + social cue.

## Nuance

- Human double: co-work, silent Zoom, library. Vault double: `vaultd.ts` watching `00 Inbox` (chokidar 1.5s), `Engine A` hygiene, `Tasks` urgency queue. The vault *is* working even when you're not — seeing its `tracking.csv` entries is doubling.
- Best cue: `If vaultd reports WIP 5/5 at 09:00, then I will pick 1 Ready card for 15m`. The 09:00 ping is the double arriving.
- Not for all tasks: double helps *initiation*, not *hyperfocus* — once in flow, double fades. Use double to *start* the Pomodoro, not to sustain all 4.
- Obsidian Kanban board *is* a doubling surface: cards waiting in `Doing` stare at you like a coworker waiting.

## Connections

- Supports: [[Habit Loop]] — double is Cue
- Supports: [[Implementation Intentions]] — `If double pings, Then I act`
- Elaborates: [[Pomodoro Technique]] — double watches timer

## Examples

- Delegation: `- [ ] If 09:00 vault check shows orphans 0, then celebrate with 1 Hunt reward: read random [[Variable Reward Schedules]] link 📅 today #body-double`
- Anti-example: Working alone with no vault feedback for 7 days → no double → stall

## ADHD Self-Delegation

Delegate with double built-in: set vaultd to ping you. Future-you doesn't need willpower — vault is already there. Write tasks that *expect* the double: `If Command Center shows resume nudge (>7d), then park or do 1 small win`.

## Agent Provenance

> Synthesized 2026-09-02. Source: ADHD community + vaultd mechanism. Timeless.

---
#atomic #body-doubling #adhd #accountability
