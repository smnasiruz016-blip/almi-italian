// De-game gate — the answer key must not be findable without the Italian.
//
// Run: npm run gate:degame   (wired into `build`, so it blocks)
//
// Three independent ways a fixed-choice bank leaks its key, checked separately because they
// have separate fixes and one of them is NOT fixed by the other two:
//
//   1. POSITION      the key sits at the same index too often          → fixed by @/lib/degame
//   2. DEAD POSITION an index is (almost) never the key                → fixed by @/lib/degame
//   3. LONGEST OPTION the key is distinctively the longest option      → NOT fixable by permuting
//
// Check 3 is here precisely so that 1 and 2 going green cannot be mistaken for the bank being
// clean. Shuffling options changes which index the key occupies; it cannot change which option
// is the longest, and a learner who picks the longest option is not reading Italian either.
//
// ── MEASURED AGAINST THE BANK AS SERVED ─────────────────────────────────────
// Everything below reads BANK — the de-gamed array that toRunnerItem serves and lib/it/grade
// marks against — not RAW_BANK. A gate that measured the authored literals would be checking a
// bank nobody receives, and would go green while the served one leaked.
//
// ── CHECK 3 USES THE AUDIT'S OWN RULE, DELIBERATELY ─────────────────────────
// cueLongest below is a transcription of almi-audit's src/checks/item-flaws.mjs: unique longest
// option, and only when it is at least 1.4× the next longest ("a little longer" is not a cue
// anyone can follow). Section is flagged at a 60% hit rate among the items where the cue
// applies. Writing our own gentler rule here would produce a green build and a red audit, which
// is the worst of both — a gate that disagrees with the checker is a gate that teaches the team
// to ignore the checker.

import { BANK, RAW_BANK, isMcq, isCloze, isMatching, isOrdering, type BankItem } from "../../src/lib/items";
import { deGame } from "../../src/lib/degame";

const CUE_SHARE = 0.6;   // almi-audit CUE_SHARE
const CUE_MIN_N = 6;     // almi-audit CUE_MIN_N — below this a lean is as likely chance as design
const RARE_FLOOR = 0.25; // almi-audit RARE_FLOOR — below a quarter of fair share is a dead class
const MULTI_SHARE = 0.6; // almi-audit position threshold, multi-option
const BINARY_SHARE = 0.75;

let failed = false;
const fail = (msg: string) => { console.error(`  ✗ ${msg}`); failed = true; };

// ── the measurements, as pure functions over any item list ──────────────────
// Pure and exported-shaped on purpose: the RED proofs below drive them with synthetic banks, so
// the detectors are shown working without the authored bank being involved in its own proof.

type Bucket = { n: number; nOptions: number; pos: number[] };

function positions(bank: readonly BankItem[]): Map<string, Bucket> {
  const m = new Map<string, Bucket>();
  const add = (key: string, idx: number, nOptions: number) => {
    let b = m.get(key);
    if (!b) { b = { n: 0, nOptions, pos: new Array(nOptions).fill(0) }; m.set(key, b); }
    b.n++;
    if (idx >= 0 && idx < nOptions) b.pos[idx]++;
  };
  for (const it of bank) {
    const p = it.payload;
    const at = (kind: string, n: number) => `${it.exam}::${it.level}::${it.section}::${kind}::${n}`;
    if (isMcq(p)) for (const q of p.questions) if (q.options.length > 1) add(at("mcq", q.options.length), q.answerIndex, q.options.length);
    if (isCloze(p)) for (const b of p.blanks) if (b.options && b.options.length > 1) add(at("cloze", b.options.length), b.options.indexOf(b.answer), b.options.length);
    if (isMatching(p)) for (const a of p.answerMap) add(at("matching", p.options.length), a, p.options.length);
    if (isOrdering(p)) for (const a of p.correctOrder) add(at("ordering", p.shuffled.length), a, p.shuffled.length);
  }
  return m;
}

