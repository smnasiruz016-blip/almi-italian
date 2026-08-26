// ENTITLEMENT MATRIX — the 3-day no-card window, asserted rather than described.
//
// This exists because the AlmiPrep version of this feature shipped GREEN and deadlocked
// production: every gate asserted what a state was CALLED, none asserted what a user in
// that state could DO. So this file names populations by their DATA and checks the answer
// the product actually gives them.
//
// It tests the decision layer — lib/access.ts + lib/free-window.ts — which is where the
// policy lives. It does NOT open a session, hit HTTP, or touch the database: the clock
// WRITE inside openSection() is the one thing here that is not covered (see the PR body).

process.env.OWNER_EMAILS = "founder@almiworld.com";
process.env.STRIPE_SECRET_KEY = "sk_test_selftest";
process.env.STRIPE_PRICE_ID = "price_selftest";

import type { User } from "@prisma/client";
import {
  hasPaidAccess,
  hasObjectiveAccess,
  isPracticeStartBlocked,
  isFreeWindowActive,
  isFreeWindowExpired,
  getAccessLevel,
  getFreeAccessDaysRemaining,
  FREE_ACCESS_DAYS,
} from "../../src/lib/access";
import { wouldRefuseSection, type RefusalReason } from "../../src/lib/free-window";

const DAY = 24 * 60 * 60 * 1000;
const ago = (d: number) => new Date(Date.now() - d * DAY);
const ahead = (d: number) => new Date(Date.now() + d * DAY);

type U = Parameters<typeof wouldRefuseSection>[0];
/** The non-null half: every helper below takes a user, not a maybe-user. */
type StartU = NonNullable<U>;

function user(over: Partial<User>): StartU {
  return {
    id: "u_test",
    email: "learner@example.com",
    emailVerifiedAt: new Date(),
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    compProUntil: null,
    freeAccessStartedAt: null,
    ...over,
  } as StartU;
}

const PERSONAS: { name: string; u: U }[] = [
  { name: "anonymous", u: null },
  { name: "signed-in, never started", u: user({}) },
  { name: "signed-in, in-window (day 1)", u: user({ freeAccessStartedAt: ago(1) }) },
  { name: "signed-in, out-of-window (day 5)", u: user({ freeAccessStartedAt: ago(5) }) },
  { name: "in-window, email UNVERIFIED", u: user({ freeAccessStartedAt: ago(1), emailVerifiedAt: null }) },
  { name: "trialing", u: user({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(7) }) },
  { name: "active", u: user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30) }) },
  { name: "active but UNVERIFIED", u: user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30), emailVerifiedAt: null }) },
  { name: "comp", u: user({ compProUntil: ahead(90) }) },
  { name: "owner", u: user({ email: "founder@almiworld.com" }) },
];

/** What /api/it/submit returns for this persona and section kind, derived from the same two
 *  predicates the route calls, in the route's order. */
function submitStatus(u: U, kind: "objective" | "estimate"): string {
  if (!u) return "401 no-session";
  if (!hasPaidAccess(u) && isPracticeStartBlocked(u)) return "402 window-expired";
  const r = wouldRefuseSection(u, kind);
  return r ? "402 " + r.toLowerCase() : "200 marked";
}

const show = (r: RefusalReason | null) => (r === null ? "OPEN" : r);

let failures = 0;
function check(label: string, actual: unknown, expected: unknown): void {
  if (actual !== expected) {
    failures++;
    console.error("  x " + label + ": got " + String(actual) + ", expected " + String(expected));
  }
}

console.log("Entitlement matrix — FREE_ACCESS_DAYS = " + FREE_ACCESS_DAYS + "\n");
const pad = (s: string, n: number) => s.padEnd(n);
console.log(
  pad("PERSONA", 34) + pad("OBJECTIVE", 16) + pad("SCRITTA/ORALE", 16) +
  pad("SUBMIT(obj)", 21) + pad("SUBMIT(est)", 21) + "LEVEL",
);
console.log("-".repeat(126));
for (const { name, u } of PERSONAS) {
  console.log(
    pad(name, 34) +
    pad(show(wouldRefuseSection(u, "objective")), 16) +
    pad(show(wouldRefuseSection(u, "estimate")), 16) +
    pad(submitStatus(u, "objective"), 21) +
    pad(submitStatus(u, "estimate"), 21) +
    getAccessLevel(u),
  );
}

console.log("\nASSERTIONS");

// ── The 18-Aug deadlock, as a standing test ─────────────────────────────────
const fresh = user({});
check("never-started is ALLOWED an objective section", wouldRefuseSection(fresh, "objective"), null);
check("never-started is NOT window-active", isFreeWindowActive(fresh), false);
check("never-started is NOT window-expired", isFreeWindowExpired(fresh), false);
check("never-started is NOT start-blocked", isPracticeStartBlocked(fresh), false);
// The exact substitution that caused the outage: hasObjectiveAccess() is FALSE for a
// never-started user, so using it as the start gate would refuse them forever.
check("hasObjectiveAccess is false for never-started (why it must NOT be the start gate)",
  hasObjectiveAccess(fresh), false);

