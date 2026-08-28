// Spend limits gate — every route that can cost money is rate-limited, and every configured
// limit is actually wired to something.
//
//   npm run gate:spend-limits        (wired into `build`, so it blocks)
//
// Offline. Reads the route files and the limiter config; makes no request and spends nothing.
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// refuseUnlessEntitled and getCurrentUser gate ENTITLEMENT, not FREQUENCY. They answer "may
// this person do it", never "how often". A paying learner in a retry loop is entitled on every
// iteration, and each one can be an Anthropic call, a Whisper transcription or two Stripe API
// calls. Authentication alone therefore does not bound spend, and this gate exists because two
// billing routes shipped with authentication as their only control.
//
// It also catches the inverse, which is how the gap was found: `resendVerification` sat in
// LIMITS with nothing importing it. A configured limit nothing calls reads as protection in
// review and provides none at runtime — worse than an obvious absence.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { LIMITS } from "../../src/lib/rate-limit";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const API = join(ROOT, "src", "app", "api");

let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Spend limits gate — entitlement is not frequency\n");

/**
 * Source with comments removed.
 *
 * The ordering check below compares the position of a spending call against the position of
 * the limiter. Without this, a COMMENT naming the call counts as the call: the first version
 * of this gate failed /billing/portal because the line above its limiter reads
 * "createPortalSession is a live Stripe call. Limit before it." A gate that matches a mention
 * rather than a call produces false positives, and false positives are how gates get deleted.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\r\n]*/g, "$1 ");
}

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...routeFiles(full));
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

/** What makes a route expensive. Each pattern is a call that leaves this process and bills. */
const SPEND = [
  { label: "Stripe", re: /getStripe\(|stripe\.[a-zA-Z]|createCheckoutSession|createPortalSession|getOrCreateCustomer/ },
  { label: "AI", re: /anthropic|Anthropic|transcribe|whisper|Whisper/ },
  { label: "email", re: /send[A-Z][A-Za-z]*Email|sendEmailVerification/ },
];

/**
 * Routes that spend but are deliberately NOT client-rate-limited, each with the control that
 * replaces the limiter. A route may only be here with a reason, so adding one is a decision
 * somebody has to write down rather than a silent omission.
 */
const EXEMPT: Record<string, string> = {
  "webhooks/stripe": "not client-reachable: every request must carry a valid router HMAC or Stripe signature, and a replayed event id is refused by the idempotency claim",
  "cron/cleanup-audio": "not client-reachable: requires CRON_SECRET or ADMIN_API_SECRET",
};

const files = routeFiles(API);
console.log("A. THE SWEEP FOUND ROUTES TO SWEEP");
check(files.length > 5, `${files.length} API route(s) enumerated`,
  `${files.length} routes found — the scan is looking in the wrong place`);

console.log("\nB. EVERY SPENDING ROUTE IS LIMITED");
{
  let spending = 0;
  let exempted = 0;
  for (const f of files) {
    const src = stripComments(readFileSync(f, "utf8"));
    const id = relative(API, f).replace(/\\/g, "/").replace(/\/route\.ts$/, "");
    const kinds = SPEND.filter((s) => s.re.test(src)).map((s) => s.label);
    if (!kinds.length) continue;
    spending++;
    const limited = /limitByClient\(/.test(src);
    if (limited) continue;
    if (id in EXEMPT) {
      exempted++;
      console.log(`     exempt: /${id} (${kinds.join(", ")}) — ${EXEMPT[id]}`);
      continue;
    }
    fail(`/${id} makes ${kinds.join(" + ")} call(s) with no rate limit — entitlement is not frequency; an authorised caller in a loop spends without bound`);
  }
  if (!failed) ok(`${spending} spending route(s): all limited, except ${exempted} with a documented non-client control`);
}

console.log("\nC. THE LIMIT COMES BEFORE THE SPEND");
// A limiter called after the expensive work has already run is decoration.
{
  let bad = 0;
  for (const f of files) {
    const src = stripComments(readFileSync(f, "utf8"));
    if (!/limitByClient\(/.test(src)) continue;
    const id = relative(API, f).replace(/\\/g, "/").replace(/\/route\.ts$/, "");
    const limitAt = src.indexOf("limitByClient(");
    for (const s of SPEND) {
      const m = s.re.exec(src);
      if (!m) continue;
      // The import block sits above everything; only compare against a call in the body.
      const callAt = src.indexOf(m[0], src.indexOf("export async function"));
      if (callAt !== -1 && callAt < limitAt) {
        bad++;
        fail(`/${id}: a ${s.label} call appears before limitByClient — the limit cannot stop it`);
      }
    }
  }
  if (!bad) ok("in every limited route, the limiter runs before the first spending call");
}

console.log("\nD. NO CONFIGURED LIMIT IS ORPHANED");
// resendVerification sat here with nothing wired to it. A bucket nobody calls looks like
// protection in review and is none at runtime.
{
  const all = files.map((f) => stripComments(readFileSync(f, "utf8"))).join("\n");
  const unused = Object.keys(LIMITS).filter((b) => !all.includes(`limitByClient("${b}"`));
  check(unused.length === 0,
    `all ${Object.keys(LIMITS).length} configured bucket(s) are wired to a route`,
    `configured but never used: ${unused.join(", ")} — delete them or wire them; an unused bucket reads as protection that is not there`);
}

console.log("\nE. THE AI ROUTES ARE BOUNDED, NOT JUST ENTITLED");
// Named explicitly. These are the two routes where one request bills a third party per token,
// so "the limiter exists somewhere" is not enough — it must be on THESE.
{
  for (const id of ["it/evaluate/scritta", "it/evaluate/orale"]) {
    const f = files.find((x) => relative(API, x).replace(/\\/g, "/") === `${id}/route.ts`);
    if (!f) {
      fail(`/${id} no longer exists — update this list rather than deleting the check`);
      continue;
    }
    const src = stripComments(readFileSync(f, "utf8"));
    const m = src.match(/limitByClient\("([a-zA-Z]+)"/);
    if (!m) fail(`/${id} has NO frequency limit — an entitled learner can loop it and bill the key`);
    else {
      const cfg = (LIMITS as Record<string, { limit: number; windowMs: number }>)[m[1]];
      check(Boolean(cfg) && cfg.limit > 0,
        `/${id} limited via "${m[1]}" (${cfg?.limit} per ${cfg?.windowMs}ms)`,
        `/${id} references bucket "${m[1]}", which is not configured`);
    }
  }
}

console.log("");
if (failed) {
  console.error("Spend limits gate FAILED\n");
  process.exit(1);
}
console.log("Spend limits gate passed\n");
