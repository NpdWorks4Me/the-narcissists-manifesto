# Backend — Autonomous Obsidian Vault Architect

All code, build artefacts, and dependencies for the vault live here. The vault root (`/`) remains pure Obsidian Markdown + `.obsidian/` config.

## Structure

```
backend/
├── package.json          # Node project manifest (run all vault commands from here)
├── package-lock.json
├── tsconfig.json         # Includes src/**, scripts/**, __tests__/**
├── node_modules/         # Dependencies (chokidar, gray-matter, compromise, etc.)
├── .env.example          # Copy to .env for OPENAI_API_KEY
├── scripts/
│   └── setup-plugins.ts  # Installs Dataview, Templater, Tasks, Tracker, Linter, Git
├── src/
│   └── vault/
│       ├── provision.ts      # Idempotent folder scaffolding
│       ├── health.ts         # vault:check
│       ├── vault-engine-a.ts # Meta-Tracking (inbox triage, WIP, hygiene)
│       ├── vault-engine-b.ts # Substance Synthesis (semantic, atomic, format)
│       ├── vaultd.ts         # Daemon watcher + scheduler
│       ├── report.ts         # Weekly KGI report
│       ├── lib/
│       │   ├── config.ts, frontmatter.ts, links.ts, nlp.ts, format.ts, tracking.ts
│       └── com.narcissist-manifesto.vault.plist  # launchd template
└── __tests__/
    ├── frontmatter.test.ts
    └── fixtures/
```

## Vault vs Backend

- **Vault root** = Obsidian knowledge graph: `00 Inbox`, `01 Hyperfixations`, `02 Atomic Concepts`, `03 Content Lab`, `04 Atlas & Meta/{Templates,Dashboards,Logs}`, `.obsidian/`
- **Backend** = all executable code. Never commit vault notes to 05 Backend; never put code in vault folders.

## Commands (run from `05 Backend/`)

```bash
cd "05 Backend"
npm install --cache /tmp/npm-cache   # if fresh clone

npm run vault:setup-plugins   # install Obsidian plugins to .obsidian/plugins/
npm run vault:check           # health check (frontmatter, WIP, links, plugins)
npm run vault:engine-a -- --dry-run   # preview inbox triage
npm run vault:engine-a -- --apply     # apply triage + hygiene
npm run vault:engine-b -- --dry-run   # preview semantic/atoms/specs
npm run vault:engine-b -- --apply     # apply insights
npm run vault:report                  # regenerate 📈 Knowledge Graph Intelligence
npm run vault:daemon                  # persistent watcher (00 Inbox + daily)
npm run vault:daemon -- --once --dry-run  # single scan preview
npm test                              # vitest
```

## Vault Root Resolution

Scripts resolve vault root as parent of `05 Backend/` (if `cwd` ends with `05 Backend` (or `backend` for legacy), go up one level). This lets `process.cwd()` be `05 Backend/` while `vaultRoot` points to the vault. No need to `cd ..` manually, but commands must be run from `05 Backend/`.

## Research — Search Any Idea (New, Main Priority)

Generic one-shot research native to this notebook (separate from `content-brain`).

```bash
cd "05 Backend"
npm run research -- "narcissism as performance" --max-pages 6
npm run research -- "audience capture and parasocial dynamics"
npm run research -- "remote work loneliness" --no-publish  # only log
npm run research:watch  # watches 00 Inbox for briefs
```

Outputs per idea (consistent 7-field `insights.json`):
- `01 Hyperfixations/<idea>.md` + `04 Atlas & Meta/Logs/research/<slug>_<id>/{package.json,insights.json,report.md}`
- 6 generic queries: base, lived experience, history archive, tools, criticism, guide

See `05 Backend/src/research/README.md` for details.

## Adding New Code

Per project rule: **all future code scripts go into `05 Backend/`** — e.g., `05 Backend/src/vault/new-feature.ts` or `05 Backend/scripts/...`. Never add `.ts/.js` to the vault's Markdown folders (`00 Inbox` etc. is for notes only; `04 Atlas & Meta/Scripts/` is now a shim README).

## Launchd

Plist is at `05 Backend/src/vault/com.narcissist-manifesto.vault.plist` — copy to `~/Library/LaunchAgents/` and `launchctl load` (requires approval) or just run `npm run vault:daemon` manually.

## Tracking

Events append to `../04 Atlas & Meta/Logs/tracking.csv` (relative to vaultRoot). Tracker plugin reads it via `04 Atlas & Meta/Logs/tracking.csv`.
