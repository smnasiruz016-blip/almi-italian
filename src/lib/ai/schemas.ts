// What a model may return, and what a page may render. These are two different types on
// purpose — that separation IS the honesty guarantee.
//
// ── THE DESIGN, AND WHY IT IS SHAPED LIKE THIS ──────────────────────────────
// AlmiPTE labels its AI output "a practice indicator, not an official PTE score" as UI prose,
// repeated by hand on each page, with nothing enforcing it. Nothing in that repo fails if a
// new page forgets, and a label that depends on remembering is a label that eventually is not
// there.
//
// Here the label is not prose and not a convention:
//
//   1. A model returns a ModelAssessment. It has NO label field, and the model is never asked
//      to produce one — a label the model could omit, mistype, or be argued out of is not a
//      guarantee. It also means a jailbroken or malfunctioning model cannot emit something
//      that claims to be official.
//
//   2. Only labelEstimate() turns a ModelAssessment into a LabelledEstimate, and it is the
//      only exported way to build one. LabelledEstimate carries `labelKind: "ESTIMATE"` as a
//      required literal, so a value without it does not TYPE CHECK, let alone render.
//
//   3. The renderer accepts LabelledEstimate and nothing else, so "render a score without its
//      label" is not a mistake anyone can make in JSX — there is no unlabelled score to pass.
//
//   4. scripts/gates/honesty-gate.mts asserts all of it at build time and fails on the phrase
//      "official score" / "punteggio ufficiale" attaching to a model result.
//
// The score itself is never a bare number either: EstimatedScore carries its own max and
// floor, read from the engine, so a "7" can never be rendered without the "/12" that makes it
// mean something.

import { z } from "zod";

/** The one label a model result may ever carry. */
export const ESTIMATE_LABEL = "ESTIMATE" as const;

/** Shown wherever an estimate is rendered. Italian first, because the learner is studying it. */
export const ESTIMATE_DISCLAIMER =
  "Stima basata su criteri — non è un punteggio ufficiale. Solo Siena (CILS) e Perugia (CELI) rilasciano un risultato ufficiale. · Criteria-based estimate, not an official score.";

/** Band vocabulary. Deliberately words, not numbers, at the criterion level: an authored
 *  criterion like "Formula di apertura e chiusura adeguate" is met or not, and inventing a
 *  per-criterion number would be a precision the rubric does not have. */
export const BAND = ["NON_RAGGIUNTO", "PARZIALE", "RAGGIUNTO"] as const;

export const CriterionAssessmentSchema = z.object({
  /** Echoed back VERBATIM from the rubric the model was given — the official CILS criterion for
   *  B1 Cittadinanza, or the item's own authored criterion elsewhere — so the UI can pair them
   *  up and the gate can prove the model scored the right rubric. */
  criterion: z.string().min(1),
  /** Null ONLY for a criterion this product appends itself because it cannot assess it — the
   *  model is never shown such a criterion, so it can never produce a null here. */
  band: z.enum(BAND).nullable(),
  /** Points awarded against this criterion's OFFICIAL ceiling. Null where the module has no
   *  published per-criterion weights (CILS UNO/DUE, CELI) and the band is the whole verdict. */
  points: z.number().min(0).max(12).nullable(),
  /** This criterion's published ceiling. NEVER supplied by the model — our code stamps it from
   *  the official rubric, so a report stored today still renders its own maxima correctly if
   *  the rubric is ever revised. Null where the module publishes no per-criterion weights. */
  pointsMax: z.number().min(0).max(12).nullable().optional(),
  /** One or two sentences, in Italian, pointing at the learner's actual text. */
  comment: z.string().min(1).max(600),
});

/**
 * What the model returns. NO label field — see the header.
 *
 * `sectionScoreValue` is nullable because CELI is PART-scored: its Track.scale is null, so
 * there is no honest per-section max to score out of. Forcing a number there would be
 * inventing a scale the exam does not have. CILS (standard and B1c) are section-scored and
 * get a real number.
 */
export const ModelAssessmentSchema = z.object({
  criteria: z.array(CriterionAssessmentSchema).min(1).max(8),
  /** Raw section score on the engine's own scale, or null for a part-scored exam. */
  sectionScoreValue: z.number().int().min(0).max(200).nullable(),
  /** Two to four concrete things the learner did well, in Italian. */
  strengths: z.array(z.string().min(1).max(300)).min(1).max(4),
  /** Two to four specific, actionable fixes, in Italian. */
  improvements: z.array(z.string().min(1).max(300)).min(1).max(4),
  /** A short overall note, in Italian. Never a verdict on the real exam. */
  summary: z.string().min(1).max(800),
});

export type ModelAssessment = z.infer<typeof ModelAssessmentSchema>;

/** A score that cannot be rendered without the numbers that make it mean something. */
export type EstimatedScore = {
  value: number;
  /** What this product could actually award — the official max minus anything it cannot judge. */
  max: number;
  floor: number;
  /** CLEAR / BORDERLINE / BELOW against the engine's own floor. */
  status: "CLEAR" | "BORDERLINE" | "BELOW";
  /** The exam's own maximum, when it differs from `max` because something is not assessable.
   *  Present so the learner is never shown "9/11" without being told the exam scores out of 12. */
  officialMax?: number;
  /** Human-readable note about what was excluded and why. */
  notAssessedNote?: string;
};

/**
 * The only thing a page may render. `labelKind` is a required literal, so an unlabelled
 * estimate is a type error rather than a review comment.
 */
export type LabelledEstimate = ModelAssessment & {
  labelKind: typeof ESTIMATE_LABEL;
  disclaimer: string;
  /** null for CELI (part-scored) — the UI then shows the part thresholds instead. */
  score: EstimatedScore | null;
  /** Extra context the engine supplies, e.g. CELI's part thresholds. */
  engineNote: string;
};

/** The stored shape, validated before it is written and after it is read. The literal is what
 *  makes a row without a label impossible to load. */
export const LabelledEstimateSchema = ModelAssessmentSchema.extend({
  labelKind: z.literal(ESTIMATE_LABEL),
  disclaimer: z.string().min(1),
  score: z
    .object({
      value: z.number(),
      max: z.number(),
      floor: z.number(),
      status: z.enum(["CLEAR", "BORDERLINE", "BELOW"]),
      officialMax: z.number().optional(),
      notAssessedNote: z.string().optional(),
    })
    .nullable(),
  engineNote: z.string(),
});

/**
 * THE ONLY WAY TO BUILD A RENDERABLE ESTIMATE.
 *
 * Takes what the model said and attaches the label the model was never asked for. Every
 * caller goes through here, so there is exactly one line in the codebase where an AI result
 * becomes something a learner can see — and scripts/gates/honesty-gate.mts checks that line.
 */
export function labelEstimate(
  assessment: ModelAssessment,
  score: EstimatedScore | null,
  engineNote: string,
): LabelledEstimate {
  return {
    ...assessment,
    labelKind: ESTIMATE_LABEL,
    disclaimer: ESTIMATE_DISCLAIMER,
    score,
    engineNote,
  };
}
