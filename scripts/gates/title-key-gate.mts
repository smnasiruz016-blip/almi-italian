// TITLE / KEY GATE — ANALISI items. The answer must come from the sentence, not from the title.
//
// Run: npm run gate:title-key   (wired into `build`, so it blocks)
//
// ── THE ROOT THIS IS AIMED AT ───────────────────────────────────────────────
// An ANALISI item is a titled grammar exercise: "Il congiuntivo presente", then a text with
// blanks. The failure mode is that the author answers from the TITLE instead of from the
// sentence — the title names a form, so the form named in the title becomes the key, whether or
// not the sentence requires it. When that happens the item is answerable without reading the
// text at all: find the option that echoes the heading.
//
// ── WHAT IS AND IS NOT CHECKABLE HERE, MEASURED FIRST ───────────────────────
// "Does this sentence require the congiuntivo?" needs a parser and a grammar; no gate in this
// repo can answer it, and one that pretended to would be a gate on my own Italian. What IS
// checkable is the SHAPE the failure leaves behind: the key echoes the title and no distractor
// does, so the heading gives it away.
//
// The mechanical integrity of a blank is checkable outright, and is checked here too: an answer
// that is not among its own options is unanswerable, a repeated option is a smaller choice than
// it looks, and a blank with no marker in the text is invisible.
//
// The population is printed before every rule. 21 of the 124 blanks are free-text (no options)
// — PracticeRunner renders those as an input and grade.ts normalises them; that is deliberate
// and documented at src/lib/it/grade.ts:44. They are excluded from the option rules and counted
// out loud rather than dropped into a silent zero.

import { BANK } from "../../src/lib/items";

type Blank = { answer: string; options?: string[] };
type Item = { exam: string; level: string; section: string; title: string; payload: { text?: string; blanks?: Blank[] } };

const items = (BANK as unknown as Item[]).filter((i) => Array.isArray(i.payload.blanks));
const failures: string[] = [];
const id = (i: Item) => `${i.exam}/${i.level}/${i.section} — ${i.title}`;

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const STOP = new Set("il lo la i gli le un uno una di a da in con su per tra fra e o ma che non".split(" "));
const wordsOf = (s: string) => strip(s).replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

// ── THE PREDICATES, NAMED ONCE ─────────────────────────────────────────────
// The rules below and the controls at the bottom call THESE, not copies of them.
//
// They were copies at first. Sabotage case H replaced the title-echo test inside the loop with
// `false` — the rule went blind and the gate stayed GREEN, because the control re-implemented
// the same expression inline and went on passing. A control that merely resembles the rule
// certifies itself. Sharing the function is what makes a control worth reading.
const answerIsAmongOptions = (b: Blank) => b.options!.includes(b.answer);
const hasDuplicateOption = (b: Blank) => new Set(b.options!).size !== b.options!.length;
const hasFourOptions = (b: Blank) => b.options!.length >= 4;
const markerCount = (text: string | undefined) => (text ?? "").match(/_{2,}/g)?.length ?? 0;
const echoesTitle = (title: string, s: string) => {
  const t = new Set(wordsOf(title));
  return t.size > 0 && wordsOf(s).some((w) => t.has(w));
};

console.log("TITLE / KEY GATE — ANALISI: the answer comes from the sentence, not the heading\n");

const optionBlanks: { i: Item; b: Blank; n: number }[] = [];
let freeText = 0;
for (const i of items) {
  i.payload.blanks!.forEach((b, n) => {
    if (Array.isArray(b.options)) optionBlanks.push({ i, b, n });
    else freeText++;
  });
}

console.log("population");
console.log(`  ANALISI items                  : ${items.length}`);
console.log(`  blanks                         : ${items.reduce((n, i) => n + i.payload.blanks!.length, 0)}`);
console.log(`  option-backed blanks           : ${optionBlanks.length}   <-- the option rules' reach`);
console.log(`  free-text blanks (by design)   : ${freeText}   <-- input + normalised marking, grade.ts:44`);

