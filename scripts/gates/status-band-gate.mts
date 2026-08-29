// STATUS BAND GATE — the CLEAR / BORDERLINE / BELOW verdict a learner reads.
//
// Run: npm run gate:status-band   (wired into `build`, so it blocks)
//
// This is the most consequential word this product prints. A learner decides whether to sit a
// real exam on the strength of it, so the numbers behind it get asserted, never assumed.
//
// WHY THIS GATE EXISTS
// On 30 Aug a merge-verification widened the BORDERLINE band from 1 to 4 and all 26 gates
// stayed green: a learner could have read "Al limite" at 3/12 and nothing would have stopped
// it. Separately, FIVE implementations of this one decision had drifted apart — on a /20
// section the engine said BORDERLINE at 9 while /api/it/submit said BELOW for the same score.
//
// TWO THINGS ARE CHECKED, AND THE SECOND IS WHY THE FIRST KEEPS WORKING:
//   1. BEHAVIOUR   — every score on every live scale maps to a pinned literal verdict.
//   2. SINGLE OWNER — no second implementation may exist. Check 1 protects one function; it
//      cannot protect a copy written next to it, which is precisely how five appeared.
//
// THE EXPECTED VALUES ARE LITERALS, DELIBERATELY.
// They are NOT read from BORDERLINE_WIDTH_BY_MAX, NOT from CILS_*_FLOOR, and NOT computed from
// the band width. A check fed the same constant the code reads moves with it and can never go
// red. Widening the band must break this file; changing a floor must break this file. Both
// require editing the tables below by hand, visibly, on purpose.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sectionStatus, borderlineWidthFor } from "../../src/lib/scoring/section-status";
import { scoreCilsB1c } from "../../src/lib/scoring/cils-b1c";
import { scoreCilsStandard } from "../../src/lib/scoring/cils-standard";

type Band = "CLEAR" | "BORDERLINE" | "BELOW";
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };
const eq = (got: unknown, want: unknown, msg: string) =>
  ok(got === want, msg + " — got " + JSON.stringify(got) + ", expected " + JSON.stringify(want));

// ---- 1. BEHAVIOUR ---------------------------------------------------------
// CILS B1 Cittadinanza: sections are /12, floor 7, BORDERLINE is the single score 6.
const B1C: [number, Band][] = [
  [0, "BELOW"], [1, "BELOW"], [2, "BELOW"], [3, "BELOW"], [4, "BELOW"], [5, "BELOW"],
  [6, "BORDERLINE"],
  [7, "CLEAR"], [8, "CLEAR"], [9, "CLEAR"], [10, "CLEAR"], [11, "CLEAR"], [12, "CLEAR"],
];
// CILS standard: sections are /20, floor 11, BORDERLINE is exactly 9 and 10.
const STD: [number, Band][] = [
  [0, "BELOW"], [1, "BELOW"], [2, "BELOW"], [3, "BELOW"], [4, "BELOW"], [5, "BELOW"],
  [6, "BELOW"], [7, "BELOW"], [8, "BELOW"],
  [9, "BORDERLINE"], [10, "BORDERLINE"],
  [11, "CLEAR"], [12, "CLEAR"], [13, "CLEAR"], [14, "CLEAR"], [15, "CLEAR"],
  [16, "CLEAR"], [17, "CLEAR"], [18, "CLEAR"], [19, "CLEAR"], [20, "CLEAR"],
];

for (const [score, want] of B1C) eq(sectionStatus(score, 7, 12), want, "B1c " + score + "/12");
for (const [score, want] of STD) eq(sectionStatus(score, 11, 20), want, "CILS std " + score + "/20");

// Band WIDTH as a literal count. Widening makes this larger, narrowing makes it smaller — one
// assertion that goes red in BOTH directions.
eq(B1C.filter(([s]) => sectionStatus(s, 7, 12) === "BORDERLINE").length, 1,
   "B1c BORDERLINE band must be exactly 1 score wide (only 6)");
eq(STD.filter(([s]) => sectionStatus(s, 11, 20) === "BORDERLINE").length, 2,
   "CILS std BORDERLINE band must be exactly 2 scores wide (9 and 10)");

// The widths again, named, so a failure says which scale moved.
eq(borderlineWidthFor(12), 1, "borderline width for a /12 section is 1");
eq(borderlineWidthFor(20), 2, "borderline width for a /20 section is 2");
// An unknown scale must NOT silently widen a verdict.
eq(borderlineWidthFor(999), 1, "an unknown scale falls back to the narrow band");

