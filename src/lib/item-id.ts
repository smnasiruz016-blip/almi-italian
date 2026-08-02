// AlmiItalian — SERVER-SIDE ITEM IDENTITY, and the one place the answer key is dropped.
//
// ── WHY THIS HAD TO COME FIRST ──────────────────────────────────────────────
// Before this file, bank items had no id of any kind. The runner indexed them by their position
// in the rendered array, which meant there was nothing a client could name an item BY and
// nothing the server could re-load an item FROM. Server-authoritative grading was not merely
// missing, it was impossible to write: a grader needs a handle, and there wasn't one. Every
// other fix in this area is downstream of this file existing.
//
// ── WHY THE HASH IS EXACTLY {exam, level, section, title} ───────────────────
// That tuple is the DATABASE'S OWN unique key — ItalianItem @@unique([exam, level, section,
// title]) — and it is the seeder's dedup key. Hashing precisely it means one string identifies
// the item in the bundle AND resolves the ItalianItem row in Neon, so an attempt can persist
// against a real foreign key instead of a guess.
//
// The payload is deliberately NOT in the hash. Two reasons:
//
//   1. Including it would desync the id from the row it names — edit one distractor and the id
//      moves while the database row stays put.
//   2. The bank is de-gamed at load (@/lib/degame permutes options and moves keys with them). A
//      payload-derived id would therefore differ between the authored bank and the served one,
//      so an id minted while serving would fail to resolve while seeding. Identity has to be
//      the thing that does NOT move when the arrangement does.
//
// The stated trade: renaming an item's title changes its id and makes the seed create a new
// row. That is the two moving together rather than apart, which is the behaviour we want.

import { createHash } from "node:crypto";
import { BANK, type BankItem, isMcq, isMatching, isOrdering, isCloze } from "@/lib/items";
import type { RunnerItem, RunnerPayload } from "@/lib/runner-items";

/** Stable, content-derived id — the handle the client posts back. */
export function stableItemId(it: Pick<BankItem, "exam" | "level" | "section" | "title">): string {
  return createHash("sha256")
    .update(JSON.stringify({ exam: it.exam, level: it.level, section: it.section, title: it.title }))
    .digest("hex")
    .slice(0, 16);
}

/** Re-load the full item — INCLUDING its answer key — by its stable id, server-side. */
export function getItemByStableId(id: string): BankItem | undefined {
  return BANK.find((it) => stableItemId(it) === id);
}

/**
 * The collision check as a PURE function over any item list, so the gate can be shown RED
 * against a synthetic duplicate without ever editing the authored bank.
 *
 * A collision is not a cosmetic problem. Two items sharing an id means the seed merges them
 * into one row and the grader marks a learner's answers against whichever of the two it
 * happened to find first — a wrong mark that looks exactly like a right one.
 */
export function findIdCollisions(items: readonly BankItem[]): string[] {
  const seen = new Map<string, string>();
  const out: string[] = [];
  for (const it of items) {
    const id = stableItemId(it);
    const key = `${it.exam} | ${it.level} | ${it.section} | ${it.title}`;
    const prior = seen.get(id);
    if (prior) {
      out.push(
        `"${key}" and "${prior}" both hash to ${id} — the seed would merge them into one row, and grading would key against the wrong item`,
      );
      continue;
    }
    seen.set(id, key);
  }
  return out;
}

/** Build-time guard: no two bank items may share a stable id. */
export function assertNoIdCollisions(): void {
  const collisions = findIdCollisions(BANK);
  if (collisions.length > 0) {
    throw new Error(`stableItemId collision:\n  ${collisions.join("\n  ")}`);
  }
}

// ── THE STRIP ───────────────────────────────────────────────────────────────
// toRunnerItem is the ONLY way to produce a RunnerItem, and RunnerItem's payload types have no
// key fields, so this is the only place the omission has to be got right — and a page that
// tries to route around it does not compile.
//
// Note what is NOT dropped: `title`, `prompt`, `topicTag`, `passage`, `audioScript`. None of
// them is a key. audioScript in particular is the listening transcript, which this product has
// always shown as an opt-in "Show transcript" control; removing it here would be security
// theatre that costs a real feature.

/** Strip an authored item down to what a learner may receive. */
export function toRunnerItem(it: BankItem): RunnerItem {
  return {
    id: stableItemId(it),
    exam: it.exam,
    level: it.level,
    section: it.section,
    taskType: it.taskType,
    difficulty: it.difficulty,
    title: it.title,
    prompt: it.prompt,
    topicTag: it.topicTag,
    guidanceNote: it.guidanceNote,
    payload: stripAnswers(it.payload),
  };
}

/**
 * Drop every key field from a payload.
 *
 * Written as an explicit per-shape rebuild rather than a spread-and-delete. `{...p}` followed by
 * `delete p.answerIndex` is one forgotten line away from shipping the key, and it fails OPEN:
 * add a keyed field to an authored shape later and the spread carries it straight to the
 * browser with nothing turning red. Naming each field that survives fails CLOSED instead — a
 * new authored field is invisible to the learner until someone adds it here on purpose.
 */
export function stripAnswers(p: BankItem["payload"]): RunnerPayload {
  if (isMcq(p)) {
    return {
      part: p.part,
      audioScript: p.audioScript,
      passage: p.passage,
      // Do NOT spread `q` — that is exactly how answerIndex would come back.
      questions: p.questions.map((q) => ({ q: q.q, options: q.options })),
    };
  }
  if (isMatching(p)) {
    return {
      part: p.part,
      audioScript: p.audioScript,
      instruction: p.instruction,
      prompts: p.prompts,
      options: p.options,
      // answerMap dropped.
    };
  }
  if (isOrdering(p)) {
    return {
      instruction: p.instruction,
      shuffled: p.shuffled,
      // correctOrder dropped; the runner needs only how many positions to render.
      slots: p.correctOrder.length,
    };
  }
  if (isCloze(p)) {
    return {
      text: p.text,
      // `answer` dropped from every blank; `options` is the visible choice list and stays.
      blanks: p.blanks.map((b) => (b.options ? { options: b.options } : {})),
    };
  }
  // Writing and Speaking carry no key — they are never auto-marked. Passed through whole.
  return p as RunnerPayload;
}

/** Every served item for one bucket, keys removed. */
export function runnerItemsFor(items: readonly BankItem[]): RunnerItem[] {
  return items.map(toRunnerItem);
}
