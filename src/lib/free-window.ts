// THE START PATH for the 3-day no-card window.
//
// One helper, called at every entry point, because the 2026-08-18 AlmiPrep deadlock was
// an ORDERING bug and ordering bugs come back the moment two call sites do it
// differently. The order here is the whole fix:
//
//   1. refuse ONLY an expired non-payer      (never-started falls through)
//   2. THEN set the clock, if it is not set  (starting is what sets it)
//
// Reversed, a new user is refused before the clock is set, so the clock is never set, so
// they are refused forever. That is exactly what happened to all 27 AlmiPrep users.
//
// The clock write is conditional on freeAccessStartedAt still being NULL, so a second tab,
// a retry, or a double-submit can never restart someone's three days.
//
// ── WHERE THE CLOCK STARTS, AND WHY IT DIFFERS FROM CELPIP ──────────────────
// AlmiCELPIP starts the clock in its practice START route. AlmiItalian has no start route:
// the runner is a client component and the only server call in an attempt is the single
// POST to /api/it/submit at the end. So FIRST USE here means the first graded submission.
// The clock is NOT set during a page render — a Server Component must not write on render,
// and a prefetch would otherwise burn a user's window without them answering anything.

import { prisma } from "@/lib/prisma";
import {
  hasPaidAccess,
  needsEmailVerification,
  isPracticeStartBlocked,
  type PaidUser,
  type FreeUserShape,
} from "@/lib/access";
import type { SectionMeta } from "@/lib/practice";

type StartUser = PaidUser & FreeUserShape & { id: string };

/** Why a section is refused. Null = allowed. The UI and the route MUST agree on these, so
 *  both read them from here rather than each deciding for itself. */
export type RefusalReason = "SIGN_IN" | "PAYWALL" | "WINDOW_EXPIRED" | "VERIFY_EMAIL";

/** Is this section covered by the no-card window? Taken from the ENGINE's own kind flag
 *  (src/lib/practice.ts), never from a hardcoded list of section codes: adding a section to
 *  a track cannot silently fall outside the policy. */
export const isFreeWindowSection = (kind: SectionMeta["kind"]): boolean => kind === "objective";

/**
 * The decision WITHOUT the clock write — for rendering only.
 *
 * Kept beside openSection() on purpose: two predicates that disagree about who is refused
 * is how a page shows "start" on a button that then refuses the submit.
 */
export function wouldRefuseSection(
  user: StartUser | null,
  kind: SectionMeta["kind"],
): RefusalReason | null {
  if (!user) return "SIGN_IN";
  if (hasPaidAccess(user)) return null; //          owner ‖ comp ‖ active sub — everything
  // Subscribed but not yet verified, on ANY section: the only thing between them and access
  // is the email, so never answer that with a subscribe button they have already pressed.
  if (needsEmailVerification(user)) return "VERIFY_EMAIL";
  if (!isFreeWindowSection(kind)) return "PAYWALL"; // SCRITTA / ORALE are never in the window
  if (isPracticeStartBlocked(user)) return "WINDOW_EXPIRED";
  // Never-started and in-window both reach here. The free path carries the same email bar
  // as the paid path, so say so specifically instead of showing a paywall.
  if (user.emailVerifiedAt === null) return "VERIFY_EMAIL";
  return null;
}

/**
 * May this user have this section marked — and if so, start their window.
 *
 * The write happens only after every refusal above has passed, and only for a user who is
 * actually consuming the free grant (not a payer, not already started).
 */
export async function openSection(
  user: StartUser,
  kind: SectionMeta["kind"],
): Promise<{ allowed: true } | { allowed: false; reason: RefusalReason }> {
  const refusal = wouldRefuseSection(user, kind);
  if (refusal) return { allowed: false, reason: refusal };

  // Order matters: the refusals above have already passed, so this write is what turns a
  // never-started user into an in-window user. Conditional, so it only ever fires once.
  if (isFreeWindowSection(kind) && !user.freeAccessStartedAt && !hasPaidAccess(user)) {
    await prisma.user.updateMany({
      where: { id: user.id, freeAccessStartedAt: null },
      data: { freeAccessStartedAt: new Date() },
    });
  }
  return { allowed: true };
}
