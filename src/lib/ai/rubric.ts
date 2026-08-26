// The scale and the criteria an estimate is measured against — READ FROM THE ENGINE and from
// the authored item, never written from memory.
//
// CILS and CELI score differently and the engines are deliberately isolated (src/lib/scoring/*).
// Keeping that separation is this product's whole positioning, so nothing here blends them:
// the numbers come from the Track the item belongs to, and a track carries exactly one
// engine's numbers.
//
//   CILS B1 Cittadinanza  4 sections × /12, floor 7, total ≥28/48, no banking
//   CILS standard         5 sections × /20, floor 11, capitalization
//   CELI                  PART-scored (Written + Oral) — Track.scale is null, so there is no
//                         per-section max and an estimate must NOT invent one
//
// The per-criterion rubric is the item's OWN authored `criteria` array. Every SCRITTA and
// ORALE item in the bank carries four or five, task-specific and in Italian. Inventing a
// generic rubric here would score the learner against something the task never asked for.

import { TRACKS } from "@/lib/practice";
import { CELI_CONFIG, type CeliLevel } from "@/lib/scoring";
import type { EstimatedScore } from "@/lib/ai/schemas";

export type Rubric = {
  trackLabel: string;
  /** null for a part-scored exam (CELI). */
  scale: { max: number; floor: number } | null;
  /** Engine-derived context sentence shown with the estimate. */
  engineNote: string;
  /** The item's own authored criteria, verbatim. */
  criteria: string[];
};

/** Find the rubric for one item. Throws rather than guessing: an unroutable item must not be
 *  quietly scored against some other exam's scale. */
export function rubricFor(input: {
  exam: string;
  level: string;
  criteria: string[];
}): Rubric {
  const track = TRACKS.find((t) => t.exam === input.exam && t.level === input.level);
  if (!track) {
    throw new Error(`no track for ${input.exam}/${input.level} — refusing to pick a scale`);
  }
  if (input.criteria.length === 0) {
    throw new Error(`item has no authored criteria — there is nothing to score it against`);
  }

  const celi = track.exam === "CELI" ? CELI_CONFIG[track.level as CeliLevel] : null;
  const engineNote = celi
    ? `CELI is scored by PART, not by section: the Written part must reach ≥${celi.writtenMin}/${celi.writtenMax} and the Oral part ≥${celi.oralMin}/${celi.oralMax} on the same sitting. This task is one component of a part, so no out-of-N section score is given for it.`
    : `${track.modelNote}`;

  return {
    trackLabel: track.label,
    scale: track.scale,
    engineNote,
    criteria: input.criteria,
  };
}

/**
 * Turn the model's raw section number into a scored estimate on the engine's scale.
 *
 * Returns null when the exam is part-scored, or when the model declined to give a number —
 * both are honest answers, and neither is replaced with a guess. The CLEAR/BORDERLINE/BELOW
 * banding matches each engine's own rule: CILS standard treats 2 below the floor as
 * borderline, B1c only 1 (see src/lib/scoring/*).
 */
export function scoreFrom(rubric: Rubric, raw: number | null): EstimatedScore | null {
  if (!rubric.scale || raw === null) return null;
  const { max, floor } = rubric.scale;
  const value = Math.max(0, Math.min(max, Math.round(raw)));
  // Borderline width follows the engine: /20 sections use 2, /12 sections use 1.
  const borderlineWidth = max >= 20 ? 2 : 1;
  const status: EstimatedScore["status"] =
    value >= floor ? "CLEAR" : value >= floor - borderlineWidth ? "BORDERLINE" : "BELOW";
  return { value, max, floor, status };
}
