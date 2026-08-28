import { getCurrentUser } from "@/lib/auth";
import { logRefusal } from "@/lib/observability";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { issueEmailVerificationToken, verifyUrlFor, RESEND_COOLDOWN_MS } from "@/lib/verify";
import { sendEmailVerification } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  // The per-user RESEND_COOLDOWN_MS below is the primary control and is the better one for an
  // authenticated route. This bucket existed in LIMITS with nothing wired to it, which read as
  // protection that was not there; wiring it adds a per-client ceiling on top of the per-user
  // cooldown, so one client cannot cycle accounts to keep sending mail.
  const limited = limitByClient("resendVerification", req);
  if (!limited.ok) {
    logRefusal({ route: "/api/auth/resend-verification", status: 429, reason: "rate-limited", req });
    return tooManyRequests(limited.retryAfterSeconds);
  }

  const user = await getCurrentUser();
  if (!user) {
    logRefusal({ route: "/api/auth/resend-verification", status: 401, reason: "no-session", req });
    return Response.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (user.emailVerifiedAt) {
    return Response.json({ ok: true, alreadyVerified: true });
  }

  // Cooldown — prevent abuse via repeated resend clicks.
  if (
    user.emailVerificationLastSentAt &&
    user.emailVerificationLastSentAt.getTime() > Date.now() - RESEND_COOLDOWN_MS
  ) {
    return Response.json(
      { ok: false, error: "Please wait a moment before requesting another email." },
      { status: 429 },
    );
  }

  const rawToken = await issueEmailVerificationToken(user.id);

  try {
    await sendEmailVerification({ to: user.email, verifyUrl: verifyUrlFor(rawToken) });
  } catch (e) {
    console.error("[resend-verification] email send failed:", e);
    return Response.json(
      { ok: false, error: "Email send failed. Try again in a moment." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
