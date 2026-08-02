// AlmiItalian — answer-position de-game.
//
// WHAT WAS WRONG. Measured over the authored bank, before this file existed:
//
//   MCQ (288 questions, every section 4-option)
//     CILS_STANDARD::DUE::ASCOLTO   11%  89%   ·    ·
//     CILS_STANDARD::DUE::LETTURA   13%  82%   5%   ·
//     CELI::DUE::LETTURA            14%  86%   ·    ·
//     … 8 of 8 sections, all leaning on index 1
//     Position 3 was NEVER the key in any of the 288 questions, and position 2 in 11.
//
//   CLOZE with options (ANALISI, 103 blanks)
//     CILS_STANDARD::DUE::ANALISI   96%   2%   2%
//     CILS_STANDARD::UNO::ANALISI   89%   9%   2%
//
// A learner who always picked the second option scored ~80% on Ascolto and Lettura without
// reading the Italian, and one who never picked the fourth option lost nothing at all — every
// four-option MCQ in the product was really a three-way choice. That is not a difficulty
// setting, it is a hole in the measurement.
//
// WHAT THIS DOES. For each MCQ question and each option-bearing cloze blank it permutes the
// OPTIONS and moves the key with them, so the item a learner sees is the same item asking the
// same thing with the same right answer — only the right answer is no longer sitting where
// habit put it.
//
// ── WHY THE TRANSFORM RUNS HERE AND NOT IN THE SEED FILES ───────────────────
// The bank is de-gamed as it loads (see @/lib/items), not rewritten in scripts/seed/batch1/*.
// Two reasons, and the second is the one that matters:
//
//   1. The authored files stay readable as authored. A content editor reviewing cils-due.ts
//      sees the item they wrote, not a permuted copy they have to mentally undo.
//   2. The audit executes the bank AS SERVED rather than parsing the seed literals, precisely
//      because a product that permutes at load would otherwise be measured on a key that no
//      longer ships. Running here means what the checker measures and what the learner
//      receives are the same array.
//
// ── WHY IT IS NOT RANDOM ────────────────────────────────────────────────────
// No Math.random anywhere. The permutation is a pure function of the item's own identity
// (exam · level · section · title · question index), so the same bank always produces the same
// arrangement: a build is reproducible, the gate can assert an exact distribution, and a
// learner who reloads does not get a reshuffled paper.
//
// ── WHY BALANCED BLOCKS RATHER THAN A PLAIN SHUFFLE ─────────────────────────
// A seeded shuffle alone is unbiased in expectation and lumpy in practice: over 33 questions
// it will happily leave one position at 12% and another at 39%, and B1d would still be able to
// name a position worth eliminating. Instead each bucket draws its target positions from
// shuffled blocks of [0..n-1] — so across any bucket every position is the key either
// floor(N/n) or ceil(N/n) times, an imbalance of at most one item, by construction.
//
// The block is SHUFFLED rather than walked in order for a reason worth stating: a round-robin
// (A, B, C, D, A, B, C, D…) is also perfectly balanced and completely gameable — the learner
// counts. Balance fixes the histogram; shuffling the block fixes the sequence. Both are needed,
// which is why "fix the distribution" is not the same instruction as "shuffle".
//
// ── WHAT IT DELIBERATELY DOES NOT TOUCH ─────────────────────────────────────
// MATCHING and ORDERING keys are permutations over a full option set — every option is the key
// for exactly one prompt or slot — so they are uniform by construction and measure 25/25/25/25
// already. Permuting them would change nothing about gameability and would only make the
// authored item harder to trace. They pass through untouched.
//
// This also does NOT fix the longest-option cue (H1): the key is the single longest option in
// 61% of MCQ questions against a 25% chance rate, and no rearrangement of options changes which
// one is longest. That is an authoring defect and needs authoring; see scripts/items/degame-gate.mts,
// which measures it separately so it cannot be mistaken for something this file handled.

import type { BankItem, Payload, McqPayload, ClozePayload } from "@/lib/items";

