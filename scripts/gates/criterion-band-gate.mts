// CRITERION BAND GATE — the word next to a criterion's score.
//
// Run: npm run gate:criterion-band   (wired into `build`, so it blocks)
//
// WHY THIS EXISTS
// `band` is a field of the AI schema: the model fills it in, in parallel with `points`, and
// nothing compared the two. A live production report carried, on one screen at one moment:
//
//     Adeguatezza stilistica      0/1  ->  "Non raggiunto"
//     Ortografia e punteggiatura  0/1  ->  "Parziale"
//
// Same value, same ceiling, two different verdicts. criterionBand() now derives the word from
// the score wherever a score exists, and this gate holds that line.
//
// TWO CASES, AND THE SECOND MATTERS AS MUCH AS THE FIRST
//   1. points and pointsMax are numbers  -> the band MUST equal f(points, pointsMax).
//   2. either is null                    -> the model's band MUST be returned untouched.
// Case 2 is not a formality. CILS UNO/DUE and CELI publish no per-criterion weights; the prompt
// orders points = null there and, as schemas.ts:53-54 and summary-consistency.ts:64-67 both
// record, THE BAND CARRIES THE VERDICT on those modules. A derivation that swallowed the null
// case would delete the only verdict those exams have. So this gate fails if the null case
// starts returning anything at all.
//
// HOW THE RENDER SITE IS CHECKED
// Not with a regex over `className="..."`. That was the #59 blind spot: the verdict colours
// lived in ternaries and a lookup map, a sabotage reverting one stayed green, and the scan had
// to be widened to every string literal. The same lesson applies here, so the render check
// reads the component's source with comments stripped and asserts it derives from the shared
// function rather than printing whatever arrived.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { criterionBand, type CriterionBand } from "../../src/lib/scoring/section-status";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };
const eq = (got: unknown, want: unknown, msg: string) =>
  ok(got === want, msg + " — got " + JSON.stringify(got) + ", expected " + JSON.stringify(want));

// ---- CASE 1: a number exists, so the number decides -----------------------
// Written out as literals. Not generated from criterionBand's own rule — a table produced by
// the function under test agrees with it by construction and proves nothing.
const CASES: [number, number, CriterionBand][] = [
  // the published B1c ceilings: 1, 3 and 4 points
  [0, 1, "NON_RAGGIUNTO"], [1, 1, "RAGGIUNTO"],
  [0, 3, "NON_RAGGIUNTO"], [1, 3, "PARZIALE"], [2, 3, "PARZIALE"], [3, 3, "RAGGIUNTO"],
  [0, 4, "NON_RAGGIUNTO"], [1, 4, "PARZIALE"], [2, 4, "PARZIALE"], [3, 4, "PARZIALE"], [4, 4, "RAGGIUNTO"],
  // a 12-point whole-section ceiling, for the ends and one middle
  [0, 12, "NON_RAGGIUNTO"], [6, 12, "PARZIALE"], [12, 12, "RAGGIUNTO"],
];
for (const [pts, max, want] of CASES) eq(criterionBand(pts, max), want, `${pts}/${max}`);

// The live defect, named: both rows are 0/1 and both must now read the same.
eq(criterionBand(0, 1), "NON_RAGGIUNTO", "Adeguatezza stilistica 0/1");
eq(criterionBand(0, 1), "NON_RAGGIUNTO", "Ortografia e punteggiatura 0/1 (was 'Parziale')");

// On a 1-point criterion the rubric offers only two outcomes, so PARZIALE must be unreachable.
ok(!([0, 1].map((p) => criterionBand(p, 1)).includes("PARZIALE")),
   "PARZIALE must be impossible on a 1-point criterion — the rubric has no middle state there");

// ---- CASE 2: no number, so the model's word is left alone ----------------
for (const [pts, max, label] of [
  [null, null, "both null (CILS UNO/DUE, CELI — the band IS the verdict)"],
  [null, 3, "points null, ceiling known"],
  [2, null, "points known, ceiling null"],
  [undefined, undefined, "both absent"],
  [1, 0, "a zero ceiling is not a scale"],
] as [number | null | undefined, number | null | undefined, string][]) {
  eq(criterionBand(pts, max), null,
     `${label}: criterionBand must return null so the model's band survives`);
}

// ---- the render site actually uses it ------------------------------------
function stripComments(src: string): string {
  let out = "", i = 0, inLine = false, inBlock = false;
  let inStr: string | null = null;
  const BS = String.fromCharCode(92);
  while (i < src.length) {
    const c = src[i], n = i + 1 < src.length ? src[i + 1] : "";
    if (inLine) { if (c === "\n") { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i += 2; } else i++; continue; }
    if (inStr) { if (c === BS) { out += c + n; i += 2; continue; } if (c === inStr) inStr = null; out += c; i++; continue; }
    if (c === "/" && n === "/") { inLine = true; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

const REPORT = "src/components/EstimateReport.tsx";
const code = stripComments(readFileSync(join(root, REPORT), "utf8"));
ok(/criterionBand\s*\(/.test(code),
   `${REPORT} does not call criterionBand — the rendered word is not derived from the score`);
ok(/criterionBand\s*\(\s*c\.points\s*,\s*c\.pointsMax\s*\)/.test(code),
   `${REPORT} calls criterionBand with the wrong arguments — it must read the criterion's own points and ceiling`);
// The model's band must still be the fallback, or the null case loses its verdict.
ok(/\?\?\s*c\.band/.test(code),
   `${REPORT} no longer falls back to the model's band — CILS UNO/DUE and CELI would lose their only verdict`);
// And the label lookup must read the resolved band, never the raw field.
ok(!/BAND_LABEL\[c\.band\]/.test(code),
   `${REPORT} still looks the label up from c.band directly, bypassing the derivation`);

if (failures.length) {
  console.error("\n❌ CRITERION BAND GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `✅ criterion-band gate: ${CASES.length} scored cases pinned as literals; PARZIALE unreachable ` +
  `at 1 point; 5 unscored shapes return null so the model's band survives on part-scored exams; ` +
  `${REPORT} derives from criterionBand(c.points, c.pointsMax).`,
);
