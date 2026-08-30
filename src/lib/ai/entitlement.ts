// The second lock on every metered AI call, and — since 2026-08-31 — the only thing that
// bounds what one trial account can spend. Ported from AlmiPTE's src/lib/ai/entitlement.ts.
//
// ── WHY THE GATE IS HERE AND NOT ONLY IN THE ROUTES ─────────────────────────
// Checking the two evaluation routes closes today's hole. It does not stop the NEXT route
// from being added without the check — which is exactly how AlmiPTE came to have one skill
// gated and another not, in the same repo, on the same model, with nothing in between
// noticing. So the evaluators refuse for themselves: a route that forgets gets a refusal
// from the function it is trying to spend money with, instead of a bill.
//
// ── WHY IT IS NOT INSIDE getAnthropicClient() ───────────────────────────────
// That would be the tightest chokepoint and it is the wrong one. getAnthropicClient() has no
// user, and a product grows authoring/admin paths that legitimately run with no learner at
// all. Putting a learner entitlement check there would either block those or need a bypass
// flag, and a gate with a bypass flag is a gate with a hole in it.
//
// The rule this encodes: a LEARNER-TRIGGERED metered call requires an entitled learner.
//
// ── THERE IS ONLY hasPaidAccess NOW ─────────────────────────────────────────
// SCRITTA and ORALE were always paid-only: they cost money to serve, so the 3-day no-card
// window deliberately excluded them (PR #34). That window was withdrawn network-wide on
// 2026-08-31, which changes nothing HERE — this file already asked hasPaidAccess and nothing
// else. It is the rest of the product that moved to meet it.
//
// ── AND WHY THAT IS NO LONGER ENOUGH: THE TRIAL CAP ─────────────────────────
// Withdrawing the window made every non-paying visitor a TRIAL user by definition, and the
// ads are running. `trialing` sits inside hasPaidAccess, so before this file changed, a trial
// account had NO total limit on AI evaluations — only per-hour rate limits (12 scritta,
// 8 orale). Over seven days that is a ceiling of 2016 + 1344 metered calls, which priced from
// this product's own AICostLedger rows is roughly $73 of Anthropic + OpenAI spend per account,
// on a card that has not been charged yet.
//
// The shape is the network's, not a new one. Founder decision on AlmiOET:
//   2 Produzione scritta + 2 Produzione orale evaluations inside the trial.
//   The third attempt gets a clear message saying what was used and what to do.
//   NEVER a 500.
// Same numbers, same behaviour. Nothing here invents a different measure.

import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPaidAccess, isOwner, isCompActive } from "@/lib/access";

/** How many AI evaluations of EACH skill a trial includes. AlmiOET's number, kept identical
 *  so the network has one answer to this question. */
export const TRIAL_EVALUATIONS_PER_SKILL = 2;

/**
 * Consecutive failed evaluations after which we stop calling the provider.
 *
 * ── WHY 3, FROM THE POPULATION RATHER THAN A FEELING ────────────────────────
 * Production AICostLedger, 2026-08-29: 9 evaluate calls, 1 of them served-then-failed — an
 * observed failure rate near 11%. If failures were independent at that rate, three in a row
 * is about 1 in 750. So 3 is comfortably past coincidence while still letting a learner who
 * hit one bad response try again twice.
 *
 * CONSECUTIVE, not "3 in a window": one success resets it. A learner who succeeds, fails,
 * succeeds, fails is not experiencing an outage and should not be stopped; a learner whose
 * last three attempts all failed is, and every further call spends money to produce nothing.
 *
 * This is the half of the trial cap the cap cannot do. The cap counts RESULTS RECEIVED and
 * deliberately does not charge a learner for our failures — which means an evaluation that
 * fails every time never consumes an allowance and never stops. The measured worst case for
 * a trial account is $72.83 in seven days, unchanged by the cap for exactly that reason.
 * This is the guard that closes it.
 */
