// AlmiItalian — WHAT THE BROWSER IS ALLOWED TO SEE.
//
// This module is the client-safe half of the item vocabulary. It declares the runner's
// payload shapes, the type guards that render them, and the atom-key convention that the
// browser and the grader both spell the same way. It imports NOTHING — not the bank, not
// node:crypto — and that is deliberate on both counts.
//
// ── WHY IT EXISTS AS A SEPARATE FILE ────────────────────────────────────────
// PracticeRunner used to import its type guards (isMcq, isMatching, …) from @/lib/items.
// Those are VALUES, so the import pulled @/lib/items into the client bundle, and with it
// `src/data/items-batch1.json` — all 270 authored items, `answerIndex` / `answerMap` /
// `correctOrder` / `blanks[].answer` intact. The whole answer key was a JS chunk away from
// any learner with devtools, on every practice page, whatever the props said.
//
// Stripping the props would not have fixed that by itself: the bundle was reachable through
// the guards, not through the page. So the guards moved here, to a module that has no way to
// reach the bank, and the runner now imports only from this file.
//
// ── THE OMISSION IS THE POINT, AND THE TYPE ENFORCES IT ─────────────────────
// Every Runner* payload below is its authored counterpart MINUS the key:
//
//     McqQuestion      { q, options, answerIndex }  →  RunnerMcqQuestion   { q, options }
//     MatchingPayload  { …, answerMap }             →  RunnerMatchingPayload  { … }
//     OrderingPayload  { …, correctOrder }          →  RunnerOrderingPayload  { …, slots }
//     ClozePayload     { blanks: { answer, options? } } → { blanks: { options? } }
//
// A page that tries to hand the authored bank straight to the runner no longer compiles.
// That is the difference between a rule and a habit: `toRunnerItem` in @/lib/item-id is the
// only way to produce these, and it is the only place the key is dropped.
//
// ORDERING keeps `slots` because the runner has to render one select per position and it used
// to get that count from `correctOrder.length` — the key doing double duty as a layout hint.
// `slots` is that count and nothing else: a number of blanks, which the learner can see by
// counting the blanks.

export type Part = "WRITTEN" | "ORAL";

export type RunnerMcqQuestion = { q: string; options: string[] };
export type RunnerMcqPayload = {
  part?: Part;
  audioScript?: string;
  passage?: string;
  questions: RunnerMcqQuestion[];
};
export type RunnerMatchingPayload = {
  part?: Part;
  audioScript?: string;
  instruction: string;
  prompts: string[];
  options: string[];
};
export type RunnerOrderingPayload = {
  instruction: string;
  shuffled: string[];
  /** How many positions to render. Was `correctOrder.length`. */
  slots: number;
};
export type RunnerClozeBlank = { options?: string[] };
export type RunnerClozePayload = { text: string; blanks: RunnerClozeBlank[] };

// Writing and Speaking are AI-criteria estimates with no key to strip, so these are the
// authored shapes unchanged. They are re-declared here rather than imported so that this
// module keeps its "imports nothing" property, which is what keeps the bank out of the bundle.
export type RunnerWritingPayload = {
  part?: Part;
  task: string;
  context: string;
  minWords: number;
  maxWords?: number;
  criteria: string[];
};
export type RunnerSpeakingPayload = {
  part?: Part;
  task: string;
  parts: string[];
  criteria: string[];
  prepSeconds?: number;
  speakSeconds?: number;
};

export type RunnerPayload =
  | RunnerMcqPayload
  | RunnerMatchingPayload
  | RunnerOrderingPayload
  | RunnerClozePayload
  | RunnerWritingPayload
  | RunnerSpeakingPayload;

export type RunnerItem = {
  /** Stable content-derived id — sha256({exam, level, section, title}). The handle the client
   *  posts back so the server re-loads the item and marks against its OWN key. This replaced
   *  the answer key that used to ship in its place. */
  id: string;
  exam: string;
  level: string;
  section: string;
  taskType: string;
  difficulty: string;
  title: string;
  prompt?: string;
  topicTag?: string;
  guidanceNote?: string;
  payload: RunnerPayload;
};

// Shape guards. These detect the payload rather than trusting `taskType`, so a section that
// mixes MCQ + MATCHING (Ascolto does) renders each item correctly.
//
// The discriminators had to change with the shapes: MATCHING used to be identified by
// `answerMap` and ORDERING by `correctOrder` — both keys, both gone. They are now identified
// by what the learner actually sees, which is what a renderer should have been keying on.
export const isMcq = (p: RunnerPayload): p is RunnerMcqPayload =>
  Array.isArray((p as RunnerMcqPayload).questions);
export const isMatching = (p: RunnerPayload): p is RunnerMatchingPayload =>
  Array.isArray((p as RunnerMatchingPayload).prompts) && Array.isArray((p as RunnerMatchingPayload).options);
export const isOrdering = (p: RunnerPayload): p is RunnerOrderingPayload =>
  Array.isArray((p as RunnerOrderingPayload).shuffled);
export const isCloze = (p: RunnerPayload): p is RunnerClozePayload =>
  Array.isArray((p as RunnerClozePayload).blanks);
export const isWriting = (p: RunnerPayload): p is RunnerWritingPayload =>
  typeof (p as RunnerWritingPayload).minWords === "number";
export const isSpeaking = (p: RunnerPayload): p is RunnerSpeakingPayload =>
  Array.isArray((p as RunnerSpeakingPayload).parts);
export const isObjectivePayload = (p: RunnerPayload): boolean =>
  isMcq(p) || isMatching(p) || isOrdering(p) || isCloze(p);

// ── THE ATOM-KEY CONVENTION ─────────────────────────────────────────────────
// One "atom" is one gradable thing: an MCQ question, one matching prompt, one ordering
// position, one cloze blank. The browser records an answer per atom key; the grader re-derives
// the SAME keys from the server-held item and marks each one.
//
// The keys are scoped to their item — `mcq:0`, not `3:mcq:0`. The old client keys carried the
// item's index in the rendered array, which meant an answer's meaning depended on the order
// the page happened to lay items out in. Now the item is named by its stable id in the posted
// envelope and the atom key names only the position WITHIN that item, so nothing about a
// posted answer depends on render order.
export const ATOM = {
  mcq: (questionIndex: number) => `mcq:${questionIndex}`,
  matching: (promptIndex: number) => `mat:${promptIndex}`,
  ordering: (slot: number) => `ord:${slot}`,
  cloze: (blankIndex: number) => `clz:${blankIndex}`,
} as const;

/** One marked atom, as it comes back from /api/it/submit AFTER the section is scored. */
export type AtomMark = {
  itemId: string;
  /** The ATOM key this mark belongs to (`mcq:0`, `mat:2`, …). */
  atom: string;
  correct: boolean;
  /** The right answer, in exactly the form the client stores its own answers in — an option
   *  index as a string for MCQ / matching / ordering, the answer text for a cloze blank. It is
   *  disclosed HERE, after marking, and only here. */
  correctValue: string;
};

/** The scored reply. `correct`, `total`, `percent` and the scale read-out are all computed
 *  server-side; the client renders them and asserts nothing of its own. */
export type SubmitResult = {
  ok: true;
  correct: number;
  total: number;
  percent: number;
  exam: string;
  level: string;
  section: string;
  /** Present only for section-scored engines (CILS). CELI is part-scored and sends null. */
  scaled: { score: number; max: number; floor: number; status: "CLEAR" | "BORDERLINE" | "BELOW" } | null;
  marks: AtomMark[];
};
