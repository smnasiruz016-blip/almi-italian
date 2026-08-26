// Rate limiting for credential endpoints (audit C7).
//
// ── WHAT WAS WRONG ──────────────────────────────────────────────────────────
// /api/auth/login, /api/auth/signup and /api/auth/verify-email had no limit, no lockout and no
// 429 path. Login in particular compares a password against a bcrypt hash and returns a clean
// yes/no, so an attacker with a leaked password list could run it online at whatever rate the
// platform would serve — an offline password test, run online.
//
// ── WHAT THIS IS, AND WHAT IT IS NOT ────────────────────────────────────────
// This is an IN-MEMORY, PER-INSTANCE counter, and that is a real limitation, not a footnote:
//
//   • Serverless runs many instances. Each keeps its own map, so the effective limit across the
//     fleet is roughly (limit × instances), not `limit`.
//   • A cold start resets the map. An attacker who can force new instances gets a fresh budget.
//   • It therefore SLOWS bulk credential stuffing. It does not stop a determined distributed
//     attacker, and nothing in this file should be read as claiming otherwise.
//
// It is here anyway because the honest alternative was nothing at all. The real fix is a shared
// store (the network already runs Neon; a `LoginAttempt` table or an Upstash counter would make
// this global), and that is a schema change with its own migration and its own review. Between
// "no limit" and "a limit that survives a redeploy" there is a large gap, and this closes the
// part of it that costs one file and no infrastructure.
//
// Fluid Compute makes it meaningfully better than it sounds: instances are reused across
// concurrent requests and stay warm, so in practice a burst from one source does land on a
// small number of maps rather than a fresh one each time.
//
// ── WHY THE BUCKET KEY IS A HASH ────────────────────────────────────────────
// Keys are hashed client ids (see @/lib/observability), never raw IPs and never emails. A
// rate-limit map keyed by email address is a list of who uses this product, held in memory and
// visible in any heap dump — the exact data /privacy says we keep carefully.

import { NextResponse } from "next/server";
import { clientHash } from "@/lib/observability";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Drop expired buckets. Called on write, so the map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 512) return; // cheap: only pay for this once the map is worth sweeping
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number };

/**
 * Fixed-window counter.
 *
 * @param bucket  what is being limited, e.g. "login". Namespaces the key so a signup attempt
 *                does not spend a login's budget.
 * @param id      the caller, already hashed.
 */
export function rateLimit(
  bucket: string,
  id: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const key = `${bucket}:${id}`;
  const b = buckets.get(key);

  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1 };
  }
  if (b.count >= opts.limit) {
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((b.resetAt - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true, remaining: opts.limit - b.count };
}

/** The limits, in one place so they can be read as a policy rather than hunted for. */
export const LIMITS = {
  // Tight. A human signing in mis-types a password once or twice, not ten times a minute.
  login: { limit: 8, windowMs: 60_000 },
  // Account creation is rarer still, and each one can send an email.
  signup: { limit: 5, windowMs: 60 * 60_000 },
  // A verification link is clicked once. Repeated hits are somebody walking token values —
  // which is futile against a 32-byte hex token, but should still cost them something.
  verifyEmail: { limit: 20, windowMs: 60 * 60_000 },
  // Resending is a mail send per call; this is a spend limit as much as a security one.
  resendVerification: { limit: 5, windowMs: 60 * 60_000 },
  // /api/billing/health makes THREE live Stripe calls per hit. This is a spend and quota
  // limit first and a security one second: an operator checks it a handful of times, never
  // in a loop. Applied BEFORE the auth check so it also costs something to guess the secret.
  billingHealth: { limit: 6, windowMs: 60_000 },
} as const;

/** Convenience: limit by hashed client, straight from the Request. */
export function limitByClient(
  bucket: keyof typeof LIMITS,
  req: Request,
): RateLimitResult {
  return rateLimit(bucket, clientHash(req), LIMITS[bucket]);
}

/** The 429 body + Retry-After header, so every route refuses the same way.
 *  NextResponse rather than Response: some of these routes return NextResponse elsewhere and a
 *  handler cannot mix the two return types. */
export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many attempts. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
