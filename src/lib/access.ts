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

const ACTIVE_STATUSES = new Set(["trialing", "active"]);

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

// NETWORK STANDARD, confirmed by the founder 2026-07-08 and REVISED 2026-08-28.
//
// Two independent doors, and they are not the same thing:
//   • The 7-day TRIAL is STRIPE's own `trialing` status — card saved at checkout, not
//     charged. It is not an app-side timer.
//   • The 3-day WINDOW is an app-side, no-card grant on the OBJECTIVE sections only.
//
// The window is NOT the app-side trial this file used to describe and that was removed:
// that one opened EVERY skill for 7 days from createdAt. This one covers only sections the
// engine marks itself, and its clock starts on FIRST USE, not at signup. The line is COST,
// not generosity — Produzione scritta/orale are `kind: "estimate"`, have no answer key, and
// are the skills a paid model would have to read.
//
// Free vs paid is a SKILL split taken from the ENGINE (src/lib/practice.ts), never from a
// hardcoded list of section codes here:
//   • kind "objective" (ASCOLTO / LETTURA / ANALISI) → paid, or inside the 3-day window.
//   • kind "estimate"  (SCRITTA / ORALE)             → always requires hasPaidAccess().
//
// Paid access requires an active subscription AND a verified email (Goethe parity) — owner
// and comp bypass both. `needsEmailVerification` distinguishes "paid but unverified" so the UI
// can say "verify your email" instead of "subscribe".
export type PaidUser = Pick<
  User,
  "email" | "emailVerifiedAt" | "subscriptionStatus" | "subscriptionCurrentPeriodEnd" | "compProUntil"
>;

export function hasPaidAccess(user: PaidUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return true; //                    owner bypass
  if (user.compProUntil && user.compProUntil > new Date()) return true; // admin-granted comp
  return hasActiveSubscription(user) && user.emailVerifiedAt !== null;
}

// True when the only thing standing between the user and paid access is email
// verification (they have an active/trialing sub but haven't verified yet).
export function needsEmailVerification(user: PaidUser | null): boolean {
  if (!user) return false;
  if (isOwner(user.email)) return false;
  if (user.compProUntil && user.compProUntil > new Date()) return false;
  return hasActiveSubscription(user) && user.emailVerifiedAt === null;
}

// ── THE 3-DAY NO-CARD WINDOW ────────────────────────────────────────────────
// Ported from AlmiCELPIP (src/lib/billing/plans.ts + free-window.ts), field for field.
// Founder decision 2026-08-28. See src/lib/free-window.ts for the START path.
//
// ── THE SCAR TISSUE, PORTED DELIBERATELY ────────────────────────────────────
// AlmiPrep shipped this on 2026-08-18 and deadlocked production. Its start gate asked
// "may this user practise right now" instead of "may this user BEGIN", so it refused
// before the clock existed; the clock is set BY starting, so it was never set; so it
// refused forever. All 27 users sat at freeAccessStartedAt = NULL and could do nothing,
// and every gate was green throughout because each asserted what a state was CALLED.
//
// "NEVER STARTED" IS NOT A REFUSAL. Three predicates, three different questions, and
// they must never be interchanged:
//
//   hasPaidAccess()           owner ‖ comp ‖ (active subscription AND verified email)
//   hasObjectiveAccess()      deliberately a SUPERSET of hasPaidAccess — a paying user
//                             must never be refused something a free user is given
//   isPracticeStartBlocked()  refuses ONLY a non-paying user whose window has EXPIRED

const DAY_MS = 24 * 60 * 60 * 1000;

export const FREE_ACCESS_DAYS = 3;

export type FreeUserShape = Pick<User, "freeAccessStartedAt">;

/** A window that has been started and has not yet run out. A never-started user is NOT
 *  "active" — and is not refused either; see isPracticeStartBlocked. */
export function isFreeWindowActive(user: FreeUserShape): boolean {
  if (!user.freeAccessStartedAt) return false;
  return user.freeAccessStartedAt.getTime() + FREE_ACCESS_DAYS * DAY_MS > Date.now();
}

/** True ONLY when a window was started and has since run out. */
export function isFreeWindowExpired(user: FreeUserShape): boolean {
  return Boolean(user.freeAccessStartedAt) && !isFreeWindowActive(user);
}

/** Whole days left, or null when no window is running. Null covers BOTH "not started" and
 *  "expired" — a caller that must tell those apart reads getAccessLevel(). */
export function getFreeAccessDaysRemaining(user: FreeUserShape): number | null {
  if (!isFreeWindowActive(user)) return null;
  const endsAt = user.freeAccessStartedAt!.getTime() + FREE_ACCESS_DAYS * DAY_MS;
  return Math.ceil((endsAt - Date.now()) / DAY_MS);
}

/** May they have an objective section MARKED right now? A superset of hasPaidAccess by
 *  construction. The free path requires a verified email — the same bar as the paid path
 *  (Goethe/CELPIP parity), which is why the UI shows a verify banner, not a paywall. */
export function hasObjectiveAccess(user: (PaidUser & FreeUserShape) | null): boolean {
  if (!user) return false;
  if (hasPaidAccess(user)) return true;
  return isFreeWindowActive(user) && user.emailVerifiedAt !== null;
}

/** THE START GATE. Refuses exactly one population: a non-paying user whose window has
 *  EXPIRED. A user with no window yet falls through — starting is how they get one.
 *  Do NOT substitute hasObjectiveAccess() here; that substitution IS the 18 Aug regression. */
export function isPracticeStartBlocked(user: (PaidUser & FreeUserShape) | null): boolean {
  if (!user) return false; //           signed out is a sign-in prompt, not a refusal
  if (hasPaidAccess(user)) return false;
  return isFreeWindowExpired(user);
}

export type AccessLevel = "NONE" | "FREE_3DAY" | "FREE_EXPIRED" | "PAID";

/** Four states, and the one the UI keeps confusing with NONE: a user whose window ran out
 *  is not the same as one who never started, and the upgrade copy differs. */
export function getAccessLevel(user: (PaidUser & FreeUserShape) | null): AccessLevel {
  if (!user) return "NONE";
  if (hasPaidAccess(user)) return "PAID";
  if (isFreeWindowActive(user)) return "FREE_3DAY";
  if (isFreeWindowExpired(user)) return "FREE_EXPIRED";
  return "NONE";
}
