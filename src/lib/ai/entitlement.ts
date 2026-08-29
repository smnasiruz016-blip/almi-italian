// The second lock on every metered AI call. Ported from AlmiPTE's src/lib/ai/entitlement.ts.
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
// ── WHY THE ORDER IS hasPaidAccess FIRST ────────────────────────────────────
// hasPaidAccess() already encodes the owner and comp bypasses, which are explicitly allowed
// to skip email verification. Checking verification first locks a comped user out with a 403
// for a mailbox nobody asked them to confirm — a bug AlmiPTE's gate caught, recorded, and
// this port keeps caught (see the comp case in scripts/gates/ai-cost-gate.mts).
//
// ── THERE IS ONLY hasPaidAccess NOW ─────────────────────────────────────────
// SCRITTA and ORALE were always paid-only: they cost money to serve, so the 3-day no-card
// window deliberately excluded them (PR #34). That window was withdrawn network-wide on
// 2026-08-31, which changes nothing HERE — this file already asked hasPaidAccess and nothing
// else. It is the rest of the product that moved to meet it.

import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasPaidAccess } from "@/lib/access";

export type AiRefusal = {
  ok: false;
  /** 401 = no user · 402 = pay · 403 = verify the address you already have. */
  status: 401 | 402 | 403;
  error: string;
  upgradeUrl?: string;
};

/** Exactly the fields the decision reads. Nothing else is loaded. */
export type EntitlementUser = Pick<
  User,
  "email" | "emailVerifiedAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"
>;

/**
 * The decision, as a PURE function — no database, no request, no clock beyond the one
 * hasPaidAccess already consults.
 *
 * Split out from the loader below so the gate can drive it across every user shape that
 * matters without a database and without inventing rows in a production table. A rule you can
 * only exercise by creating a real user is a rule that gets exercised once.
 */
export function decideAiEntitlement(user: EntitlementUser | null): AiRefusal | null {
  if (!user) return { ok: false, status: 401, error: "Not authenticated" };

  // FIRST, and the order is load-bearing — see the header.
  if (hasPaidAccess(user)) return null;

  // Not entitled. Say WHICH, so the UI can ask a subscriber to verify rather than asking
  // them to subscribe again.
  if (user.emailVerifiedAt === null) {
    return { ok: false, status: 403, error: "Verify your email address first." };
  }
  return {
    ok: false,
    status: 402,
    error:
      "Produzione scritta and orale feedback is part of AlmiItalian Pro — start a 7-day free trial, card saved, not charged.",
    upgradeUrl: "/pricing",
  };
}

/**
 * May this user trigger a metered AI evaluation right now?
 *
 * Returns `null` when they may — deliberately, so a caller that ignores the return value
 * gains nothing: the refusal is a value you have to look at. Loads the user fresh rather than
 * trusting a caller-supplied snapshot, because the caller's copy is exactly what a forgetful
 * route would fail to have.
 */
export async function checkAiEntitlement(userId: string | null | undefined): Promise<AiRefusal | null> {
  if (!userId) return { ok: false, status: 401, error: "Not authenticated" };
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
  return decideAiEntitlement(user);
}

/**
 * The evaluator-side form. Evaluators already return `{ok:false, error}` on failure, so a
 * refusal is shaped like one and needs no new branch at the call site — it simply never
 * reaches the model client.
 */
export async function refuseUnlessEntitled(
  userId: string | null | undefined,
): Promise<{ ok: false; error: string; status: number } | null> {
  const refusal = await checkAiEntitlement(userId);
  if (!refusal) return null;
  console.warn(
    JSON.stringify({
      evt: "ai-refusal",
      reason: refusal.status === 402 ? "not-paid" : refusal.status === 403 ? "unverified" : "no-user",
      userId: userId ?? null,
    }),
  );
  return { ok: false, error: refusal.error, status: refusal.status };
}
