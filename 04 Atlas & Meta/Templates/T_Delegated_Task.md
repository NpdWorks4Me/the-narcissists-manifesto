<%*
const today = tp.date.now("YYYY-MM-DD");
const plus3 = tp.date.now("YYYY-MM-DD", 3);
const title = tp.file.title;
-%>
---
id: "<% tp.file.creation_date('YYYYMMDDHHmmss') %>-task"
title: "Task — <% title %>"
type: "task"
status: "ready"
created: "<% tp.file.creation_date('YYYY-MM-DD') %>"
updated: "<% tp.file.creation_date('YYYY-MM-DD') %>"
tags: [task, delegated, adhd]
aliases: []
due: "<% plus3 %>"
priority: medium
related_note: ""
loop: "habit-loop"
timebox: "25m"
freshness: { type: timeless, as_of: "<% today %>", source: vault }
---

# Task — <% title %>

## For future agent

> **Summary:** Delegated task using If-Then syntax for ADHD. Created `<% today %>` from kanban. Use [[Implementation Intentions]] format. Timebox `25m` + Small Wins.
> **Load:** Read `SOUL.md` + loop `[[Behavioral Loops MOC]]`.

## Delegation

> Write tasks as if to an employee: VERB + FILE + DONE + TIMEBOX

- [ ] If [cue: file/time/banner], Then [VERB] [[related_note]] until [DONE] for 25m 📅 <% plus3 %> #delegated #pomodoro
  - Cue: 
  - Action: 
  - Done: 
  - Reward (tribe/hunt/self): 

> Examples: `If I open [[hook-model]] at 10am, then draft reward checklist until 5 bullets done for 25m`

## Loop Choice

- If can't start → [[Habit Loop]] + [[Implementation Intentions]] + [[Body Doubling]]
- If can't sustain → [[Pomodoro Technique]] + [[Small Wins]]
- If can't return → [[Zeigarnik Effect]] + [[Seinfeld Chain]]
- If can't compound → [[Hook Model]] + [[Variable Reward Schedules]]

## Reward Roll

After 25m, roll: `<% Math.random().toFixed(2) %>` → Hunt (>0.66) / Self (>0.33) / Tribe
- Hunt: open random link from `[[Variable Reward Schedules]]`
- Self: check `tracking.csv` +1 or `📈 Knowledge Graph Intelligence`
- Tribe: draft 1 tweet/thread from note

## Notes

- 

## Resume

- Last: <% today %>
- Next: update `resume_point.next_step` in related note