// ── A. MECHANICAL INTEGRITY ────────────────────────────────────────────────
console.log("\nA. a blank is answerable at all");
let a = 0;
for (const { i, b, n } of optionBlanks) {
  if (!answerIsAmongOptions(b)) { failures.push(`${id(i)} blank ${n + 1}: the answer "${b.answer}" is not among its own options [${b.options!.join(", ")}] — nothing a learner can click is correct`); a++; }
  if (hasDuplicateOption(b)) { failures.push(`${id(i)} blank ${n + 1}: an option is repeated — [${b.options!.join(", ")}]. The blank offers fewer real choices than it shows`); a++; }
  if (!hasFourOptions(b)) { failures.push(`${id(i)} blank ${n + 1}: only ${b.options!.length} option(s); every other blank in the bank offers four`); a++; }
}
for (const i of items) {
  const markers = markerCount(i.payload.text);
  if (markers !== i.payload.blanks!.length) { failures.push(`${id(i)}: the text has ${markers} blank marker(s) but ${i.payload.blanks!.length} blank(s) are defined — a learner sees a different exercise from the one being marked`); a++; }
}
console.log(`  ${a === 0 ? "✓" : "✗"} ${a} violation(s) across ${optionBlanks.length} option-backed blanks and ${items.length} texts`);

// ── B. THE ANSWER IS NOT READABLE OFF THE TITLE ────────────────────────────
console.log("\nB. the heading does not give the answer away");
let b2 = 0;
for (const { i, b, n } of optionBlanks) {
  if (!echoesTitle(i.title, b.answer)) continue;
  const distractorHit = b.options!.some((o) => o !== b.answer && echoesTitle(i.title, o));
  if (!distractorHit) {
    failures.push(`${id(i)} blank ${n + 1}: the key "${b.answer}" echoes the title and no distractor does. A learner can pick it from the heading without reading the sentence`);
    b2++;
  }
}
console.log(`  ${b2 === 0 ? "✓" : "✗"} ${b2} blank(s) whose key is readable off the title`);

// ── CONTROLS ───────────────────────────────────────────────────────────────
console.log("\ncontrols");
// These call the SAME functions the rules call. Break a rule and its control goes with it.
const c1 = !answerIsAmongOptions({ answer: "xxx", options: ["a", "in", "da", "con"] });
const c1b = answerIsAmongOptions({ answer: "a", options: ["a", "in", "da", "con"] });
const c2 = hasDuplicateOption({ answer: "a", options: ["a", "in", "a", "con"] });
const c2b = !hasDuplicateOption({ answer: "a", options: ["a", "in", "da", "con"] });
const c5 = markerCount("Vado ___ Roma ___ treno.") === 2 && markerCount("Nessun buco qui.") === 0;
const c3 = echoesTitle("Il congiuntivo presente", "congiuntivo");
const c4 = !echoesTitle("Le preposizioni semplici", "alle");
console.log(`  ${c1 && c1b ? "✓" : "✗"} an answer outside its options is seen, and one inside it is not`);
console.log(`  ${c2 && c2b ? "✓" : "✗"} a repeated option is seen, and four distinct ones are not`);
console.log(`  ${c5 ? "✓" : "✗"} blank markers are counted, and a text with none reads 0`);
console.log(`  ${c3 ? "✓" : "✗"} a key echoing its title is seen`);
console.log(`  ${c4 ? "✓" : "✗"} a key unrelated to its title is not flagged`);
if (!c1 || !c1b) failures.push("control: the answer-in-options rule cannot fire, or fires on a correct blank");
if (!c2 || !c2b) failures.push("control: the duplicate-option rule cannot fire, or fires on four distinct options");
if (!c5) failures.push("control: blank markers are not being counted");
if (!c3) failures.push("control: the title-echo rule cannot fire, so its zero means nothing");
if (!c4) failures.push("control: the title-echo rule fires on an unrelated key — it would flag the whole bank");

if (failures.length) {
  console.error(`\n❌ TITLE / KEY GATE FAILED — ${failures.length} violation(s):`);
  for (const f of failures.slice(0, 12)) console.error("   • " + f);
  if (failures.length > 12) console.error(`   … and ${failures.length - 12} more`);
  process.exit(1);
}
console.log(`\n✅ title-key gate: ${optionBlanks.length} option-backed blanks are answerable and none is readable off its heading; ${freeText} free-text blanks excluded by design.`);
