// DERIVED VERDICT GATE — nobody replays a verdict, and nobody trusts the model's total.
//
// Run: npm run gate:derived-verdict   (wired into `build`, so it blocks)
//
// TWO GUARANTEES, BOTH OF WHICH EXIST BY CONSTRUCTION AND NEITHER OF WHICH WAS GUARDED.
//
// 1. THE SECTION TOTAL IS SUMMED FROM THE CRITERIA, NOT TAKEN FROM THE MODEL.
//    prompts.ts tells the model, for official-rubric modules: "NON calcolare tu il totale di
//    sezione: mettilo a null in `sectionScoreValue`. Il totale lo somma l'applicazione dai tuoi
//    punteggi per criterio, così le parti e il totale non possono mai contraddirsi." rubric.ts
//    then sums the criteria itself and RETURNS before `assessment.sectionScoreValue` is ever
//    read, so even a disobedient model cannot move the total.
//
//    That is why a "does the sum equal the total" check has an EMPTY POPULATION — there is no
//    module where both numbers independently exist. Asserting it would have been a vacuous
//    gate. What can actually break is the CONSTRUCTION: someone simplifies rubric.ts to trust
//    the model's total, or drops the "mettilo a null" line from the prompt. Nothing would
//    notice. So the construction is what gets asserted here.
//
// 2. NO SURFACE RENDERS A STORED VERDICT.
//    #60 made the criterion band derive at render. The progress list still replayed the
//    section status frozen on the row, so one product did both things at once: a row written
//    before #56 collapsed the five banding implementations could show a word today's engine no
//    longer produces for that score. progress.ts now derives it from the scale that travels
//    with the row.
//
// The source checks strip comments first and anchor to declarations. On 30 Aug two gate
// regexes matched their own comments and one matched a renamed component; in #59 a
// className-only regex missed the ternaries where the verdict colours lived. Neither shape is
// used here.

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sectionStatusWithUnassessed } from "../../src/lib/scoring/section-status";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };
const eq = (got: unknown, want: unknown, msg: string) =>
  ok(got === want, msg + " — got " + JSON.stringify(got) + ", expected " + JSON.stringify(want));

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
const read = (rel: string) => stripComments(readFileSync(join(root, rel), "utf8"));

// ---- 1a. rubric.ts OFFICIAL branch sums the criteria ----------------------
const RUBRIC = "src/lib/ai/rubric.ts";
const rubric = read(RUBRIC);

ok(/if\s*\(\s*rubric\.mode\s*===\s*"OFFICIAL"[\s\S]{0,4000}?for\s*\(\s*const\s+c\s+of\s+rubric\.official\s*\)/.test(rubric),
   `${RUBRIC}: the OFFICIAL branch no longer walks rubric.official — the section total is not being summed from the criteria`);
ok(/value\s*\+=\s*Math\.max\(\s*0\s*,\s*Math\.min\(\s*c\.max\s*,\s*pts\s*\)\s*\)/.test(rubric),
   `${RUBRIC}: the per-criterion accumulation is gone or no longer clamps to c.max — a criterion could exceed its own ceiling`);

// ---- 1b. the OFFICIAL branch RETURNS before the model's total is read -----
// Position, not presence: sectionScoreValue may exist, but only AFTER the official branch has
// returned. If the read moves above that return, the model's total can reach a learner.
const officialAt = rubric.indexOf('rubric.mode === "OFFICIAL"');
const sectionScoreAt = rubric.indexOf("assessment.sectionScoreValue");
ok(officialAt >= 0, `${RUBRIC}: the OFFICIAL branch is gone`);
ok(sectionScoreAt >= 0, `${RUBRIC}: assessment.sectionScoreValue is never read at all — the non-official path lost its score`);
if (officialAt >= 0 && sectionScoreAt >= 0) {
  const between = rubric.slice(officialAt, sectionScoreAt);
  ok(/\breturn\s*\{/.test(between),
     `${RUBRIC}: no return between the OFFICIAL branch and the read of assessment.sectionScoreValue — ` +
     `the official path can now fall through to the model's own section total`);
}

// ---- 1c. the prompt still forbids the model computing the total ----------
const PROMPTS = "src/lib/ai/prompts.ts";
const prompts = read(PROMPTS);
ok(/NON calcolare tu il totale di sezione/.test(prompts),
   `${PROMPTS}: the instruction "NON calcolare tu il totale di sezione" is gone — the model may start returning its own total`);
ok(/mettilo a null in .?\`?sectionScoreValue/.test(prompts) || /mettilo a null/.test(prompts),
   `${PROMPTS}: the "mettilo a null" instruction is gone`);
ok(/le parti e il\s*\n?\s*"?\s*totale non possono mai contraddirsi|totale non possono mai contraddirsi/.test(prompts),
   `${PROMPTS}: the sentence promising parts and total cannot contradict has been removed`);

// ---- 2. no surface renders a stored verdict ------------------------------
const PROGRESS = "src/lib/progress.ts";
const progress = read(PROGRESS);
ok(/sectionStatusWithUnassessed\s*\(/.test(progress),
   `${PROGRESS}: does not derive the status — a stored verdict is being replayed to the learner`);
ok(/typeof\s+s\.floor\s*===\s*"number"/.test(progress),
   `${PROGRESS}: no longer reads the row's own floor, so it cannot re-band history`);
ok(/derived\s*\?\?/.test(progress),
   `${PROGRESS}: the stored status is no longer the FALLBACK — a row written before the floor existed would lose its verdict`);
// The stored word must never be the first choice.
ok(!/const\s+status\s*=\s*STATUSES\.find/.test(progress),
   `${PROGRESS}: the stored status is being taken directly again, ahead of the derivation`);

// ---- behavioural: the derivation reproduces rubric.ts exactly ------------
// Orale carries one unassessable point (Pronuncia e intonazione), so officialMax 12 > max 11
// and the gap softens BELOW to BORDERLINE. Scritta has no gap. Literals, not computed.
eq(sectionStatusWithUnassessed(6, 1, 7, 12), "BORDERLINE", "Orale 6 with a 1-point gap reaches the floor -> BORDERLINE");
eq(sectionStatusWithUnassessed(6, 0, 7, 12), "BORDERLINE", "Scritta 6 is one under the floor -> BORDERLINE on its own");
eq(sectionStatusWithUnassessed(5, 1, 7, 12), "BELOW", "Orale 5 cannot reach 7 even with the gap -> BELOW");
eq(sectionStatusWithUnassessed(5, 0, 7, 12), "BELOW", "Scritta 5 -> BELOW");
eq(sectionStatusWithUnassessed(7, 0, 7, 12), "CLEAR", "at the floor -> CLEAR");
eq(sectionStatusWithUnassessed(11, 1, 7, 12), "CLEAR", "Orale full assessable score -> CLEAR");
eq(sectionStatusWithUnassessed(12, 0, 7, 12), "CLEAR", "Scritta full score -> CLEAR");
eq(sectionStatusWithUnassessed(0, 1, 7, 12), "BELOW", "zero -> BELOW even with the gap");

if (failures.length) {
  console.error("\n❌ DERIVED VERDICT GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  "✅ derived-verdict gate: rubric.ts sums the section total from the criteria and returns " +
  "before the model's own total is read; prompts.ts still forbids the model computing it; " +
  "progress.ts derives the section status instead of replaying the stored word; 8 banding " +
  "cases pinned as literals.",
);