/** almi-audit's cueLongest, transcribed. Returns the index the cue points at, or null. */
function cueLongest(options: readonly string[]): number | null {
  const lens = options.map((o) => String(o ?? "").length);
  const max = Math.max(...lens);
  if (lens.filter((l) => l === max).length !== 1) return null;
  const second = Math.max(...lens.filter((l) => l !== max));
  if (max < second * 1.4) return null;
  return lens.indexOf(max);
}

type CueRow = { applied: number; hit: number; nSum: number; kSum: number };

function longestCue(bank: readonly BankItem[]): Map<string, CueRow> {
  const m = new Map<string, CueRow>();
  const add = (key: string, options: string[], keyIndex: number) => {
    let r = m.get(key);
    if (!r) { r = { applied: 0, hit: 0, nSum: 0, kSum: 0 }; m.set(key, r); }
    r.nSum += 1; r.kSum += options.length;
    const cue = cueLongest(options);
    if (cue === null) return;
    r.applied++;
    if (cue === keyIndex) r.hit++;
  };
  for (const it of bank) {
    const p = it.payload;
    const at = (kind: string) => `${it.exam}::${it.level}::${it.section}::${kind}`;
    if (isMcq(p)) for (const q of p.questions) if (q.options.length > 1) add(at("mcq"), q.options, q.answerIndex);
    if (isCloze(p)) for (const b of p.blanks) if (b.options && b.options.length > 1) add(at("cloze"), b.options, b.options.indexOf(b.answer));
  }
  return m;
}

// ── RED PROOFS ──────────────────────────────────────────────────────────────
console.log("De-game gate — position, dead position, longest-option cue\n");
console.log("RED proofs (the detectors must fail on a bank that is known bad):");

const rigged: BankItem[] = Array.from({ length: 24 }, (_, i) => ({
  exam: "CILS_B1C", level: "B1C", section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
  title: `GATE FIXTURE — rigged ${i}`,
  payload: { questions: [{ q: "?", options: ["aa", "bb", "cc", "dd"], answerIndex: 1 }] },
} as unknown as BankItem));

{
  const b = [...positions(rigged).values()][0];
  const worst = Math.max(...b.pos) / b.n;
  if (worst < MULTI_SHARE) fail("RED PROOF FAILED — a bank with every key at index 1 did not register as a position cluster. The position detector is blind.");
  else console.log(`  ✓ position detector flags an all-index-1 bank (${Math.round(worst * 100)}% on one index)`);

  const dead = b.pos.filter((c) => c / b.n < (1 / b.nOptions) * RARE_FLOOR).length;
  if (dead === 0) fail("RED PROOF FAILED — a bank where indices 0, 2 and 3 are never the key reported no dead position.");
  else console.log(`  ✓ dead-position detector flags the same bank (${dead} never-keyed position(s))`);

  // …and the transform must actually fix what the detector just caught.
  const fixedB = [...positions(deGame(rigged)).values()][0];
  const spread = Math.max(...fixedB.pos) - Math.min(...fixedB.pos);
  if (spread > 1) fail(`RED PROOF FAILED — deGame() left a spread of ${spread} on the rigged fixture; the transform does not do what this gate assumes.`);
  else console.log(`  ✓ deGame() turns that fixture into ${fixedB.pos.join("/")} (spread ${spread})`);
}

