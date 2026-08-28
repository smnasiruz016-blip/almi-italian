// Speaking claims gate — the model never states a length or duration it was not given.
//
//   npm run gate:speaking-claims        (wired into `build`, so it blocks)
//
// Offline. No model call, no network, no key: the guard functions and the prompt text are read
// directly, so this costs nothing and cannot be flaky.
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// A real production attempt scored 11/11 with every criterion "Raggiunto", and the only
// criticism it received was that the answer was "ben al di sotto dei circa 90 secondi di parlato
// atteso". The model did not invent that number: oraleSystemPrompt injected
// "Il compito prevede circa ${speakSeconds} secondi di parlato" from the item payload, and the
// model marked the learner against it.
//
// 13 of the 60 ORALE items carry speakSeconds: 90 (the rest 120, 150, 180). None carries any
// sourcing. The scoring constants all sit in CILS_B1C_SOURCING with a `verified` flag and a
// named document; these durations have nothing — no comment, no citation, no research brief.
// The fact-gated /learn corpus states only the syllabus shape (a spoken test of about ten
// minutes, a presentation of roughly a minute, a dialogue of two to three) and publishes no
// per-task second count anywhere.
//
// This is the #38 defect one step further on. There, the model invented "circa 110 parole" when
// the app already knew the count, and contradictingWordCounts now fails the response closed.
// Here there is no count to check against — no official document publishes a duration — so the
// rule is stricter: the model must state NO duration at all.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contradictingDurations, contradictingWordCounts } from "../../src/lib/text/word-count";
import { CONFIDENCE_REVIEW_THRESHOLD } from "../../src/lib/ai/transcribe";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Speaking claims gate — no unsourced length, no unsourced duration\n");

/**
 * Source with comments removed.
 *
 * Section A asks whether the prompt still hands the model a duration. The doc comment above
 * oraleSystemPrompt QUOTES the removed string, to record what was taken out and why — so a
 * naive scan finds "secondi di parlato" in the very file that no longer emits it and fails a
 * correct fix. Matching a mention rather than the code is how a gate earns a reputation for
 * crying wolf, and a gate with that reputation gets deleted.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\r\n]*/g, "$1 ");
}

const promptsSrc = stripComments(readFileSync(join(ROOT, "src", "lib", "ai", "prompts.ts"), "utf8"));
const evalSrc = stripComments(readFileSync(join(ROOT, "src", "lib", "ai", "evaluate.ts"), "utf8"));
const routeSrc = stripComments(readFileSync(join(ROOT, "src", "app", "api", "it", "evaluate", "orale", "route.ts"), "utf8"));

// ── A. THE PROMPT DOES NOT HAND THE MODEL A DURATION ────────────────────────
console.log("A. THE PROMPT STATES NO DURATION");
{
  check(!/secondi di parlato/.test(promptsSrc),
    "the prompt no longer tells the model how many seconds are expected",
    'the prompt still contains "secondi di parlato" — it is handing the model an unsourced target to mark the learner against');
  check(!/\$\{opts\.speakSeconds\}/.test(promptsSrc),
    "speakSeconds is not interpolated into any prompt string",
    "speakSeconds is interpolated into a prompt — the item's practice target is reaching the model as an exam expectation");
  check(/NON conosci la DURATA/.test(promptsSrc),
    "the prompt explicitly tells the model it does not know the duration",
    "the prompt does not forbid duration claims — silence is not an instruction");
}

// ── B. THE GUARD CATCHES WHAT THE PROMPT FAILS TO PREVENT ───────────────────
// The prompt is an instruction; the guard is the thing that holds when the instruction is
// ignored. Driven with the real function, on the real sentence from the production attempt.
console.log("B. THE GUARD CATCHES A DURATION CLAIM");
{
  const real = "La tua risposta è ben al di sotto dei circa 90 secondi di parlato atteso.";
  const hits = contradictingDurations(real);
  check(hits.length > 0, `the exact sentence from the live attempt is caught (${hits.join(", ")})`,
    "the sentence that reached a real learner is NOT caught — the guard does not cover the case it was built for");

  check(contradictingDurations("Parla per 2 minuti.").length > 0, "minutes are caught, not just seconds",
    "a claim in minutes slips through");
  check(contradictingDurations("Il treno parte alle 15:10 e costa 12 euro.").length === 0,
    "a clock time and a price are not mistaken for a duration claim",
    "an ordinary number was flagged as a duration — a false positive here would fail good feedback");
  check(contradictingDurations("Hai parlato per 90 secondi.", [90]).length === 0,
    "an explicitly allowed duration passes, for the day a source publishes one",
    "the allow-list does not work, so a sourced duration could never be permitted");
}

