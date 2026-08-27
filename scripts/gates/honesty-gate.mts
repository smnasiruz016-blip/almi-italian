// HONESTY GATE — an AI-derived score cannot reach a page without its estimate label.
//
//   npm run gate:honesty
//
// ── WHY THIS EXISTS, AND WHY IT IS NEW WORK ─────────────────────────────────
// AlmiPTE labels its AI output "a practice indicator, not an official PTE score" as UI prose,
// hand-repeated on each page, with NOTHING enforcing it. I checked its gates: none of them
// mention a label. So the promise holds exactly as long as everyone remembers, and the first
// page that forgets ships a bare AI number that reads like a result.
//
// This product makes the label structural instead, and this gate proves the structure:
//
//   A  THE SCHEMA       a stored estimate without labelKind must FAIL validation
//   B  THE MODEL        the model is never asked for a label it could omit or be talked out of
//   C  THE CONSTRUCTOR  exactly one function turns a model result into something renderable
//   D  THE RENDERER     the one renderer imports the disclaimer and prints it
//   E  THE PHRASE       "official score" / "punteggio ufficiale" may appear ONLY negated
//   F  THE ROW          the DB write carries the label through, never a literal
//
// E is the check most likely to be written wrong. The honest disclaimer CONTAINS the banned
// phrase — "non è un punteggio ufficiale", "not an official score" — so a naive ban fires on
// the very sentence that makes the product honest, and the cheapest way to green it is to
// delete the disclaimer. So E requires NEGATION, not absence.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  LabelledEstimateSchema,
  ModelAssessmentSchema,
  labelEstimate,
  ESTIMATE_LABEL,
  ESTIMATE_DISCLAIMER,
  type ModelAssessment,
} from "../../src/lib/ai/schemas";

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("Honesty gate — no AI score without its estimate label\n");

const SAMPLE: ModelAssessment = {
  criteria: [{ criterion: "Efficacia comunicativa", band: "PARZIALE", points: 2, pointsMax: 3, comment: "La richiesta c'è ma non dice quale certificato." }],
  sectionScoreValue: 7,
  strengths: ["Apertura e chiusura corrette."],
  improvements: ["Specifica il tipo di certificato."],
  summary: "Testo comprensibile, richiesta poco precisa.",
};

// ── A. THE SCHEMA ───────────────────────────────────────────────────────────
console.log("A. the schema (an unlabelled estimate does not validate):");
{
  const labelled = labelEstimate(SAMPLE, { value: 7, max: 12, floor: 7, status: "CLEAR" }, "note");
  if (!LabelledEstimateSchema.safeParse(labelled).success) fail("a correctly labelled estimate FAILED validation — the gate's own fixture is wrong");
  else ok("a labelled estimate validates");

  const { labelKind: _drop, ...unlabelled } = labelled as Record<string, unknown> & { labelKind: unknown };
  if (LabelledEstimateSchema.safeParse(unlabelled).success) fail("an estimate with NO labelKind validated — the label is not required");
  else ok("an estimate with no labelKind is REJECTED");

  if (LabelledEstimateSchema.safeParse({ ...labelled, labelKind: "OFFICIAL" }).success) {
    fail('labelKind "OFFICIAL" validated — the literal is not pinned');
  } else ok('labelKind "OFFICIAL" is REJECTED');

  if (LabelledEstimateSchema.safeParse({ ...labelled, disclaimer: "" }).success) {
    fail("an empty disclaimer validated");
  } else ok("an empty disclaimer is REJECTED");
}

// ── B. THE MODEL IS NEVER ASKED FOR A LABEL ─────────────────────────────────
console.log("\nB. the model (it cannot supply, omit or misstate the label):");
{
  const withLabel = ModelAssessmentSchema.safeParse({ ...SAMPLE, labelKind: "OFFICIAL" });
  // Zod strips unknown keys by default, so the assertion is that the label does not SURVIVE.
  if (withLabel.success && "labelKind" in (withLabel.data as object)) {
    fail("a model-supplied labelKind survived parsing — the model can influence the label");
  } else ok("a model-supplied labelKind does not survive parsing");
}

// ── C. THE CONSTRUCTOR ──────────────────────────────────────────────────────
console.log("\nC. the constructor (one function, always labels):");
{
  const out = labelEstimate(SAMPLE, null, "");
  if (out.labelKind !== ESTIMATE_LABEL) fail(`labelEstimate produced labelKind "${out.labelKind}"`);
  else if (!out.disclaimer || out.disclaimer.length < 20) fail("labelEstimate produced an empty or trivial disclaimer");
  else ok("labelEstimate always attaches the label and the disclaimer");
}

// ── file helpers ────────────────────────────────────────────────────────────
const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
      )
    : [];
const norm = (f: string) => f.split("\\").join("/");
/** Read CODE, not prose — a gate that fires on an explanation of its own rule punishes the
 *  person who documented it, and the cheapest way to green it is to delete the comment. */
const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const all = walk("src");
if (all.length === 0) fail("found no source files — this gate is looking in the wrong place");

