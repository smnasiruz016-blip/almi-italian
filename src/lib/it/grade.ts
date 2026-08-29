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
import { TRACKS, type SectionMeta } from "@/lib/practice";
import { sectionStatus } from "@/lib/scoring/section-status";
import { ATOM, type AtomMark, type SubmitResult } from "@/lib/runner-items";

/**
 * Free-text cloze normalisation: case-insensitive, trimmed, inner whitespace collapsed, and
 * DIACRITIC-FOLDED.
 *
 * ── WHY THE FOLD WAS ADDED ──────────────────────────────────────────────────
 * Without it a learner on a non-Italian keyboard who typed "e stato scritto" for the key
 * "è stato scritto" was marked WRONG — not for their Italian, but for not having an accented
 * keyboard. Four of the bank's 21 free-text keys carry accents, and the audience for this
 * product is precisely people typing Italian on whatever device they own.
 *
 * ── WHY IT IS SAFE HERE, AND WHY THAT HAD TO BE CHECKED ─────────────────────
 * Folding is NOT free in Italian: it collapses real minimal pairs — e/è, papa/papà, pero/però,
 * te/tè, si/sì — so in the wrong bank it would make a wrong answer newly correct.
 * scripts/gates/marking-gate.mts sweeps every free-text key on every build and fails if any
 * folds onto a different valid word, or if two distinct keys collide. Today: 4 keys change,
 * none is a whole-key minimal pair, no collisions.
 *
 * Only free-text blanks use this. Option-backed blanks (103 of the 124) compare the chosen
 * option exactly and are untouched.
 *
 * The NFD-strip technique is the network's own (see countrySlug in the sibling repos), applied
 * here to marking for the first time.
 *
 * ⚠️ AlmiGoethe has the identical gap for German umlauts in
 * src/lib/goethe/tasks/objective.ts — reported, not fixed from here.
 */
const norm = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/\s+/g, " ");

/**
 * Everything a client is allowed to say. Note what is ABSENT: no answer key, no score, no
 * correct/total, no exam, level or section. Those are facts about the items and the server owns
 * them.
 */
export interface AttemptBody {
  items?: { itemId?: string; answers?: Record<string, string> }[];
}

/**
 * The section a post belongs to, resolved from the SERVER-loaded items and never from the
 * body — the same rule gradeAttempt marks by, and the ONLY implementation of it.
 *
 * The route calls this to decide ENTITLEMENT before anything is marked. It deliberately
 * never calls markItem: this function has no reason to touch an answer key, so it cannot
 * leak one. gradeAttempt calls it too, so the two can never disagree about which section a
 * post is measured on.
 */
export function resolveAttemptSection(
  body: AttemptBody,
):
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      exam: BankItem["exam"];
      level: BankItem["level"];
      section: BankItem["section"];
      kind: SectionMeta["kind"] | undefined;
    } {
  const posted = Array.isArray(body.items) ? body.items : null;
  if (!posted || posted.length === 0) return { ok: false, status: 400, error: "Missing items" };

  const buckets = new Set<string>();
  let first: BankItem | null = null;
  for (const p of posted) {
    const id = typeof p?.itemId === "string" ? p.itemId : "";
    if (!id) return { ok: false, status: 400, error: "Missing itemId" };
    const item = getItemByStableId(id);
    if (!item) return { ok: false, status: 404, error: `Unknown item: ${id}` };
    first ??= item;
    buckets.add(`${item.exam}::${item.level}::${item.section}`);
  }
  // A section is one bucket by construction; a post spanning several is malformed, and is
  // refused rather than scored against whichever bucket the client would prefer.
  if (buckets.size !== 1 || !first) {
    return { ok: false, status: 400, error: "Items span more than one exam, level or section" };
  }
  const { exam, level, section } = first;
  const track = TRACKS.find((t) => t.exam === exam && t.level === level);
  const kind = track?.sections.find((s) => s.code === section)?.kind;
  return { ok: true, exam, level, section, kind };
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
    // Marked here, beside the load, so the key never travels further than the item it came from.
    marks.push(...markItem(id, item, answers));
  }

  // Exam, level and section come from the ITEMS, not the body — resolved by the one
  // implementation of that rule, which the route also uses to decide entitlement.
  const resolved = resolveAttemptSection(body);
  if (!resolved.ok) return resolved;
  const { exam, level, section, kind } = resolved;

  // Produzione scritta / orale are criteria-based estimates with no key to compare against.
  // Refusing is the honest answer: silently returning 0/0 would let a Writing post be
  // presented as a marked section that happened to score nothing.
  if (kind === "estimate") {
    return {
      ok: false,
      status: 400,
      error: "This section is not auto-marked — Produzione scritta and orale have no answer key",
    };
  }
  const track = TRACKS.find((t) => t.exam === exam && t.level === level);

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
        // Was `score === scale.floor - 1`: a one-wide band on EVERY scale, so on a /20
        // section 9 was BELOW here while the engine called it BORDERLINE. One function now.
        const status = sectionStatus(score, scale.floor, scale.max);
        return { score, max: scale.max, floor: scale.floor, status };
      })()
    : null;

  return { ok: true, correct, total, percent, exam, level, section, scaled, marks };
}
