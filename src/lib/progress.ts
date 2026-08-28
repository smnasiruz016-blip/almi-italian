// WHAT A LEARNER HAS ACTUALLY DONE — read for the /account progress sections.
//
// ── WHY ONLY TWO SKILLS ─────────────────────────────────────────────────────
// AlmiPrep's /account renders six sections: band trend, writing, speaking, listening, reading
// and mock tests. Italian can honestly render TWO of them.
//
// Writing (SCRITTA) and Speaking (ORALE) go through the AI evaluator, which writes an
// `AiEvaluation` row per attempt — user, skill, exam, level, section, the estimate as JSON, the
// ESTIMATE label, and a timestamp, indexed on [userId, createdAt]. Everything a list needs.
//
// The objective sections do NOT. Ascolto, Lettura and Analisi would be `ItalianAttempt` rows,
// and on production that table has **zero rows** while `AiEvaluation` has real ones. Nothing is
// recorded when a learner answers them, so "My listening tests" here would render an empty box
// for every learner forever — the same lie as a link to the wrong page, just slower to notice.
// Those sections are deliberately absent until something writes the rows. That is a separate
// change, and this file is where it would be added.
//
// ── WHY THE LABEL TRAVELS WITH THE NUMBER ───────────────────────────────────
// A score is never returned bare. `LabelledEstimate` carries `labelKind: "ESTIMATE"` as a
// literal so a report cannot exist without it, and EstimateReport always prints the disclaimer
// above the number. A progress LIST is the easy place for that to be dropped — the number is
// small, the row is terse, and the disclaimer feels like clutter. So `isEstimate` is returned
// per row and the caller has to render it; the type does not let a score arrive without one.

import { prisma } from "@/lib/prisma";
import type { AiSkill } from "@prisma/client";

export type ProgressAttempt = {
  id: string;
  skill: AiSkill;
  /** e.g. "CILS_B1C" — the engine that produced the estimate. */
  exam: string;
  level: string;
  section: string;
  createdAt: Date;
  /** Null when the stored evaluation carries no score (a part-scored module). */
  score: { value: number; max: number; status: "CLEAR" | "BORDERLINE" | "BELOW" } | null;
  /** Always true here. Present so a caller cannot render the number without the label. */
  isEstimate: true;
};

/** The stored `evaluation` JSON, narrowed to the only part this list reads. */
type StoredEvaluation = {
  score?: { value?: number; max?: number; status?: string } | null;
};

const STATUSES = ["CLEAR", "BORDERLINE", "BELOW"] as const;

function readScore(evaluation: unknown): ProgressAttempt["score"] {
  const ev = evaluation as StoredEvaluation | null;
  const s = ev?.score;
  if (!s || typeof s.value !== "number" || typeof s.max !== "number") return null;
  // A status we do not recognise is dropped rather than rendered. An old row written before a
  // status was added, or by a future version, must not print an unknown word next to a score.
  const status = STATUSES.find((x) => x === s.status);
  if (!status) return null;
  return { value: s.value, max: s.max, status };
}

/**
 * A learner's most recent evaluated attempts for one skill, newest first.
 *
 * Scoped to `userId` in the query, never filtered after the fetch: an attempt list is the one
 * place where reading a row too many means showing one learner another learner's work.
 */
export async function recentAttempts(userId: string, skill: AiSkill, take = 5): Promise<ProgressAttempt[]> {
  const rows = await prisma.aiEvaluation.findMany({
    where: { userId, skill },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      skill: true,
      exam: true,
      level: true,
      section: true,
      createdAt: true,
      evaluation: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    skill: r.skill,
    exam: String(r.exam),
    level: r.level,
    section: r.section,
    createdAt: r.createdAt,
    score: readScore(r.evaluation),
    isEstimate: true as const,
  }));
}
