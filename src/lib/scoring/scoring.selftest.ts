// AlmiItalian scoring self-tests. Run: npm run selftest:engine
// Covers all three engine paths + the two mandated guards: no-banking-on-B1c and scales-never-mixed.
import { scoreCilsStandard, CILS_STANDARD_FLOOR, CILS_STANDARD_SECTIONS } from "./cils-standard";
import { scoreCilsB1c, CILS_B1C_FLOOR, CILS_B1C_TOTAL_FLOOR, CILS_B1C_SECTIONS } from "./cils-b1c";
import { scoreCeli, CELI_CONFIG } from "./celi";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; } else { failed++; console.error("✗ " + msg); }
}
function eq<T>(a: T, b: T, msg: string) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`); }

// ---------- CILS STANDARD: floors + capitalization banking ----------
{
  const r = scoreCilsStandard("DUE", [
    { section: "ASCOLTO", score: 15 },
    { section: "LETTURA", score: 12 },
    { section: "ANALISI", score: 8 }, //  below 11 → retake
    { section: "SCRITTA", score: 11 },
    { section: "ORALE", score: 6 }, //    below 11 → retake
  ]);
  eq(r.total, 52, "CILS std total sums sections");
  eq(r.passed, false, "CILS std fails when any section < 11");
  eq(r.bankedToday.length, 3, "CILS std banks the 3 sections ≥11 today");
  eq(r.toRetake.length, 2, "CILS std flags 2 sections to retake");
  assert(r.bankingModel === "capitalization", "CILS std uses capitalization banking");
  assert(r.bankedToday.includes("ASCOLTO") && r.bankedToday.includes("SCRITTA"), "CILS std banks the exact passed sections");
  const allPass = scoreCilsStandard("UNO", CILS_STANDARD_SECTIONS.map((s) => ({ section: s.section, score: 11 })));
  eq(allPass.passed, true, "CILS std passes when every section == floor 11");
  eq(CILS_STANDARD_FLOOR, 11, "CILS std floor is 11");
  assert(CILS_STANDARD_SECTIONS.find((s) => s.section === "ANALISI") !== undefined, "CILS std has the distinctive Analisi section");
  assert(CILS_STANDARD_SECTIONS.filter((s) => s.isEstimate).length === 2, "CILS std marks Scritta+Orale as estimates");
}

// ---------- CILS B1c: BOTH conditions, NO banking (mandated guard) ----------
{
  // All sections ≥7 but total < 28 → FAIL on the total condition.
  const lowTotal = scoreCilsB1c([
    { section: "ASCOLTO", score: 7 }, { section: "LETTURA", score: 7 },
    { section: "SCRITTA", score: 7 }, { section: "ORALE", score: 6 }, // 6 < 7 → also section fail; total 27
  ]);
  eq(lowTotal.total, 27, "B1c total sums the four /12 sections");
  eq(lowTotal.conditions.totalThresholdMet, false, "B1c total 27 < 28 fails the total condition");
  eq(lowTotal.passed, false, "B1c fails when total < 28");

  // One section below floor but total ≥28 → still FAIL on the per-section condition.
  const oneBelow = scoreCilsB1c([
    { section: "ASCOLTO", score: 12 }, { section: "LETTURA", score: 12 },
    { section: "SCRITTA", score: 6 }, //  < 7
    { section: "ORALE", score: 10 }, //   total = 40 ≥ 28
  ]);
  eq(oneBelow.total, 40, "B1c total 40");
  eq(oneBelow.conditions.totalThresholdMet, true, "B1c total 40 meets total condition");
  eq(oneBelow.conditions.perSectionFloorMet, false, "B1c one section < 7 fails the per-section condition");
  eq(oneBelow.passed, false, "B1c fails when any section < 7 even if total ≥28");

  const clean = scoreCilsB1c([
    { section: "ASCOLTO", score: 7 }, { section: "LETTURA", score: 7 },
    { section: "SCRITTA", score: 7 }, { section: "ORALE", score: 7 }, // 28, all ≥7
  ]);
  eq(clean.total, 28, "B1c total exactly 28");
  eq(clean.passed, true, "B1c passes at ≥7 each AND ≥28 total");

  // MANDATED GUARD: B1c must never expose a banking mechanism.
  assert(clean.bankingModel === "none", "B1c bankingModel is 'none' (all-or-nothing)");
  assert(!("bankedToday" in clean), "B1c result must NOT carry a bankedToday field (no capitalization)");
  eq(CILS_B1C_FLOOR, 7, "B1c section floor is 7");
  eq(CILS_B1C_TOTAL_FLOOR, 28, "B1c total floor is 28");
}

// ---------- CELI: both-parts + band estimate + one-year part banking ----------
{
  // CELI 2 (B1) — official: written /120 min72, oral /40 min22, total /160, C floor 94.
  const b1pass = scoreCeli("DUE", { writtenScore: 80, oralScore: 25 });
  assert(b1pass.verified === true && b1pass.pending === false, "CELI B1 is verified/locked");
  if (b1pass.verified) {
    eq(b1pass.total, 105, "CELI B1 total sums parts");
    eq(b1pass.passed, true, "CELI B1 passes when both parts clear their min");
    eq(b1pass.gradeBand, "C", "CELI B1 total 105 → band C (sufficiente)");
    eq(b1pass.banking, null, "CELI B1 no banking when both parts pass");
    assert(b1pass.isEstimate === true, "CELI band is always an estimate");
  }
  // Strong written, failed oral → not passed, WRITTEN banks one year.
  const b1oralFail = scoreCeli("DUE", { writtenScore: 115, oralScore: 10 });
  if (b1oralFail.verified) {
    eq(b1oralFail.passed, false, "CELI B1 fails when oral < min even with strong written");
    assert(b1oralFail.banking?.bankablePart === "WRITTEN" && b1oralFail.banking?.years === 1, "CELI B1 banks the passed WRITTEN part for 1 year");
  }
  // Band boundary: total 93 → D (fail), 94 → C (pass).
  const justFail = scoreCeli("DUE", { writtenScore: 72, oralScore: 21 }); // oral 21 < 22 → fail anyway; check band
  const b1band94 = scoreCeli("DUE", { writtenScore: 72, oralScore: 22 }); // total 94
  if (b1band94.verified) eq(b1band94.gradeBand, "C", "CELI B1 total 94 → C (pass floor)");
  if (justFail.verified) eq(justFail.gradeBand, "D", "CELI B1 total 93 → D (fail band)");

  // CELI 3 (B2) — official: written /140 min84, oral /60 min33, total /200, C floor 117, has Linguistic Competence.
  const b2 = scoreCeli("TRE", { writtenScore: 130, oralScore: 45 });
  if (b2.verified) {
    eq(b2.total, 175, "CELI B2 total");
    eq(b2.gradeBand, "A", "CELI B2 total 175 → band A (173–200)");
    eq(b2.passed, true, "CELI B2 passes when both parts clear");
  }
  eq(CELI_CONFIG.TRE.totalMax, 200, "CELI B2 total max is 200 (official)");
  eq(CELI_CONFIG.DUE.totalMax, 160, "CELI B1 total max is 160 (official)");

  // CELI 1 (A2) — official: written /90 min54, oral /40 min25, total /130, superato ≥79, pass/fail (no A–E).
  const a2 = scoreCeli("UNO", { writtenScore: 54, oralScore: 25 });
  assert(a2.verified === true && a2.pending === false, "CELI A2 (CELI 1) is verified/locked");
  if (a2.verified) {
    eq(a2.total, 79, "CELI A2 total 54+25");
    eq(a2.passed, true, "CELI A2 passes at both minima (54/25)");
    eq(a2.gradeBand, "PASS", "CELI A2 is pass/fail (no A–E band)");
  }
  const a2fail = scoreCeli("UNO", { writtenScore: 53, oralScore: 25 }); // written below 54
  if (a2fail.verified) {
    eq(a2fail.passed, false, "CELI A2 fails when written < 54");
    assert(a2fail.banking?.bankablePart === "ORAL", "CELI A2 banks the passed ORAL part");
  }
  eq(CELI_CONFIG.UNO.totalMax, 130, "CELI A2 total max 130 (official)");

  // CELI 4 (C1) — official: 140/60/200, min 84/33, C floor 117, bands A–E (D floor 69).
  const c1 = scoreCeli("QUATTRO", { writtenScore: 130, oralScore: 45 });
  if (c1.verified) {
    eq(c1.total, 175, "CELI C1 total");
    eq(c1.gradeBand, "A", "CELI C1 total 175 → A");
    eq(c1.passed, true, "CELI C1 passes when both parts clear");
  }
  eq((scoreCeli("QUATTRO", { writtenScore: 69, oralScore: 0 }) as { gradeBand: string }).gradeBand, "D", "CELI C1 total 69 → D (E is 0–68)");
  eq((scoreCeli("QUATTRO", { writtenScore: 68, oralScore: 0 }) as { gradeBand: string }).gradeBand, "E", "CELI C1 total 68 → E");

  // CELI 5 (C2) — official: 150/50/200, min 89/28, C floor 117, bands A–E with D floor 72 (distinct from C1's 69).
  const c2 = scoreCeli("CINQUE", { writtenScore: 100, oralScore: 30 });
  if (c2.verified) {
    eq(c2.total, 130, "CELI C2 total 100+30");
    eq(c2.gradeBand, "C", "CELI C2 total 130 → C (117–143)");
    eq(c2.passed, true, "CELI C2 passes at both minima (89/28)");
  }
  eq(CELI_CONFIG.CINQUE.writtenMax, 150, "CELI C2 written max 150 (official)");
  // C2's D/E boundary is 72 — NOT C1's 69. Guards against cross-level transcription.
  eq((scoreCeli("CINQUE", { writtenScore: 72, oralScore: 0 }) as { gradeBand: string }).gradeBand, "D", "CELI C2 total 72 → D");
  eq((scoreCeli("CINQUE", { writtenScore: 71, oralScore: 0 }) as { gradeBand: string }).gradeBand, "E", "CELI C2 total 71 → E (C2 D-floor 72 ≠ C1 69)");

  // IMPATTO (A1) stays PENDING BY DESIGN: numerics officially read, but its single-overall-threshold pass
  // (total ≥16 → P/N, no per-part minima, no banking) is not representable in the both-parts model yet.
  const a1 = scoreCeli("IMPATTO", { writtenScore: 999, oralScore: 999 });
  eq(a1.pending, true, "CELI Impatto (A1) still PENDING — overall-threshold pass model not yet in engine");
  assert(!("passed" in a1), "CELI pending result carries no passed field");
}

// ---------- MANDATED GUARD: scales are never mixed across engines ----------
{
  // Each engine has its own section vocabulary and its own scale — no shared, reusable scale object.
  const stdSections = new Set(CILS_STANDARD_SECTIONS.map((s) => s.section)); // 5
  const b1cSections = new Set(CILS_B1C_SECTIONS.map((s) => s.section)); // 4
  eq(stdSections.size, 5, "CILS standard has 5 sections");
  eq(b1cSections.size, 4, "CILS B1c has 4 sections");
  assert(stdSections.has("ANALISI") && !(b1cSections as Set<string>).has("ANALISI"), "Analisi exists in standard but NOT in B1c — scales not blended");
  // Different per-section maxima prove the scales differ (20 vs 12), and CELI has no per-section /N at all.
  assert((CILS_STANDARD_FLOOR as number) !== (CILS_B1C_FLOOR as number), "CILS standard floor (11) ≠ B1c floor (7)");
  const b1 = scoreCilsB1c(CILS_B1C_SECTIONS.map((s) => ({ section: s.section, score: 12 })));
  assert(b1.totalMax === 48 && "conditions" in b1, "B1c result shape is its own (/48, two conditions) — not the /100 standard shape");
  const std = scoreCilsStandard("A2", CILS_STANDARD_SECTIONS.map((s) => ({ section: s.section, score: 20 })));
  assert(std.totalMax === 100 && "bankedToday" in std, "CILS standard result shape is its own (/100, banking) — not B1c");
  assert(scoreCeli("DUE", { writtenScore: 0, oralScore: 0 }).exam === "CELI", "CELI result is its own exam family");
}

console.log(failed === 0 ? `\n✓ All ${passed} scoring assertions passed (3 engines, no cross-contamination).` : `\n✗ ${failed} FAILED, ${passed} passed`);
if (failed > 0) process.exit(1);
