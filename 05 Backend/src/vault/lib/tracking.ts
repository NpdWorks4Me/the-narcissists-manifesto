import { existsSync, readFileSync, writeFileSync, appendFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { CONFIG } from "./config.js";

export interface TrackingRow {
  date: string;
  note_id: string;
  title: string;
  type: string;
  status: string;
  wip_count: number;
  orphan_count: number;
  broken_links: number;
  confidence: number;
  event: string;
}

const CSV_HEADER = "date,note_id,title,type,status,wip_count,orphan_count,broken_links,confidence,event";

function csvEscape(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function trackingCsvPath(vaultRoot: string): string {
  return join(vaultRoot, CONFIG.FOLDERS.logs, "tracking.csv");
}

export function ensureTrackingCsv(vaultRoot: string): void {
  const p = trackingCsvPath(vaultRoot);
  if (!existsSync(p)) {
    writeFileSync(p, CSV_HEADER + "\n", "utf-8");
  } else {
    const first = readFileSync(p, "utf-8").split("\n")[0]?.trim();
    if (first !== CSV_HEADER) {
      const rest = readFileSync(p, "utf-8");
      writeFileSync(p, CSV_HEADER + "\n" + rest, "utf-8");
    }
  }
}

export function appendTrackingRow(vaultRoot: string, row: TrackingRow): void {
  ensureTrackingCsv(vaultRoot);
  const p = trackingCsvPath(vaultRoot);
  const line = [
    row.date,
    csvEscape(row.note_id),
    csvEscape(row.title),
    row.type,
    row.status,
    String(row.wip_count),
    String(row.orphan_count),
    String(row.broken_links),
    String(row.confidence),
    csvEscape(row.event),
  ].join(",") + "\n";
  appendFileSync(p, line, "utf-8");
  maybeRotate(vaultRoot);
}

function maybeRotate(vaultRoot: string): void {
  const p = trackingCsvPath(vaultRoot);
  const content = readFileSync(p, "utf-8");
  const lines = content.split("\n").filter(Boolean);
  // header + rows
  if (lines.length - 1 > CONFIG.TRACKING_CSV_ROTATE_ROWS) {
    const year = new Date().getFullYear();
    const rotated = join(vaultRoot, CONFIG.FOLDERS.logs, `tracking-${year}.csv`);
    // append overflow to rotated file
    const overflow = lines.slice(1, lines.length - CONFIG.TRACKING_CSV_ROTATE_ROWS + 1).join("\n") + "\n";
    if (!existsSync(rotated)) writeFileSync(rotated, CSV_HEADER + "\n", "utf-8");
    appendFileSync(rotated, overflow, "utf-8");
    // keep header + last N rows
    const keep = [CSV_HEADER, ...lines.slice(-CONFIG.TRACKING_CSV_ROTATE_ROWS)].join("\n") + "\n";
    writeFileSync(p, keep, "utf-8");
  }
}

export function readTrackingRows(vaultRoot: string): TrackingRow[] {
  const p = trackingCsvPath(vaultRoot);
  if (!existsSync(p)) return [];
  const lines = readFileSync(p, "utf-8").split("\n").filter(Boolean);
  if (lines.length <= 1) return [];
  return lines.slice(1).map((l) => {
    // naive split respecting quotes not needed for our controlled data; use simple parse
    const parts = parseCsvLine(l);
    return {
      date: parts[0] || "",
      note_id: parts[1] || "",
      title: parts[2] || "",
      type: parts[3] || "",
      status: parts[4] || "",
      wip_count: parseInt(parts[5] || "0", 10),
      orphan_count: parseInt(parts[6] || "0", 10),
      broken_links: parseInt(parts[7] || "0", 10),
      confidence: parseFloat(parts[8] || "0"),
      event: parts[9] || "",
    };
  });
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}
