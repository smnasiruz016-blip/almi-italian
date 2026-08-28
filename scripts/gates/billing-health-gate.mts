// Billing health gate — /api/billing/health is not readable by the internet.
//
//   npm run gate:billing-health        (wired into `build`, so it blocks)
//
// Offline. No database, no network, and NO LIVE STRIPE CALL — deliberately. The anonymous path
// is refused before a Stripe client is constructed, so the property worth asserting can be
// asserted without spending a single request against the account's quota. A gate that had to
// hit Stripe to prove the route does not hit Stripe would be its own counterexample.
//
// WHAT THIS ROUTE DISCLOSES, AND WHY THAT NEEDS AUTH RATHER THAN THROTTLING
// Key mode (live/test), which STRIPE_PRICE_ID_* vars exist, whether the billing portal is
// active, and each price's unit amount, validity and livemode match. No secret VALUE is echoed
// — every non-`price_…` value is redacted — so this is not a credential leak. It is a
// configuration disclosure, and one request is enough to obtain it. Throttling only changes how
// fast someone gets it, which is why the control is authentication.
//
// The limiter is still asserted below, for the second risk: every authorised GET fires THREE
// live Stripe calls (balance.retrieve, billingPortal.configurations.list, prices.retrieve), so
// the route is an amplifier against a metered third party. It runs FIRST so that guessing the
// secret costs something too.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isBillingHealthAuthorized } from "../../src/lib/billing/health-auth";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Billing health gate — the config self-check is not public\n");

const SRC = readFileSync(join(ROOT, "src", "app", "api", "billing", "health", "route.ts"), "utf8");

// ── A. THE DECISION, EVERY COMBINATION ──────────────────────────────────────
console.log("A. WHO IS AUTHORISED — the full truth table");
{
  const S = "the-real-secret";
  type Row = [string, string | undefined, string | null, boolean, boolean];
  const rows: Row[] = [
    // label                                    env        header        session  expected
    ["anonymous, secret configured",            S,         null,         false,   false],
    ["wrong header secret",                     S,         "wrong",      false,   false],
    ["correct header secret",                   S,         S,            false,   true],
    ["admin session, no header",                S,         null,         true,    true],
    ["non-admin session, no header",            S,         null,         false,   false],
    // Fail-closed: an unconfigured deploy must authorise NOBODY. If Boolean(envSecret) were
    // dropped, the first row below would authorise every anonymous caller on earth, and the
    // route would look healthier for it.
    ["ADMIN_API_SECRET unset, no header",       undefined, null,         false,   false],
    ["ADMIN_API_SECRET unset, header sent",     undefined, "anything",   false,   false],
    ["ADMIN_API_SECRET unset, header undefined-ish", undefined, "undefined", false, false],
    ["ADMIN_API_SECRET empty string",           "",        "",           false,   false],
    ["unset env, but a real admin session",     undefined, null,         true,    true],
  ];
  let bad = 0;
  for (const [label, env, header, session, expected] of rows) {
    const got = isBillingHealthAuthorized(env, header, session);
    if (got !== expected) {
      bad++;
      fail(`${label}: authorized=${got}, expected ${expected}`);
    }
  }
  if (!bad) ok(`all ${rows.length} authorisation cases behave as specified`);
  check(isBillingHealthAuthorized(undefined, null, false) === false,
    "an unset ADMIN_API_SECRET authorises nobody (fail-closed)",
    "an unset ADMIN_API_SECRET authorised an anonymous caller — the route is public on any deploy that forgot it");
}

// ── B. THE ROUTE ACTUALLY USES IT ───────────────────────────────────────────
// A correct decision function nothing calls is decoration.
console.log("\nB. THE ROUTE USES THE SHARED DECISION");
{
  check(SRC.includes("isBillingHealthAuthorized("),
    "the route calls isBillingHealthAuthorized",
    "the route does NOT call isBillingHealthAuthorized — the tested decision is not the one that runs");
  check(/return NextResponse\.json\(\{\s*error:\s*"unauthorized"\s*\}\s*,\s*\{\s*status:\s*401\s*\}\)/.test(SRC),
    "an unauthorised caller gets a 401",
    "no 401 is returned — an unauthorised caller would fall through to the Stripe calls");
}

// ── C. ORDERING: NOTHING EXPENSIVE HAPPENS BEFORE THE REFUSAL ───────────────
// The disclosure and the Stripe amplification both live after this point. If a Stripe client
// were constructed before the auth check, an anonymous request would still cost real calls even
// though its response was a 401.
console.log("\nC. THE REFUSAL COMES BEFORE THE STRIPE CLIENT");
{
  const limitAt = SRC.indexOf("limitByClient(");
  const authAt = SRC.indexOf("isBillingHealthAuthorized(");
  const unauthorizedAt = SRC.indexOf('"unauthorized"');
  const stripeAt = SRC.indexOf("new Stripe(");
  const balanceAt = SRC.indexOf("stripe.balance.retrieve");

  check(limitAt !== -1, "the route rate-limits", "the route does NOT rate-limit");
  check(limitAt < authAt, "the limiter runs before the auth check — guessing the secret costs something",
    "the auth check runs before the limiter — secret guessing would be free");
  check(stripeAt !== -1 && unauthorizedAt < stripeAt,
    "the 401 is returned before a Stripe client is constructed",
    "a Stripe client is constructed before the 401 — anonymous traffic would still cost Stripe calls");
  check(balanceAt !== -1 && unauthorizedAt < balanceAt,
    "the 401 is returned before stripe.balance.retrieve",
    "stripe.balance.retrieve runs before the 401");
}

// ── D. THE LIMITER IS CONFIGURED FOR THIS ROUTE ─────────────────────────────
// limitByClient throws on an unknown bucket, so a missing entry is a build-time break rather
// than a silent no-limit. Asserted anyway: the audit found the limiter wired to the credential
// routes only, and this is the line that stops that regressing.
console.log("\nD. THE billingHealth BUCKET EXISTS");
{
  const rl = readFileSync(join(ROOT, "src", "lib", "rate-limit.ts"), "utf8");
  const m = rl.match(/billingHealth:\s*\{\s*limit:\s*(\d+),\s*windowMs:\s*([0-9_]+)\s*\}/);
  check(Boolean(m), `billingHealth is a configured bucket${m ? ` (limit ${m[1]} per ${m[2]}ms)` : ""}`,
    "there is no billingHealth bucket in rate-limit.ts — limitByClient would throw, or worse, not limit");
  check(SRC.includes('limitByClient("billingHealth"'),
    "the route limits on the billingHealth bucket",
    "the route does not use the billingHealth bucket");
}

console.log("");
if (failed) {
  console.error("Billing health gate FAILED\n");
  process.exit(1);
}
console.log("Billing health gate passed\n");
