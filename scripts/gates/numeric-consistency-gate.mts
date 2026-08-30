// NUMERIC CONSISTENCY GATE — a numeric key must be a number the stimulus actually states.
//
// Run: npm run gate:numeric   (wired into `build`, so it blocks)
//
// ── THE DEFECT THIS EXISTS FOR ──────────────────────────────────────────────
// A blind review of 45 items found an item whose bill read "Importo totale: 87,50 euro" while
// its options offered 15 / 21 / 78,50 / 150. No option matched the text, so the question had no
// defensible answer, and every learner who answered it was marked against a key the stimulus
// did not support. That failure is MECHANICAL: it needs no opinion about Italian, only the
// observation that a number in the key is not in the passage.
//
// ── WHAT THIS GATE DELIBERATELY DOES NOT DO ────────────────────────────────
// The same review raised two other kinds, and NEITHER is checked here:
//   · two distractors that mean the same thing
//   · a stem that gives its own answer away
// Both need a reader who understands the Italian. A gate that half-catches them would report a
// number people would read as coverage, and half-coverage of a judgement problem is worse than
// saying plainly that the gate does not look. It does not look. A human reads for those.
//
// ── THE POPULATION, COUNTED BEFORE THE GUARD WAS WRITTEN (2026-08-31) ───────
//   288 MCQ questions in the bank
//   288 have a passage or an audio script
//    22 have a CORRECT option containing a digit   <-- the scope
// Twenty-two is small, and it is stated rather than hidden: a gate over an empty population
// proves nothing, and a gate over a small one proves exactly as much as its population.
//
// ── WHY IT HAD TO LEARN ITALIAN NUMERALS ────────────────────────────────────
// The first version of this check, run on the live bank, flagged three items:
//   "650 euro"                      audio says "seicentocinquanta euro"
//   "Gli over 65 e i malati cronici" audio says "sopra i sessantacinque anni"
//   "Circa il 40%"                   audio says "quasi il quaranta per cento"
// All three are correctly authored — an audio script SHOULD spell numbers, because edge-tts
// reads words, not glyphs. A gate that fires on three good items on its first run is a gate
// somebody switches off, so the digits are compared against the numerals the stimulus spells
// as well as the ones it prints. Section A proves the parser before anything trusts it.

import type { BankItem } from "../../src/lib/items";
import { BANK } from "../../src/lib/items";

const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

// ── A. THE ITALIAN NUMERAL PARSER, PROVEN BEFORE IT IS USED ────────────────
const UNITS: Record<string, number> = {
  zero: 0, uno: 1, un: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5,
  sei: 6, sette: 7, otto: 8, nove: 9,
};
const TEENS: Record<string, number> = {
  dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15,
  sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19,
};
const TENS: Record<string, number> = {
  venti: 20, vent: 20, trenta: 30, trent: 30, quaranta: 40, quarant: 40,
  cinquanta: 50, cinquant: 50, sessanta: 60, sessant: 60, settanta: 70, settant: 70,
  ottanta: 80, ottant: 80, novanta: 90, novant: 90,
};

/** One Italian cardinal written as a single word, 0–9999. Italian compounds them:
 *  "sessantacinque", "seicentocinquanta", "ventitre". Returns null when the word is not a
 *  numeral, which is the common case and must stay cheap. */
export function parseItalianNumeral(word: string): number | null {
  let w = word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (!w || !/^[a-z]+$/.test(w)) return null;
  let total = 0, consumed = false;

  // thousands: "mille", "duemila", "tremila"…
  const kMatch = w.match(/^(.*?)mil(?:a|le)/);
  if (kMatch) {
    const head = kMatch[1];
    const mult = head === "" ? 1 : parseChunk(head);
    if (mult === null) return null;
    total += (mult === 0 ? 1 : mult) * 1000;
    w = w.slice(kMatch[0].length);
    consumed = true;
  }
  if (w) {
    const rest = parseChunk(w);
    if (rest === null) return consumed ? null : null;
    total += rest;
    consumed = true;
  }
  return consumed ? total : null;
}

