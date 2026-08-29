// ENTITLEMENT MATRIX — the paywall, asserted rather than described.
//
// This exists because the AlmiPrep version of the free-window feature shipped GREEN and
// deadlocked production: every gate asserted what a state was CALLED, none asserted what a
// user in that state could DO. So this file names populations by their DATA and checks the
// answer the product actually gives them.
//
// ── REWRITTEN 2026-08-31, NOT DELETED ───────────────────────────────────────
// The founder withdrew the 3-day no-card window network-wide. Most of this file's assertions
// were about window arithmetic and they went red on that change — which is the gate doing its
// job: it was telling us exactly what the old design protected. Deleting it would have thrown
// away the part that still matters, so the window arithmetic is gone and the two properties
// that outlive the window are kept and STRENGTHENED:
//
//   1. THE INVERSION IS ASSERTED. A signed-in, verified, never-paid user used to be OPEN on
//      an objective section. That is now the single most important thing to get wrong
//      silently, so it is checked head-on: that user is PAYWALL on every section.
//   2. THE PREDICATES ARE STILL THREE. hasPaidAccess / hasObjectiveAccess /
//      isPracticeStartBlocked answer three different questions; two now have an empty
//      population. An empty population is exactly when someone collapses them, so the
//      relationships between them are asserted here and a collapse fails.
//
// It tests the decision layer — lib/access.ts + lib/section-access.ts — which is where the
// policy lives. It does NOT open a session, hit HTTP, or touch the database.

process.env.OWNER_EMAILS = "founder@almiworld.com";
process.env.STRIPE_SECRET_KEY = "sk_test_selftest";
process.env.STRIPE_PRICE_ID = "price_selftest";

import type { User } from "@prisma/client";
import {
  hasPaidAccess,
  hasObjectiveAccess,
  isPracticeStartBlocked,
  getAccessLevel,
} from "../../src/lib/access";
import { refuseSection, type RefusalReason } from "../../src/lib/section-access";

const DAY = 24 * 60 * 60 * 1000;
const ago = (d: number) => new Date(Date.now() - d * DAY);
const ahead = (d: number) => new Date(Date.now() + d * DAY);

type U = Parameters<typeof refuseSection>[0];
type StartU = NonNullable<U>;

function user(over: Partial<User>): StartU {
  return {
    id: "u_test",
    email: "learner@example.com",
    emailVerifiedAt: new Date(),
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    compProUntil: null,
    // Still set on some personas ON PURPOSE: the column survives in the database, and a
    // legacy value must not resurrect a grant. See "THE COLUMN IS INERT" below.
    freeAccessStartedAt: null,
    ...over,
  } as StartU;
}

const PERSONAS: { name: string; u: U; paid: boolean }[] = [
  { name: "anonymous", u: null, paid: false },
  { name: "signed-in, verified, never paid", u: user({}), paid: false },
  { name: "signed-in, UNVERIFIED, never paid", u: user({ emailVerifiedAt: null }), paid: false },
  { name: "legacy freeAccessStartedAt day 1", u: user({ freeAccessStartedAt: ago(1) }), paid: false },
  { name: "legacy freeAccessStartedAt day 5", u: user({ freeAccessStartedAt: ago(5) }), paid: false },
  { name: "trialing", u: user({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(7) }), paid: true },
  { name: "active", u: user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30) }), paid: true },
  { name: "active but UNVERIFIED", u: user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30), emailVerifiedAt: null }), paid: false },
  { name: "trialing but UNVERIFIED", u: user({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(7), emailVerifiedAt: null }), paid: false },
  { name: "expired subscription", u: user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ago(1) }), paid: false },
  { name: "canceled subscription", u: user({ subscriptionStatus: "canceled", subscriptionCurrentPeriodEnd: ahead(30) }), paid: false },
  { name: "comp", u: user({ compProUntil: ahead(90) }), paid: true },
  { name: "comp EXPIRED", u: user({ compProUntil: ago(1) }), paid: false },
  { name: "owner", u: user({ email: "founder@almiworld.com" }), paid: true },
];

/** What /api/it/submit returns for this persona, derived from the same function the route
 *  calls. The route no longer branches on section kind, and neither does this. */