// ── Window arithmetic ───────────────────────────────────────────────────────
check("day 1 in-window", isFreeWindowActive(user({ freeAccessStartedAt: ago(1) })), true);
check("day 5 expired", isFreeWindowExpired(user({ freeAccessStartedAt: ago(5) })), true);
check("just under 3 days still active",
  isFreeWindowActive(user({ freeAccessStartedAt: new Date(Date.now() - (3 * DAY - 60_000)) })), true);
check("just over 3 days expired",
  isFreeWindowActive(user({ freeAccessStartedAt: new Date(Date.now() - (3 * DAY + 60_000)) })), false);
check("days remaining is null when never started", getFreeAccessDaysRemaining(fresh), null);
check("days remaining is null when expired", getFreeAccessDaysRemaining(user({ freeAccessStartedAt: ago(5) })), null);

// ── The superset property: a payer is never refused what a free user gets ───
for (const { name, u } of PERSONAS) {
  if (u && hasPaidAccess(u)) {
    check(name + ": paid => objective access", hasObjectiveAccess(u), true);
    check(name + ": paid => objective section open", wouldRefuseSection(u, "objective"), null);
    check(name + ": paid => estimate section open", wouldRefuseSection(u, "estimate"), null);
    check(name + ": paid => not start-blocked", isPracticeStartBlocked(u), false);
  }
}

// ── The paid-only skills are paid-only for every unpaid population ──────────
for (const { name, u } of PERSONAS) {
  if (u && !hasPaidAccess(u)) {
    const r = wouldRefuseSection(u, "estimate");
    check(name + ": SCRITTA/ORALE refused", r !== null, true);
    check(name + ": SCRITTA/ORALE never opened by the window",
      r === "PAYWALL" || r === "WINDOW_EXPIRED" || r === "VERIFY_EMAIL", true);
  }
}

// ── Specific expectations ───────────────────────────────────────────────────
check("anonymous objective -> SIGN_IN", wouldRefuseSection(null, "objective"), "SIGN_IN");
check("anonymous estimate -> SIGN_IN", wouldRefuseSection(null, "estimate"), "SIGN_IN");
check("out-of-window objective -> WINDOW_EXPIRED",
  wouldRefuseSection(user({ freeAccessStartedAt: ago(5) }), "objective"), "WINDOW_EXPIRED");
check("in-window unverified -> VERIFY_EMAIL",
  wouldRefuseSection(user({ freeAccessStartedAt: ago(1), emailVerifiedAt: null }), "objective"), "VERIFY_EMAIL");
check("in-window verified objective -> OPEN",
  wouldRefuseSection(user({ freeAccessStartedAt: ago(1) }), "objective"), null);
check("in-window verified estimate -> PAYWALL",
  wouldRefuseSection(user({ freeAccessStartedAt: ago(1) }), "estimate"), "PAYWALL");
check("active-but-unverified is NOT paid",
  hasPaidAccess(user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30), emailVerifiedAt: null })), false);
check("comp bypasses verification", hasPaidAccess(user({ compProUntil: ahead(90), emailVerifiedAt: null })), true);
check("owner bypasses everything", hasPaidAccess(user({ email: "founder@almiworld.com", emailVerifiedAt: null })), true);
check("expired subscription is not paid",
  hasPaidAccess(user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ago(1) })), false);
check("canceled status is not paid",
  hasPaidAccess(user({ subscriptionStatus: "canceled", subscriptionCurrentPeriodEnd: ahead(30) })), false);
check("expired comp is not paid", hasPaidAccess(user({ compProUntil: ago(1) })), false);
// A subscriber who has only failed to verify must never be answered with a paywall — on
// EITHER kind of section. They have already pressed the subscribe button.
const unverifiedSub = user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30), emailVerifiedAt: null });
check("active-but-unverified objective -> VERIFY_EMAIL", wouldRefuseSection(unverifiedSub, "objective"), "VERIFY_EMAIL");
check("active-but-unverified estimate -> VERIFY_EMAIL (not PAYWALL)", wouldRefuseSection(unverifiedSub, "estimate"), "VERIFY_EMAIL");
const trialingUnverified = user({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(7), emailVerifiedAt: null });
check("trialing-but-unverified estimate -> VERIFY_EMAIL", wouldRefuseSection(trialingUnverified, "estimate"), "VERIFY_EMAIL");

if (failures) {
  console.error("\nx Entitlement selftest: " + failures + " assertion(s) failed.\n");
  process.exit(1);
}
console.log("\nOK Entitlement selftest: all assertions passed across " + PERSONAS.length + " populations.");
