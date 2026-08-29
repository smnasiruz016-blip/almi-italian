// PRACTICE submit endpoint — the server side that did not exist.
//
// Marks a whole section against the SERVER-held answer keys, re-loaded by the posted item ids.
// The client supplies only which item and which option it chose; it never supplies a key, a
// score, or the exam, level and section it wants to be measured on. See lib/it/grade.ts for
// what this replaced and why.
//
// The correct answers come back in this reply, AFTER the section has been marked — which is
// also the only place they are ever disclosed. Because a section is submitted in one call,
// there is no per-item reveal for a client to harvest mid-attempt.
//
// ── WHAT IS PAID, AND WHAT IS NOT (revised 2026-08-28) ──────────────────────
// This route is the ONE place an objective section is actually marked, so it is where the
// entitlement policy has to be true. src/lib/access.ts describes the policy; this route
// enforces it, and both take the free/paid line from the ENGINE's section kind.
//
// Between 2026-08-28 and 2026-08-31 the objective sections were open inside a 3-day no-card
// window. The founder withdrew that grant network-wide, so this route is back to one rule:
// hasPaidAccess() for every section. See src/lib/access.ts.
//
// An auth-only route would still be wrong, and the reason has not changed: this reply
// DISCLOSES THE CORRECT ANSWER for every atom posted. The ids are sha256({exam, level,
// section, title}) over human-readable Italian titles, which is an obstacle, not an access
// control. So the gate lives here, not only in the page.
//
// ORDER OF CHECKS — deliberate, do not reorder:
//   1. no session                        → 401, nothing parsed
//   2. refuseSection()                   → 402, nothing parsed, no item id confirmed
//   3. resolve the section SERVER-SIDE from the posted item ids
//   4. grade
//
// ⚠️ STEP 2 RUNS BEFORE ANY BODY PARSING, AND THAT IS LOAD-BEARING. It was written that way
// so the population entitled to nothing cannot use a 404 to test whether an item id exists.
// Under the window there were two refusal points — an early one for expired non-payers and a
// later openSection() after the section was resolved, because in-window users had to reach
// it. With the window gone every non-payer is refused, so the whole decision moves UP to the
// early point and the later call disappears. The oracle this comment protects is now closed
// for MORE people than before, not fewer. Do not move it back down.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { gradeAttempt, resolveAttemptSection, type AttemptBody } from "@/lib/it/grade";
import { refuseSection, type RefusalReason } from "@/lib/section-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Both refusals are logged. This route's reply discloses the correct answer for every atom
 *  posted, so a run of 401s or 402s against it is somebody probing for the answer key — and
 *  that is exactly the pattern that currently leaves no trace at all. console.warn, not .log:
 *  this is an event someone should read, not per-request volume nobody does. */
function logRefusal(status: number, reason: string, userId?: string) {
  console.warn(
    JSON.stringify({ evt: "refusal", route: "/api/it/submit", status, reason, userId: userId ?? null }),
  );
}

/** Message per refusal, so the client can say the true thing. None of these promise
 *  feedback on Writing/Speaking — that feature does not exist yet (see Brief C). */
const REFUSAL_COPY: Record<RefusalReason, string> = {
  SIGN_IN: "Sign in to practise.",
  PAYWALL:
    "Practice is part of AlmiItalian Pro — start a 7-day free trial, card saved, not charged, then $12/month. Cancel anytime.",
  VERIFY_EMAIL: "Verify your email address to have your section marked.",
};

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    logRefusal(401, "no-session");
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // STEP 2 — THE WHOLE ENTITLEMENT DECISION, and it happens BEFORE the body is parsed so a
  // 404 can never be used to confirm that an item id exists. Same function the section page
  // calls, so the page cannot offer what this route then refuses.
  const refusal = refuseSection(user);
  if (refusal) {
    logRefusal(402, refusal.toLowerCase(), user.id);
    return NextResponse.json({ ok: false, error: REFUSAL_COPY[refusal] }, { status: 402 });
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  // STEP 3 — which section is this? From the server-loaded items, never from the body.
  const resolved = resolveAttemptSection(body);
  if (!resolved.ok) {
    return NextResponse.json({ ok: false, error: resolved.error }, { status: resolved.status });
  }

  // The second entitlement check that used to sit here is GONE, not lost: it existed because
  // the decision depended on `resolved.kind`, which is only known after the section is
  // resolved. The decision no longer depends on kind, so it moved to step 2 above, where it
  // also closes the item-id oracle for everyone it refuses.

  const graded = gradeAttempt(body);
  if (!graded.ok) {
    return NextResponse.json({ ok: false, error: graded.error }, { status: graded.status });
  }
  return NextResponse.json(graded);
}
