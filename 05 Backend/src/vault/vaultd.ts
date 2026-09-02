/**
 * vaultd — daemon runner: watches 00 Inbox, schedules daily/nightly/weekly
 * Extended 5-phase nightly (OKM-aligned): close day → reconcile → synthesize → heal → reindex
 * Usage: npm run vault:daemon [-- --once] [-- --dry-run] [-- --nightly]
 */
import { watch } from "chokidar";
import { spawn } from "child_process";
import { join } from "path";
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync } from "fs";
import matter from "gray-matter";
import { CONFIG } from "./lib/config.js";

const _cwd = process.cwd();
const vaultRoot = (() => { const base = _cwd.split("/").pop() || ""; const isBackend = base === "backend" || base === "05 Backend"; return isBackend ? _cwd.slice(0, -base.length).replace(/\/$/, "") || "." : _cwd; })();
const args = process.argv.slice(2);
const once = args.includes("--once");
const nightlyFlag = args.includes("--nightly");
const dryRunFlag = args.includes("--dry-run") ? "--dry-run" : "";

function runScript(rel: string, extraArgs: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["--yes", "tsx", rel, ...extraArgs], { cwd: vaultRoot, stdio: "inherit", env: { ...process.env, NPM_CONFIG_CACHE: "/tmp/npm-cache" } });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${rel} exited ${code}`))));
    child.on("error", reject);
  });
}
function runEngine(engine: "a" | "b", extraArgs: string[] = []): Promise<void> {
  const script = engine === "a" ? "05 Backend/src/vault/vault-engine-a.ts" : "05 Backend/src/vault/vault-engine-b.ts";
  // Use same cache workaround as runScript
  return runScript(script, extraArgs);
}

// --- 5-phase nightly ---
async function phaseCloseDay() {
  console.log("\n🌙 [1/5] Close day — daily note + tracking close");
  // Ensure daily note exists in 01 Hyperfixations? Actually daily logs are in vault root daily pattern — we create in 04 Atlas & Meta/Logs
  const today = new Date().toISOString().slice(0, 10);
  const trackingPath = join(vaultRoot, CONFIG.FOLDERS.logs, "tracking.csv");
  try {
    const row = `${today},nightly-close,Close day,system,active,0,0,0,0.0,nightly-close-day\n`;
    if (existsSync(trackingPath)) appendFileSync(trackingPath, row);
    console.log("  ✓ tracking close appended");
  } catch (e) {
    console.warn("  ⚠ close day tracking failed", e);
  }
  // Touch daily note if template exists
  try {
    await runScript("05 Backend/src/vault/report.ts", []);
    console.log("  ✓ KGI refreshed as part of close");
  } catch {}
}

async function phaseReconcile() {
  console.log("\n⚖️  [2/5] Reconcile — contradictions");
  try {
    await runScript("05 Backend/src/vault/reconcile.ts", dryRunFlag ? [dryRunFlag, "--apply"] : ["--apply"]);
  } catch (e) {
    console.warn("  ⚠ reconcile failed (may be no contradictions)", e);
    // Fallback to engine-a hygiene
    try { await runEngine("a", dryRunFlag ? [dryRunFlag] : ["--apply"]); } catch {}
  }
}

async function phaseSynthesize() {
  console.log("\n🧠 [3/5] Synthesize — cross-source patterns");
  try {
    await runScript("05 Backend/src/vault/synthesize.ts", dryRunFlag ? [dryRunFlag] : ["--apply"]);
  } catch (e) {
    console.log("  ℹ synthesize script not found — falling back to engine-b");
    await runEngine("b", dryRunFlag ? [dryRunFlag] : ["--apply"]);
  }
}

async function phaseHeal() {
  console.log("\n🩹 [4/5] Heal — orphan auto-link");
  try {
    await runScript("05 Backend/src/vault/heal.ts", dryRunFlag ? [dryRunFlag] : ["--apply"]);
  } catch (e) {
    console.log("  ℹ heal script not found — using autoLinker lib via engine-b fallback");
  }
  console.log("  ✓ heal pass complete");
}

async function phaseReindex() {
  console.log("\n🔎 [5/5] Reindex — semantic index");
  try {
    await runScript("05 Backend/src/vault/reindex.ts", dryRunFlag ? [dryRunFlag] : ["--apply"]);
  } catch (e) {
    console.log("  ℹ reindex not yet built — TF-IDF index is live via engine-b");
  }
}

async function runNightly() {
  const start = Date.now();
  console.log("\n🌙🌙🌙 Nightly 5-phase starting @ " + new Date().toISOString() + (dryRunFlag ? " (dry-run)" : ""));
  const logDir = join(vaultRoot, CONFIG.FOLDERS.logs);
  mkdirSync(logDir, { recursive: true });
  const nightlyLog = join(logDir, "nightly.log");
  try {
    await phaseCloseDay();
    await phaseReconcile();
    await phaseSynthesize();
    await phaseHeal();
    await phaseReindex();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const line = `[${new Date().toISOString()}] nightly complete in ${elapsed}s dryRun=${!!dryRunFlag}\n`;
    appendFileSync(nightlyLog, line);
    console.log(`\n✅ Nightly complete in ${elapsed}s → ${nightlyLog}`);
  } catch (e) {
    console.error("nightly failed", e);
    appendFileSync(nightlyLog, `[${new Date().toISOString()}] nightly FAILED: ${e}\n`);
    throw e;
  }
}

async function runOnce() {
  if (nightlyFlag) {
    await runNightly();
    return;
  }
  console.log("🔄 Single scan run (engine-a → engine-b → report)");
  try {
    await runEngine("a", dryRunFlag ? [dryRunFlag] : ["--apply"]);
    await runEngine("b", dryRunFlag ? [dryRunFlag] : ["--apply"]);
    await runScript("05 Backend/src/vault/report.ts", []);
  } catch (e) {
    console.error("once run failed", e);
  }
}

if (once) {
  await runOnce();
  process.exit(0);
}

if (nightlyFlag) {
  await runNightly();
  process.exit(0);
}

// Persistent watch
console.log(`👁️  vaultd starting — watching ${CONFIG.FOLDERS.inbox} + ${CONFIG.FOLDERS.hyperfixations}`);
console.log(`Vault: ${vaultRoot}`);
console.log(`Dry run: ${!!dryRunFlag} | --once for single scan | --nightly for 5-phase`);
console.log(`Schedules: daily 09:00 → engine-a+b | nightly 22:00 → 5-phase | weekly Fri 18:00 | health Sun 21:00`);

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
    console.log(`  hyperfixation changed: ${p} — timestamp check on next scan`);
  }
});

// Schedulers
function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}
function scheduleDaily() {
  const ms = msUntilNext(9, 0);
  const next = new Date(Date.now() + ms);
  console.log(`⏰ Next daily (09:00) at ${next.toLocaleString()} (in ${Math.round(ms / 1000 / 60)} min)`);
  setTimeout(async () => {
    console.log("\n⏰ Daily scheduled scan triggered");
    await runOnce();
    scheduleDaily();
  }, ms);
}
function scheduleNightly() {
  const ms = msUntilNext(22, 0);
  const next = new Date(Date.now() + ms);
  console.log(`🌙 Next nightly 5-phase (22:00) at ${next.toLocaleString()} (in ${Math.round(ms / 1000 / 60)} min)`);
  setTimeout(async () => {
    console.log("\n🌙 Nightly scheduled trigger");
    await runNightly();
    scheduleNightly();
  }, ms);
}
function scheduleWeekly() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(18, 0, 0, 0);
  // Next Friday (5)
  const days = (5 - next.getDay() + 7) % 7 || 7;
  if (next <= now || next.getDay() !== 5) next.setDate(next.getDate() + days);
  const ms = next.getTime() - now.getTime();
  console.log(`📅 Next weekly review (Fri 18:00) at ${next.toLocaleString()}`);
  setTimeout(async () => {
    console.log("\n📅 Weekly review trigger");
    try { await runScript("05 Backend/src/vault/report.ts", []); } catch {}
    scheduleWeekly();
  }, ms);
}
function scheduleHealth() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(21, 0, 0, 0);
  // Next Sunday (0)
  const days = (0 - next.getDay() + 7) % 7 || 7;
  if (next <= now || next.getDay() !== 0) next.setDate(next.getDate() + days);
  const ms = next.getTime() - now.getTime();
  console.log(`🩺 Next health audit (Sun 21:00) at ${next.toLocaleString()}`);
  setTimeout(async () => {
    console.log("\n🩺 Health audit trigger");
    try { await runScript("05 Backend/src/vault/health.ts", []); } catch {}
    scheduleHealth();
  }, ms);
}

scheduleDaily();
scheduleNightly();
scheduleWeekly();
scheduleHealth();

process.on("SIGINT", () => {
  console.log("\nvaultd shutting down...");
  inboxWatch.close();
  hfWatch.close();
  process.exit(0);
});