// ── deterministic PRNG ──────────────────────────────────────────────────────
// xmur3 to turn a string into a 32-bit seed, mulberry32 to turn that into a stream. Both are
// small, well-known, and — the only property we actually need — identical on every machine.
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rngFor = (seed: string) => mulberry32(xmur3(seed)());

/** Fisher–Yates against a seeded stream. Returns a new array; never mutates the input. */
function shuffled<T>(input: readonly T[], rand: () => number): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Target key positions for one bucket: `count` values in [0, n), drawn from shuffled blocks of
 * [0..n-1] so every position appears floor(count/n) or ceil(count/n) times.
 */
export function targetPositions(count: number, n: number, seed: string): number[] {
  const out: number[] = [];
  const base = Array.from({ length: n }, (_, i) => i);
  const rand = rngFor(seed);
  let block = 0;
  while (out.length < count) {
    out.push(...shuffled(base, rand));
    block++;
    if (block > count + 2) break; // unreachable; a loop bound rather than a promise
  }
  return out.slice(0, count);
}

/**
 * Targets for the FREE atoms of a bucket, given the positions the FIXED (numeric) atoms have
 * already taken. The free atoms are assigned the positions the bucket is short of, so the bucket
 * as a whole lands on the same floor/ceil balance it would have reached with no fixed atoms at
 * all — rather than the free atoms being balanced among themselves and the total coming out
 * lopsided because nobody accounted for the ones that could not move.
 *
 * If the fixed atoms alone already over-fill a position (more numeric items keyed at "10 euro"
 * than the bucket's fair share allows) that overflow cannot be undone by moving other items, and
 * the function does not pretend otherwise: it fills what it can and the gate reports the
 * residual spread.
 */
export function assignTargets(freeCount: number, fixed: readonly number[], n: number, seed: string): number[] {
  const total = freeCount + fixed.length;
  const per = Math.floor(total / n);
  const extra = total % n;
  // Which positions get the ceil rather than the floor — chosen deterministically from the seed
  // so it is not always the low indices that get the extra item.
  const order = shuffled(Array.from({ length: n }, (_, i) => i), rngFor(`ceil|${seed}`));
  const want = new Array<number>(n).fill(per);
  for (let i = 0; i < extra; i++) want[order[i]]++;

  const taken = new Array<number>(n).fill(0);
  for (const f of fixed) if (f >= 0 && f < n) taken[f]++;

  const pool: number[] = [];
  for (let i = 0; i < n; i++) for (let k = 0; k < Math.max(0, want[i] - taken[i]); k++) pool.push(i);
  // Over-filled positions leave the pool short; top it up with the least-used positions so every
  // free atom still gets a target.
  while (pool.length < freeCount) {
    const counts = new Array<number>(n).fill(0);
    for (const f of fixed) if (f >= 0 && f < n) counts[f]++;
    for (const p of pool) counts[p]++;
    pool.push(counts.indexOf(Math.min(...counts)));
  }
  return shuffled(pool, rngFor(`free|${seed}`)).slice(0, freeCount);
}

/**
 * Permute `options` so the option currently at `keyIndex` ends up at `target`, with the rest
 * scrambled deterministically. Returns the new options and the new key index (=== target).
 *
 * The scramble-then-swap order matters. Swapping alone (key into place, incumbent into the
 * key's old slot) leaves every other distractor exactly where the author put it, so the
 * distractor ORDER still carries the author's habits even after the key moves.
 */
export function permuteWithKey<T>(
  options: readonly T[],
  keyIndex: number,
  target: number,
  seed: string,
): { options: T[]; keyIndex: number } {
  if (keyIndex < 0 || keyIndex >= options.length) {
    // An unresolvable key is not this file's business to paper over — hand it back untouched
    // and let the bank gate be the thing that fails on it.
    return { options: options.slice(), keyIndex };
  }
  const key = options[keyIndex];
  const rest = options.filter((_, i) => i !== keyIndex);
  const scrambled = shuffled(rest, rngFor(seed));
  const t = Math.max(0, Math.min(options.length - 1, target));
  scrambled.splice(t, 0, key);
  return { options: scrambled, keyIndex: t };
}

