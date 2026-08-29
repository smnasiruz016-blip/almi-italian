// THE one place a score becomes CLEAR / BORDERLINE / BELOW.
//
// There were FIVE implementations of this before: cils-b1c.ts statusFor, cils-standard.ts
// statusFor, it/grade.ts, and two inside ai/rubric.ts. They did not agree. On a /20 section a
// learner scoring 9 was told "Al limite" by the engine and "Sotto la soglia" by the submit
// endpoint — same learner, same score, different word depending on which screen they were on.
// Two implementations agreeing is not a fix; the next one written makes three. This is the
// only function permitted to make the decision, and everything else calls it.
//
// ── WHAT IS SOURCED HERE AND WHAT IS NOT ────────────────────────────────────
// The FLOOR is sourced. For CILS standard it is 11/20 per skill, from the Italian government
// information sheet quoted in content/learn/cils-b1c-scoring-and-criteria.md; the B1c 7/12 is
// our own documented derivation from it. Both are disclosed to learners as such.
//
// 🔴 The BORDERLINE WIDTH below is NOT sourced. It is not in Siena's criteria PDF, not in the
// government sheet, and not in the 52-article corpus — the corpus derives the floor with its
// source and never mentions a proximity band at all. It is a UI affordance we invented. It is
// isolated here, as a literal table, so that changing it is one visible edit rather than five
// silent ones, and so the gate in scripts/gates/status-band-gate.mts can assert it.
//
// Do not compute this from the floor. A width derived from the same constant the check reads
// moves with it, and then nothing can fail.
const BORDERLINE_WIDTH_BY_MAX: Record<number, number> = {
  12: 1, // CILS B1 Cittadinanza — a section is /12
  20: 2, // CILS standard        — a section is /20
};

/** Sections on an unknown scale get the narrower band: never widen a verdict by accident. */
const DEFAULT_BORDERLINE_WIDTH = 1;

export function borderlineWidthFor(max: number): number {
  return BORDERLINE_WIDTH_BY_MAX[max] ?? DEFAULT_BORDERLINE_WIDTH;
}

export type SectionStatusValue = "CLEAR" | "BORDERLINE" | "BELOW";

/**
 * The band in words, for English surfaces.
 *
 * Two screens used to render the band as COLOUR ALONE (the score turned teal or coral and
 * nothing said why), and a third dropped the raw uppercase enum "BORDERLINE" into an English
 * sentence. Colour alone fails WCAG 1.4.1 - Use of Color: a colour-blind reader, a greyscale
 * print or a high-contrast theme loses the verdict entirely, and the verdict is the thing a
 * learner decides on.
 *
 * These mirror the Italian strings already live in EstimateReport ("Sopra la soglia" /
 * "Al limite" / "Sotto la soglia") on the screens whose language is English. They carry no
 * "(estimate)" suffix: each surface already labels its own estimates, and the objective
 * sections in the practice runner are marked, not estimated.
 *
 * One record, so a fourth wording cannot appear the way five banding rules did.
 */
export const SECTION_STATUS_LABEL_EN: Record<SectionStatusValue, string> = {
  CLEAR: "Above the threshold",
  BORDERLINE: "At the threshold",
  BELOW: "Below the threshold",
};

/**
 * Band one section score against its own floor.
 *
 * `max` selects the band width, so a /12 and a /20 section are never banded on each other's
 * scale — that mix-up is what this file exists to make impossible.
 */
export function sectionStatus(score: number, floor: number, max: number): SectionStatusValue {
  if (score >= floor) return "CLEAR";
  if (score >= floor - borderlineWidthFor(max)) return "BORDERLINE";
  return "BELOW";
}

/**
 * The same band, for a score that could not be fully assessed.
 *
 * `gap` is the points on criteria this product could not judge (an official rubric criterion
 * we cannot see, e.g. pronunciation from a transcript). Those points can only ADD, so the
 * assessed value is a LOWER BOUND on the real one. This softens BELOW to BORDERLINE when the
 * missing points could still carry the learner to the floor - telling someone they are below
 * a threshold they may well have met is the one error worth engineering against here.
 *
 * It can only ever soften, never harden: a CLEAR or BORDERLINE verdict is returned untouched.
 * This lives beside sectionStatus rather than inside ai/rubric.ts because a second file that
 * decides this word is how five implementations happened in the first place.
 */
export function sectionStatusWithUnassessed(
  score: number,
  gap: number,
  floor: number,
  max: number,
): SectionStatusValue {
  const base = sectionStatus(score, floor, max);
  if (base !== "BELOW") return base;
  return gap > 0 && score + gap >= floor ? "BORDERLINE" : "BELOW";
}
