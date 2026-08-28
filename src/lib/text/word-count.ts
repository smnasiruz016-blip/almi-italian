// ONE word-count implementation, shared by the composer and the evaluator.
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
// On the first live Writing attempt the UI counted 96 words and the model's feedback said
// "circa 110 parole". Two numbers for one text, and the wrong one was the one the learner was
// told. The model was never given the count, so it estimated — and a model inventing a number
// it was not handed is the same defect class as the fabricated statistics stripped elsewhere
// in the network.
//
// The app already knew the answer. So the count is computed ONCE, here, and passed into the
// prompt as a fact. If the composer and the server counted separately they would eventually
// disagree by a space or a hyphen, and the disagreement would be invisible.

/** Whitespace-separated tokens. Deliberately the same rule the composer's live counter has
 *  always used, so the number under the textarea and the number in the prompt are the same
 *  number and not two implementations that happen to agree today. */
export function wordCount(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Numbers the model claimed about the text's LENGTH that contradict the real count.
 *
 * Returns the offending values, so a caller can refuse rather than pass a second wrong number
 * to the learner. Empty means the output makes no contradicting claim.
 *
 * ⚠️ `allowed` is what stops this firing on legitimate prose. The model may quite properly
 * mention the TASK's limits ("il compito chiede 80-120 parole") or restate the true count, and
 * flagging those would make the check a nuisance that gets switched off. So a number counts as
 * a contradiction only when it is neither the actual count nor one of the task's own bounds.
 */
export function contradictingWordCounts(text: string, actual: number, allowed: number[] = []): number[] {
  const ok = new Set<number>([actual, ...allowed]);
  const out: number[] = [];
  // "96 parole", "circa 110 parole", "110 parole circa", "~110 parole"
  const re = /(\d{1,4})\s*(?:parole|words)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    if (!ok.has(n)) out.push(n);
  }
  return out;
}

/**
 * Durations the model asserted that it was never given.
 *
 * The sibling of contradictingWordCounts, and it exists for the same reason one step further on.
 * That guard stopped the model inventing "circa 110 parole" when the app already knew the count.
 * This one stops a duration reaching the learner at all, because for the spoken task there is no
 * count to check against: no official document publishes an expected length in seconds, so ANY
 * number the model states is unsourced by construction.
 *
 * `allowed` therefore defaults to empty and is expected to stay empty. It is a parameter rather
 * than a hardcoded rule so that the day an awarding body does publish a duration, the value can
 * be passed in from the same place it is sourced — not written into this function.
 *
 * Matches "90 secondi", "circa 90 secondi", "~90 secondi", "2 minuti", "90 seconds". Ordinary
 * clock references a learner might legitimately be told, like "alle 15:10", carry no unit word
 * and are not matched.
 */
export function contradictingDurations(text: string, allowed: number[] = []): string[] {
  const ok = new Set<number>(allowed);
  const out: string[] = [];
  const re = /(\d{1,4})\s*(secondi|secondo|minuti|minuto|seconds|minutes)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    const seconds = unit.startsWith("min") ? n * 60 : n;
    if (!ok.has(seconds) && !ok.has(n)) out.push(`${n} ${unit}`);
  }
  return out;
}