// ── NUMERIC OPTION SETS ARE ORDERED, NOT PERMUTED ───────────────────────────
// An option set whose members are all quantities ("Dieci euro", "15 euro", "Alle 9", "Il 70%")
// is read as a scale, and a scale printed out of order makes the candidate sort it before they
// can answer — difficulty that measures nothing, which almi-audit flags as a construct-irrelevant
// defect (H1q) in its own right.
//
// This was found by measuring rather than by reasoning, and it is worth recording how: the first
// version of this file permuted everything. The authored bank already had 8 of its 14 numeric
// sets out of order; permuting took that to 11. The position fix was quietly making a different
// defect worse — which is what "fixing one axis exposes another" looks like when it actually
// happens to you.
//
// So numeric sets are SORTED ascending instead of shuffled, which fixes all 14 including the 8
// that were already wrong. The cost is stated plainly: their key position is then decided by the
// value, not by us, so they cannot take part in position balancing. They are counted as FIXED
// and the free atoms in the same bucket are assigned around them, so the bucket still comes out
// balanced overall — see assignTargets below.

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8,
  nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15,
  sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20, trenta: 30, quaranta: 40,
  cinquanta: 50, sessanta: 60, settanta: 70, ottanta: 80, novanta: 90, cento: 100,
};

/** The quantity an option states, or null if it does not state one. */
export function optionValue(s: string): number | null {
  const t = String(s ?? "").toLowerCase();
  const digits = t.match(/\d+(?:[.,]\d+)?/);
  if (digits) return parseFloat(digits[0].replace(",", "."));
  for (const w of t.replace(/[^\p{L}]+/gu, " ").trim().split(/\s+/)) {
    if (w in NUMBER_WORDS) return NUMBER_WORDS[w];
  }
  return null;
}

/** Values for an all-numeric option set, or null if any option is not a quantity. */
export function numericValues(options: readonly string[]): number[] | null {
  const v = options.map(optionValue);
  return v.every((x) => x !== null) ? (v as number[]) : null;
}

/** Sort an all-numeric option set ascending, carrying the key with it. */
function sortNumeric(options: readonly string[], keyIndex: number, values: number[]) {
  const order = options.map((_, i) => i).sort((a, b) => values[a] - values[b] || a - b);
  return {
    options: order.map((i) => options[i]),
    keyIndex: order.indexOf(keyIndex),
  };
}

// ── bucket assignment ───────────────────────────────────────────────────────
// An "atom" here is one option-bearing gradable unit: an MCQ question or a cloze blank.
// Buckets are keyed by {exam, level, section, kind, optionCount} — the same grain the
// gameability checks report at, so a bucket that is balanced here is balanced there.
type AtomRef =
  | { kind: "mcq"; item: BankItem; qi: number; nOptions: number }
  | { kind: "cloze"; item: BankItem; bi: number; nOptions: number };

const bucketOf = (a: AtomRef) =>
  `${a.item.exam}::${a.item.level}::${a.item.section}::${a.kind}::${a.nOptions}`;

/** A stable per-atom sort key, so target assignment does not depend on the order the seed
 *  files happen to be concatenated in. Adding an item to cils-uno.ts must not reshuffle
 *  celi-due.ts. */
const atomSortKey = (a: AtomRef) =>
  `${a.item.title}#${a.kind === "mcq" ? a.qi : a.bi}`;

/**
 * De-game a whole bank. Pure: returns new items, leaves the input untouched.
 *
 * Exported as a function over an arbitrary item list — not as a transform hard-wired to the
 * real bank — so the gate can drive it with a synthetic all-index-1 fixture and watch it come
 * out balanced, without the authored bank being involved in its own proof.
 */
