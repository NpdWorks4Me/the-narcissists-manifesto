---
id: "inbox-readme"
title: "Inbox — Landing Zone"
type: "moc"
status: "active"
created: "2026-08-31"
updated: "2026-08-31"
tags: []
aliases: []
resume_point:
  last_explored: ""
  current_thought: ""
  next_step: ""
content_potential:
  suggested_format: "none"
  confidence_score: 0.0
---

# 📥 00 Inbox — Landing Zone

> Drop **raw captures, clips, voice transcripts, bookmarks, and half-formed thoughts** here. Don't organize — just dump. The agent's **Engine A** will triage within seconds.

## How it works

1. Create a new note in this folder (or paste via Obsidian capture). Raw text is fine — no frontmatter required.
2. **Engine A** (file watcher + daily scan) will:
   - Extract `#tags`, `[[links]]`, `TODO`s and topic entities
   - Add valid YAML frontmatter (`type: inbox → hyperfixation` if single-topic)
   - Wrap your original text under `## Raw Capture` (never destroys your words)
   - Suggest or auto-route to `01 Hyperfixations/` when confident

## Manual override

- Add frontmatter yourself and set `status: raw` to force re-triage on next scan.
- Run `npm run vault:engine-a -- --dry-run` to preview, `--apply` to move.

## Coaching tip

> Low friction > perfect organization. This inbox is allowed to be messy — the system's job is hygiene, not judgment.
