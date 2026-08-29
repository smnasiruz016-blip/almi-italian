// EXAM VERDICT GATE — the four score→verdict families that are not the three-band status.
//
// Run: npm run gate:exam-verdict   (wired into `build`, so it blocks)
//
// #56 gave CLEAR / BORDERLINE / BELOW a single owner and a gate. These four decide things that
// are at least as consequential and had no gate at all:
//
//   1. cils-standard.ts:74-75  banked / toRetake  — "you must sit this section again"
//   2. celi.ts:112-115,130-131 pass, and which part banks for a year
//   3. celi.ts:117-124         the A/B/C/D/E grade band, or PASS/FAIL
//   4. ai/official-rubrics     a criterion we cannot assess -> band null -> "Non valutato"
//
// Unlike the three-band status, each of these has exactly ONE implementation — there was
// nothing to collapse. What was missing is that nothing asserted their thresholds.
//
// 🔴 WHY (1) IS FIRST. Changing the banking comparison from `>= CILS_STANDARD_FLOOR` to
// `>= CILS_STANDARD_FLOOR - 2` was measured against the whole chain and EVERY gate stayed
// green, including the engine self-test. A learner scoring 9/20 would have been told the
// section banks when it must be re-sat. The self-test does exercise banking, but its scenario
// scores (8 and 6) sit below both the real and the drifted threshold, so it cannot see the
// drift. A test that passes proves nothing until you know what input it was given.
//
// THE NUMBERS BELOW ARE LITERALS, DELIBERATELY.
// They are NOT read from CILS_STANDARD_FLOOR or CELI_CONFIG. A check fed the same constant the
// code reads moves with it and can never fail. These have to be edited by hand, in the diff.
//
// The CELI figures are official, from the CVCL criteri-di-valutazione PDFs. The CILS standard
// 11/20 is official too — the Istituto Italiano di Cultura Algiers information sheet, quoted in
// content/learn/cils-b1c-scoring-and-criteria.md and independently confirmed by Siena's Linee
// guida. Pinning 11 here matters twice over: content/learn renders {{CILS_STANDARD_FLOOR}} from
// this same constant, so a drift would silently rewrite a sentence that cites a government
// source, turning a sourced claim into a fabricated one.

import { scoreCilsStandard, CILS_STANDARD_SECTIONS } from "../../src/lib/scoring/cils-standard";
import { scoreCeli } from "../../src/lib/scoring/celi";
import { CILS_B1C_SCRITTA, CILS_B1C_ORALE } from "../../src/lib/ai/official-rubrics";

const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };
const eq = (got: unknown, want: unknown, msg: string) =>
  ok(got === want, msg + " — got " + JSON.stringify(got) + ", expected " + JSON.stringify(want));

const ALL = CILS_STANDARD_SECTIONS.map((s) => s.section);

// ---- 1. BANKING: the boundary is 11/20, and it is the sourced number -------
// One section is varied while the rest are held at a clear 20, so the only thing that can move
// the result is the score under test.
function bankedAt(score: number): string[] {
  const inputs = ALL.map((section) => ({ section, score: section === "ASCOLTO" ? score : 20 }));
  return scoreCilsStandard("UNO", inputs).bankedToday as unknown as string[];
}
function retakeAt(score: number): string[] {
  const inputs = ALL.map((section) => ({ section, score: section === "ASCOLTO" ? score : 20 }));
  return scoreCilsStandard("UNO", inputs).toRetake as unknown as string[];
}

// The edge, written out. 10 must NOT bank; 11 must bank. Widening or narrowing the banking
// comparison moves one of these two, so this pair fails in BOTH directions.
ok(!bankedAt(10).includes("ASCOLTO"), "a section scoring 10/20 must NOT bank (floor is 11)");
ok(bankedAt(11).includes("ASCOLTO"), "a section scoring 11/20 MUST bank (floor is 11)");
ok(retakeAt(10).includes("ASCOLTO"), "a section scoring 10/20 MUST be listed for retake");
ok(!retakeAt(11).includes("ASCOLTO"), "a section scoring 11/20 must NOT be listed for retake");

// Two points either side, so a drift of 1 OR 2 is caught even if an edge were mis-specified.
ok(!bankedAt(9).includes("ASCOLTO"), "9/20 must NOT bank");
ok(!bankedAt(8).includes("ASCOLTO"), "8/20 must NOT bank");
ok(bankedAt(12).includes("ASCOLTO"), "12/20 must bank");

