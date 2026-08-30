// OPTION CATEGORY GATE — no option belongs to a category that cannot answer the question.
//
// Run: npm run gate:option-category   (wired into `build`, so it blocks)
//
// ── WHAT THIS FOUND ─────────────────────────────────────────────────────────
// "A che ora chiude lo sportello?" — Alle 8:30 / Alle 13:30 / Alle 18:00 / **Al sabato**.
// A day of the week cannot answer a clock-time question, so no learner reading the stem could
// take the fourth option seriously: a four-option item that is really a three-way choice, and a
// learner's score on it is a third easier than the item claims. It came from the same item's
// THIRD question, whose key is "Il sabato" — the author's eye slid one question up.
//
// ── WHY THE RULE IS THIS NARROW, AND WHAT THAT COSTS ────────────────────────
// The first version of this rule classified the QUESTION by its interrogative and reached
// 33 of 288 questions. 208 landed in "ALTRO", so a zero from it was a zero from a filter.
//
// The second version dropped the interrogative and flagged any option whose category differed
// from the other three. That reached 34 typed questions and produced 8 hits — of which SEVEN
// were fine: "Ogni giorno", "Mai", "Sempre", "Non è indicato", "Tutti i giorni" are legitimate
// and often excellent distractors, because rejecting them is exactly the comprehension being
// tested. Precision 1 in 8. A gate at that precision teaches people to add exceptions.
//
// So the rule is narrowed to the one pair that is genuinely incompatible: a DAY among CLOCKs,
// or a CLOCK among DAYs. Neither can answer the other's question in any phrasing.
//
// ⚠️ WHAT THAT LEAVES UNCHECKED, stated rather than implied: 254 of 288 questions have no
// option carrying a category at all, and this gate says nothing about them. It is not a claim
// that the bank's options are coherent. It is a claim about one confusion, checked completely.

import { BANK } from "../../src/lib/items";

type Q = { q: string; options: string[]; answerIndex: number };
type Item = { exam: string; level: string; section: string; title: string; payload: { questions?: Q[] } };

const items = BANK as unknown as Item[];
const failures: string[] = [];

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const DAY = /\b(lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica)\b/;
const CLOCK = /(\b\d{1,2}[:.]\d{2}\b|\b(all[ae]|ore)\s+\d|\bmezzogiorno\b|\bmezzanotte\b)/;

// A day AND a clock in one option ("Sabato alle 17") is neither — it answers both, which is
// what a well-made schedule option looks like. Only a pure one counts.
function pureCat(o: string): "DAY" | "CLOCK" | null {
  const s = strip(o);
  const d = DAY.test(s), c = CLOCK.test(s);
  if (d && !c) return "DAY";
  if (c && !d) return "CLOCK";
  return null;
}

console.log("OPTION CATEGORY GATE — a day cannot answer a clock question, or the reverse\n");

const allQ = items.filter((i) => Array.isArray(i.payload.questions))
  .flatMap((i) => i.payload.questions!.map((q) => ({ i, q })));

// The stem decides which category is incoherent, and only two stems decide it cleanly.
//
// A first version left the stem out and asked only whether one option's category differed from
// the others'. It flagged two more items, and reading them showed the rule, not the items, was
// wrong: "Quando riapre questa farmacia?" takes "Domani alle 8:30" AND "Il lunedì" — *quando*
// accepts a day or a time, so a mixture under it is a well-made item, not a defect. "Quando" is
// deliberately NOT in this list. Only a stem that asks for a clock time, or one that asks for a
// day, rules the other category out.
const ASKS_CLOCK = /\b(a che ora|fino a che ora|verso che ora|entro che ora|da che ora)\b/;
const ASKS_DAY = /\b(che giorno|in quale giorno|quale giorno|in che giorno)\b/;

let inScope = 0;
for (const { i, q } of allQ) {
  const s = strip(q.q);
  const wantsClock = ASKS_CLOCK.test(s);
  const wantsDay = ASKS_DAY.test(s);
  if (!wantsClock && !wantsDay) continue;
  inScope++;
  const forbidden = wantsClock ? "DAY" : "CLOCK";
  q.options.forEach((o, oi) => {
    if (pureCat(o) !== forbidden) return;
    failures.push(
      `${i.exam}/${i.level}/${i.section} — ${i.title}\n     Q: ${q.q}\n     option ${String.fromCharCode(65 + oi)} ` +
      `"${o}" is a ${forbidden}, and this stem asks for a ${wantsClock ? "CLOCK TIME" : "DAY"}. ` +
      `No learner reading the stem can take it seriously, so the item is a ${q.options.length - 1}-way ` +
      `choice wearing ${q.options.length} options` +
      (oi === q.answerIndex ? ` — and it is the KEY, which is worse: the key cannot answer its own question.` : `.`),
    );
  });
}

console.log("population");
console.log(`  MCQ questions                       : ${allQ.length}`);
console.log(`  stems asking for a clock time or day: ${inScope}   <-- everything this gate can see`);
console.log(`  questions outside that stem set     : ${allQ.length - inScope}`);
console.log(`  violations                          : ${failures.length}`);

// ── CONTROLS. A zero from a rule that cannot fire is not a zero. ────────────
const seesIt = (() => {
  const c = ["Alle 9:00", "Alle 10:00", "Alle 11:00", "Il sabato"].map(pureCat);
  return c.filter((x) => x === "CLOCK").length === 3 && c.filter((x) => x === "DAY").length === 1;
})();
const ignoresClean = new Set(["Alle 9:00", "Alle 10:00", "Alle 11:00", "Alle 12:00"].map(pureCat)).size === 1;
const ignoresWords = ["Ogni giorno", "Mai", "Sempre", "Non è indicato"].every((o) => pureCat(o) === null);
const ignoresBoth = pureCat("Sabato alle 17") === null;

console.log("\ncontrols");
console.log(`  ${seesIt ? "✓" : "✗"} a planted DAY among three CLOCKs is seen`);
console.log(`  ${ignoresClean ? "✓" : "✗"} four clock times are not flagged`);
console.log(`  ${ignoresWords ? "✓" : "✗"} "Ogni giorno" / "Mai" / "Sempre" are not categories — the seven false positives stay out`);
console.log(`  ${ignoresBoth ? "✓" : "✗"} "Sabato alle 17" is both, therefore neither`);
if (!seesIt) failures.push("control: the rule cannot see a planted DAY among CLOCKs, so its zero means nothing");
if (!ignoresClean) failures.push("control: four clock times are being flagged — the rule is firing on category, not mismatch");
if (!ignoresWords) failures.push('control: "Ogni giorno" is being typed as a category; that is the 1-in-8 precision the narrow rule exists to avoid');
if (!ignoresBoth) failures.push('control: "Sabato alle 17" must be neither DAY nor CLOCK');

if (failures.length) {
  console.error(`\n❌ OPTION CATEGORY GATE FAILED — ${failures.length} violation(s):`);
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(`\n✅ option-category gate: ${inScope} question(s) mix days and clock times, none incoherently.`);