export const CONSECUTIVE_FAILURE_LIMIT = 3;

/** The two metered skills. Mirrors the AiSkill enum in prisma/schema.prisma. */
export type AiSkillKind = "SCRITTA" | "ORALE";

/** How many evaluations this learner already has, per skill. Supplied BY THE CALLER — see
 *  the note on decideAiEntitlement about why this is a parameter and not a query. */
export type TrialUsage = Record<AiSkillKind, number>;

export type AiRefusal = {
  ok: false;
  /** 401 = no user · 402 = pay (or trial allowance spent) · 403 = verify the address you
   *  already have · 503 = OUR provider is failing and we stopped calling it. */
  status: 401 | 402 | 403 | 503;
  /** Short machine-readable cause, for logRefusal(). Prose belongs in `error`. */
  reason: "no-user" | "unverified" | "not-paid" | "trial-cap" | "provider-failing";
  error: string;
  upgradeUrl?: string;
};

/** Exactly the fields the decision reads. Nothing else is loaded. */
export type EntitlementUser = Pick<
  User,
  "email" | "emailVerifiedAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"
>;

/**
 * Is this user's access coming ONLY from a running trial?
 *
 * The cap applies to exactly this population and no other. An owner, a comped account, and a
 * paying `active` subscriber are all outside it — and that exclusion is the half of this
 * feature that is dangerous to get wrong. Refusing a trial user their third writing costs
 * them a little patience; refusing a PAYING user costs us the customer, and would be a worse
 * bug than the one this cap exists to fix.
 *
 * Owner and comp are checked explicitly rather than assumed, because a comped account can
 * also carry a `trialing` subscription row and would otherwise be capped by accident.
 */
export function isCappedTrial(user: EntitlementUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return false; //   owner: never capped
  if (isCompActive(user)) return false; //    comp:  never capped
  if (!hasPaidAccess(user)) return false; //  not entitled at all — the paywall answers first
  return user.subscriptionStatus === "trialing";
}

function skillLabel(skill: AiSkillKind): string {
  return skill === "SCRITTA" ? "Produzione scritta" : "Produzione orale";
}

/**
 * The decision, as a PURE function — no database, no request, no clock beyond the one
 * hasPaidAccess already consults.
 *
 * Split out from the loader below so the gate can drive it across every user shape that
 * matters without a database and without inventing rows in a production table. A rule you can
 * only exercise by creating a real user is a rule that gets exercised once.
 *
 * ⚠️ THAT IS WHY `usage` IS A PARAMETER. The cap needs a COUNT, and a count needs a query —
 * putting the query in here would have made this function impure and taken the gate's ability
 * to drive it on fixtures with it. Production has ZERO trialing users today (counted
 * 2026-08-31), so fixtures are the ONLY way this rule can be exercised at all: a cap that can
 * only be tested by finding a real trial user is a cap that ships untested. The loader counts;
 * this decides.
 *
 * `usage` may be null when the caller knows the cap cannot apply (isCappedTrial() is false).
 * A null usage NEVER refuses — it means "not asked", not "zero used".
 */
