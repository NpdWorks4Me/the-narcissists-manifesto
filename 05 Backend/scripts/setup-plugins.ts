/**
 * Plugin installer — fetches curated plugins to .obsidian/plugins/
 * Falls back to manual instructions if network unavailable.
 */
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const pluginsDir = join(vaultRoot, ".obsidian", "plugins");
const communityPluginsPath = join(vaultRoot, ".obsidian", "community-plugins.json");

// Curated set — see plan §4.1-4.2
// Versions pinned to latest stable as of 2026-08; update as needed.
const PLUGINS: { id: string; repo: string; version: string }[] = [
  { id: "dataview", repo: "blacksmithgu/obsidian-dataview", version: "0.5.68" },
  { id: "templater-obsidian", repo: "SilentVoid13/Templater", version: "2.9.0" },
  { id: "obsidian-tasks", repo: "obsidian-tasks-group/obsidian-tasks", version: "7.18.3" },
  { id: "obsidian-tracker", repo: "pyrochlore/obsidian-tracker", version: "1.14.3" },
  { id: "calendar", repo: "liamcain/obsidian-calendar", version: "1.5.10" },
  { id: "obsidian-linter", repo: "platers/obsidian-linter", version: "1.30.1" },
  { id: "obsidian-git", repo: "Vinzent03/obsidian-git", version: "2.32.0" },
];

async function fetchReleaseAsset(repo: string, version: string, asset: string): Promise<Uint8Array | null> {
  const urls = [
    `https://github.com/${repo}/releases/download/${version}/${asset}`,
    `https://github.com/${repo}/releases/download/v${version}/${asset}`,
  ];
  for (const url of urls) {
    try {
      console.log(`  Fetching ${url} ...`);
      const res = await fetch(url);
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
      console.log(`  → ${res.status} ${res.statusText}`);
    } catch (e: any) {
      console.log(`  → fetch failed: ${e.message}`);
    }
  }
  return null;
}

async function installPlugin(p: (typeof PLUGINS)[number]) {
  const dest = join(pluginsDir, p.id);
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

  // Try manifest first to check if already installed at correct version
  const manifestPath = join(dest, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const man = JSON.parse(readFileSync(manifestPath, "utf-8"));
      if (man.version === p.version || man.version === `v${p.version}`) {
        console.log(`✓ ${p.id} already at ${man.version}, skipping download`);
        return true;
      }
    } catch {}
  }

  // Preferred: download main.js, manifest.json, styles.css individually
  const assets = ["main.js", "manifest.json", "styles.css"];
  let success = false;
  for (const asset of assets) {
    const data = await fetchReleaseAsset(p.repo, p.version, asset);
    if (data) {
      writeFileSync(join(dest, asset), data);
      console.log(`  ✓ ${p.id}/${asset} (${data.length} bytes)`);
      success = true;
    } else {
      // styles.css is optional
      if (asset === "styles.css") continue;
      console.log(`  ✗ ${p.id}/${asset} not found — will need manual install`);
    }
  }
  return success;
}

async function main() {
  console.log("🔌 Installing curated plugins to .obsidian/plugins/");
  console.log(`Vault: ${vaultRoot}\n`);

  if (!existsSync(pluginsDir)) mkdirSync(pluginsDir, { recursive: true });

  let anyFailed = false;
  for (const p of PLUGINS) {
    console.log(`\n— ${p.id} (${p.repo}@${p.version})`);
    const ok = await installPlugin(p);
    if (!ok) anyFailed = true;
  }

  // Enable plugins
  const enabled = PLUGINS.map((p) => p.id);
  writeFileSync(communityPluginsPath, JSON.stringify(enabled, null, 2), "utf-8");
  console.log(`\n✓ Wrote ${communityPluginsPath}:`);
  console.log(JSON.stringify(enabled, null, 2));

  // Seed templates.json for Templater
  const templatesJsonPath = join(vaultRoot, ".obsidian", "templates.json");
  // Also templater config is in .obsidian/plugins/templater-obsidian/data.json — we write a sane default if missing
  const templaterDataPath = join(vaultRoot, ".obsidian", "plugins", "templater-obsidian", "data.json");
  const templaterDefaults = {
    command_timeout: 5,
    templates_folder: "04 Atlas & Meta/Templates",
    templates_pairs: [["", ""]],
    trigger_on_file_creation: false,
    auto_jump_to_cursor: false,
    enable_system_commands: false,
    startup_templates: [""],
    folder_templates: [{ folder: "00 Inbox", template: "04 Atlas & Meta/Templates/T_Hyperfixation.md" }],
  };
  if (!existsSync(templaterDataPath)) {
    writeFileSync(templaterDataPath, JSON.stringify(templaterDefaults, null, 2), "utf-8");
    console.log(`✓ Wrote templater data.json`);
  }

  // Linter default config
  const linterDataPath = join(vaultRoot, ".obsidian", "plugins", "obsidian-linter", "data.json");
  if (!existsSync(linterDataPath)) {
    const linterDefaults = {
      ruleConfigs: {
        "yaml-timestamp": { enabled: false },
        "compact-yaml": { enabled: true },
        "escape-yaml-special-characters": { enabled: true },
      },
      settings: { ruleConfigs: {} },
    };
    writeFileSync(linterDataPath, JSON.stringify(linterDefaults, null, 2), "utf-8");
    console.log(`✓ Wrote linter data.json`);
  }

  console.log("\n" + "=".repeat(60));
  if (anyFailed) {
    console.log("⚠️  Some plugins could not be fetched (network/RATE_LIMIT).");
    console.log("Manual fallback:");
    console.log("  Obsidian → Settings → Community plugins → Browse → Search by name → Install → Enable");
    console.log("  Required: Dataview, Templater");
    console.log("  Recommended: Tasks, Tracker, Calendar, Linter, Obsidian Git");
    console.log("\nVault still works with fallback static tables if Dataview missing.");
  } else {
    console.log("✅ All plugins installed. Restart Obsidian and enable them in Settings → Community plugins.");
  }
  console.log("Enable order: Dataview → Templater → Tasks → Tracker → Calendar → Linter → (optional) Obsidian Git");
}

main().catch((e) => {
  console.error("setup-plugins failed:", e);
  process.exit(1);
});
