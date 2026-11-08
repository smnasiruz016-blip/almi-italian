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
// on a card that has not been charged yet. (RR-394: NEW trials are 48 hours, so their rate-limit
// ceiling is shorter; trials started before RR-394 still run to their own Stripe end. The cap below
// keys on `trialing`, not on a length, so it governs both kinds the same way.)
//
// The shape is the network's, not a new one. Founder decision on AlmiOET:
//   2 Produzione scritta + 2 Produzione orale evaluations inside the trial.
//   The third attempt gets a clear message saying what was used and what to do.
//   NEVER a 500.
// Same numbers, same behaviour. Nothing here invents a different measure.

//
// ── RR-397: THE FREE 48 HOURS (no card), PUT INTO THIS DECISION ─────────────
// Owner decision, 8 Nov 2026: every product works like AlmiOET — 48 hours free from sign-up, no card, no Stripe trial, with
// 1 AI-assessed Produzione scritta + 1 Produzione orale per account and a daily money cap on free AI. This file is AlmiItalian's
// one AI door, so the free 48 hours live HERE and not in a second door beside it:
//   · hasPaidAccess() is still asked FIRST and is unchanged. Everything in that branch — the circuit breaker, and the 2 + 2 cap
//     for a running card trial (`trialing`) — is exactly as before. Card trials already running keep it to their own end.
//   · Only when hasPaidAccess() says no AND the email is verified (the existing 403 stays first) does the free 48 hours apply:
//     tasteMayUseAi() (src/lib/taste.ts) allows ONE of each skill, counted from AiEvaluation (results RECEIVED, the same honest
//     denominator as the card-trial cap), and only while today's free-AI budget is left (src/lib/free-ai-budget.ts).
//   · The breaker applies to a free account too: a provider failing three times stops the calls.
//   · Refusals stay 402 / 403 / 503, never a 500.

import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPaidAccess, isOwner, isCompActive } from "@/lib/access";
import { isTasteActive, isTasteOver, tasteMayUseAi, TASTE_AI_LIMITS, type TasteUser } from "@/lib/taste";
import { freeAiAllowedToday, FREE_AI_BUSY_MESSAGE } from "@/lib/free-ai-budget";
import { TASTE_OVER_TITLE, UNLOCK_LABEL } from "@/lib/offer";
import { claimFreeAi, releaseFreeAi, type ClaimStore, type FreeAiKind } from "@/lib/free-ai-claim";

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
  reason: "no-user" | "unverified" | "not-paid" | "trial-cap" | "provider-failing" | "free-used" | "free-ai-busy";
  error: string;
  upgradeUrl?: string;
};

/** Exactly the fields the decision reads. Nothing else is loaded. RR-397: plus the free-48-hours fields (createdAt,
 *  stripeSubscriptionId), optional in the type so a shape without them simply has no free 48 hours. */
export type EntitlementUser = Pick<
  User,
  "email" | "emailVerifiedAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"
> & TasteUser;

/** RR-397: is this a verified, not-paid account inside its free 48 hours (the population the free AI rule governs)? */
export function isFreeTimeAi(user: EntitlementUser | null, now: number = Date.now()): boolean {
  if (!user) return false;
  if (hasPaidAccess(user)) return false; //   paid, comp, owner, card trial: the branch above, unchanged
  if (user.emailVerifiedAt === null) return false; // the existing "verify your email" answer comes first
  return isTasteActive(user, now);
}

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

/** The free 48 hours' kind for a skill (FreeAiUse.kind and TASTE_AI_LIMITS use WRITING / SPEAKING). */
const FREE_KIND: Record<AiSkillKind, FreeAiKind> = { SCRITTA: "WRITING", ORALE: "SPEAKING" };

/** The one "you have used your free one" answer, from the count (decideAiEntitlement) and from the claim (reserveFreeEvaluation). */
function freeUsedRefusal(skill: AiSkillKind): AiRefusal {
  const limit = TASTE_AI_LIMITS[FREE_KIND[skill]];
  return {
    ok: false,
    status: 402,
    reason: "free-used",
    error:
      `Your free 48 hours include ${limit} AI-assessed ${skillLabel(skill)}, and you have used it. ` +
      `${UNLOCK_LABEL} for unlimited feedback. Every practice section stays open until your free 48 hours end.`,
    upgradeUrl: "/pricing",
  };
}

/**
 * RR-399 A3 · THE "1 FREE" IS ATOMIC. decideAiEntitlement() counts AiEvaluation rows, and two requests at the same moment both
 * count "0 used". So when the decision GRANTS a free-48-hours evaluation, the free use is reserved here in one INSERT that only
 * one request can win (FreeAiUse, unique userId + kind; src/lib/free-ai-claim.ts):
 *   RESERVED     → null (allowed); the route gives it back with releaseFreeEvaluation() if no result reaches the learner
 *   USED         → the same 402 "free-used" refusal as the count gives
 *   UNAVAILABLE  → null: the table is not migrated yet, so the count decision stands (nothing breaks before the owner's migration)
 * `store` is for the offline test only.
 */
export async function reserveFreeEvaluation(userId: string, skill: AiSkillKind, store?: ClaimStore): Promise<AiRefusal | null> {
  const claim = await claimFreeAi(userId, FREE_KIND[skill], store);
  return claim === "USED" ? freeUsedRefusal(skill) : null;
}

