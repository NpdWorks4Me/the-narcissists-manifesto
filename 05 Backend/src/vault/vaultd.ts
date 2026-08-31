/**
 * vaultd — daemon runner: watches 00 Inbox, schedules daily/weekly scans
 * Usage: npm run vault:daemon [-- --once] [-- --dry-run]
 */
import { watch } from "chokidar";
import { spawn } from "child_process";
import { join } from "path";
import { existsSync } from "fs";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const once = args.includes("--once");
const dryRunFlag = args.includes("--dry-run") ? "--dry-run" : "";

function runEngine(engine: "a" | "b", extraArgs: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = engine === "a" ? "05 Backend/src/vault/vault-engine-a.ts" : "05 Backend/src/vault/vault-engine-b.ts";
    const child = spawn("npx", ["tsx", script, ...extraArgs], { cwd: vaultRoot, stdio: "inherit" });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`engine-${engine} exited ${code}`))));
    child.on("error", reject);
  });
}

async function runOnce() {
  console.log("🔄 Single scan run");
  try {
    await runEngine("a", dryRunFlag ? [dryRunFlag] : ["--apply"]);
    await runEngine("b", dryRunFlag ? [dryRunFlag] : ["--apply"]);
    const { spawn: spawn2 } = await import("child_process");
    const report = spawn2("npx", ["tsx", "05 Backend/src/vault/report.ts"], { cwd: vaultRoot, stdio: "inherit" });
    await new Promise<void>((res, rej) => {
      report.on("close", (c) => (c === 0 ? res() : rej(new Error(`report exited ${c}`))));
      report.on("error", rej);
    });
  } catch (e) {
    console.error("once run failed", e);
  }
}

if (once) {
  await runOnce();
  process.exit(0);
}

// Persistent watch
console.log(`👁️  vaultd starting — watching ${CONFIG.FOLDERS.inbox} + ${CONFIG.FOLDERS.hyperfixations}`);
console.log(`Vault: ${vaultRoot}`);
console.log(`Dry run: ${!!dryRunFlag} | Press Ctrl+C to stop. Also run with --once for single scan.`);

const inboxWatch = watch(join(vaultRoot, CONFIG.FOLDERS.inbox), { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 800 } });
const hfWatch = watch(join(vaultRoot, CONFIG.FOLDERS.hyperfixations), { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 800 } });

let debounce: NodeJS.Timeout | null = null;
function debouncedEngineA(path: string) {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(async () => {
    console.log(`\n📥 File event: ${path}`);
    try {
      await runEngine("a", dryRunFlag ? [dryRunFlag] : ["--apply"]);
    } catch (e) {
      console.error("engine-a on watch failed", e);
    }
  }, 1500);
}

inboxWatch.on("add", debouncedEngineA).on("change", debouncedEngineA);
hfWatch.on("change", (p) => {
  if (p.endsWith(".md")) {
    console.log(`  hyperfixation changed: ${p} — updating timestamp check on next scan`);
  }
});

// Daily scheduler via setTimeout (fallback if launchd not installed)
// Simple: run at 09:00 local if daemon is long-lived
function scheduleDaily() {
  const now = new Date();
  const next9 = new Date(now);
  next9.setHours(9, 0, 0, 0);
  if (next9 <= now) next9.setDate(next9.getDate() + 1);
  const ms = next9.getTime() - now.getTime();
  console.log(`⏰ Next daily scan at ${next9.toLocaleString()} (in ${Math.round(ms / 1000 / 60)} min)`);
  setTimeout(async () => {
    console.log("\n⏰ Daily scheduled scan triggered");
    await runOnce();
    scheduleDaily();
  }, ms);
}
scheduleDaily();

process.on("SIGINT", () => {
  console.log("\nvaultd shutting down...");
  inboxWatch.close();
  hfWatch.close();
  process.exit(0);
});
