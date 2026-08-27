// The scale and the criteria an estimate is measured against — READ FROM THE ENGINE and from
// the published source, never written from memory.
//
// CILS and CELI score differently and the engines are deliberately isolated
// (src/lib/scoring/*). Keeping that separation is this product's whole positioning, so nothing
// here blends them: the numbers come from the Track the item belongs to, and a track carries
// exactly one engine's numbers.
//
//   CILS B1 Cittadinanza  4 sections × /12 — and a PUBLISHED per-criterion rubric (see
//                         src/lib/ai/official-rubrics.ts)
//   CILS standard         5 sections × /20, floor 11 — no published sub-criteria found
//   CELI                  PART-scored — Track.scale is null; an estimate must NOT invent one
//
// TWO RUBRIC MODES, and which one applies is decided by the source, not by preference:
//   OFFICIAL  the exam publishes its criteria and their weights → score against those, and
//             DERIVE the section total by summing them, so the parts cannot disagree with it.
//   AUTHORED  no published sub-criteria → fall back to the item's OWN authored criteria, band
//             them, and let the model give a whole-section number as before.

import { TRACKS } from "@/lib/practice";
import { CELI_CONFIG, type CeliLevel } from "@/lib/scoring";
import type { EstimatedScore, ModelAssessment } from "@/lib/ai/schemas";
import {
  officialRubricFor,
  officialMax,
  assessableMax,
  CILS_B1C_SOURCE_URL,
  type OfficialCriterion,
} from "@/lib/ai/official-rubrics";

export type Rubric = {
  trackLabel: string;
  /** null for a part-scored exam (CELI). */
  scale: { max: number; floor: number } | null;
  engineNote: string;
  /** The criteria the model is asked to score, in order. */
  criteria: string[];
  /** OFFICIAL when the exam publishes weights; AUTHORED otherwise. */
  mode: "OFFICIAL" | "AUTHORED";
  /** Present only in OFFICIAL mode. */
  official?: OfficialCriterion[];
  sourceUrl?: string;
};

export function rubricFor(input: {
  exam: string;
  level: string;
  section: string;
  criteria: string[];
}): Rubric {
  const track = TRACKS.find((t) => t.exam === input.exam && t.level === input.level);
  if (!track) {
    throw new Error(`no track for ${input.exam}/${input.level} — refusing to pick a scale`);
  }

  const celi = track.exam === "CELI" ? CELI_CONFIG[track.level as CeliLevel] : null;
  const engineNote = celi
    ? `CELI is scored by PART, not by section: the Written part must reach ≥${celi.writtenMin}/${celi.writtenMax} and the Oral part ≥${celi.oralMin}/${celi.oralMax} on the same sitting. This task is one component of a part, so no out-of-N section score is given for it.`
    : track.modelNote;

  const official = officialRubricFor(input.exam, input.level, input.section);
  if (official) {
    return {
      trackLabel: track.label,
      scale: track.scale,
      engineNote,
      criteria: official.map((c) => c.label),
      mode: "OFFICIAL",
      official,
      sourceUrl: CILS_B1C_SOURCE_URL,
    };
  }

  if (input.criteria.length === 0) {
    throw new Error("item has no authored criteria and no published rubric — nothing to score against");
  }
  return {
    trackLabel: track.label,
    scale: track.scale,
    engineNote,
    criteria: input.criteria,
    mode: "AUTHORED",
  };
}

/**
 * The section score.
 *
 * OFFICIAL mode SUMS the per-criterion points rather than taking the model's own total. The
 * parts and the whole then cannot disagree — the failure mode where a report says "3/3, 1/1,
 * 4/4" and then announces 6/12 simply cannot occur, because there is only one number.
 *
 * AUTHORED mode keeps the previous behaviour: the model's whole-section figure, clamped.
 * Returns null for a part-scored exam or when no number is available — both are honest answers
 * and neither is replaced with a guess.
 */
export function scoreFrom(rubric: Rubric, assessment: ModelAssessment): EstimatedScore | null {
  if (!rubric.scale) return null;
  const { floor } = rubric.scale;

  if (rubric.mode === "OFFICIAL" && rubric.official) {
    const oMax = officialMax(rubric.official);
    const aMax = assessableMax(rubric.official);
    const notAssessed = rubric.official.filter((c) => c.notAssessed);

    // Sum only what was assessed, and only up to each criterion's own ceiling.
    let value = 0;
    for (const c of rubric.official) {
      if (c.notAssessed) continue;
      const got = assessment.criteria.find((a) => a.criterion.toLowerCase() === c.label.toLowerCase());
      const pts = got?.points;
      if (typeof pts === "number") value += Math.max(0, Math.min(c.max, pts));
    }
    value = Math.round(value * 10) / 10;

    // ── BANDING WHEN A POINT CANNOT BE ASSESSED ─────────────────────────────
    // The unassessed criterion can only ADD, never subtract, so the assessed total is a LOWER
    // BOUND on the real one. That makes the banding decidable without pretending to know the
    // missing point: at or above the floor is genuinely clear; exactly one point short could
    // still reach the floor once the examiner hears the candidate, so it is BORDERLINE rather
    // than BELOW. Rounding that to "BELOW" would tell a learner they failed a section they may
    // well have passed.
    const gap = aMax < oMax ? oMax - aMax : 0;
    const status: EstimatedScore["status"] =
      value >= floor ? "CLEAR" : value + gap >= floor ? "BORDERLINE" : "BELOW";

    return {
      value,
      max: aMax,
      floor,
      status,
      ...(aMax !== oMax
        ? {
            officialMax: oMax,
            notAssessedNote: notAssessed.map((c) => `${c.label} (${c.max} p.): ${c.notAssessedReason ?? "non valutabile"}`).join(" "),
          }
        : {}),
    };
  }

  const raw = assessment.sectionScoreValue;
  if (raw === null) return null;
  const { max } = rubric.scale;
  const value = Math.max(0, Math.min(max, Math.round(raw)));
  // Borderline width follows the engine: /20 sections use 2, /12 sections use 1.
  const borderlineWidth = max >= 20 ? 2 : 1;
  const status: EstimatedScore["status"] =
    value >= floor ? "CLEAR" : value >= floor - borderlineWidth ? "BORDERLINE" : "BELOW";
  return { value, max, floor, status };
}