function submitStatus(u: U): string {
  if (!u) return "401 no-session";
  const r = refuseSection(u);
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

console.log("Entitlement matrix — ONE door: $12/mo, 7-day trial, card at checkout\n");
const pad = (s: string, n: number) => s.padEnd(n);
console.log(pad("PERSONA", 36) + pad("SECTION", 14) + pad("SUBMIT", 20) + "LEVEL");
console.log("-".repeat(84));
for (const { name, u } of PERSONAS) {
  console.log(pad(name, 36) + pad(show(refuseSection(u)), 14) + pad(submitStatus(u), 20) + getAccessLevel(u));
}

console.log("\nASSERTIONS");

// ── 1. THE INVERSION. This is the change, stated as a test. ─────────────────
// Before 2026-08-31 this exact user was OPEN on Ascolto / Lettura / Analisi.
const freeVerified = user({});
check("verified never-paid user is REFUSED (the window is gone)", refuseSection(freeVerified), "PAYWALL");
check("verified never-paid user has NO objective access", hasObjectiveAccess(freeVerified), false);
check("verified never-paid user is NOT PAID", hasPaidAccess(freeVerified), false);
check("verified never-paid user's access level is NONE", getAccessLevel(freeVerified), "NONE");

// ── THE COLUMN IS INERT ─────────────────────────────────────────────────────
// freeAccessStartedAt survives in the database. A legacy value must never grant anything, or
// dropping the window would leave a back door open for exactly the rows we chose not to
// delete. Both sides of the old 3-day boundary are checked, because "recent enough" was the
// whole mechanism.
for (const d of [0, 1, 2.9, 3.1, 5, 400]) {
  const legacy = user({ freeAccessStartedAt: ago(d) });
  check("legacy freeAccessStartedAt " + d + "d ago grants nothing", refuseSection(legacy), "PAYWALL");
  check("legacy freeAccessStartedAt " + d + "d ago is not objective access", hasObjectiveAccess(legacy), false);
}

// ── 2. THE THREE PREDICATES ARE STILL THREE ─────────────────────────────────
// Two now have an empty population. That is when they get collapsed, so the relationships are
// pinned here. See the note in src/lib/access.ts.
check("isPracticeStartBlocked refuses NOBODY now", isPracticeStartBlocked(freeVerified), false);
check("isPracticeStartBlocked refuses no payer either", isPracticeStartBlocked(user({ compProUntil: ahead(9) })), false);
// If someone "simplifies" isPracticeStartBlocked into the paywall, these two start agreeing.
// They must not: they are different questions with different answers for this user.
check("isPracticeStartBlocked has NOT been collapsed into the paywall",
  isPracticeStartBlocked(freeVerified) === (refuseSection(freeVerified) !== null), false);
for (const { name, u } of PERSONAS) {
  if (!u) continue;
  // The superset property, which is the one that must survive any future free grant.
  check(name + ": paid => objective access (superset holds)",
    hasPaidAccess(u) ? hasObjectiveAccess(u) : true, true);
  // Nobody is start-blocked, on any persona, ever.
  check(name + ": not start-blocked", isPracticeStartBlocked(u), false);
}

// ── 3. EVERY POPULATION, BOTH DIRECTIONS ────────────────────────────────────
for (const { name, u, paid } of PERSONAS) {
  if (!u) continue;
  check(name + ": hasPaidAccess", hasPaidAccess(u), paid);
  if (paid) {
    check(name + ": section OPEN", refuseSection(u), null);
    check(name + ": submit marked", submitStatus(u), "200 marked");
    check(name + ": level PAID", getAccessLevel(u), "PAID");
  } else {
    check(name + ": section refused", refuseSection(u) !== null, true);
    check(name + ": level NONE", getAccessLevel(u), "NONE");
  }
}

// ── 4. SPECIFIC EXPECTATIONS ────────────────────────────────────────────────
check("anonymous -> SIGN_IN", refuseSection(null), "SIGN_IN");
check("comp bypasses verification", hasPaidAccess(user({ compProUntil: ahead(90), emailVerifiedAt: null })), true);
check("owner bypasses everything", hasPaidAccess(user({ email: "founder@almiworld.com", emailVerifiedAt: null })), true);
// A subscriber who has only failed to verify must never be answered with a paywall. They have
// already pressed the subscribe button; sending them to checkout again is the bug this catches.
check("active-but-unverified -> VERIFY_EMAIL, not PAYWALL",
  refuseSection(user({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(30), emailVerifiedAt: null })), "VERIFY_EMAIL");
check("trialing-but-unverified -> VERIFY_EMAIL, not PAYWALL",
  refuseSection(user({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(7), emailVerifiedAt: null })), "VERIFY_EMAIL");
// An unverified user who has NOT subscribed is a paywall, not a verify prompt: verifying
// their email would not open anything.
check("unverified never-paid -> PAYWALL, not VERIFY_EMAIL", refuseSection(user({ emailVerifiedAt: null })), "PAYWALL");

// ── 5. NO REFUSAL REASON CAN NAME A STATE NOBODY IS IN ──────────────────────
// WINDOW_EXPIRED was removed from the union. If a reason comes back without a population, the
// copy for it becomes unreachable prose that reviewers still read as true.
const REASONS: RefusalReason[] = ["SIGN_IN", "PAYWALL", "VERIFY_EMAIL"];
const produced = new Set(PERSONAS.map(({ u }) => refuseSection(u)).filter((r): r is RefusalReason => r !== null));
for (const r of produced) {
  check('refusal "' + r + '" is a declared reason', REASONS.includes(r), true);
}
check("every declared reason is reachable by some persona", REASONS.every((r) => produced.has(r)), true);

if (failures) {
  console.error("\nx Entitlement selftest: " + failures + " assertion(s) failed.\n");
  process.exit(1);
}
console.log("\nOK Entitlement selftest: all assertions passed across " + PERSONAS.length + " populations.");