export function decideAiEntitlement(
  user: EntitlementUser | null,
  skill: AiSkillKind,
  usage: TrialUsage | null,
  consecutiveFailures = 0,
): AiRefusal | null {
  if (!user) return { ok: false, status: 401, reason: "no-user", error: "Not authenticated" };

  // FIRST, and the order is load-bearing — see the header.
  if (hasPaidAccess(user)) {
    // THE CIRCUIT BREAKER, BEFORE THE ALLOWANCE. It applies to everyone who would otherwise
    // be allowed to call — owner, comp and paying subscriber included — because it is not
    // about what they are entitled to. It is about us having failed three times in a row and
    // having no reason to believe the fourth call will be different.
    if (consecutiveFailures >= CONSECUTIVE_FAILURE_LIMIT) {
      const used = usage?.[skill] ?? 0;
      const allowanceLine = isCappedTrial(user)
        ? ` Your trial allowance is untouched — you have used ${used} of ${TRIAL_EVALUATIONS_PER_SKILL} ${skillLabel(skill)} evaluations, and these failures did not count against it.`
        : "";
      return {
        ok: false,
        status: 503,
        reason: "provider-failing",
        error:
          `We could not produce a result — your last ${consecutiveFailures} attempts failed on our side, ` +
          `so we have stopped trying rather than keep charging for nothing. This is our problem, ` +
          `not yours.${allowanceLine} Please try again later.`,
      };
    }
    // Entitled. The only remaining question is whether a TRIAL has spent its allowance.
    // `!usage` and not `usage === null`: a caller that passes undefined must fall through to
    // ALLOW, not throw. This function is on the path of a request that must answer 402 and
    // never 500, so a missing tally is "not asked", never a crash — scripts/gates/ai-cost-gate
    // caught exactly that by calling the old one-argument signature.
    if (!isCappedTrial(user) || !usage) return null;

    const used = usage[skill] ?? 0;
    if (used < TRIAL_EVALUATIONS_PER_SKILL) return null;

    // 402, never 500. The learner did nothing wrong and the request is well-formed; they have
    // simply used what the trial includes. Say the number, and say what happens next — they
    // have ALREADY given a card, so pointing them at /pricing to "upgrade" would answer a
    // question they did not ask. Their trial converts on its own.
    const ends = user.subscriptionCurrentPeriodEnd;
    const when = ends
      ? ` Full access begins when your trial converts on ${ends.toISOString().slice(0, 10)}.`
      : " Full access begins when your trial converts.";
    return {
      ok: false,
      status: 402,
      reason: "trial-cap",
      error:
        `Your free trial includes ${TRIAL_EVALUATIONS_PER_SKILL} ${skillLabel(skill)} evaluations and you have used ` +
        `${used} of ${TRIAL_EVALUATIONS_PER_SKILL}.${when} Every practice section stays open in the meantime.`,
      upgradeUrl: "/account",
    };
  }

  // Not entitled. Say WHICH, so the UI can ask a subscriber to verify rather than asking
  // them to subscribe again.
  if (user.emailVerifiedAt === null) {
    return { ok: false, status: 403, reason: "unverified", error: "Verify your email address first." };
  }
  return {
    ok: false,
    status: 402,
    reason: "not-paid",
    error:
      "Produzione scritta and orale feedback is part of AlmiItalian Pro — start a 7-day free trial, card saved, not charged.",
    upgradeUrl: "/pricing",
  };
}

/**
 * Count what this learner has already been given, per skill.
 *
 * ── WHY AiEvaluation AND NOT AICostLedger ───────────────────────────────────
 * Counted on production before choosing, 2026-08-31: the same 8 attempts produced 8
 * AiEvaluation rows and 13 AICostLedger rows. The ledger is a record of CALLS, not of results
 * — one ORALE attempt writes two rows (orale.transcribe + orale.evaluate), and a call that
 * was billed but failed writes a row too. Counting it would charge a learner two of their two
 * speaking attempts for a single recording, and would charge them for our own parse failures.
 *
 * AiEvaluation is written once, at the end, only when a labelled estimate actually reached
 * the learner. One row = one thing the learner received. That is the honest denominator for
 * "how much of your trial have you used".
 *
 * ── THE WINDOW: THE WHOLE TRIAL, NOT A ROLLING ONE ──────────────────────────
 * A rolling window would let one account harvest indefinitely, which is the entire exposure
 * this cap exists to close. So the count is the learner's LIFETIME total, which for the
 * population that matters — someone who signs up from an ad and starts a trial — is exactly
 * their trial usage, with no clock to derive and get wrong.
 *
 * The one case where lifetime and trial-only diverge: an account that accumulated evaluations
 * while OWNER or COMPED and later starts a trial would arrive with its allowance already
 * spent. That is rare, it fails in the direction of refusing a trial user rather than a paying
 * one, and the alternative — deriving the trial start from subscriptionCurrentPeriodEnd minus
 * TRIAL_DAYS — is a clock that, if it drifts wide, silently disables the cap. Silently
 * disabling the cap is the failure this whole change exists to prevent.
 */