// Every score, banked and retake are exact complements — a section is never both or neither.
for (let s = 0; s <= 20; s++) {
  const b = bankedAt(s).includes("ASCOLTO");
  const r = retakeAt(s).includes("ASCOLTO");
  ok(b !== r, `score ${s}/20: banked and toRetake must be exact complements (got banked=${b}, retake=${r})`);
  eq(b, s >= 11, `score ${s}/20 banks only when >= 11`);
}

// A full pass banks all five; a full fail banks none.
eq(scoreCilsStandard("UNO", ALL.map((section) => ({ section, score: 11 }))).bankedToday.length, 5,
   "all five sections at exactly 11 bank all five");
eq(scoreCilsStandard("UNO", ALL.map((section) => ({ section, score: 10 }))).bankedToday.length, 0,
   "all five sections at 10 bank nothing");
eq(scoreCilsStandard("UNO", ALL.map((section) => ({ section, score: 10 }))).toRetake.length, 5,
   "all five sections at 10 are all re-sat");

// ---- 2. CELI: part minima, pass, and which part banks ----------------------
// Official CVCL minima, written out per level: [level, writtenMin, oralMin].
const CELI_MINIMA: [string, number, number][] = [
  ["UNO", 54, 25],
  ["DUE", 72, 22],
  ["TRE", 84, 33],
  ["QUATTRO", 84, 33],
  ["CINQUE", 89, 28],
];
for (const [lv, wMin, oMin] of CELI_MINIMA) {
  const L = lv as Parameters<typeof scoreCeli>[0];
  const atMin = scoreCeli(L, { writtenScore: wMin, oralScore: oMin });
  const wUnder = scoreCeli(L, { writtenScore: wMin - 1, oralScore: oMin });
  const oUnder = scoreCeli(L, { writtenScore: wMin, oralScore: oMin - 1 });
  eq(atMin.passed, true, `CELI ${lv}: exactly ${wMin}/${oMin} passes (both minima are inclusive)`);
  eq(wUnder.passed, false, `CELI ${lv}: written ${wMin - 1} (one under) fails`);
  eq(oUnder.passed, false, `CELI ${lv}: oral ${oMin - 1} (one under) fails`);
  // Exactly one part cleared -> that part banks for one year. Both or neither -> nothing banks.
  eq(wUnder.banking?.bankablePart, "ORAL", `CELI ${lv}: failing written banks the ORAL part`);
  eq(oUnder.banking?.bankablePart, "WRITTEN", `CELI ${lv}: failing oral banks the WRITTEN part`);
  eq(wUnder.banking?.years, 1, `CELI ${lv}: a banked part lasts 1 year`);
  eq(atMin.banking, null, `CELI ${lv}: nothing banks when both parts clear`);
  eq(scoreCeli(L, { writtenScore: 0, oralScore: 0 }).banking, null,
     `CELI ${lv}: nothing banks when neither part clears`);
}

// A1 Impatto is "overall": a single total threshold, and NO capitalizzazione at all.
eq(scoreCeli("IMPATTO", { writtenScore: 8, oralScore: 8 }).passed, true, "CELI A1: total 16 passes");
eq(scoreCeli("IMPATTO", { writtenScore: 8, oralScore: 7 }).passed, false, "CELI A1: total 15 fails");
eq(scoreCeli("IMPATTO", { writtenScore: 16, oralScore: 0 }).passed, true,
   "CELI A1: total 16 passes even with a zero part (overall mode does not gate on parts)");
eq(scoreCeli("IMPATTO", { writtenScore: 16, oralScore: 0 }).banking, null,
   "CELI A1 never banks a part");

