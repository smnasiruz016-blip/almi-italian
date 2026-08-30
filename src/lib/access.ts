import type { User } from "@prisma/client";

// Access tiers (canonical AlmiWorld pattern).
// OWNER_EMAILS → unlimited usage / premium bypass on this product (testing, demos, daily use).
// ADMIN_EMAILS → the /admin panel. A user can be in both; the founder is.
function inList(envVar: string | undefined, email: string | null | undefined): boolean {
  if (!email || !envVar) return false;
  return envVar.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

export const isOwner = (email: string | null | undefined) => inList(process.env.OWNER_EMAILS, email);
export const isAdmin = (email: string | null | undefined) =>
  email?.toLowerCase() === "almiworld@almiworld.com" || inList(process.env.ADMIN_EMAILS, email); // canonical founder always admin
// The /admin panel: reachable by ADMIN_EMAILS users and ALWAYS by the owner.
// The founder is in both lists per the canonical model; gating on this makes
// the Admin nav link + server guards fire for the owner even if ADMIN_EMAILS
// happens to be unset/mismatched on a given project.
export const canAccessAdmin = (email: string | null | undefined) => isOwner(email) || isAdmin(email);

// Billing is OFF until the founder sets the price id + Stripe key. Fail-closed = no paywall
// gets shown/charged before it is real.
export function isBillingEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

/** The Stripe statuses that mean "this subscription is live". Exported because the admin
 *  table needs the same list for its SQL filter, and a hand-copy there is how a badge and a
 *  paywall come to disagree about the same person. Array, because Prisma's `in` takes one;
 *  the Set below is built from it so there is still one literal. */
export const ACTIVE_SUBSCRIPTION_STATUSES = ["trialing", "active"] as const;
const ACTIVE_STATUSES = new Set<string>(ACTIVE_SUBSCRIPTION_STATUSES);

function hasActiveSubscription(
  user: Pick<User, "subscriptionStatus" | "subscriptionCurrentPeriodEnd">,
): boolean {
  if (!isBillingEnabled()) return false; //                   no real subscriptions possible yet
  if (user.subscriptionStatus && ACTIVE_STATUSES.has(user.subscriptionStatus)) {
    // trialing/active; if a period end is recorded, honour it.
    return !user.subscriptionCurrentPeriodEnd || user.subscriptionCurrentPeriodEnd > new Date();
  }
  return false;
}

// NETWORK STANDARD — founder 2026-07-08, revised 2026-08-28, REVISED AGAIN 2026-08-31.
//
// ── ONE DOOR ────────────────────────────────────────────────────────────────
// Founder decision, network-wide, 2026-08-31: "3 din wali free khirrki band ker dain, sirf
// 7 day free trial after entring card will stay, throughout the network."
//
// So there is exactly one way into practice now:
//   $12/month · 7-day free trial · CARD COLLECTED AT CHECKOUT · cancel anytime.
// The trial is STRIPE's own `trialing` status, not an app-side timer, and the card is taken
// up front — see src/lib/stripe.ts, where payment_method_collection is now pinned explicitly
// rather than left to a Stripe default that could move under us.
//
// /learn is untouched and stays completely open. It is the free layer of this product; the
// paywall below is about PRACTICE, and nothing here reads or gates a /learn route.
//
// WHAT WAS REMOVED: the 3-day, no-card window on the objective sections (ASCOLTO / LETTURA /
// ANALISI). It was added 2026-08-28 and withdrawn three days later. Counted before removing
// it, on production, 2026-08-31: 2 users, BOTH with freeAccessStartedAt = NULL. Nobody had
// ever opened a window, so nobody was cut off mid-window by this change.
//
// `User.freeAccessStartedAt` IS NOT DROPPED. A destructive migration buys nothing here: the
// column is now never written and never read for entitlement, and dropping it would be an
// irreversible change to production data in exchange for tidiness.
//
// Paid access requires an active subscription AND a verified email (Goethe parity) — owner
// and comp bypass both. `needsEmailVerification` distinguishes "paid but unverified" so the UI
// can say "verify your email" instead of "subscribe".
export type PaidUser = Pick<
  User,
  "email" | "emailVerifiedAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"
>;

/** An unexpired admin-granted comp. Exported because THREE places need this exact question —
 *  hasPaidAccess, needsEmailVerification, and the trial cap in lib/ai/entitlement.ts. It was
 *  already written out twice here; a third hand-copy is how a badge and a paywall come to
 *  disagree, so it is one function now. */
export function isCompActive(user: Pick<User, "compProUntil"> | null): boolean {
  return Boolean(user?.compProUntil && user.compProUntil > new Date());
}

export function hasPaidAccess(user: PaidUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return true; //                    owner bypass
  if (isCompActive(user)) return true; //                     admin-granted comp
  return hasActiveSubscription(user) && user.emailVerifiedAt !== null;
}

// True when the only thing standing between the user and paid access is email
// verification (they have an active/trialing sub but haven't verified yet).
export function needsEmailVerification(user: PaidUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return false;
  if (isCompActive(user)) return false;
  return hasActiveSubscription(user) && user.emailVerifiedAt === null;
}

// ── THE THREE PREDICATES STAY SEPARATE. THIS IS THE PART TO READ. ───────────
//
// THE SCAR TISSUE, KEPT DELIBERATELY — and it is NOT about the window.
// AlmiPrep shipped the window on 2026-08-18 and deadlocked production. Its start gate asked
// "may this user practise right now" instead of "may this user BEGIN", so it refused before
// the clock existed; the clock is set BY starting, so it was never set; so it refused
// forever. All 27 users sat at freeAccessStartedAt = NULL and could do nothing, and every
// gate was green throughout because each asserted what a state was CALLED rather than what a
// user in that state could DO.
//
// Withdrawing the window on 2026-08-31 removes ONE of the reasons these three were kept
// apart. It does not remove the lesson, and it does not turn them into the same question. Two
// of them now have an EMPTY population, and an empty population is exactly the condition
// under which someone "tidies" a predicate away and re-derives it wrong under deadline. So
// they stay, and each one says here why it stays:
//
//   hasPaidAccess()           owner ‖ comp ‖ (active subscription AND verified email).
//                             THE door — every section, objective and estimate alike.
//                             The only one with callers today.
//
//   hasObjectiveAccess()      "may an objective section be MARKED right now?" Still a
//                             SUPERSET of hasPaidAccess BY CONSTRUCTION — a paying user must
//                             never be refused something a free user is given. The superset
//                             is EMPTY today, so it returns exactly what hasPaidAccess
//                             returns. KEPT because the day any objective-only grant comes
//                             back, this is the one line that widens; a caller collapsed onto
//                             hasPaidAccess would have to be hunted down again instead.
//
//   isPracticeStartBlocked()  "is this a non-payer whose free grant has RUN OUT?" — a third,
//                             different question. Its population is now empty by
//                             construction: no grant is issued, so none can expire. It
//                             returns false for everyone and HAS NO CALLERS.
//                             ⚠️ NEVER substitute hasPaidAccess() or hasObjectiveAccess()
//                             for it. "Never started" is not a refusal, and neither is
//                             "never granted" — collapsing those two ideas into one is
//                             precisely what produced 18 August.
//
// `FreeUserShape` is gone with the window machinery it typed; the three predicates now take
// PaidUser, which is the only shape entitlement still reads.

/** May an objective section be MARKED right now? A superset of hasPaidAccess by construction
 *  — see the note above. The superset is empty while there is no free grant, so today this is
 *  hasPaidAccess. Do not inline it; the separation is the point. */
export function hasObjectiveAccess(user: PaidUser | null): boolean {
  if (!user) return false;
  if (hasPaidAccess(user)) return true;
  // No free grant exists to widen this. When one returns, it widens HERE and nowhere else.
  return false;
}

/** Is this a non-payer whose free grant has run out? Nobody, because no grant is issued.
 *  Kept, uncalled, on purpose — see the note above. Do NOT wire this in as a paywall. */
export function isPracticeStartBlocked(user: PaidUser | null): boolean {
  if (!user) return false; //           signed out is a sign-in prompt, not a refusal
  if (hasPaidAccess(user)) return false;
  // There is no window to have expired. A non-payer is refused by the paywall in
  // src/lib/section-access.ts, which is a different sentence with a different answer.
  return false;
}

/** Two states now, not four: FREE_3DAY and FREE_EXPIRED described a grant that no longer
 *  exists, and a UI branch for a state nobody can be in is a branch nobody can test. */
export type AccessLevel = "NONE" | "PAID";

export function getAccessLevel(user: PaidUser | null): AccessLevel {
  if (!user) return "NONE";
  return hasPaidAccess(user) ? "PAID" : "NONE";
}
