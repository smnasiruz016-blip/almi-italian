// Summary consistency gate — the summary cannot deny a level the scores just awarded in full.
//
//   npm run gate:summary-consistency        (wired into `build`, so it blocks)
//
// Offline. Drives the real functions and reads the real prompt; no model call, no key, no cost.
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// A live attempt scored 11/11 — every assessable criterion at its published maximum, every band
// "Raggiunto" — and the summary said "per raggiungere pienamente il livello B1, è importante...".
// Both cannot stand. The scores and the summary come from ONE structured response, so the model
// had its own numbers in front of it; nothing required them to agree and no code checked.
//
// The ruling this gate encodes:
//   · full marks on every assessable criterion + a summary asserting the level was not reached
//     = RED, because that sentence is false against our own scores;
//   · saying the estimate cannot speak to pronuncia e intonazione stays ALLOWED, because it is
//     true — the official grid carries it, this product cannot judge it from a transcript, and
//     officialCriteriaBlock used to hide it entirely, which is why the hedge came out ungrounded.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contradictsFullMarks, allAssessableAtMax } from "../../src/lib/ai/summary-consistency";
import { oraleSystemPrompt } from "../../src/lib/ai/prompts";
import { rubricFor } from "../../src/lib/ai/rubric";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Summary consistency gate — full marks cannot come with 'not yet at the level'\n");

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\r\n]*/g, "$1 ");
const evalSrc = stripComments(readFileSync(join(ROOT, "src", "lib", "ai", "evaluate.ts"), "utf8"));

// The real sentence from the live attempt, and the full-marks award it came with.
const LIVE_SUMMARY =
  "Hai svolto il compito in modo efficace e comprensibile. Per raggiungere pienamente il livello B1, è importante ampliare il lessico.";
const FULL_MARKS = [
  { points: 4, pointsMax: 4 },
  { points: 4, pointsMax: 4 },
  { points: 3, pointsMax: 3 },
];

console.log("A. THE LIVE CONTRADICTION IS CAUGHT");
{
  check(allAssessableAtMax(FULL_MARKS), "11/11 is recognised as full marks",
    "full marks were not recognised — the check would never engage on the case it was built for");
  const hits = contradictsFullMarks(LIVE_SUMMARY, allAssessableAtMax(FULL_MARKS));
  check(hits.length > 0, `the exact summary from the live attempt is caught (${hits.length} sentence)`,
    "the sentence a real learner received is NOT caught");
}

console.log("\nB. WHAT IS TRUE IS STILL ALLOWED");
// If this section ever fails, the guard has started rejecting honest feedback, which is worse
// than the defect: it would push the model toward saying nothing rather than saying the truth.
{
  const allowed = [
    "Hai raggiunto il massimo su tutti i criteri valutabili. Questa stima non valuta la pronuncia e l'intonazione, che nella griglia ufficiale vale 1 punto.",
    "Ottimo lavoro. Per continuare a migliorare, prova a usare connettivi più vari.",
    "Il tuo lessico è adeguato. Lavora ancora sulla varietà delle strutture.",
    "Questa è una stima didattica e non un risultato ufficiale.",
  ];
  let bad = 0;
  for (const s of allowed) {
    const hits = contradictsFullMarks(s, true);
    if (hits.length) {
      bad++;
      fail(`honest feedback was flagged as a contradiction: ${JSON.stringify(s.slice(0, 70))}`);
    }
  }
  if (!bad) ok(`${allowed.length} honest summaries pass, including the pronuncia carve-out`);
}

console.log("\nC. THE CHECK ONLY APPLIES AT FULL MARKS");
// A shortfall statement is legitimate — usually correct — for a learner who did not score full
// marks. The contradiction exists only against our own maximum award.
{
  const partial = [
    { points: 3, pointsMax: 4 },
    { points: 4, pointsMax: 4 },
    { points: 3, pointsMax: 3 },
  ];
  check(!allAssessableAtMax(partial), "10/11 is not treated as full marks",
    "a partial score was read as full marks — the guard would fire on correct feedback");
  check(contradictsFullMarks(LIVE_SUMMARY, allAssessableAtMax(partial)).length === 0,
    "the same sentence is allowed when the learner did NOT score full marks",
    "the sentence was flagged at partial marks — the guard is policing wording, not consistency");
  check(!allAssessableAtMax([]), "an empty assessment is not full marks",
    "an unscored assessment was read as perfect");
  check(!allAssessableAtMax([{ points: null, pointsMax: null }]),
    "a part-scored exam (no per-criterion weights) is not read as full marks",
    "null points were read as a maximum — the guard would misfire on CILS UNO/DUE and CELI");
}