/** RR-399 A3 · give a reserved free evaluation back (the scoring failed or was refused after the door said yes). A no-op when
 *  there is nothing reserved; for a paying account it can only remove a row from its own past free use, which grants nothing,
 *  because an account that ever subscribed or was comped never has free 48 hours again (tasteEndsAt). */
export async function releaseFreeEvaluation(userId: string, skill: AiSkillKind, store?: ClaimStore): Promise<void> {
  await releaseFreeAi(userId, FREE_KIND[skill], store);
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
  /** RR-397: is today's free-AI budget left? Read only for a free-48-hours account. Defaults to FALSE (fail closed): a caller
   *  that did not ask the budget gives a free account no AI, and a paid account never reads it. */
  freeAiBudgetOk = false,
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

  // RR-397 · THE FREE 48 HOURS (no card). Not paid, verified, and inside the 48 hours from sign-up: ONE AI assessment of each
  // skill, while today's free-AI budget lasts. Everything above this line is unchanged.
  if (isTasteActive(user)) {
    if (consecutiveFailures >= CONSECUTIVE_FAILURE_LIMIT) {
      return {
        ok: false,
        status: 503,
        reason: "provider-failing",
        error:
          `We could not produce a result — your last ${consecutiveFailures} attempts failed on our side, so we have stopped ` +
          `trying. This is our problem, not yours. Your free allowance is untouched; please try again later.`,
      };
    }
    // A free account's tally must be COUNTED; a missing one is never read as "zero used" (that would be unlimited free AI).
    const verdict = tasteMayUseAi({
      user,
      kind: skill === "SCRITTA" ? "WRITING" : "SPEAKING",
      usedOfKind: usage ? usage[skill] ?? 0 : Number.POSITIVE_INFINITY,
      budgetOk: freeAiBudgetOk,
    });
    if (verdict.ok) return null;
    if (verdict.reason === "BUDGET") {
      return { ok: false, status: 402, reason: "free-ai-busy", error: FREE_AI_BUSY_MESSAGE, upgradeUrl: "/pricing" };
    }
    return freeUsedRefusal(skill);
  }

  return {
    ok: false,
    status: 402,
    reason: "not-paid",
    error: isTasteOver(user)
      ? `${TASTE_OVER_TITLE}. Produzione scritta and orale feedback is part of AlmiItalian Pro: ${UNLOCK_LABEL}, cancel anytime.`
      : `Produzione scritta and orale feedback is part of AlmiItalian Pro: ${UNLOCK_LABEL}, cancel anytime.`,
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
 * the trial length — is a clock that, if it drifts wide, silently disables the cap. Silently
 * disabling the cap is the failure this whole change exists to prevent.
 *
 * RR-394 proved the point: the trial length changed (from a week to 48 hours for NEW checkouts)
 * while week-long trials were still running. Because nothing here derives a window from a trial
 * length, both populations are capped identically (2 + 2 per trial, keyed on `trialing`) and a
 * running card trial keeps its access to its own Stripe end. RR-397 then ended card trials for new
 * checkouts altogether; the free 48 hours are counted from this SAME tally (1 + 1, see
 * decideAiEntitlement), because a free account has no other AI results to have collected.
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
  /** RR-399 A3: claim = reserve the free use when a free evaluation is granted (the route's door). */
  opts: { claim?: boolean } = {},
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
      // RR-397: the free 48 hours start at sign-up and belong only to an account that never subscribed.
      createdAt: true,
      stripeSubscriptionId: true,
    },
  });
  // RR-397: a verified, not-paid account inside its free 48 hours. Its tally, failure count and today's free-AI budget are read
  // ONLY for it; a paying subscriber never waits on (or is refused by) a free-AI query.
  const freeTime = isFreeTimeAi(user);
  const usage = isCappedTrial(user) ? await countTrialUsage(userId) : freeTime ? await countTrialUsage(userId) : null;
  // Counted for everyone who could otherwise call: the breaker is about our provider, not
  // about their tier. A user with no entitlement never gets here in a state where it matters,
  // because the paywall answers first.
  const consecutiveFailures = hasPaidAccess(user) || freeTime ? await countConsecutiveFailures(userId) : 0;
  const freeAiBudgetOk = freeTime ? await freeAiAllowedToday() : false;
  const decision = decideAiEntitlement(user, skill, usage, consecutiveFailures, freeAiBudgetOk);
  // RR-399 A3: a free-48-hours evaluation was just GRANTED: reserve it atomically before anything is spent. Only the route's own
  // door claims (opts.claim, default true); the evaluator's second lock re-checks with claim: false, because the route has
  // already reserved this evaluation and a second claim would refuse the learner their own free one.
  if (decision === null && freeTime && opts.claim !== false) return reserveFreeEvaluation(userId, skill);
  return decision;
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
  // RR-399 A3: the second lock. The route's door already reserved a free evaluation; re-checking must not claim it again.
  const refusal = await checkAiEntitlement(userId, skill, { claim: false });
  if (!refusal) return null;
  console.warn(JSON.stringify({ evt: "ai-refusal", reason: refusal.reason, skill, userId: userId ?? null }));
  return { ok: false, error: refusal.error, status: refusal.status };
}
