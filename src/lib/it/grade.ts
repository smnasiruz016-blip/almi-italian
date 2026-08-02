// AlmiItalian — server-authoritative marking.
//
// ── WHAT THIS REPLACED ──────────────────────────────────────────────────────
// There was no grading route. PracticeRunner.tsx built a list of gradable atoms in the browser
// and marked each one against `answerIndex` / `answerMap` / `correctOrder` / `blank.answer`,
// read straight out of the props the page had handed it. The score, the percentage, the scaled
// section result and the CLEAR/BORDERLINE/BELOW verdict were all computed in the page.
//
// So the product had no measurement, only a display of one. The key was in the payload, the
// arithmetic was in the client, and a learner who changed either got whatever answer they
// preferred. Nothing here is a hardening pass over that design — the marking is being moved,
// for the first time, to somewhere the learner is not.
//
// ── THE RULE THIS FILE KEEPS ────────────────────────────────────────────────
// The request says which item and which option was chosen. Everything else — the key, the
// exam, the level, the section, the point total, the scale, the verdict — is a fact about the
// ITEM, and comes from the server-loaded item. AttemptBody below is the whole of what a client
// may assert, and the route types its body as exactly that, so widening it turns tsc red at the
// call site rather than quietly re-opening the hole.

import { getItemByStableId } from "@/lib/item-id";
import { isMcq, isMatching, isOrdering, isCloze, type BankItem } from "@/lib/items";
import { TRACKS } from "@/lib/practice";
import { ATOM, type AtomMark, type SubmitResult } from "@/lib/runner-items";

/** Free-text cloze normalisation: case-insensitive, trimmed, inner whitespace collapsed.
 *  Identical to the rule the client used to apply, moved here with it. */
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Everything a client is allowed to say. Note what is ABSENT: no answer key, no score, no
 * correct/total, no exam, level or section. Those are facts about the items and the server owns
 * them.
 */
export interface AttemptBody {
  items?: { itemId?: string; answers?: Record<string, string> }[];
}

export type GradeOutcome = { ok: false; status: number; error: string } | SubmitResult;

/**
 * Mark ONE atom against ITS OWN key. The key is the first argument on purpose: this is the
 * single place a key is consumed, so "where did that key come from" is answerable by reading
 * one line. It comes from the server-loaded item, never from anything in the request.
 */
function markAtom(
  itemId: string,
  atom: string,
  correctValue: string,
  chosen: string | undefined,
  freeText: boolean,
): AtomMark {
  const correct = freeText
    ? norm(chosen ?? "") !== "" && norm(chosen ?? "") === norm(correctValue)
    : chosen !== undefined && chosen === correctValue;
  return { itemId, atom, correct, correctValue };
}

/** Every gradable atom of one server-loaded item, marked against the answers posted for it. */
export function markItem(id: string, item: BankItem, answers: Record<string, string>): AtomMark[] {
  const p = item.payload;
  if (isMcq(p)) {
    return p.questions.map((q, qi) =>
      markAtom(id, ATOM.mcq(qi), String(q.answerIndex), answers[ATOM.mcq(qi)], false),
    );
  }
  if (isMatching(p)) {
    return p.answerMap.map((ans, pi) =>
      markAtom(id, ATOM.matching(pi), String(ans), answers[ATOM.matching(pi)], false),
    );
  }
  if (isOrdering(p)) {
    return p.correctOrder.map((ans, slot) =>
      markAtom(id, ATOM.ordering(slot), String(ans), answers[ATOM.ordering(slot)], false),
    );
  }
  if (isCloze(p)) {
    return p.blanks.map((b, bi) =>
      // A blank with options is an exact match against the chosen option; a free-text blank is
      // normalised first. Both rules are the ones the browser used to apply — moved, not changed.
      markAtom(id, ATOM.cloze(bi), b.answer, answers[ATOM.cloze(bi)], !b.options),
    );
  }
  // Writing / Speaking: no key, nothing to mark.
  return [];
}

export function gradeAttempt(body: AttemptBody): GradeOutcome {
  const posted = Array.isArray(body.items) ? body.items : null;
  if (!posted || posted.length === 0) return { ok: false, status: 400, error: "Missing items" };

  const loaded: { id: string; item: BankItem }[] = [];
  const marks: AtomMark[] = [];

  for (const p of posted) {
    const id = typeof p?.itemId === "string" ? p.itemId : "";
    if (!id) return { ok: false, status: 400, error: "Missing itemId" };
    // An id that resolves to nothing FAILS LOUDLY. Marking it 0 would be the same defect in a
    // quieter coat: the caller could not tell a wrong answer from an item that does not exist,
    // and a typo'd id would read as a legitimately failed section.
    const item = getItemByStableId(id);
    if (!item) return { ok: false, status: 404, error: `Unknown item: ${id}` };
    const answers = p.answers && typeof p.answers === "object" ? p.answers : {};
    loaded.push({ id, item });
    // Marked here, beside the load, so the key never travels further than the item it came from.
    marks.push(...markItem(id, item, answers));
  }

  // Exam, level and section come from the ITEMS, not the body. A section is one bucket by
  // construction; a post spanning several is malformed, and is refused rather than scored
  // against whichever bucket the client would prefer to be measured on.
  const buckets = new Set(loaded.map((l) => `${l.item.exam}::${l.item.level}::${l.item.section}`));
  if (buckets.size !== 1) {
    return { ok: false, status: 400, error: "Items span more than one exam, level or section" };
  }
  const { exam, level, section } = loaded[0].item;

  // Produzione scritta / orale are AI-criteria estimates with no key to compare against.
  // Refusing is the honest answer: silently returning 0/0 would let a Writing post be presented
  // as a marked section that happened to score nothing.
  const track = TRACKS.find((t) => t.exam === exam && t.level === level);
  const meta = track?.sections.find((s) => s.code === section);
  if (meta?.kind === "estimate") {
    return {
      ok: false,
      status: 400,
      error: "This section is not auto-marked — Produzione scritta and orale have no answer key",
    };
  }
  if (marks.length === 0) {
    return { ok: false, status: 400, error: "No markable atoms in these items" };
  }

  const correct = marks.filter((m) => m.correct).length;
  const total = marks.length;
  const percent = Math.round((correct / total) * 100);

  // The scaled read-out. CILS is section-scored, so a section has a max and a floor; CELI is
  // part-scored and has neither at this grain, so it gets null and the page shows the part
  // thresholds instead. This is the same rule the runner applied, with one difference that
  // matters: the numbers now come from the engine on the server, where the learner cannot
  // reach the arithmetic.
  const scale = track?.scale ?? null;
  const scaled = scale
    ? (() => {
        const score = Math.round((correct / total) * scale.max);
        const status: "CLEAR" | "BORDERLINE" | "BELOW" =
          score >= scale.floor ? "CLEAR" : score === scale.floor - 1 ? "BORDERLINE" : "BELOW";
        return { score, max: scale.max, floor: scale.floor, status };
      })()
    : null;

  return { ok: true, correct, total, percent, exam, level, section, scaled, marks };
}
