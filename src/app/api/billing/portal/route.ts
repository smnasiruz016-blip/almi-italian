import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { logRefusal } from "@/lib/observability";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { isBillingEnabled } from "@/lib/access";
import { createPortalSession } from "@/lib/stripe";

export async function POST(req: Request) {
  // createPortalSession is a live Stripe call. Limit before it.
  const limited = limitByClient("billingAction", req);
  if (!limited.ok) {
    logRefusal({ route: "/api/billing/portal", status: 429, reason: "rate-limited", req });
    return tooManyRequests(limited.retryAfterSeconds);
  }

  const user = await getCurrentUser();
  if (!user) {
    logRefusal({ route: "/api/billing/portal", status: 401, reason: "no-session", req });
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  if (!isBillingEnabled() || !user.stripeCustomerId) {
    return NextResponse.json({ error: "No subscription to manage yet." }, { status: 400 });
  }
  try {
    const url = await createPortalSession(user.stripeCustomerId);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Could not open the billing portal." }, { status: 500 });
  }
}