console.log("\nD. THE MODEL IS TOLD THE UNASSESSED CRITERION EXISTS");
// The hedge was ungrounded because officialCriteriaBlock filtered the criterion out entirely:
// the model could not know a twelfth point existed, so it could not say the one true thing.
{
  const rubric = rubricFor({ exam: "CILS_B1C", level: "B1C", section: "ORALE", criteria: [] });
  const prompt = oraleSystemPrompt(rubric, { words: 120 });
  check(/Pronuncia e intonazione/.test(prompt),
    "the prompt names the unassessed criterion",
    "the prompt still hides Pronuncia e intonazione — the model cannot ground an honest hedge in a criterion it does not know exists");
  check(/NON dargli un punteggio/.test(prompt) && /non inserirlo/i.test(prompt),
    "the prompt forbids scoring it or listing it among the criteria",
    "the criterion is named without being ruled out of scoring — this invites the guess the original design avoided");
  check(/non può pronunciarsi/.test(prompt),
    "the prompt states what the model MAY truthfully say about it",
    "the prompt names the criterion but not the true statement available — naming it without that is an invitation to hedge freely again");
}

console.log("\nE. THE RULE AND THE CHECK ARE BOTH WIRED");
// The prompt rule is the instruction; the check is what holds when the instruction is ignored,
// which is precisely what happened with the word-count rule before it got a guard.
{
  const prompts = readFileSync(join(ROOT, "src", "lib", "ai", "prompts.ts"), "utf8");
  check(/IL SUMMARY NON PU/.test(prompts),
    "SHARED_RULES forbids contradicting the awarded scores",
    "no rule in SHARED_RULES ties the summary to the scores");
  check(/contradictsFullMarks\(/.test(evalSrc), "evaluate.ts runs the consistency check",
    "evaluate.ts never calls contradictsFullMarks — the check exists but nothing runs it");
  check(/"summary-contradiction"/.test(evalSrc), "a contradiction marks the response bad",
    "no summary-contradiction branch — the check cannot change the outcome");
  const checkAt = evalSrc.indexOf("contradictsScores(parsed).length");
  const failAt = evalSrc.indexOf("if (bad || !parsed)");
  check(checkAt !== -1 && failAt !== -1 && checkAt < failAt,
    "the check runs before the fail-closed branch",
    "the check runs after the response is already accepted");
}

// ── F. ALL FOUR GUARDS SURVIVE, IN ALL THREE PLACES ─────────────────────────
// Found while rebasing this branch onto #49 and #50. Each guard is a branch in the `bad`
// ternary, a retry instruction, and a `why` case — three separate places. A conflict on that
// ternary is resolved by taking one side, and taking either side keeps the code compiling and
// the whole chain green while a guard silently stops running.
//
// Sabotaging the guards proved three of them red. The fourth, "schema", had NOTHING watching
// it: changing `? "schema"` to `? null` — so an unparseable model response is accepted instead
// of refused — compiled cleanly and passed all 25 gates. That gap is what this section closes.
//
// Asserted by NAME rather than by count, so adding a fifth guard fails here until it is wired
// into all three places, and removing one names the guard that went.
console.log("\nF. EVERY GUARD IS WIRED IN ALL THREE PLACES");
{
  const GUARDS = ["schema", "word-count", "duration", "summary-contradiction"] as const;

  // 1. a branch in BOTH ternaries that decide `bad` — the first pass and the post-retry recheck.
  //
  // Counted, not merely found. An earlier version of this check used `.test()`, and a sabotage
  // that removed the branch from the first ternary alone still passed because the recheck kept
  // it. A guard that runs only on the retry is half a guard, and half is exactly what a
  // one-sided merge resolution produces.
  const TERNARIES = 2;
  for (const g of GUARDS) {
    const n = (evalSrc.match(new RegExp(`\\?\\s*"${g}"`, "g")) ?? []).length;
    check(n >= TERNARIES, `"${g}" branches in both the first pass and the recheck (${n})`,
      `"${g}" appears in ${n} of ${TERNARIES} bad-ternaries — a guard missing from one of them runs only sometimes, which is how a one-sided merge resolution hides`);
  }

  // 2. its own retry instruction. "schema" is the first branch and reads `bad === "schema"`;
  //    the others follow the same shape.
  for (const g of GUARDS) {
    check(new RegExp(`bad === "${g}"`).test(evalSrc), `"${g}" has its own retry/why branch`,
      `nothing branches on bad === "${g}" — a response failing that guard gets the wrong retry text and the wrong reason recorded`);
  }

  // 3. the fail-closed path is still the destination
  check(/if \(bad \|\| !parsed\)/.test(evalSrc),
    "a response marked bad still fails closed",
    "the fail-closed branch is gone — a guard can mark a response bad and it is shown anyway");
  check(/status: 502/.test(evalSrc), "the learner gets a refusal, not a wrong estimate",
    "the failure path no longer returns a refusal");
}

console.log("");
if (failed) {
  console.error("Summary consistency gate FAILED\n");
  process.exit(1);
}
console.log("Summary consistency gate passed\n");
