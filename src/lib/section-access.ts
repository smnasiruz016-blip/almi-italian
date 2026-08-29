// WHO IS REFUSED A PRACTICE SECTION, AND WHY — the single answer both the page and the route
// read.
//
// ── WHY THIS MODULE EXISTS AT ALL (unchanged, and still the reason) ─────────
// The section page and POST /api/it/submit must agree about who is refused. Two predicates
// that disagree is how a page comes to show a "start" button that then refuses the submit. So
// neither decides for itself; both call refuseSection() here.
//
// ── WHAT CHANGED, 2026-08-31 ────────────────────────────────────────────────
// This file was `free-window.ts` and implemented the 3-day, no-card grant on the objective
// sections. The founder withdrew that grant network-wide, so there is now ONE door:
// $12/month, a 7-day Stripe trial, card collected at checkout, cancel anytime.
//
// Renamed rather than left as `free-window.ts`, because a module named for a free window that
// grants nothing is a lie a reader has to discover. Two importers moved with it.
//
// GONE WITH THE GRANT:
//   · isFreeWindowSection()  — the objective/estimate split only mattered because objective
//                              sections had a free path. They no longer do; the decision is
//                              now the same for every section, so `kind` is not a parameter
//                              any more. It cannot be reintroduced by accident.
//   · openSection()          — it refused, THEN wrote the clock
//                              (prisma.user.updateMany → freeAccessStartedAt). No grant means
//                              no clock, and a function called "open" that only ever refuses
//                              is the same kind of lie as the filename. Its one caller now
//                              calls refuseSection() directly, EARLIER in the route than
//                              openSection() sat — see the note in that route about why the
//                              refusal has to come before the body is parsed.
//   · WINDOW_EXPIRED         — no window, so nothing can expire. Removed from the union so a
//                              UI branch for it cannot survive as unreachable copy.
//
// See src/lib/access.ts for why hasPaidAccess / hasObjectiveAccess / isPracticeStartBlocked
// are still three separate predicates even though two of them now have an empty population.

import { hasPaidAccess, needsEmailVerification, type PaidUser } from "@/lib/access";

/** Why a section is refused. Null = allowed. The UI and the route MUST agree on these, so
 *  both read them from here rather than each deciding for itself. */
export type RefusalReason = "SIGN_IN" | "PAYWALL" | "VERIFY_EMAIL";

/**
 * The whole decision. No database, no clock, no write — so a Server Component may call it on
 * render and the route may call it before it parses anything.
 *
 * Order is load-bearing:
 *   1. no user            → sign in (not a paywall; they have not been asked to pay yet)
 *   2. paid               → open (owner ‖ comp ‖ active subscription, all inside hasPaidAccess)
 *   3. subscribed but unverified → verify (NEVER a paywall: they already pressed subscribe)
 *   4. everyone else      → paywall
 */
export function refuseSection(user: PaidUser | null): RefusalReason | null {
  if (!user) return "SIGN_IN";
  if (hasPaidAccess(user)) return null; //          owner ‖ comp ‖ active subscription
  // Subscribed and merely unverified: the only thing between them and access is the email, so
  // never answer that with a subscribe button they have already pressed.
  if (needsEmailVerification(user)) return "VERIFY_EMAIL";
  return "PAYWALL";
}
