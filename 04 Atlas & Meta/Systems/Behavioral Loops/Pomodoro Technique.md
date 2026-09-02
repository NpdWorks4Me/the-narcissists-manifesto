---
id: 20260902-pomodoro
title: Pomodoro Technique
type: atomic-concept
status: synthesized
created: '2026-09-02'
updated: '2026-09-02'
tags:
  - atomic
  - pomodoro
  - timebox
  - adhd
  - time-blindness
aliases:
  - Timeboxing
  - 25-5
resume_point:
  last_explored: '2026-09-02'
  current_thought: Fixed interval + variable reward for time blindness
  next_step: Wire to vault research:25min and dice-roll rewards
content_potential:
  suggested_format: guide
  confidence_score: 0.8
freshness:
  type: timeless
  as_of: '2026-09-02'
  source: vault
relations:
  - { type: supports, target: Habit Loop }
  - { type: supports, target: Variable Reward Schedules }
---

# Pomodoro Technique

## For future agent

> **Summary:** Atomic on Pomodoro `25m focus → 5m rest × variable reward` for ADHD time blindness. Status `synthesized` as of `2026-09-02`. Vault already has `npm run research:25min` / `research:10min` — wire dice-roll rewards (Hunt/Self/Tribe) after each 25m.
> **Load:** Read `SOUL.md`.

## Definition

**Pomodoro Technique (Cirillo, 1980s, timeless)** — Fixed-interval loop: `25m single-task focus → 5m break → variable reward → repeat. After 4, longer break.` The timer *is* the cue, the timebox *is* urgency, the break reward *is* dopamine.

## Nuance

- ADHD time blindness needs *external* time: timer, not willpower. `25m` is short enough to start, long enough to make progress.
- Vault wiring: `npm run research:25min` (dual-track 25min + 10m harvest) already implements this for research. Extend to writing: `25m write → dice-roll reward`.
- Reward must be variable: roll: `>0.7 → Hunt: open random [[Narcissism]] link`, `>0.4 → Self: check Tracker +1`, `else → Tribe: draft 1 tweet from note`. Fixed break (scroll) is not a reward — it's a trap.
- Investment: update `resume_point.last_explored` + `tracking.csv` at break — stores value for next Pomodoro.

## Connections

- Supports: [[Habit Loop]] — timer is Cue, 25m is Routine
- Supports: [[Variable Reward Schedules]] — dice-roll is variable payoff
- Delegates to: [[Small Wins]] — guarantee break reward even if work incomplete

## Examples

- Delegation: `- [ ] If timer 25m starts, then write 2 bullets under [[hook-model]] ## Synthesis 📅 today #pomodoro`
- Anti-example: `Work 3hrs on manifesto` → no cue, no urgency, no reward → ADHD shutdown

## ADHD Self-Delegation

Delegate with timebox baked in: `- [ ] Draft [[SPEC — Dopamine Loops]] Hook for 25m until 2 sentences done 📅 today #pomodoro`. When timer dings, you *must* break and roll reward — that's the loop close.

## Agent Provenance

> Synthesized 2026-09-02. Source: Cirillo + ADHD time-blindness research. Maps to existing vault `research:25min` orchestrator.

---
#atomic #pomodoro #adhd #timebox