// ── D. THE RENDERER ─────────────────────────────────────────────────────────
console.log("\nD. the renderer (whatever renders an estimate prints the disclaimer):");
{
  const RENDERER = "src/components/EstimateReport.tsx";
  const renderers = all.filter((f) => {
    const c = code(f);
    return /\.tsx$/.test(f) && /LabelledEstimate/.test(c);
  }).map(norm);

  let rendererBad = false;
  const rfail = (m: string) => { rendererBad = true; fail(m); };
  if (!renderers.includes(RENDERER)) rfail(`${RENDERER} does not reference LabelledEstimate — has the renderer moved?`);

  // THE CANONICAL RENDERER must print the disclaimer itself.
  if (renderers.includes(RENDERER) && !/ESTIMATE_DISCLAIMER/.test(code(RENDERER))) {
    rfail(`${RENDERER} renders estimates but never references ESTIMATE_DISCLAIMER`);
  }

  // EVERY OTHER holder of a LabelledEstimate must DELEGATE to it rather than draw its own.
  // Requiring them all to print the disclaimer themselves was the first version of this check
  // and it was wrong: PracticeComposer holds the value only to hand it over, and failing it
  // would have pushed a second copy of the disclaimer into a component that renders no score —
  // duplicating the label is not the same as guaranteeing it.
  let delegates = 0;
  for (const f of renderers) {
    if (f === RENDERER) continue;
    const c = code(f);
    if (/ESTIMATE_DISCLAIMER/.test(c)) { delegates++; continue; } // prints it itself: also fine
    if (/<EstimateReport[\s/>]/.test(c)) { delegates++; continue; } // hands it to the one that does
    rfail(`${f} holds a LabelledEstimate but neither prints the disclaimer nor delegates to <EstimateReport>`);
  }
  if (!rendererBad) ok(`the canonical renderer prints the disclaimer; ${delegates} other holder(s) delegate to it`);
}

// ── E. THE PHRASE, NEGATED ONLY ─────────────────────────────────────────────
console.log("\nE. the phrase (\"official score\" may appear only negated):");
{
  const PHRASES = [/punteggio ufficiale/gi, /risultato ufficiale/gi, /official score/gi, /official result/gi];
  // A negation must appear close before the phrase. Kept generous on purpose: the job is to
  // catch a CLAIM, not to police wording.
  const NEG = /\b(non|never|not|mai|senza|nessun\w*|isn't|is not|non è|no)\b[^.]{0,60}$/i;
  // ATTRIBUTION is also acceptable, and the distinction is the whole point: "only Siena awards
  // an official result" is the honest sentence this product is built on, not a claim about OUR
  // output. A gate that reddens on it teaches people to delete the true sentence — which is
  // exactly the false-positive that gets gates switched off. The defect being hunted is a
  // MODEL RESULT being called official, not the word appearing.
  const ATTRIB = /(siena|perugia|unistrasi|cvcl|ente d'esame|l'unico|unico|solo|soltanto|only|awards|rilascia|rilasciano)/i;
  const scope = all.filter((f) => /\/(ai|components|app)\//.test(norm(f)));
  let bare = 0, negated = 0;
  for (const f of scope) {
    const c = code(f);
    for (const re of PHRASES) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(c)) !== null) {
        const before = c.slice(Math.max(0, m.index - 90), m.index);
        const after = c.slice(m.index, m.index + 90);
        if (NEG.test(before) || ATTRIB.test(before) || ATTRIB.test(after)) negated++;
        else { bare++; fail(`${norm(f)}: "${m[0]}" appears with neither a negation nor an attribution — "…${before.slice(-50).trim()} ${m[0]}…"`); }
      }
    }
  }
  if (!bare) ok(`${negated} occurrence(s), every one negated or attributed to the awarding body`);
  // The gate must not pass by finding nothing: the disclaimer itself is a known negated use.
  if (negated === 0) fail("found NO occurrence at all — the disclaimer should contain a negated one, so this check is not looking where it thinks");
}

// ── F. THE ROW ──────────────────────────────────────────────────────────────
console.log("\nF. the row (the DB write carries the label through, never a literal):");
{
  const writers = all.filter((f) => /prisma\.aiEvaluation\.create/.test(code(f))).map(norm);
  let rowBad = false;
  const wfail = (m: string) => { rowBad = true; fail(m); };
  if (writers.length === 0) wfail("no route writes an AiEvaluation — has the write moved?");
  for (const f of writers) {
    const c = code(f);
    if (!/labelKind:\s*\w+\.labelKind/.test(c)) {
      wfail(`${f} writes an AiEvaluation but does not carry labelKind through from the parsed estimate`);
    }
    if (!/LabelledEstimateSchema\.parse/.test(c)) {
      wfail(`${f} writes an AiEvaluation without validating it against LabelledEstimateSchema first`);
    }
  }
  if (!rowBad) ok(`${writers.length} writer(s) validate and carry the label through`);
}

console.log("");
if (failed) {
  console.error("Honesty gate FAILED");
  console.error("  An AI number that reaches a learner without its estimate label reads as a result.\n");
  process.exit(1);
}
console.log(`Honesty gate passed — label "${ESTIMATE_LABEL}", disclaimer ${ESTIMATE_DISCLAIMER.length} chars\n`);