export async function countTrialUsage(userId: string): Promise<TrialUsage> {
  const rows = await prisma.aiEvaluation.groupBy({
    by: ["skill"],
    where: { userId },
    _count: { _all: true },
  });
  const usage: TrialUsage = { SCRITTA: 0, ORALE: 0 };
  for (const r of rows) {
    if (r.skill === "SCRITTA" || r.skill === "ORALE") usage[r.skill] = r._count._all;
  }
  return usage;
}

/**
 * How many evaluations this learner has failed in a row, most recent first, with no success
 * since. Read from AICostLedger because that is the record of CALLS — AiEvaluation only has
 * rows for results that were delivered, so it cannot see a failure at all.
 *
 * Scoped to the two evaluate features: a Whisper transcription failure is a different fault
 * with a different fix, and folding it in here would stop the writing path for a microphone
 * problem.
 */
export async function countConsecutiveFailures(userId: string): Promise<number> {
  const recent = await prisma.aICostLedger.findMany({
    where: { userId, feature: { in: ["scritta.evaluate", "orale.evaluate"] } },
    orderBy: { createdAt: "desc" },
    take: CONSECUTIVE_FAILURE_LIMIT,
    select: { success: true },
  });
  let n = 0;
  for (const r of recent) { if (r.success) break; n++; }
  return n;
}

/**
 * May this user trigger a metered AI evaluation of THIS skill right now?
 *
 * Returns `null` when they may — deliberately, so a caller that ignores the return value
 * gains nothing: the refusal is a value you have to look at. Loads the user fresh rather than
 * trusting a caller-supplied snapshot, because the caller's copy is exactly what a forgetful
 * route would fail to have.
 *
 * The usage count is loaded ONLY for a capped trial. A paying subscriber must not have their
 * request slowed by a query that could never refuse them — and must never be refused by one
 * that errored.
 */
export async function checkAiEntitlement(
  userId: string | null | undefined,
  skill: AiSkillKind,
): Promise<AiRefusal | null> {
  if (!userId) return { ok: false, status: 401, reason: "no-user", error: "Not authenticated" };
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // Exactly the fields the decision reads. Selecting the whole row would pull the password
    // hash into a code path with no business holding it.
    select: {
      email: true,
      emailVerifiedAt: true,
      subscriptionStatus: true,
      subscriptionCurrentPeriodEnd: true,
      compProUntil: true,
    },
  });
  const usage = isCappedTrial(user) ? await countTrialUsage(userId) : null;
  // Counted for everyone who could otherwise call: the breaker is about our provider, not
  // about their tier. A user with no entitlement never gets here in a state where it matters,
  // because the paywall answers first.
  const consecutiveFailures = hasPaidAccess(user) ? await countConsecutiveFailures(userId) : 0;
  return decideAiEntitlement(user, skill, usage, consecutiveFailures);
}

/**
 * The evaluator-side form. Evaluators already return `{ok:false, error}` on failure, so a
 * refusal is shaped like one and needs no new branch at the call site — it simply never
 * reaches the model client.
 */
export async function refuseUnlessEntitled(
  userId: string | null | undefined,
  skill: AiSkillKind,
): Promise<{ ok: false; error: string; status: number } | null> {
  const refusal = await checkAiEntitlement(userId, skill);
  if (!refusal) return null;
  console.warn(JSON.stringify({ evt: "ai-refusal", reason: refusal.reason, skill, userId: userId ?? null }));
  return { ok: false, error: refusal.error, status: refusal.status };
}