// ---- 3. CELI grade bands: every boundary, both sides -----------------------
// [level, total, band] — official A-E floors, written out.
const CELI_BANDS: [string, number, string][] = [
  // CELI 2 (B1): A 138, B 115, C 94, D 60, E below 60.
  ["DUE", 59, "E"], ["DUE", 60, "D"], ["DUE", 93, "D"], ["DUE", 94, "C"],
  ["DUE", 114, "C"], ["DUE", 115, "B"], ["DUE", 137, "B"], ["DUE", 138, "A"], ["DUE", 160, "A"],
  // CELI 3 (B2) and CELI 4 (C1) share the 173/144/117/69 frame.
  ["TRE", 68, "E"], ["TRE", 69, "D"], ["TRE", 116, "D"], ["TRE", 117, "C"],
  ["TRE", 143, "C"], ["TRE", 144, "B"], ["TRE", 172, "B"], ["TRE", 173, "A"],
  ["QUATTRO", 68, "E"], ["QUATTRO", 69, "D"], ["QUATTRO", 172, "B"], ["QUATTRO", 173, "A"],
  // CELI 5 (C2): D floor is 72, NOT C1's 69. Guards cross-level transcription.
  ["CINQUE", 71, "E"], ["CINQUE", 72, "D"], ["CINQUE", 116, "D"], ["CINQUE", 117, "C"],
  ["CINQUE", 143, "C"], ["CINQUE", 144, "B"], ["CINQUE", 172, "B"], ["CINQUE", 173, "A"],
];
// Official part maxima, also literals, used only to SPLIT a total across the two parts.
// Each part is clamped to its own max inside the engine, so a total cannot be delivered
// through the written part alone.
const CELI_MAXES: Record<string, [number, number]> = {
  DUE: [120, 40], TRE: [140, 60], QUATTRO: [140, 60], CINQUE: [150, 50],
};
function split(lv: string, total: number): { writtenScore: number; oralScore: number } {
  const [wMax, oMax] = CELI_MAXES[lv];
  const w = Math.min(total, wMax);
  const o = Math.min(total - w, oMax);
  if (w + o !== total) throw new Error(`cannot express total ${total} for CELI ${lv} within ${wMax}+${oMax}`);
  return { writtenScore: w, oralScore: o };
}
for (const [lv, total, band] of CELI_BANDS) {
  const L = lv as Parameters<typeof scoreCeli>[0];
  const r = scoreCeli(L, split(lv, total)) as { gradeBand?: string };
  eq(r.gradeBand, band, `CELI ${lv} total ${total} -> band ${band}`);
}
// The two graded levels that share a frame must NOT share the C2 D-floor.
eq((scoreCeli("QUATTRO", split("QUATTRO", 69)) as { gradeBand: string }).gradeBand, "D",
   "CELI 4 (C1) D-floor is 69");
eq((scoreCeli("CINQUE", split("CINQUE", 69)) as { gradeBand: string }).gradeBand, "E",
   "CELI 5 (C2) D-floor is 72, so 69 is still E");
// Ungraded levels never invent an A-E letter.
eq((scoreCeli("UNO", { writtenScore: 54, oralScore: 25 }) as { gradeBand: string }).gradeBand, "PASS",
   "CELI 1 (A2) is PASS/FAIL, never a letter");
eq((scoreCeli("IMPATTO", { writtenScore: 8, oralScore: 8 }) as { gradeBand: string }).gradeBand, "PASS",
   "CELI Impatto (A1) is PASS/FAIL, never a letter");

// ---- 4. "Non valutato": the unassessable criterion ------------------------
// EstimateReport renders the chip on `band === null`. That null originates here: a rubric
// criterion flagged notAssessed. If the flag is ever dropped, the criterion silently starts
// looking like a zero instead of an unassessed point — the one thing the chip exists to prevent.
const allCriteria = [...CILS_B1C_SCRITTA, ...CILS_B1C_ORALE];
const notAssessed = allCriteria.filter((c) => c.notAssessed);
ok(notAssessed.length >= 1,
   "at least one official rubric criterion must remain flagged notAssessed — the CILS B1c speaking " +
   "pronunciation point cannot be judged from a transcript, and dropping the flag makes it read as a zero");
for (const c of notAssessed) {
  const cc = c as { label?: string; max?: number; notAssessedReason?: string };
  ok(Boolean(cc.notAssessedReason && cc.notAssessedReason.trim()),
     `notAssessed criterion "${cc.label}" must carry a reason — an unexplained blank reads as a zero`);
  ok(typeof cc.max === "number" && cc.max > 0,
     `notAssessed criterion "${cc.label}" must still declare its official max, so the denominator stays honest`);
}

// ---- report ---------------------------------------------------------------
if (failures.length) {
  console.error("\n❌ EXAM VERDICT GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  "✅ exam-verdict gate: CILS banking pinned at 11/20 across 21 scores; " +
  CELI_MINIMA.length + " CELI levels' part minima and banking; " +
  CELI_BANDS.length + " CELI band boundaries; " +
  notAssessed.length + " notAssessed criterion/criteria intact.",
);
