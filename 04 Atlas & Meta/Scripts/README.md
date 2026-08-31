---
id: "scripts-readme"
title: "Scripts — Backend Migration"
type: "moc"
status: "active"
created: "2026-08-31"
updated: "2026-08-31"
tags: [meta]
---

# 04 Atlas & Meta / Scripts

> **Code has moved to `05 Backend/` per project structure policy.**
>
> All build files, `node_modules`, and executable scripts now live under `/05 Backend` at the vault root.
>
> | Vault path (this folder) | Actual code location | Purpose |
> |---|---|---|
> | `04 Atlas & Meta/Scripts/` | `05 Backend/src/vault/` | Engine A/B, daemon, health, report, provision, lib |
> | `scripts/` (root) | `05 Backend/scripts/` | `setup-plugins.ts` |
> | `node_modules/` (root) | `05 Backend/node_modules/` | Dependencies |
> | `package.json` (root) | `05 Backend/package.json` | Project manifest |
> | `tsconfig.json` (root) | `05 Backend/tsconfig.json` | TS config |
> | `__tests__/` (root) | `05 Backend/__tests__/` | Tests |
>
> This folder is kept for spec compliance (Section 3.1 requires it) and for vault-native artefacts:
> - `com.narcissist-manifesto.vault.plist` is now at `05 Backend/src/vault/com.narcissist-manifesto.vault.plist` — copy from there to `~/Library/LaunchAgents/` if you use launchd.
> - Logs remain at `04 Atlas & Meta/Logs/` (vault-native, not backend).
>
> **Run commands from `05 Backend/`:**
> ```bash
> cd "05 Backend"
> npm run vault:check
> npm run vault:engine-a -- --dry-run
> npm run vault:engine-b -- --apply
> npm run vault:report
> npm run vault:daemon -- --once
> ```
>
> **Do not add new code here** — all future code scripts go to `05 Backend/` per project rule. This README preserves discoverability for Obsidian users browsing the vault.

## Backward Compatibility Shims

If external tools reference `04 Atlas & Meta/Scripts/vault-engine-a.ts`, they will not find it. Use `05 Backend/src/vault/vault-engine-a.ts` instead. The daemon (`05 Backend/src/vault/vaultd.ts`) already spawns from the backend path.

## Verification

```bash
cd "05 Backend" && npm run vault:check
```
Should report 0 errors, same as before migration.
