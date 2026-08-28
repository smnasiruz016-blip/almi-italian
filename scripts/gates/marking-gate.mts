// MARKING GATE — free-text answers are marked leniently enough to be fair, and not so leniently
// that a wrong answer becomes right.
//
//   npm run gate:marking
//
// ── WHAT THIS GUARDS ────────────────────────────────────────────────────────
// Free-text cloze blanks used to be compared with `trim().toLowerCase().replace(/\s+/g," ")` and
// nothing else. Four of the bank's 21 free-text keys are accented, so a learner on a
// non-Italian keyboard typing "e stato scritto" for "è stato scritto" was marked WRONG for their
// hardware rather than their Italian.
//
// The fix — NFD + strip combining marks — is NOT free in Italian, and that is the whole reason
// this gate exists rather than a one-off test. Italian has real minimal pairs where the accent
// IS the word: e/è, papa/papà, pero/però, te/tè, si/sì, la/là, da/dà, ne/né. Fold those and a
// wrong answer becomes correct. So the sweep runs against the LIVE bank on every build: today
// no key folds onto a different valid word, and the day someone authors "papà" as a free-text
// key, this goes red instead of silently accepting "papa".

import { BANK } from "../../src/lib/items";
import { isCloze } from "../../src/lib/items";

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Marking gate — free-text answers, accents, and minimal pairs\n");

/** The OLD rule, kept here so the sweep can compare against it. */
const oldNorm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
/** The rule src/lib/it/grade.ts now applies. Kept in step by check D below. */
const newNorm = (s: string) =>
  s.trim().toLowerCase().normalize("NFD").replace(/\p{Mn}/gu, "").replace(/\s+/g, " ");

/** Words where the accent is the entire difference in meaning. Folding one of these as a WHOLE
 *  answer would accept a different Italian word. Not exhaustive Italian — the list a marking
 *  gate needs. */
const MINIMAL_PAIRS = new Set([
  "e", "è", "si", "sì", "la", "là", "da", "dà", "ne", "né", "te", "tè", "se", "sé", "li", "lì",
  "papa", "papà", "pero", "però", "casino", "casinò", "parlo", "parlò", "capito", "capitò",
  "ancora", "ancòra", "subito", "subìto", "principi", "princìpi",
]);

type Key = { title: string; section: string; answer: string };
const freeText: Key[] = [];
let withOptions = 0;
for (const it of BANK) {
  if (!isCloze(it.payload)) continue;
  for (const b of it.payload.blanks) {
    if (b.options) withOptions++;
    else freeText.push({ title: it.title, section: it.section, answer: b.answer });
  }
}

// ── A. THE SWEEP FOUND SOMETHING TO SWEEP ───────────────────────────────────
console.log("A. population:");
if (freeText.length === 0) fail("no free-text blanks found at all — this gate is looking in the wrong place");
else ok(`${freeText.length + withOptions} cloze blank(s): ${withOptions} option-backed (exact match, untouched), ${freeText.length} free text`);

// ── B. WHICH KEYS THE FOLD ACTUALLY CHANGES ─────────────────────────────────
console.log("\nB. keys whose marking changes under folding:");
const changed = freeText.filter((k) => newNorm(k.answer) !== oldNorm(k.answer));
for (const k of changed) console.log(`     ${k.section.padEnd(8)} ${JSON.stringify(oldNorm(k.answer))} -> ${JSON.stringify(newNorm(k.answer))}`);
if (changed.length === 0) fail("the fold changes NOTHING — either it is not applied or the accented keys have gone, and either way this gate is now vacuous");
else ok(`${changed.length} accented key(s) now accept the unaccented typing`);

// ── C. AND WHETHER ANY OF THAT IS DANGEROUS ─────────────────────────────────
// The load-bearing check. A phrase whose folded form merely loses an accent is safe — the rest
// of the phrase still has to match. A WHOLE key that folds onto another real word is not.
console.log("\nC. minimal-pair safety:");
const risky = changed.filter((k) => MINIMAL_PAIRS.has(newNorm(k.answer)));
for (const k of risky) {
  fail(`"${k.title}": key ${JSON.stringify(k.answer)} folds to ${JSON.stringify(newNorm(k.answer))}, which is a different Italian word — folding would mark a wrong answer correct. Give this blank options, or accept both spellings explicitly.`);
}
if (!risky.length) ok(`no key folds onto a different valid word (${MINIMAL_PAIRS.size} pairs checked)`);

const seen = new Map<string, Set<string>>();
for (const k of freeText) {
  const f = newNorm(k.answer);
  if (!seen.has(f)) seen.set(f, new Set());
  seen.get(f)!.add(oldNorm(k.answer));
}
const collisions = [...seen.entries()].filter(([, v]) => v.size > 1);
for (const [f, v] of collisions) fail(`two distinct keys collide after folding: ${[...v].map((x) => JSON.stringify(x)).join(" / ")} both -> ${JSON.stringify(f)}`);
if (!collisions.length) ok("no two distinct free-text keys collide after folding");