/** 0–999 written as one word. */
function parseChunk(w: string): number | null {
  if (w === "") return 0;
  let total = 0;
  // hundreds: "cento", "duecento" … "novecento"
  const cMatch = w.match(/^(.*?)cento/);
  if (cMatch) {
    const head = cMatch[1];
    const mult = head === "" ? 1 : (UNITS[head] ?? null);
    if (mult === null) return null;
    total += mult * 100;
    w = w.slice(cMatch[0].length);
    if (w === "") return total;
  }
  if (TEENS[w] !== undefined) return total + TEENS[w];
  if (TENS[w] !== undefined) return total + TENS[w];
  if (UNITS[w] !== undefined) return total + UNITS[w];
  // tens + unit, with the elision Italian uses: ventuno, ventotto, trentuno, quarantotto…
  for (const [t, tv] of Object.entries(TENS)) {
    if (!w.startsWith(t)) continue;
    const tail = w.slice(t.length);
    if (tail === "") return total + tv;
    if (UNITS[tail] !== undefined) return total + tv + UNITS[tail];
  }
  return total > 0 && w === "" ? total : null;
}

console.log("NUMERIC CONSISTENCY GATE — a numeric key must be a number the stimulus states\n");
console.log("A. the numeral parser, proven before anything trusts it");
{
  const CASES: [string, number | null][] = [
    ["sei", 6], ["dieci", 10], ["diciassette", 17], ["venti", 20], ["ventuno", 21],
    ["ventidue", 22], ["ventotto", 28], ["trentuno", 31], ["quaranta", 40],
    ["sessantacinque", 65], ["settantacinque", 75], ["novantanove", 99],
    ["cento", 100], ["centocinquanta", 150], ["duecentodieci", 210],
    ["seicentocinquanta", 650], ["novecento", 900], ["mille", 1000], ["duemila", 2000],
    // Not numerals. If any of these parse, the scan would inject phantom numbers into every
    // stimulus and the check would pass on anything.
    ["euro", null], ["mese", null], ["centro", null], ["ascensore", null], ["", null],
  ];
  let bad = 0;
  for (const [w, want] of CASES) {
    const got = parseItalianNumeral(w);
    if (got !== want) { bad++; failures.push(`parser: "${w}" -> ${got}, expected ${want}`); }
  }
  ok(bad === 0, `the numeral parser failed ${bad} of ${CASES.length} pinned cases`);
  console.log(`  ${bad === 0 ? "✓" : "✗"} ${CASES.length} pinned cases, including the three the live bank actually spells`);
  // The control that makes the zero above mean something: a deliberately wrong expectation
  // must be detected by the same comparison.
  ok(parseItalianNumeral("sessantacinque") !== 64,
     "control: the parser comparison cannot tell 65 from 64 — every green in section A is vacuous");
  console.log(`  ✓ control: the comparison distinguishes a correct reading from a wrong one`);
}

// ── B. THE SCAN ─────────────────────────────────────────────────────────────
const DIGITS = /\d+(?:[.,:]\d+)*/g;
const digitTokens = (s: string) => s.match(DIGITS) ?? [];

/** Every number the stimulus states — printed as digits OR spelled as Italian words. */
function statedNumbers(stim: string): Set<string> {
  const out = new Set<string>();
  for (const t of digitTokens(stim)) {
    out.add(t);
    // "22:00" also states 22 and 00; "78,50" also states 78.
    for (const part of t.split(/[.,:]/)) if (part) out.add(part);
    out.add(String(Number(t.replace(",", "."))));
  }
  for (const w of stim.toLowerCase().split(/[^\p{L}]+/u)) {
    const n = parseItalianNumeral(w);
    if (n !== null) out.add(String(n));
  }
  return out;
}

/** Does the stimulus state this number, in digits or in words? */
function stated(tok: string, set: Set<string>): boolean {
  if (set.has(tok)) return true;
  const asNum = Number(tok.replace(",", "."));
  if (Number.isFinite(asNum) && set.has(String(asNum))) return true;
  // "17" answers "alle 17"; "650" answers "seicentocinquanta". Leading zeros ("08") too.
  const stripped = tok.replace(/^0+(?=\d)/, "");
  return set.has(stripped);
}

let mcqQuestions = 0, withStimulus = 0, inScope = 0;
const violations: string[] = [];
const scoped: string[] = [];