export function deGame(bank: readonly BankItem[]): BankItem[] {
  // Deep-copy only the parts we rewrite; everything else is shared by reference.
  const out: BankItem[] = bank.map((it) => ({ ...it, payload: clonePayload(it.payload) }));

  const atoms: AtomRef[] = [];
  for (const item of out) {
    const p = item.payload;
    if (isMcqPayload(p)) {
      p.questions.forEach((q, qi) => {
        if (Array.isArray(q.options) && q.options.length > 1) {
          atoms.push({ kind: "mcq", item, qi, nOptions: q.options.length });
        }
      });
    } else if (isClozePayload(p)) {
      p.blanks.forEach((b, bi) => {
        if (Array.isArray(b.options) && b.options.length > 1) {
          atoms.push({ kind: "cloze", item, bi, nOptions: b.options!.length });
        }
      });
    }
  }

  const byBucket = new Map<string, AtomRef[]>();
  for (const a of atoms) {
    const k = bucketOf(a);
    const list = byBucket.get(k);
    if (list) list.push(a);
    else byBucket.set(k, [a]);
  }

  for (const [bucket, list] of byBucket) {
    list.sort((x, y) => (atomSortKey(x) < atomSortKey(y) ? -1 : atomSortKey(x) > atomSortKey(y) ? 1 : 0));
    const n = list[0].nOptions;

    // Pass 1 — the atoms that cannot move. Numeric sets get sorted into value order now, and the
    // key position that falls out of that is a fact the balancer has to work around.
    const fixedPos: number[] = [];
    const free: AtomRef[] = [];
    for (const a of list) {
      const [opts, keyIdx] = readAtom(a);
      const values = numericValues(opts);
      if (values) {
        const r = sortNumeric(opts, keyIdx, values);
        writeAtom(a, r.options, r.keyIndex);
        fixedPos.push(r.keyIndex);
      } else {
        free.push(a);
      }
    }

    // Pass 2 — everything else, assigned the positions the bucket is short of.
    const targets = assignTargets(free.length, fixedPos, n, bucket);
    free.forEach((a, i) => {
      const seed = `opts|${a.item.exam}|${a.item.level}|${a.item.section}|${a.item.title}|${a.kind}|${a.kind === "mcq" ? a.qi : a.bi}`;
      const [opts, keyIdx] = readAtom(a);
      const r = permuteWithKey(opts, keyIdx, targets[i], seed);
      writeAtom(a, r.options, r.keyIndex);
    });
  }

  return out;
}

/** Read an atom's option list and key index, whatever kind it is. A cloze key is the ANSWER
 *  TEXT, so its index is looked up rather than stored. */
function readAtom(a: AtomRef): [string[], number] {
  if (a.kind === "mcq") {
    const q = (a.item.payload as McqPayload).questions[a.qi];
    return [q.options, q.answerIndex];
  }
  const b = (a.item.payload as ClozePayload).blanks[a.bi];
  return [b.options!, b.options!.indexOf(b.answer)];
}

/** Write the rearranged options back. For MCQ the key is an INDEX and must be remapped; for a
 *  cloze the key is the answer TEXT, which the rearrangement does not move, so `b.answer` is
 *  deliberately left alone — rewriting it here is how a permutation would quietly become a
 *  content edit. */
function writeAtom(a: AtomRef, options: string[], keyIndex: number): void {
  if (a.kind === "mcq") {
    const q = (a.item.payload as McqPayload).questions[a.qi];
    q.options = options;
    q.answerIndex = keyIndex;
    return;
  }
  (a.item.payload as ClozePayload).blanks[a.bi].options = options;
}

// Local shape guards. These deliberately do not import the ones in @/lib/items: this module is
// imported BY that one, and a cycle between the bank and its own transform is the kind of thing
// that works until the day module evaluation order changes.
type WithQuestions = { questions: { q: string; options: string[]; answerIndex: number }[] };
type WithBlanks = { blanks: { answer: string; options?: string[] }[] };
const isMcqPayload = (p: Payload): p is McqPayload => Array.isArray((p as WithQuestions).questions);
const isClozePayload = (p: Payload): p is ClozePayload => Array.isArray((p as WithBlanks).blanks);

function clonePayload(p: Payload): Payload {
  if (isMcqPayload(p)) {
    return { ...p, questions: p.questions.map((q) => ({ ...q, options: q.options.slice() })) };
  }
  if (isClozePayload(p)) {
    return { ...p, blanks: p.blanks.map((b) => ({ ...b, options: b.options ? b.options.slice() : undefined })) };
  }
  return p;
}