{
  const cued: BankItem[] = Array.from({ length: 10 }, (_, i) => ({
    exam: "CELI", level: "DUE", section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: `GATE FIXTURE — cued ${i}`,
    payload: { questions: [{ q: "?", options: ["si", "no", "una risposta molto piu lunga delle altre", "mai"], answerIndex: 2 }] },
  } as unknown as BankItem));
  const r = [...longestCue(cued).values()][0];
  if (r.applied === 0 || r.hit / r.applied < CUE_SHARE) {
    fail("RED PROOF FAILED — a bank whose key is always the longest option did not trip the longest-option cue.");
  } else {
    console.log(`  ✓ longest-option detector flags a bank where the key is always longest (${r.hit}/${r.applied})`);
  }
  // And the negative: permuting must NOT silence it, because permuting does not fix it.
  const after = [...longestCue(deGame(cued)).values()][0];
  if (after.hit / after.applied < CUE_SHARE) {
    fail("RED PROOF FAILED — deGame() silenced the longest-option cue. It cannot; if this passes, the detector is measuring position, not length.");
  } else {
    console.log(`  ✓ deGame() does NOT silence it (${after.hit}/${after.applied}) — position and length are separate defects`);
  }
}

// ── 1 + 2. POSITION AND DEAD POSITION, over the bank AS SERVED ──────────────
console.log("\nServed bank — key position by bucket:");
const before = positions(RAW_BANK);
const after = positions(BANK);
for (const key of [...after.keys()].sort()) {
  const a = after.get(key)!;
  const b = before.get(key);
  const share = (r: Bucket) => r.pos.map((c) => `${Math.round((100 * c) / r.n)}%`.padStart(5)).join("");
  const spread = Math.max(...a.pos) - Math.min(...a.pos);
  const label = key.replace(/::\d+$/, "");
  console.log(
    `  ${label.padEnd(42)} n=${String(a.n).padStart(3)}  before${b ? share(b) : ""}   after${share(a)}   spread=${spread}`,
  );

  const limit = a.nOptions === 2 ? BINARY_SHARE : MULTI_SHARE;
  const worst = Math.max(...a.pos) / a.n;
  if (a.n >= CUE_MIN_N && worst >= limit) {
    fail(`${label}: index ${a.pos.indexOf(Math.max(...a.pos))} is the key in ${Math.round(worst * 100)}% of ${a.n} — gameable from position (limit ${Math.round(limit * 100)}%)`);
  }
  const fair = 1 / a.nOptions;
  a.pos.forEach((c, i) => {
    if (a.n >= CUE_MIN_N && c / a.n < fair * RARE_FLOOR) {
      fail(`${label}: index ${i} of ${a.nOptions} is the key in ${c} of ${a.n} (${Math.round((100 * c) / a.n)}%) — below a quarter of its ${Math.round(fair * 100)}% fair share, so never picking it is free`);
    }
  });
  // The balance the block scheme promises. Stated as its own assertion so that a future change
  // to deGame that quietly stops balancing shows up here rather than in a learner's score.
  if (spread > 1) {
    fail(`${label}: key positions are ${a.pos.join("/")} — a spread of ${spread}. Balanced assignment should never exceed 1.`);
  }
}

// ── 3. LONGEST-OPTION CUE ───────────────────────────────────────────────────
console.log("\nServed bank — longest-option cue (audit rule: unique longest AND ≥1.4× the next):");
for (const [key, r] of [...longestCue(BANK).entries()].sort()) {
  if (r.applied === 0) { console.log(`  ${key.padEnd(42)} cue never applies (no option is 1.4× the next) — clean by construction`); continue; }
  const share = r.hit / r.applied;
  const chance = r.kSum > 0 ? r.nSum / r.kSum : 0;
  console.log(`  ${key.padEnd(42)} ${r.hit}/${r.applied} = ${Math.round(share * 100)}%  (chance ${Math.round(chance * 100)}%)`);
  if (r.applied >= CUE_MIN_N && share >= CUE_SHARE && share >= chance * 1.5) {
    fail(`${key}: the longest option is the key in ${r.hit} of ${r.applied} items (${Math.round(share * 100)}%) — chance is ${Math.round(chance * 100)}%. Permuting cannot fix this; the distractors need writing.`);
  }
}

console.log("");
if (failed) {
  console.error("De-game gate FAILED\n");
  process.exit(1);
}
console.log("De-game gate passed\n");
