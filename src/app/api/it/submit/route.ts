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
// ── WHY THIS IS PAID, AND WHY THE REPO SAYS OTHERWISE ───────────────────────
// src/lib/access.ts describes a SKILL split: "Objective, auto-marked skills (Reading/Listening/
// Analysis) → free to any signed-in user." Written to that comment, this route would have been
// auth-only.
//
// The comment does not describe the shipped product. src/app/practice/[track]/[section]/page.tsx
// ends any signed-in, non-subscribed user with `redirect("/account")` before a single section
// renders — the founder gate, applied to every skill, objective ones included. So the free tier
// the comment protects does not exist: a signed-in learner without a subscription sees no
// practice of any kind.
//
// An auth-only route would therefore have made the paywall UI-only for objective marking. The
// page would redirect and this route would not, and its reply DISCLOSES THE CORRECT ANSWER for
// every atom posted — so anyone who could name item ids could harvest the whole key without
// ever holding a subscription. The ids are sha256({exam, level, section, title}) and the titles
// are human-readable Italian, which is an obstacle, not an access control.
//
// This route checks what the pages check. If the free tier is ever actually opened, this is one
// of the two places that has to change WITH it — the other is lib/access.ts's comment, which
// should stop describing a product that isn't shipping.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/access";
import { gradeAttempt, type AttemptBody } from "@/lib/it/grade";

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

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    logRefusal(401, "no-session");
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }
  if (!hasPaidAccess(user)) {
    logRefusal(402, "not-paid", user.id);
    return NextResponse.json(
      { ok: false, error: "Start your 7-day free trial to practise — card saved, not charged." },
      { status: 402 },
    );
  }

  let body: AttemptBody;
  try {
    body = (await req.json()) as AttemptBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const graded = gradeAttempt(body);
  if (!graded.ok) {
    return NextResponse.json({ ok: false, error: graded.error }, { status: graded.status });
  }
  return NextResponse.json(graded);
}
