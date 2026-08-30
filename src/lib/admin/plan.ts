// THE ONE PLACE A PERSON BECOMES A PLAN.
//
// It lived inside the /admin/accounts page, where nothing outside that file could call it and
// nothing could test it without rendering a page. Both the row badges and the stat tiles now
// call it, and scripts/gates/admin-counting-gate.mts drives it directly — a rule that can only
// be checked by grep is a rule a comment can satisfy.
//
// ── WHY THE ORDER IS OWNER FIRST ────────────────────────────────────────────
// An owner has no subscription row and no comp grant, so a classifier that only reads those
// two columns returns "free" for them — honest columns producing a dishonest label. /account
// said "Owner — full access" while the admin table said "Free" about the same person, and the
// tiles then counted the founder as a free user. isOwner() is the predicate every other
// surface uses, so it is asked first here too.
//
// ── WHY comp BEFORE pro ─────────────────────────────────────────────────────
// A comped account can also carry a subscription row. The grant is the reason they have
// access, so it is the label; counting them as Pro would put a non-paying account into the
// revenue number.
//
// EXACTLY ONE BUCKET PER PERSON. The tiles add up to the total by construction rather than by
// subtraction, so no tile is the remainder of the others and none can silently absorb a
// population nobody thought about.

import { isOwner, ACTIVE_SUBSCRIPTION_STATUSES } from "@/lib/access";

export type Plan = "owner" | "comp" | "pro" | "free";

/** Exactly the columns the decision reads. */
export type PlanUser = {
  email: string;
  compProUntil: Date | null;
  subscriptionStatus: string | null;
};

export function classifyPlan(u: PlanUser): Plan {
  if (isOwner(u.email)) return "owner";
  if (u.compProUntil && u.compProUntil.getTime() > Date.now()) return "comp";
  if (u.subscriptionStatus && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(u.subscriptionStatus)) {
    return "pro";
  }
  return "free";
}

/** The words the learner sees on /account, from the same predicates. */
export const PLAN_LABEL: Record<Plan, string> = {
  owner: "Owner",
  comp: "Comp",
  pro: "Pro",
  free: "Free",
};

/** One pass, one bucket each. Returns counts that sum to `users.length`. */
export function tallyPlans(users: PlanUser[]): Record<Plan, number> {
  const t: Record<Plan, number> = { owner: 0, comp: 0, pro: 0, free: 0 };
  for (const u of users) t[classifyPlan(u)]++;
  return t;
}
