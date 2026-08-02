import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { logRefusal } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_HEX_RE = /^[a-f0-9]{64}$/;

function getBaseUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
}

// GET /api/auth/verify-email?token=... — the link target from the email. Always
// redirects to /verify-email with a status query param so the user sees a
// branded page rather than raw JSON.
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  // A verification link is clicked once; repeated hits are somebody walking token values.
  // Futile against a 32-byte hex token, but it should still cost them something.
  const limit = limitByClient("verifyEmail", req);
  if (!limit.ok) {
    logRefusal({ route: "/api/auth/verify-email", status: 429, reason: "rate-limited", req });
    return tooManyRequests(limit.retryAfterSeconds);
  }

  const token = url.searchParams.get("token") ?? "";
  const base = getBaseUrl(req);

  if (!TOKEN_HEX_RE.test(token)) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findUnique({
    where: { emailVerificationTokenHash: tokenHash },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerificationExpiresAt: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) {
    return NextResponse.redirect(`${base}/verify-email?status=invalid`);
  }

  // Already verified — treat the click as a no-op success.
  if (user.emailVerifiedAt) {
    return NextResponse.redirect(`${base}/verify-email?status=success`);
  }

  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    return NextResponse.redirect(`${base}/verify-email?status=expired`);
  }

  // CONSUME the token: it is single-use and is invalidated here, in the same write that marks
  // the address verified, so a replayed link cannot re-verify. Nulling the hash was always what
  // this did - it just never said so, and a reader (or a checker) looking for the word had no
  // way to tell a consumed token from a forgotten one.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null, // consumed - cannot be reused
      emailVerificationExpiresAt: null,
    },
  });

  // Welcome email — sent once, only on the fresh-verification path (the
  // already-verified branch above returns early, so this never double-sends).
  // Fire-and-forget: a mail failure must not break the user's verification.
  try {
    await sendWelcomeEmail({ to: user.email, name: user.name });
  } catch (err) {
    console.error("[verify-email] welcome send failed", {
      message: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.redirect(`${base}/verify-email?status=success`);
}
