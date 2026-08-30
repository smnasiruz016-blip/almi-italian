// SOURCE FRESHNESS GATE — how long since anybody looked at the awarding body's own document.
//
// Run: npm run gate:source-freshness   (wired into `build`)
//
// ── IT WARNS ON AGE. IT FAILS ON A CLAIM WITH NOTHING BEHIND IT. ───────────
// A stale source is not a broken build. Siena and CVCL do not publish on our release schedule,
// and a gate that went red on the calendar would be red for weeks at a time through nobody's
// fault — and a gate that is red for reasons nobody can act on today is a gate people learn to
// scroll past. So this prints and exits 0. Its whole job is that "up to date" stops being a
// belief and becomes a date on a screen.
//
// ── IT RE-HASHES THE COMMITTED BYTES ───────────────────────────────────────
// The documents live at docs/sources/, in this repository, beside the check that asserts them.
// Every recorded sha256 is recomputed from the committed file on every build. A mismatch, or a
// recorded document with no file, is RED.
//
// This is what the earlier version could not do. It read dates out of a markdown table and did
// arithmetic on them; the bytes were in almi-italian-data/, a folder no check could reach. A
// record that says 'sha256 abc…' while nothing ever recomputes abc… is a decoration. It is how
// CELI 2 stayed `verified: true` for a month with no document behind it at all.
//
// What it still cannot see: whether anybody READ the document. A hash proves the bytes are the
// bytes that were fetched, not that the numbers pinned in the code were checked against them.
// That is why the pinned-value tables in the record are written out by hand and why two of the
// PDFs went to a human reader — pdftotext dropped sentence layers on the CILS Linee guida in
// this same audit, so a number pulled by that tool is not evidence on its own.
//
// ── THE ONE FAILURE MODE A WARNING-ONLY GATE HAS ───────────────────────────
// Going quiet. If the record disappears, is renamed, or stops matching the row format, a gate
// that only ever warns would print nothing and everyone would read silence as freshness. So
// the vacuity checks below DO fail: no record, no parseable rows, or a date in the future is a
// red build. The warning is soft; the ability to warn is not.
//
// ── AND IT FAILS ON A VERIFIED LEVEL WITH NO RECORDED SOURCE ───────────────
// Added after the first run of this gate reported that celi.ts marked all six CELI levels
// `verified: true` while the record covered four — with DUE, the only level TRACKS routes,
// resting on a sentence rather than a document. The numbers turned out to be correct, which is
// the point: `verified: true` with nothing behind it is INDISTINGUISHABLE from a false claim
// until somebody goes and looks. It sat there unnoticed because nothing checked it.
//
// Age is a warning because Siena and CVCL publish on their schedule, not ours, and nobody can
// act on it today. A missing source is the opposite: it is wrong now and fixable now. So this
// one FAILS. A warn-only gate's single failure mode is going quiet, which sabotage case C
// demonstrated — and a false claim that only whispers is the same defect wearing a warning.

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RECORD = "docs/source-record.md";
const WARN_AFTER_DAYS = 120;

const failures: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) failures.push(m); };

console.log("SOURCE FRESHNESS GATE — re-hashes the committed sources; warns at " + WARN_AFTER_DAYS + " days on age\n");

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

// ── EVERY RECORDED DOCUMENT IS COMMITTED, AND ITS BYTES STILL HASH — FAILS ─
{
  console.log("\nevery recorded document is committed at docs/sources/ and re-hashed");
  // Parsed by CELL, not by a fixed pipe count: the CILS table has six columns (it carries a url)
  // and the CELI table has five. A regex with four pipes in it read the URL as the filename and
  // reported three documents missing that were sitting right there.
  const docs: { doc: string; hash: string }[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim()).filter((c, i, a) => !(i === 0 || i === a.length - 1));
    const hashCell = cells.find((c) => /^`[0-9a-f]{64}`$/.test(c));
    if (!hashCell) continue;
    const m = (cells[0] ?? "").match(/`([^`]+\.pdf)`/);
    if (!m) continue;
    docs.push({ doc: m[1], hash: hashCell.replace(/`/g, "") });
  }

  console.log(`  recorded documents with a sha256: ${docs.length}`);
  ok(docs.length > 0,
     `${RECORD} records no document with a sha256. Without one this gate has nothing to recompute ` +
     `and would pass on an empty record, which is the shape the old version failed in.`);
  ok(docs.length >= 8,
     `only ${docs.length} hashed document(s) recorded. The product pins numbers from three CILS ` +
     `documents and six CELI levels; fewer than eight means a source stopped being tracked.`);

  let verified = 0;
  for (const d of docs) {
    const p = join(ROOT, "docs", "sources", d.doc);
    if (!existsSync(p)) {
      failures.push(
        `${RECORD} records ${d.doc} with a sha256, but docs/sources/${d.doc} does not exist. A hash ` +
        `with no bytes beside it is a decoration: nothing can ever recompute it, so the record can ` +
        `never be wrong and this gate can never be right.`,
      );
      continue;
    }
    const actual = createHash("sha256").update(readFileSync(p)).digest("hex");
    if (actual !== d.hash) {
      failures.push(
        `docs/sources/${d.doc} does not hash to what ${RECORD} records. Recorded ${d.hash.slice(0, 16)}…, ` +
        `the committed file is ${actual.slice(0, 16)}…. Either the document was replaced without ` +
        `re-reading the numbers pinned from it, or the record was edited without the bytes.`,
      );
      continue;
    }
    verified++;
  }
  console.log(`  ✓ ${verified} of ${docs.length} re-hashed from the committed file and matched`);

  // CONTROL. A hash comparison that cannot tell two byte strings apart proves nothing.
  const first = docs[0] && existsSync(join(ROOT, "docs", "sources", docs[0].doc))
    ? createHash("sha256").update(readFileSync(join(ROOT, "docs", "sources", docs[0].doc))).digest("hex")
    : "";
  const nudged = docs[0] && first
    ? createHash("sha256").update(Buffer.concat([readFileSync(join(ROOT, "docs", "sources", docs[0].doc)), Buffer.from([0])])).digest("hex")
    : "x";
  const distinguishes = first !== nudged;
  console.log(`  ${distinguishes ? "✓" : "✗"} control: the hash distinguishes a file from the same file plus one byte`);
  ok(distinguishes, "control: the hash comparison cannot see a one-byte difference, so every match above means nothing");
}

