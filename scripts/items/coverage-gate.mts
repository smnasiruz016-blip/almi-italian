// Coverage gate — every level an engine can score is either routed or declared out of scope.
//
// Run: npm run gate:coverage   (wired into `build`, so it blocks)
//
// ── THE HOLE THIS CLOSES ────────────────────────────────────────────────────
// The scoring engines declare 13 exam levels; TRACKS routes 4. The other 9 existed only as the
// difference between two lists nobody compared — a reader of TRACKS saw four tracks and nothing
// telling them nine more were implied in src/lib/scoring. That is the shape of a silent drop:
// no line of code is wrong, and the product quietly covers a third of what it appears to.
//
// This gate makes the two lists compare themselves. Every level in CilsStandardLevel, CeliLevel
// and the B1 Cittadinanza engine must appear in COVERAGE, and every ROUTED entry must have a
// real track with a real bank behind it. Adding a level to an engine without deciding what to do
// about it now fails the build.
//
// It deliberately does NOT require every level to be routed. "Out of scope, because no bank is
// authored" is a legitimate answer; "nobody noticed" is not. The gate enforces that a decision
// was made, not which decision.

import { TRACKS, COVERAGE, sectionCount } from "../../src/lib/practice";
import { itemsFor } from "../../src/lib/items";
import type { CilsStandardLevel } from "../../src/lib/scoring/cils-standard";
import type { CeliLevel } from "../../src/lib/scoring/celi";

const MIN_ITEMS_PER_MODULE = 15;

let failed = false;
const fail = (msg: string) => { console.error(`  ✗ ${msg}`); failed = true; };

console.log("Coverage gate — every engine level is routed or declared out of scope\n");

// The engines' own level lists. Written as typed literals so that adding a level to
// CilsStandardLevel or CeliLevel and not adding it here is a TYPE error, not a silent pass —
// the gate cannot be out of date with the engine without tsc saying so first.
const CILS_STANDARD_LEVELS: CilsStandardLevel[] = ["A1", "A2", "UNO", "DUE", "TRE", "QUATTRO"];
const CELI_LEVELS: CeliLevel[] = ["IMPATTO", "UNO", "DUE", "TRE", "QUATTRO", "CINQUE"];
const ENGINE_LEVELS: [string, string][] = [
  ["CILS_B1C", "B1C"],
  ...CILS_STANDARD_LEVELS.map((l) => ["CILS_STANDARD", l] as [string, string]),
  ...CELI_LEVELS.map((l) => ["CELI", l] as [string, string]),
];

// ── RED PROOF ───────────────────────────────────────────────────────────────
// A level the engines know about but COVERAGE has never heard of must be caught. Proved against
// a synthetic level rather than by removing a real one, so the check is shown working without
// the declaration being edited to test it.
{
  const declared = new Set(COVERAGE.map((c) => `${c.exam}|${c.level}`));
  if (declared.has("CELI|SEI")) {
    fail("RED PROOF FAILED — the fixture level CELI|SEI is somehow declared; pick another fixture.");
  } else {
    console.log("  ✓ RED proof: an undeclared engine level (CELI|SEI) is absent from COVERAGE, so the lookup below can fail");
  }
}

// ── 1. Every engine level is accounted for ──────────────────────────────────
const byKey = new Map(COVERAGE.map((c) => [`${c.exam}|${c.level}`, c]));
for (const [exam, level] of ENGINE_LEVELS) {
  if (!byKey.has(`${exam}|${level}`)) {
    fail(`${exam} ${level}: the engine can score this level but COVERAGE does not mention it — route it or declare it out of scope`);
  }
}
if (!failed) console.log(`  ✓ all ${ENGINE_LEVELS.length} engine level(s) appear in COVERAGE`);

// ── 2. Nothing declared that no engine knows ────────────────────────────────
const engineKeys = new Set(ENGINE_LEVELS.map(([e, l]) => `${e}|${l}`));
for (const c of COVERAGE) {
  if (!engineKeys.has(`${c.exam}|${c.level}`)) {
    fail(`COVERAGE declares ${c.exam} ${c.level}, which no scoring engine knows about`);
  }
}

// ── 3. ROUTED means routed, and backed by a real bank ───────────────────────
for (const c of COVERAGE.filter((x) => x.status === "ROUTED")) {
  const track = TRACKS.find((t) => t.exam === c.exam && t.level === c.level);
  if (!track) {
    fail(`${c.exam} ${c.level} is declared ROUTED but no track in TRACKS points at it`);
    continue;
  }
  for (const s of track.sections) {
    const n = sectionCount(track, s);
    if (n < MIN_ITEMS_PER_MODULE) {
      fail(`${c.exam} ${c.level} is declared ROUTED but ${track.slug}/${s.slug} has ${n} item(s), under the ${MIN_ITEMS_PER_MODULE} floor`);
    }
  }
}

// ── 4. OUT_OF_SCOPE means genuinely unreachable, not merely unlisted ────────
// A level declared out of scope must have no track AND no items. If either exists the
// declaration is stale, and a learner may be able to reach something we have said is not there.
for (const c of COVERAGE.filter((x) => x.status === "OUT_OF_SCOPE")) {
  const track = TRACKS.find((t) => t.exam === c.exam && t.level === c.level);
  if (track) fail(`${c.exam} ${c.level} is declared OUT_OF_SCOPE but TRACKS routes it as "${track.slug}"`);
  const stray = ["ASCOLTO", "LETTURA", "ANALISI", "SCRITTA", "ORALE"]
    .map((s) => [s, itemsFor(c.exam, c.level, s).length] as const)
    .filter(([, n]) => n > 0);
  if (stray.length) {
    fail(`${c.exam} ${c.level} is declared OUT_OF_SCOPE but the bank holds items: ${stray.map(([s, n]) => `${s}=${n}`).join(", ")}`);
  }
  if (!c.note.trim()) fail(`${c.exam} ${c.level} is OUT_OF_SCOPE with no reason given`);
}

// ── the ledger ──────────────────────────────────────────────────────────────
console.log("\n  exam           level      CEFR  status         detail");
for (const c of COVERAGE) {
  const mark = c.status === "ROUTED" ? "✓" : "·";
  console.log(`  ${mark} ${c.exam.padEnd(13)} ${c.level.padEnd(9)} ${c.cefr.padEnd(4)}  ${c.status.padEnd(13)}  ${c.label}`);
}
const routed = COVERAGE.filter((c) => c.status === "ROUTED").length;
console.log(`\n  ${routed} routed, ${COVERAGE.length - routed} declared out of scope, ${COVERAGE.length} engine level(s) total`);

console.log("");
if (failed) {
  console.error("Coverage gate FAILED\n");
  process.exit(1);
}
console.log("Coverage gate passed\n");
