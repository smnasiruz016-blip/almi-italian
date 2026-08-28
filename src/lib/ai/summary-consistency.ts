// THE SUMMARY MUST NOT CONTRADICT THE SCORES THE SAME RESPONSE JUST AWARDED.
//
// A real production attempt scored 11/11 — every assessable criterion at its published maximum,
// every band "Raggiunto" — and the summary told the learner that "per raggiungere pienamente il
// livello B1, è importante...". Full marks and "you have not fully reached the level" cannot
// both be true, and the one the learner reads last is the sentence.
//
// WHY A CHECK AND NOT ONLY A RULE
// The scores and the summary come back in ONE structured response, so the model has the numbers
// in front of it. Nothing tied them: no instruction required consistency and no code looked. A
// rule in the prompt was added alongside this, but a rule is an instruction, and an instruction
// is what was already being ignored — the model was told not to invent word counts and did that
// too, which is why contradictingWordCounts exists. This is the same shape of guard.
//
// WHAT IS STILL ALLOWED, BECAUSE IT IS TRUE
// The official CILS grid carries "Pronuncia e intonazione" (1 of 12) and this product cannot
// judge it from a transcript. Saying so is honest and stays permitted: it is a statement about
// what the ESTIMATE cannot cover, not a claim that the learner fell short. Only the second kind
// is caught here.

/** A shortfall claim is a level word AND a not-yet marker in the same sentence. */
const LEVEL = /\b(livello|liv\.|[ABC][12]\b)/i;

/**
 * Not-yet markers. Deliberately narrow: they must assert that the level is NOT (yet) reached.
 *
 * "devi lavorare sul lessico" is ordinary, useful advice and is NOT a shortfall claim — a
 * learner at full marks can still be told what to practise next. Flagging that would make this
 * check fire on good feedback, and a check that fires on good output gets removed.
 */
const SHORTFALL = [
  /per\s+raggiungere/i,
  /per\s+arrivare\s+a/i,
  /non\s+(?:hai\s+)?(?:ancora\s+)?raggiunt/i,
  /non\s+raggiunge/i,
  /non\s+(?:è|e')\s+ancora/i,
  /non\s+ancora\s+(?:al|a)\b/i,
  /devi\s+ancora\s+raggiungere/i,
  /non\s+(?:è|e')\s+sufficiente\s+per/i,
];

/**
 * Sentences in `summary` that claim the level was not reached.
 *
 * Split on sentence boundaries first, so a level word in one sentence and a shortfall marker in
 * an unrelated one do not combine into a false positive.
 *
 * @param summary  the model's summary prose.
 * @param allAtMax whether EVERY assessable criterion scored its published maximum. When false
 *                 this returns nothing: a shortfall statement is legitimate — often correct —
 *                 for a learner who did not score full marks. The contradiction only exists
 *                 against our own full-marks award.
 */
export function contradictsFullMarks(summary: string, allAtMax: boolean): string[] {
  if (!allAtMax) return [];
  return summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && LEVEL.test(s) && SHORTFALL.some((re) => re.test(s)));
}

/**
 * Did every assessable criterion score its ceiling?
 *
 * A criterion with `points: null` is one the module publishes no per-criterion weight for
 * (CILS UNO/DUE, CELI), where the band carries the verdict instead. Those are IGNORED rather
 * than treated as a shortfall: "no points to award" is not "did not score them", and reading it
 * the other way would silently disable the check on every part-scored exam.
 *
 * Returns false when nothing was scored at all, so an empty or unscored assessment can never be
 * mistaken for a perfect one.
 */
export function allAssessableAtMax(
  criteria: { points: number | null; pointsMax?: number | null }[],
): boolean {
  const scored = criteria.filter(
    (c) => typeof c.points === "number" && typeof c.pointsMax === "number" && c.pointsMax > 0,
  );
  if (scored.length === 0) return false;
  return scored.every((c) => c.points === c.pointsMax);
}
