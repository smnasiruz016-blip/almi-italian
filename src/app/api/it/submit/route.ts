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
// Until 2026-08-28 this route required hasPaidAccess() for everything, and the page above
// it redirected every signed-in non-subscriber to /account. That matched the shipped
// product but not the stated one. The founder re-decided: objective sections (kind
// "objective" — ASCOLTO / LETTURA / ANALISI) are open inside a 3-day no-card window;
// SCRITTA / ORALE stay paid.
//
// An auth-only route would still be wrong, and the reason has not changed: this reply
// DISCLOSES THE CORRECT ANSWER for every atom posted. The ids are sha256({exam, level,
// section, title}) over human-readable Italian titles, which is an obstacle, not an access
// control. So the gate lives here, not only in the page.
//
// ORDER OF CHECKS — deliberate, do not reorder:
//   1. no session                        → 401, nothing parsed
//   2. expired non-payer                 → 402, nothing parsed, no item id confirmed
//   3. resolve the section SERVER-SIDE from the posted item ids
//   4. estimate section without payment  → 402
//   5. openSection() — refuse, THEN set the clock (see lib/free-window.ts)
//
// Step 2 runs before any body parsing so the one population entitled to nothing cannot use
// a 404 to test whether an item id exists. A never-started or in-window user reaches step 3
// and can see those 404s — they are entitled to the keys of an objective section anyway.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess, isPracticeStartBlocked } from "@/lib/access";
import { gradeAttempt, resolveAttemptSection, type AttemptBody } from "@/lib/it/grade";
import { openSection, type RefusalReason } from "@/lib/free-window";

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
    "Produzione scritta and orale are part of AlmiItalian Pro — start a 7-day free trial, card saved, not charged.",
  WINDOW_EXPIRED:
    "Your 3-day free practice window has ended. Start a 7-day free trial — card saved, not charged — to keep practising.",
  VERIFY_EMAIL: "Verify your email address to have your section marked.",
};

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    logRefusal(401, "no-session");
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const paid = hasPaidAccess(user);

  // STEP 2 — the one population entitled to nothing: a non-payer whose window has run out.
  // Refused BEFORE the body is parsed, so a 404 can never be used to confirm that an item id
  // exists. A never-started user is NOT in this population and falls through, which is the
  // whole point (see lib/free-window.ts).
  if (!paid && isPracticeStartBlocked(user)) {
    logRefusal(402, "window-expired", user.id);
    return NextResponse.json({ ok: false, error: REFUSAL_COPY.WINDOW_EXPIRED }, { status: 402 });
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

  // STEP 4+5 — entitlement, then the clock. An item that is in the bank but routed by no
  // track has no kind; treat that as "estimate" so an unroutable section fails CLOSED
  // (paid-only) rather than falling into the free window by accident.
  const decision = await openSection(user, resolved.kind ?? "estimate");
  if (!decision.allowed) {
    logRefusal(402, decision.reason.toLowerCase(), user.id);
    return NextResponse.json({ ok: false, error: REFUSAL_COPY[decision.reason] }, { status: 402 });
  }

  const graded = gradeAttempt(body);
  if (!graded.ok) {
    return NextResponse.json({ ok: false, error: graded.error }, { status: graded.status });
  }
  return NextResponse.json(graded);
}
