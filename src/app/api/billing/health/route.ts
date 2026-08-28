import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { logRefusal } from "@/lib/observability";
import { isBillingHealthAuthorized } from "@/lib/billing/health-auth";

// Read-only billing self-check. Exposes NO secret values — only key MODE
// (live/test), boolean validity, and price IDs. Any value that is not a clean
// `price_…` id is redacted, so a mis-pasted secret can never be echoed.
//
// ── WHY THIS IS GUARDED (added 2026-08-28) ──────────────────────────────────
// It was open to the internet, and every anonymous GET fired THREE live Stripe calls
// (balance.retrieve, billingPortal.configurations.list, prices.retrieve) with no limit.
// Redaction meant no secret leaked, so the exposure was two other things: it disclosed the
// billing configuration (key mode, which price vars exist, whether the portal is live, the
// unit amount), and it was a free amplifier against this account's Stripe rate quota —
// someone else's traffic, spent from our budget.
//
// TWO doors, deliberately, because the endpoint has two legitimate callers:
//   • x-admin-secret: ADMIN_API_SECRET — the network convention (see /api/admin/stats), and
//     the only one that works from curl, a deploy check or AlmiMonitor.
//   • an admin SESSION — so the founder can open it in a browser without handling a secret.
// Fail-closed on both: an unset ADMIN_API_SECRET never authorises anybody.
//
// The rate limit runs FIRST, before either check, so guessing the secret also costs
// something. It is the same in-memory, per-instance limiter used on the credential routes —
// read lib/rate-limit.ts for what that does and does not stop.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function keyMode(k: string): string {
  if (!k) return "missing";
  if (k.startsWith("sk_live_")) return "live";
  if (k.startsWith("sk_test_")) return "test";
  return "unknown";
}

const safeId = (v: string): string =>
  /^price_[A-Za-z0-9]+$/.test(v) ? v : "REDACTED_NON_PRICE_VALUE";

export async function GET(req: Request) {
  // 1. Limit first — this also prices an attempt to guess the secret.
  const limited = limitByClient("billingHealth", req);
  if (!limited.ok) {
    logRefusal({ route: "/api/billing/health", status: 429, reason: "rate-limited", req });
    return tooManyRequests(limited.retryAfterSeconds);
  }

  // 2. Either door. Fail-closed: an unset ADMIN_API_SECRET authorises nobody.
  const secret = process.env.ADMIN_API_SECRET;
  const headerSecret = req.headers.get("x-admin-secret");
  // The header door first, so the browser door costs no session lookup for machine callers.
  if (!isBillingHealthAuthorized(secret, headerSecret, false)) {
    const user = await getCurrentUser();
    if (!isBillingHealthAuthorized(secret, headerSecret, canAccessAdmin(user?.email))) {
      logRefusal({
        route: "/api/billing/health",
        status: 401,
        reason: user ? "not-admin" : secret ? "bad-or-absent-secret" : "secret-unset",
        req,
      });
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = keyMode(key);
  const priceVars = ["STRIPE_PRICE_ID_MONTHLY", "STRIPE_PRICE_ID_YEARLY", "STRIPE_PRICE_ID"] as const;
  const present: Record<string, string> = {};
  for (const v of priceVars) {
    const val = process.env[v];
    if (val) present[v] = val;
  }

  const out: Record<string, unknown> = {
    keyPresent: Boolean(key),
    keyMode: mode,
    priceVarsPresent: Object.keys(present),
  };
  if (!key) {
    out.ok = false;
    out.reason = "STRIPE_SECRET_KEY missing";
    return NextResponse.json(out);
  }

  const stripe = new Stripe(key);

  let keyValid = false;
  try {
    await stripe.balance.retrieve();
    keyValid = true;
  } catch (e) {
    out.keyError = (e as { code?: string; type?: string }).code || (e as { type?: string }).type || "auth_failed";
  }
  out.keyValid = keyValid;

  let portalReachable = false;
  try {
    const cfgs = await stripe.billingPortal.configurations.list({ limit: 1 });
    portalReachable = cfgs.data.some((c) => c.active);
  } catch {
    portalReachable = false;
  }
  out.portalReachable = portalReachable;

  const prices: Record<string, unknown> = {};
  for (const [v, id] of Object.entries(present)) {
    const clean = /^price_[A-Za-z0-9]+$/.test(id);
    try {
      const p = await stripe.prices.retrieve(id);
      prices[v] = {
        priceId: safeId(id),
        cleanFormat: clean,
        valid: true,
        active: p.active,
        recurring: p.recurring?.interval ?? "one-time",
        amount: p.unit_amount,
        modeMatch: (mode === "live") === p.livemode,
      };
    } catch (e) {
      prices[v] = { priceId: safeId(id), cleanFormat: clean, valid: false, error: (e as { code?: string }).code || "retrieve_failed" };
    }
  }
  out.prices = prices;

  const anyPrice = Object.keys(present).length > 0;
  const pricesOk = anyPrice && Object.values(prices).every(
    (p) => (p as { valid?: boolean }).valid && (p as { modeMatch?: boolean }).modeMatch && (p as { cleanFormat?: boolean }).cleanFormat,
  );
  out.ok = keyValid && portalReachable && pricesOk;
  return NextResponse.json(out);
}