// ── D. THE REGRESSION, ON THE FOUR REAL KEYS ────────────────────────────────
// Named explicitly so the fix cannot silently return: each must accept BOTH spellings, and the
// gate's own normaliser must agree with the one the product actually marks with.
console.log("\nD. regression — the four accented keys accept both spellings:");
const REGRESSION: [string, string][] = [
  ["è stato scritto", "e stato scritto"],
  ["è stata preparata", "e stata preparata"],
  ["è stata approvata", "e stata approvata"],
  ["fosse già partito", "fosse gia partito"],
];
for (const [accented, plain] of REGRESSION) {
  const inBank = freeText.some((k) => oldNorm(k.answer) === oldNorm(accented));
  if (!inBank) fail(`"${accented}" is no longer a free-text key in the bank — update this list rather than deleting the check`);
  else if (newNorm(accented) !== newNorm(plain)) fail(`"${accented}" does NOT accept "${plain}"`);
  else if (oldNorm(accented) === oldNorm(plain)) fail(`"${accented}" vs "${plain}" is not actually a folding case — the fixture is wrong`);
  else ok(`"${accented}" accepts "${plain}"`);
}

// The gate marks with its own copy of the rule, so it must be shown to agree with the product's.
// Otherwise this whole file could pass while the app marks differently.
console.log("\nE. the gate's rule matches the product's:");
{
  const probe = ["è stato scritto", "PERCHÉ  così", "già", "senza accenti"];
  const { markItem } = await import("../../src/lib/it/grade");
  const { ATOM } = await import("../../src/lib/runner-items");
  // Drive the real marker through a synthetic cloze item and confirm the unaccented typing wins.
  let agreed = 0;
  for (const key of probe) {
    const item = { exam: "CILS_B1C", level: "B1C", section: "ANALISI", taskType: "CLOZE", difficulty: "FOUNDATION", title: "probe", payload: { text: "___", blanks: [{ answer: key }] } } as never;
    const plain = newNorm(key);
    const marks = markItem("probe", item, { [ATOM.cloze(0)]: plain });
    if (marks[0]?.correct) agreed++;
    else fail(`the product did NOT accept ${JSON.stringify(plain)} for key ${JSON.stringify(key)} — the gate and the marker disagree`);
  }
  if (agreed === probe.length) ok(`the real marker accepts the folded form of all ${probe.length} probe key(s)`);
}

// -- F. THE OTHER DIRECTION, AND A CONTROL THAT MUST STILL FAIL -------------
// D proves an ACCENTED key accepts UNACCENTED typing. The reverse matters too: a learner who
// over-accents ("era" typed as "era" with a grave) must also be marked correct, or the fix is
// half a fix. It holds by construction -- norm() is applied to BOTH sides of the comparison --
// but "by construction" is the kind of claim that stops being true after someone edits one
// side, so it is asserted against the real marker rather than reasoned about.
//
// The control is the other half: folding must not have turned the marker into something that
// accepts anything. An unaccented key must still REFUSE a genuinely different word.
console.log("\nF. the reverse direction, and a control that must still be refused:");
{
  const { markItem } = await import("../../src/lib/it/grade");
  const { ATOM } = await import("../../src/lib/runner-items");
  const mark = (key: string, typed: string) => {
    const item = { exam: "CILS_B1C", level: "B1C", section: "ANALISI", taskType: "CLOZE", difficulty: "FOUNDATION", title: "probe", payload: { text: "___", blanks: [{ answer: key }] } } as never;
    return Boolean(markItem("probe", item, { [ATOM.cloze(0)]: typed })[0]?.correct);
  };

  // Reverse: unaccented KEY, accented INPUT.
  const reverse: [string, string][] = [
    ["era", "erà"],
    ["sia", "sià"],
    ["faccio", "facciò"],
  ];
  let revOk = 0;
  for (const [key, typed] of reverse) {
    if (mark(key, typed)) revOk++;
    else fail(`unaccented key ${JSON.stringify(key)} did NOT accept accented typing ${JSON.stringify(typed)} - folding is one-directional`);
  }
  if (revOk === reverse.length) ok(`${reverse.length} unaccented key(s) accept accented typing - the fold works both ways`);

  // Control: a real, unaccented key still marks correctly...
  const control = "guardiamo";
  const inBank = freeText.some((k) => k.answer === control);
  check(inBank, `the control key ${JSON.stringify(control)} is still in the bank`,
    `${JSON.stringify(control)} is no longer a free-text key - pick another control rather than deleting this`);
  check(mark(control, control), `the unaccented control ${JSON.stringify(control)} still marks correct`,
    `the unaccented control ${JSON.stringify(control)} no longer marks correct - folding broke ordinary marking`);
  check(mark(control, "  GUARDIAMO  "), "the control still tolerates case and surrounding space",
    "case/space handling regressed alongside the fold");

  // ...and still REFUSES a different word. Without this, a marker that accepted everything
  // would satisfy every other check in this file.
  check(!mark(control, "guardiamoci"), `the control refuses a different word ("guardiamoci")`,
    "the marker accepted a DIFFERENT word - folding has made marking permissive, not tolerant");
  check(!mark(control, ""), "the control refuses an empty answer",
    "an empty answer was marked correct");
}

console.log("");
if (failed) {
  console.error("Marking gate FAILED\n");
  process.exit(1);
}
console.log("Marking gate passed\n");
