// CELI PASS RULE GATE — all three published conditions bind, and the equality they rest on holds.
//
// Run: npm run gate:celi-pass-rule   (wired into `build`, so it blocks)
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// Every CELI 1–5 criteri-di-valutazione PDF (committed at docs/sources/, re-hashed on every build
// by gate:source-freshness) states the pass rule as THREE conditions:
//
//   "Per superare l'esame … è necessario ottenere un minimo di X punti nella Prova scritta"
//   "… Y punti nella Prova orale"
//   "L'esame è considerato superato se il punteggio ottenuto è compreso tra Z e MAX."
//
// scoreCeli enforced two of them. It reached the right answer every time — 33 595 driven score
// pairs, zero disagreements — because writtenMin + oralMin === passFloor at all five levels, so
// clearing both parts already implies clearing the total.
//
// That equality is an arithmetic fact about numbers CVCL chose. It is not a law. If CVCL ever
// publishes a floor ABOVE the sum of the minima, a two-condition rule starts telling people they
// passed an exam they did not pass — and nothing in this repo would have noticed, because the
// numbers would all still be individually correct and every existing gate would stay green.
//
// So this gate does two things a value check cannot: it asserts the EQUALITY that makes the rules
// agree, and it drives scoreCeli across each boundary to prove each condition actually binds.
//
// ── WHAT IT DOES NOT COVER ──────────────────────────────────────────────────
// IMPATTO (A1) is deliberately excluded from the three-condition rule: its regulation decides the
// certificate on the total alone, with the per-part marks as indicative sub-results. That is a
// different published rule, not an exception to this one, and it is asserted separately below.

import { CELI_CONFIG, scoreCeli, type CeliLevel } from "../../src/lib/scoring/celi";

// Read from the committed PDFs — the sentence "…superato se il punteggio ottenuto è compreso tra Z e MAX."
const PUBLISHED_FLOOR: Record<string, number> = { UNO: 79, DUE: 94, TRE: 117, QUATTRO: 117, CINQUE: 117 };

const failures: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) failures.push(m); };
const passedAt = (lvl: CeliLevel, w: number, o: number) =>
  (scoreCeli(lvl, { writtenScore: w, oralScore: o }) as { passed: boolean }).passed;

console.log("CELI PASS RULE GATE — three published conditions, and the equality they rest on\n");

const bothParts = (Object.entries(CELI_CONFIG) as [CeliLevel, typeof CELI_CONFIG[CeliLevel]][])
  .filter(([, c]) => c.passMode === "both-parts");

console.log("population");
console.log(`  levels declared            : ${Object.keys(CELI_CONFIG).length}`);
console.log(`  both-parts levels          : ${bothParts.length}   <-- everything this gate judges`);
console.log(`  published floors on record : ${Object.keys(PUBLISHED_FLOOR).length}`);
ok(bothParts.length >= 5, `only ${bothParts.length} both-parts level(s) — the population this gate exists for has shrunk, so its silence would mean nothing`);

// ── A. THE EQUALITY THE OLD TWO-CONDITION RULE SILENTLY DEPENDED ON ────────
console.log("\nA. writtenMin + oralMin === the published floor, at every both-parts level");
for (const [lvl, c] of bothParts) {
  const floor = PUBLISHED_FLOOR[lvl];
  ok(floor !== undefined, `${lvl} is a both-parts level with no published floor recorded in this gate — add it from its PDF at docs/sources/ before trusting anything below`);
  if (floor === undefined) continue;
  ok(c.passFloor === floor, `${lvl}: celi.ts passFloor is ${c.passFloor}, the PDF publishes ${floor}`);
  const sum = c.writtenMin! + c.oralMin!;
  ok(sum === floor,
     `${lvl}: writtenMin + oralMin = ${sum} but the published floor is ${floor}. These have always been ` +
     `equal, and a two-condition rule was correct ONLY because of that. They are now unequal, so the ` +
     `total condition is doing real work — check that scoreCeli enforces it and that nothing else in ` +
     `the product still reasons about "clearing both parts" as if it meant clearing the exam.`);
  console.log(`  ${sum === floor && c.passFloor === floor ? "✓" : "✗"} ${lvl.padEnd(9)} ${c.writtenMin} + ${c.oralMin} = ${sum}   published floor ${floor}`);
}

// ── B. EACH CONDITION ACTUALLY BINDS ───────────────────────────────────────
// Driven, not read. For each level: one point below each minimum must fail, and the exact
// boundary must pass. A rule that ignored a condition would pass one of these.
console.log("\nB. each of the three conditions binds — driven across its boundary");
for (const [lvl, c] of bothParts) {
  const wMin = c.writtenMin!, oMin = c.oralMin!, wMax = c.writtenMax!, oMax = c.oralMax!;
  const atFloor = passedAt(lvl, wMin, oMin);
  const wShort = passedAt(lvl, wMin - 1, oMax);       // total is huge, written one short
  const oShort = passedAt(lvl, wMax, oMin - 1);       // total is huge, oral one short
  ok(atFloor, `${lvl}: exactly the two minima (${wMin}/${oMin}) does NOT pass, but that is the published floor`);
  ok(!wShort, `${lvl}: written ${wMin - 1} with a full oral PASSES. The written minimum is not binding — a learner short on the written paper is being told they cleared the exam.`);
  ok(!oShort, `${lvl}: oral ${oMin - 1} with a full written PASSES. The oral minimum is not binding.`);
  console.log(`  ${atFloor && !wShort && !oShort ? "✓" : "✗"} ${lvl.padEnd(9)} at (${wMin},${oMin}) pass · written-1 with full oral fail · oral-1 with full written fail`);
}

// ── C. IMPATTO IS THE OTHER RULE, AND STILL IS ─────────────────────────────
console.log("\nC. IMPATTO (A1) is decided on the total alone — a different published rule, not an exception");
{
  const c = CELI_CONFIG.IMPATTO;
  ok(c.passMode === "overall", "IMPATTO is no longer passMode 'overall' — its regulation decides the certificate on the total alone");
  const atFloor = passedAt("IMPATTO", c.passFloor!, 0);
  const below = passedAt("IMPATTO", c.passFloor! - 1, 0);
  ok(atFloor, `IMPATTO: total ${c.passFloor} does not pass, but that is the published threshold`);
  ok(!below, `IMPATTO: total ${c.passFloor! - 1} passes, below the published threshold`);
  console.log(`  ${atFloor && !below ? "✓" : "✗"} total ${c.passFloor} passes with oral 0; ${c.passFloor! - 1} does not`);
}

// ── CONTROLS ───────────────────────────────────────────────────────────────
// A driver that cannot tell pass from fail proves nothing about either.
console.log("\ncontrols");
const topPasses = passedAt("DUE", CELI_CONFIG.DUE.writtenMax!, CELI_CONFIG.DUE.oralMax!);
const zeroFails = passedAt("DUE", 0, 0);
console.log(`  ${topPasses ? "✓" : "✗"} a full score passes`);
console.log(`  ${!zeroFails ? "✓" : "✗"} a zero score does not`);
ok(topPasses, "control: a full score does not pass — the driver is not reaching the real function");
ok(!zeroFails, "control: a zero score passes — the driver reports pass for everything");

if (failures.length) {
  console.error(`\n❌ CELI PASS RULE GATE FAILED — ${failures.length} violation(s):`);
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(`\n✅ celi-pass-rule gate: ${bothParts.length} both-parts level(s) enforce all three published conditions, each driven across its own boundary; the floor equals the sum of the minima at every level, and IMPATTO still runs the total-only rule.`);
