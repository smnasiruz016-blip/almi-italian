// SOURCE FRESHNESS GATE — how long since anybody looked at the awarding body's own document.
//
// Run: npm run gate:source-freshness   (wired into `build`)
//
// ── IT WARNS. IT DOES NOT FAIL. ─────────────────────────────────────────────
// A stale source is not a broken build. Siena and CVCL do not publish on our release schedule,
// and a gate that went red on the calendar would be red for weeks at a time through nobody's
// fault — and a gate that is red for reasons nobody can act on today is a gate people learn to
// scroll past. So this prints and exits 0. Its whole job is that "up to date" stops being a
// belief and becomes a date on a screen.
//
// ── WHAT IT CANNOT SEE, SAID PLAINLY ────────────────────────────────────────
// Nothing here re-reads a PDF or compares a number. It reads docs/source-record.md and does
// arithmetic on the dates in it. If somebody edits the date without opening the document, this
// gate says fresh and is wrong — which is why the record file tells you to re-hash rather than
// re-date, and why a hash sits beside every entry.
//
// ── THE ONE FAILURE MODE A WARNING-ONLY GATE HAS ───────────────────────────
// Going quiet. If the record disappears, is renamed, or stops matching the row format, a gate
// that only ever warns would print nothing and everyone would read silence as freshness. So
// the vacuity checks below DO fail: no record, no parseable rows, or a date in the future is a
// red build. The warning is soft; the ability to warn is not.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RECORD = "docs/source-record.md";
const WARN_AFTER_DAYS = 120;

const failures: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) failures.push(m); };

console.log("SOURCE FRESHNESS GATE — warns at " + WARN_AFTER_DAYS + " days, never fails on age\n");

const path = join(ROOT, RECORD);
ok(existsSync(path), `${RECORD} is missing. A warning-only gate with nothing to read prints nothing, and silence reads as freshness.`);
if (!existsSync(path)) { report(); }

const text = readFileSync(path, "utf8");

/** Table rows: | document | … | YYYY-MM-DD | … |  — the date cell is the fetch date. */
type Row = { doc: string; date: string; ageDays: number };
const rows: Row[] = [];
for (const line of text.split(/\r?\n/)) {
  if (!line.trimStart().startsWith("|")) continue;
  const cells = line.split("|").map((c) => c.trim()).filter((c, i, a) => !(i === 0 || i === a.length - 1));
  if (cells.length < 3) continue;
  const dateCell = cells.find((c) => /^\d{4}-\d{2}-\d{2}$/.test(c));
  if (!dateCell) continue;
  const doc = (cells[0] ?? "").replace(/`/g, "").slice(0, 60);
  const age = Math.floor((Date.now() - Date.parse(dateCell + "T00:00:00Z")) / 86_400_000);
  rows.push({ doc, date: dateCell, ageDays: age });
}

// ── THE POPULATION ─────────────────────────────────────────────────────────
console.log("population");
console.log(`  documents with a recorded fetch date: ${rows.length}`);
ok(rows.length > 0,
   `${RECORD} exists but no row carries a YYYY-MM-DD fetch date. Either the format changed or ` +
   `the table is gone — a gate reading zero rows would warn about nothing and look healthy.`);
ok(rows.length >= 3,
   `only ${rows.length} dated document(s) recorded. The product pins numbers from at least the ` +
   `CILS criteria, the CILS linee guida, and the CVCL criteria; fewer than three means a source ` +
   `stopped being tracked rather than stopped being stale.`);

const future = rows.filter((r) => r.ageDays < 0);
ok(future.length === 0,
   `${future.length} row(s) are dated in the future (${future.map((r) => r.date).join(", ")}) — ` +
   `a future date silences this gate forever, which is the one way to make it useless without ` +
   `deleting it.`);

// ── THE WARNING ────────────────────────────────────────────────────────────
console.log("\nages");
const stale = rows.filter((r) => r.ageDays >= WARN_AFTER_DAYS);
for (const r of rows.slice().sort((a, b) => b.ageDays - a.ageDays)) {
  const mark = r.ageDays >= WARN_AFTER_DAYS ? "⚠️ " : "  ";
  console.log(`  ${mark}${String(r.ageDays).padStart(4)}d  ${r.date}  ${r.doc}`);
}

if (failures.length) { report(); }

if (stale.length) {
  console.log(`\n⚠️  SOURCE FRESHNESS WARNING — ${stale.length} of ${rows.length} document(s) not re-read in ${WARN_AFTER_DAYS}+ days:`);
  for (const r of stale) console.log(`      ${r.doc} — last fetched ${r.date} (${r.ageDays} days ago)`);
  console.log(`\n    This is a WARNING, not a failure. Re-fetch, re-hash, and update ${RECORD}.`);
  console.log(`    If the hash is unchanged the numbers were not restated and only the date moves.`);
} else {
  console.log(`\n✅ source-freshness gate: ${rows.length} document(s) tracked, none older than ${WARN_AFTER_DAYS} days ` +
              `(oldest ${Math.max(...rows.map((r) => r.ageDays))}d). Warns on age; never fails on it.`);
}

function report(): never {
  console.error("\n❌ SOURCE FRESHNESS GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