// ── C. THE GUARD IS WIRED, AND FAILS CLOSED ─────────────────────────────────
// A guard that runs and then lets the response through would be worse than none: it would look
// like the defect was handled.
console.log("\nC. THE GUARD IS WIRED INTO THE EVALUATION PATH");
{
  check(/contradictingDurations\(/.test(evalSrc), "evaluate.ts calls contradictingDurations",
    "evaluate.ts never calls contradictingDurations — the guard exists but nothing runs it");
  check(/"duration"/.test(evalSrc), "a duration claim marks the response bad",
    "no duration branch — the check cannot change the outcome");
  check(/bad \|\| !parsed/.test(evalSrc), "a bad response fails closed rather than being shown",
    "the failure path no longer fails closed");
  const durAt = evalSrc.indexOf("inventedDurations(parsed).length");
  const failAt = evalSrc.indexOf("if (bad || !parsed)");
  check(durAt !== -1 && failAt !== -1 && durAt < failAt,
    "the duration check runs before the fail-closed branch",
    "the duration check runs after the response is already accepted");
}

// ── D. THE WORD-COUNT GUARD FROM #38 STILL HOLDS ────────────────────────────
// Same family of defect; regressing it while fixing its sibling would be a poor trade.
console.log("\nD. THE #38 WORD-COUNT GUARD IS UNTOUCHED");
{
  check(contradictingWordCounts("Hai scritto circa 110 parole.", 96).length > 0,
    "an invented word count is still caught",
    "the #38 guard no longer catches an invented count");
  check(contradictingWordCounts("Hai scritto 96 parole.", 96).length === 0,
    "the true count is still allowed",
    "the true count is now flagged — this would fail every good response");
}

// ── E. THE LOW-CONFIDENCE WARNING IS THRESHOLDED, AND SANE ──────────────────
// The warning fired on the same 11/11 attempt. exp(avg_logprob) is a per-token likelihood, not a
// calibrated confidence: the old 0.7 demanded avg_logprob >= -0.357, while Whisper's own decoder
// only calls a segment bad below -1.0. The threshold must stay on the model's side of that line.
console.log("\nE. THE LOW-CONFIDENCE WARNING IS NOT UNCONDITIONAL");
{
  const whisperBadBar = Math.exp(-1.0); // 0.3679 — Whisper's own "this went badly" bar
  check(CONFIDENCE_REVIEW_THRESHOLD < 0.7,
    `the threshold is ${CONFIDENCE_REVIEW_THRESHOLD}, below the 0.7 that fired on a good transcript`,
    `the threshold is back at ${CONFIDENCE_REVIEW_THRESHOLD} — good Italian speech trips it and the warning becomes noise`);
  check(CONFIDENCE_REVIEW_THRESHOLD > whisperBadBar,
    `the threshold (${CONFIDENCE_REVIEW_THRESHOLD}) is above Whisper's own low-quality bar (${whisperBadBar.toFixed(4)})`,
    `the threshold is at or below ${whisperBadBar.toFixed(4)} — it would never fire, which is the opposite failure`);
  check(/confidenceKnown && /.test(routeSrc),
    "the warning fires only on a confidence we actually measured",
    "the warning fires on an unmeasured confidence too — an unknown transcript is not a bad one, and flagging it puts the notice on every attempt");
}

console.log("");
if (failed) {
  console.error("Speaking claims gate FAILED\n");
  process.exit(1);
}
console.log("Speaking claims gate passed\n");
