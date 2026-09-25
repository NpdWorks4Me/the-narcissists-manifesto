---
name: obsidian-ingest
description: Drop a URL, PDF, audio, screenshot → rewrites 5-15 vault pages.
  Maps to vault:ingest.
metadata:
  copilot-enabled-agents: opencode
---

# obsidian-ingest

Drop a source and the vault rewrites itself.

```bash
npm run vault:ingest -- <url|path> [--visual] [--max-frames 24]
```

- URL: fetches + strips HTML; YouTube tries transcript first.
- PDF: `pdftotext` if available.
- Audio `.m4a/.mp3/.wav`: local `whisper` (tiny) if installed — `pip install openai-whisper`.
- Image `.png/.jpg`: `tesseract` OCR if available, else preserves path for Claude vision.
- YouTube `--visual`: `yt-dlp` (≤720p) + `ffmpeg` scene detection → frames in `04 Atlas & Meta/Logs/ytvisual-*/frames/`.

**Flow:** `raw/<slug>.md` (immutable) → score vs vault → rewrite top 1-2 related notes (adds `> 🔄 INGEST` block) or create atomic stub. Logs to `Logs/ingest.log`. Next: `vault:reconcile`.

Requires: `whisper`, `yt-dlp`, `ffmpeg`, `tesseract` optional — skips gracefully if missing.
