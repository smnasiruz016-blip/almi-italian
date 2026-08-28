// Webhook idempotency gate — the router can deliver one event three times; this proves the
// product acts on it once, and that a failed run stays retryable.
//
//   npm run gate:webhook-idempotency        (wired into `build`, so it blocks)
//
// Offline. No database, no network, no key: src/lib/billing/webhook-idempotency.ts takes a
// two-method store, so the REAL logic runs here against a fake that can be told to raise P2002.
// This asserts the behaviour, it does not describe it.
//
// WHY. almi-billing-router forwards on any non-2xx with BACKOFF_MS = [300, 900, 2700] and
// abandons an attempt at 10s. Its own comment assumes "products are idempotent on the same
// event id". Before this gate almi-italian was one of three products in the network that was
// not — a duplicate delivery of customer.subscription.created emailed the learner again.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  claimEvent,
  releaseClaim,
  UNIQUE_VIOLATION,
  type ClaimStore,
} from "../../src/lib/billing/webhook-idempotency";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Webhook idempotency gate — one delivery, one effect\n");

/** A store that behaves like the real table: the primary key rejects a second insert. */
function fakeStore() {
  const rows = new Set<string>();
  const store: ClaimStore = {
    async create({ data }) {
      if (rows.has(data.id)) {
        throw Object.assign(new Error("Unique constraint failed"), { code: UNIQUE_VIOLATION });
      }
      rows.add(data.id);
      return {};
    },
    async delete({ where }) {
      rows.delete(where.id);
      return {};
    },
  };
  return { store, rows };
}

// ── A. THE SECOND DELIVERY IS TURNED AWAY ───────────────────────────────────
console.log("A. A REPEATED EVENT IS CLAIMED ONCE");
{
  const { store, rows } = fakeStore();
  const first = await claimEvent(store, "evt_1", "customer.subscription.created");
  const second = await claimEvent(store, "evt_1", "customer.subscription.created");
  const third = await claimEvent(store, "evt_1", "customer.subscription.created");
  check(first === true, "the first delivery claims the event",
    "the FIRST delivery was refused — nothing would ever be processed");
  check(second === false && third === false,
    "the second and third deliveries are refused — the router's three attempts act once",
    `a repeat delivery was allowed through (second=${second}, third=${third}) — the learner gets a second email`);
  check(rows.size === 1, "exactly one row exists for the event", `${rows.size} rows exist for one event`);
}

// ── B. A DIFFERENT EVENT IS NOT BLOCKED BY AN EARLIER ONE ───────────────────
console.log("\nB. A DIFFERENT EVENT STILL GETS THROUGH");
{
  const { store } = fakeStore();
  await claimEvent(store, "evt_1", "customer.subscription.created");
  const other = await claimEvent(store, "evt_2", "customer.subscription.updated");
  check(other === true, "a different event id is claimed normally",
    "a DIFFERENT event was refused — the guard is blocking real traffic, not duplicates");
}

// ── C. A FAILED RUN STAYS RETRYABLE ─────────────────────────────────────────
// Claiming before the work is what closes the race; releasing on failure is what stops that
// from turning a transient error into a silently dropped subscription change.
console.log("\nC. A FAILED HANDLER RELEASES ITS CLAIM");
{
  const { store, rows } = fakeStore();
  await claimEvent(store, "evt_3", "customer.subscription.created");
  await releaseClaim(store, "evt_3");
  check(rows.size === 0, "the claim is gone after a release",
    "the claim survived the release — the event can never be retried");
  const again = await claimEvent(store, "evt_3", "customer.subscription.created");
  check(again === true, "the released event can be claimed again by the next attempt",
    "a released event could NOT be reclaimed — a failed run is lost for good");
}

// ── D. AN UNKNOWN DATABASE ERROR IS NOT SWALLOWED ───────────────────────────
// A guard that treats every error as "already claimed" reports success while doing nothing.
console.log("\nD. A NON-P2002 ERROR IS RETHROWN, NOT READ AS A DUPLICATE");
{
  const store: ClaimStore = {
    async create() {
      throw Object.assign(new Error("connection refused"), { code: "P1001" });
    },
    async delete() {
      return {};
    },
  };
  let threw = false;
  try {
    await claimEvent(store, "evt_4", "customer.subscription.created");
  } catch {
    threw = true;
  }
  check(threw, "an unknown database error propagates",
    "an unknown database error was read as a duplicate — every event would be silently skipped");
}

// ── E. THE ROUTE CLAIMS BEFORE IT ACTS ──────────────────────────────────────
// The behaviour above is only worth anything if the claim happens before the side effects. A
// claim placed after the email would be a correct function called at a useless moment.
console.log("\nE. THE ROUTE CLAIMS BEFORE ANY SIDE EFFECT");
{
  const src = readFileSync(join(ROOT, "src", "app", "api", "webhooks", "stripe", "route.ts"), "utf8");
  const claimAt = src.indexOf("claimEvent(");
  const emailAt = src.indexOf("sendSubscriptionConfirmationEmail(");
  const syncAt = src.indexOf("prisma.user.updateMany");
  check(claimAt !== -1, "the route calls claimEvent",
    "the route does NOT call claimEvent — the guard is not wired in");
  check(emailAt !== -1 && claimAt < emailAt, "the claim precedes the confirmation email",
    "the confirmation email is sent BEFORE the claim — duplicates would still be emailed");
  check(syncAt !== -1 && claimAt < syncAt, "the claim precedes the subscription write",
    "the subscription write happens BEFORE the claim");
  check(src.includes("releaseClaim("), "the route releases the claim on the failure path",
    "the route never calls releaseClaim — a failed handler would block every retry");
  check(!/no idempotency guard is needed/.test(src),
    "the old \"no idempotency guard is needed\" premise is gone from the route",
    "the route still says no idempotency guard is needed — that premise is what caused this bug");
}

console.log("");
if (failed) {
  console.error("Webhook idempotency gate FAILED\n");
  process.exit(1);
}
console.log("Webhook idempotency gate passed\n");