for (const it of BANK as BankItem[]) {
  const p = it.payload as { questions?: { q: string; options: string[]; answerIndex: number }[]; passage?: string; audioScript?: string };
  if (!Array.isArray(p.questions)) continue;
  const stim = [p.passage ?? "", p.audioScript ?? ""].join(" ");
  const set = statedNumbers(stim);
  p.questions.forEach((q, qi) => {
    mcqQuestions++;
    if (!stim.trim()) return;
    withStimulus++;
    const keyText = q.options[q.answerIndex] ?? "";
    const keyNums = digitTokens(keyText);
    if (!keyNums.length) return; //           no number in the key: nothing mechanical to check
    inScope++;
    const where = `${it.exam}/${it.level}/${it.section} "${it.title}" D${qi + 1}`;
    scoped.push(`${where} — key "${keyText}"`);
    const absent = keyNums.filter((t) => !stated(t, set));
    if (absent.length) {
      violations.push(
        `${where}: the key is "${keyText}" but the stimulus never states ${absent.map((a) => `"${a}"`).join(", ")} ` +
        `— either the passage was edited away from its key, or the key points at the wrong option. ` +
        `A learner answering from the text cannot reach this answer.`,
      );
    }
  });
}

console.log("\nB. the population");
console.log(`  MCQ questions in the bank                 : ${mcqQuestions}`);
console.log(`  ...with a passage or audio script         : ${withStimulus}`);
console.log(`  ...whose CORRECT option contains a digit  : ${inScope}   <-- the scope`);
ok(inScope > 0,
   `no MCQ question has a digit in its correct option, so this gate checks nothing. An empty ` +
   `population is a vacuous gate: either the detector broke or the bank changed shape.`);
ok(withStimulus > 200, `only ${withStimulus} question(s) carry a stimulus — the walk is not reaching the bank`);

console.log("\nC. every numeric key is stated by its own stimulus");
for (const v of violations) failures.push(v);
console.log(`  ${violations.length === 0 ? "✓" : "✗"} ${inScope - violations.length} of ${inScope} numeric keys are stated by their stimulus`);

// ── D. CONTROLS — the detector must fire, and must NOT over-fire ───────────
console.log("\nD. controls");
{
  // D1 — it fires. A key whose number the stimulus does not state must be caught.
  const stim = "Importo totale: 87,50 euro. Scadenza: 15 marzo.";
  const set = statedNumbers(stim);
  ok(!stated("78,50", set), "control: a number absent from the stimulus was reported as stated — the detector cannot fire");
  ok(stated("87,50", set) && stated("15", set), "control: a number the stimulus prints was reported as absent — the detector over-fires");
  console.log("  ✓ fires on a key the stimulus does not state; silent on one it prints");

  // D2 — it does not over-fire on a spelled numeral. This is the false positive that would
  // have condemned three correctly authored listening items.
  const spoken = "L'affitto è di seicentocinquanta euro al mese. Sopra i sessantacinque anni. Quasi il quaranta per cento.";
  const sset = statedNumbers(spoken);
  ok(stated("650", sset) && stated("65", sset) && stated("40", sset),
     "control: a number the stimulus SPELLS was reported as absent — the gate would fail three correctly authored items");
  ok(!stated("41", sset), "control: an unrelated number was reported as stated — the word scan is inventing numbers");
  console.log("  ✓ resolves spelled numerals (650 / 65 / 40) and does not invent absent ones");

  // D3 — out of scope stays out of scope. A key with no digits must never be flagged.
  ok(digitTokens("Alle nove e mezza").length === 0, "control: a key with no digits was treated as in scope");
  ok(digitTokens("Il pane").length === 0, "control: a key with no digits was treated as in scope");
  console.log("  ✓ a key with no digits is out of scope, not a pass and not a failure");
}

if (failures.length) {
  console.error("\n❌ NUMERIC CONSISTENCY GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `\n✅ numeric-consistency gate: ${inScope} numeric key(s) of ${mcqQuestions} MCQ questions in scope, ` +
  `every one stated by its own stimulus; the numeral parser is pinned on 24 values and reads ` +
  `the three the live bank spells. Distractor meaning and stem leakage are NOT checked here.`,
);