// ── EVERY VERIFIED LEVEL HAS A DOCUMENT — THIS ONE FAILS TOO ───────────────
// The mapping is READ FROM THE RECORD, not hard-coded here. A gate that carried its own
// level->document table would be asserting its own belief about the world; this asserts that
// two files agree, and both have to be edited to make it lie.
{
  console.log("\nevery CELI level marked verified: true has a document recorded against it");
  const celiPath = join(ROOT, "src", "lib", "scoring", "celi.ts");
  const celi = existsSync(celiPath) ? readFileSync(celiPath, "utf8") : "";
  ok(celi.length > 0, `src/lib/scoring/celi.ts is missing — this check cannot run, and a check that cannot run must not pass quietly`);

  // levels and their verified flag, straight from the config object
  const levels = [...celi.matchAll(/^\s{2}([A-Z]+):\s*\{([^}]*)\}/gm)]
    .map((m) => ({ level: m[1], verified: /verified:\s*true/.test(m[2]) }));

  // the level -> document table in the record
  const map = new Map(
    [...text.matchAll(/^\|\s*([A-Z]+)\s*\|\s*[A-C][12]\s*\|\s*`([^`]+\.pdf)`\s*\|/gm)]
      .map((m) => [m[1], m[2]]),
  );

  const verified = levels.filter((l) => l.verified);
  console.log(`  levels declared            : ${levels.length}`);
  console.log(`  marked verified: true      : ${verified.length}   <-- every one needs a document`);
  console.log(`  rows in the level->doc map : ${map.size}`);

  ok(levels.length > 0, `no level config could be parsed out of celi.ts — the check found nothing to judge, which is not the same as finding nothing wrong`);
  ok(map.size > 0, `${RECORD} has no level->document table — without it every verified level is unbacked and this gate cannot tell`);

  for (const { level } of verified) {
    const doc = map.get(level);
    if (!doc) {
      failures.push(
        `celi.ts marks ${level} \`verified: true\` but ${RECORD} records no source document for it. ` +
        `That is a claim about an awarding body's published numbers with nothing behind it — not a ` +
        `stale record, a false one. Either fetch and record the document, or set verified: false ` +
        `with the reason beside it (the engine then returns PENDING rather than a fabricated grade).`,
      );
      continue;
    }
    // the named document must also be hashed in the table above
    const hashed = new RegExp("`" + doc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "`[^|]*\\|[^|]*\\|[^|]*\\|[^|]*\\|\\s*`[0-9a-f]{16,}`").test(text);
    if (!hashed) {
      failures.push(
        `${RECORD} maps ${level} to ${doc}, but that document has no hashed row. A filename is not ` +
        `a source; the hash is what says somebody held the bytes.`,
      );
      continue;
    }
    console.log(`  \u2713 ${level.padEnd(9)} ${doc}`);
  }

  // CONTROLS. A check that cannot fail is not a check.
  const seesUnbacked = !map.has("__NOT_A_LEVEL__");
  const seesHashed = /`celi-2-valutazione\.pdf`[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*`[0-9a-f]{16,}`/.test(text);
  console.log(`  ${seesUnbacked ? "\u2713" : "\u2717"} control: a level absent from the map is detected as absent`);
  console.log(`  ${seesHashed ? "\u2713" : "\u2717"} control: the hashed-row matcher finds a row it must find`);
  ok(seesUnbacked, "control: the map lookup cannot tell a missing level from a present one");
  ok(seesHashed, "control: the hashed-row matcher cannot find celi-2-valutazione.pdf, so a pass from it means nothing");
}

// ── THE WARNING — SOFT, AND DELIBERATELY SO ────────────────────────────────
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
              `(oldest ${Math.max(...rows.map((r) => r.ageDays))}d); every recorded document re-hashed from its ` +
              `committed bytes, and every verified CELI level has a ` +
              `document behind it. Warns on age; fails on a claim with no source.`);
}

function report(): never {
  console.error("\n❌ SOURCE FRESHNESS GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