// The named edges — each is a score at which a learner's word changes.
eq(sectionStatus(5, 7, 12), "BELOW", "B1c lower edge: 5 is BELOW");
eq(sectionStatus(6, 7, 12), "BORDERLINE", "B1c 6 is BORDERLINE");
eq(sectionStatus(7, 7, 12), "CLEAR", "B1c upper edge: 7 is CLEAR");
eq(sectionStatus(8, 11, 20), "BELOW", "CILS std lower edge: 8 is BELOW");
eq(sectionStatus(9, 11, 20), "BORDERLINE", "CILS std 9 is BORDERLINE");
eq(sectionStatus(10, 11, 20), "BORDERLINE", "CILS std 10 is BORDERLINE");
eq(sectionStatus(11, 11, 20), "CLEAR", "CILS std upper edge: 11 is CLEAR");

// Cross-scale: 9 is BORDERLINE on /20 but CLEAR on /12. If the two scales were ever banded on
// a single width, one of these flips.
eq(sectionStatus(9, 7, 12), "CLEAR", "the same score 9 on the /12 scale is CLEAR");

// The live engines must return exactly what the shared function returns — no engine keeps a
// private opinion.
for (const [score, want] of B1C)
  eq(scoreCilsB1c([{ section: "ASCOLTO", score }]).sections[0].status, want, "engine B1c " + score + "/12");
for (const [score, want] of STD)
  eq(scoreCilsStandard("UNO", [{ section: "ASCOLTO", score }]).sections[0].status, want, "engine CILS std " + score + "/20");

// ---- 2. SINGLE OWNER ------------------------------------------------------
// Comments are stripped BEFORE scanning. On 30 Aug two gate regexes matched their own
// explanatory comments and a third matched a renamed component, so this strips first and
// anchors to a decision SHAPE rather than to a bare word.
const OWNER = "src/lib/scoring/section-status.ts";
const ALLOWED = new Set([
  OWNER,
  "src/lib/scoring/scoring.selftest.ts",  // asserts the bands; must name them
  "scripts/gates/status-band-gate.mts",   // this file
]);

function stripComments(src: string): string {
  let out = "";
  let i = 0;
  let inLine = false, inBlock = false;
  let inStr: string | null = null;
  const BACKSLASH = String.fromCharCode(92);
  while (i < src.length) {
    const c = src[i];
    const n = i + 1 < src.length ? src[i + 1] : "";
    if (inLine) { if (c === "\n") { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i += 2; } else i++; continue; }
    if (inStr) {
      if (c === BACKSLASH) { out += c + n; i += 2; continue; }
      if (c === inStr) inStr = null;
      out += c; i++; continue;
    }
    if (c === "/" && n === "/") { inLine = true; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

// A DECISION is a threshold-ish identifier and the literal "BORDERLINE" inside ONE statement.
// Rendering code (`s.status === "BORDERLINE"`) has no floor/threshold near it and is not matched.
const DECISION = /(floor|threshold|passMark|cutoff)[^;{}]{0,80}(>=|<=|===|<|>)[^;{}]{0,160}"BORDERLINE"|(>=|<=|===|<|>)[^;{}]{0,80}(floor|threshold|passMark|cutoff)[^;{}]{0,160}"BORDERLINE"/;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next" || e === ".git") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts|mjs)$/.test(e)) out.push(p);
  }
  return out;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const offenders: string[] = [];
for (const abs of [...walk(join(root, "src")), ...walk(join(root, "scripts"))]) {
  const rel = relative(root, abs).split(String.fromCharCode(92)).join("/");
  if (ALLOWED.has(rel)) continue;
  if (DECISION.test(stripComments(readFileSync(abs, "utf8")))) offenders.push(rel);
}
ok(offenders.length === 0,
   "a second CLEAR/BORDERLINE/BELOW implementation exists outside " + OWNER + ": " + offenders.join(", "));

// The owner must still be the thing that decides. Without this, deleting the rule entirely
// would satisfy the check above.
ok(DECISION.test(stripComments(readFileSync(join(root, OWNER), "utf8"))),
   OWNER + " no longer contains the banding decision — the rule moved or vanished");

// ---- report ---------------------------------------------------------------
if (failures.length) {
  console.error("\n❌ STATUS BAND GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log("✅ status-band gate: " + (B1C.length + STD.length) + " scores pinned across 2 scales; " +
            "bands 1 and 2 wide; single owner " + OWNER + ".");
