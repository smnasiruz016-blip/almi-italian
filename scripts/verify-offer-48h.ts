// RR-394 · behaviour proof for the 48-hour offer. Run: npx tsx scripts/verify-offer-48h.ts
//   1. a NEW checkout gets a 48-hour trial (trial_period_days: 2), and the checkout really uses it;
//   2. a 7-day trial that is ALREADY running keeps its access to its own end (it is not cut at 48 hours);
//   3. a paying subscriber keeps access exactly as before.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const pick = (c: string[]) => c.find((p) => existsSync(join(ROOT, p)));
const OFFER = pick(["src/lib/billing/offer.ts", "src/lib/offer.ts"])!;
const STRIPE = pick(["src/lib/billing/stripe.ts", "src/lib/stripe.ts"])!;
const ACCESS = pick(["src/lib/billing/plans.ts", "src/lib/plans.ts", "src/lib/billing/access.ts", "src/lib/access.ts", "src/lib/entitlement.ts", "src/lib/billing/entitlement.ts"]);

let failed = 0;
const t = async (name: string, fn: () => unknown | Promise<unknown>) => {
  try { await fn(); console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n")[0]}`); }
};
const DAY = 86_400_000;

(async () => {
  const offer = await import(pathToFileURL(join(ROOT, OFFER)).href);
  await t("a new checkout has a 48-hour trial (trial_period_days: 2)", () => {
    assert.equal(offer.TRIAL_PERIOD_DAYS, 2);
    assert.equal(offer.TRIAL_HOURS, 48);
    assert.deepEqual(offer.trialForNewCheckout(), { trial_period_days: 2 });
  });
  await t("the checkout session is built from the offer file, not a number of its own", () => {
    const s = readFileSync(join(ROOT, STRIPE), "utf8");
    assert.match(s, /from "\.\/offer"/);
    assert.match(s, /trial_period_days:\s*TRIAL_PERIOD_DAYS|\.\.\.trialForNewCheckout\(\)/);
    assert.doesNotMatch(s, /const TRIAL_(PERIOD_)?DAYS\s*=/);
  });

  if (!ACCESS) { failed++; console.log("  FAIL no access module found: point ACCESS at this repo's isProActive / hasPaidAccess"); }
  else {
    // This repo's predicate is hasPaidAccess (src/lib/access.ts). It is fail-closed until billing is configured
    // (isBillingEnabled reads two env names), so the test sets obvious placeholders IN MEMORY only (no real key is read or
    // used; nothing here talks to Stripe), and clears OWNER_EMAILS so the owner bypass cannot make a case pass.
    process.env.STRIPE_SECRET_KEY ??= "sk_test_placeholder_for_offer_test_only";
    process.env.STRIPE_PRICE_ID ??= "price_placeholder_for_offer_test_only";
    delete process.env.OWNER_EMAILS;
    const access = await import(pathToFileURL(join(ROOT, ACCESS)).href);
    const fn = access.isProActive ?? access.hasPaidAccess ?? access.hasActiveSubscription ?? access.isSubscriptionActive;
    if (typeof fn !== "function") { failed++; console.log(`  FAIL ${ACCESS} exports no isProActive: adapt this test to the repo's own access predicate`); }
    else {
      const now = Date.now();
      // hasPaidAccess here also requires a verified email (emailVerifiedAt), so the learner in every case is verified.
      const base = { compProUntil: null, emailVerified: new Date(now - 30 * DAY), emailVerifiedAt: new Date(now - 30 * DAY), email: "learner@example.com" };
      await t("an existing 7-day trial is unchanged: started 3 days ago (past 48 h), Stripe's end 4 days ahead → still has access", () => {
        assert.equal(fn({ ...base, subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: new Date(now + 4 * DAY), trialEndsAt: new Date(now + 4 * DAY), createdAt: new Date(now - 3 * DAY) }), true);
      });
      await t("an existing paying subscriber is unchanged → access", () => {
        assert.equal(fn({ ...base, subscriptionStatus: "active", subscriptionCurrentPeriodEnd: new Date(now + 20 * DAY), trialEndsAt: null, createdAt: new Date(now - 90 * DAY) }), true);
      });
      await t("control: a subscription whose period has ended → no access (the predicate really looks at the dates)", () => {
        assert.equal(fn({ ...base, subscriptionStatus: "active", subscriptionCurrentPeriodEnd: new Date(now - DAY), trialEndsAt: null, createdAt: new Date(now - 90 * DAY) }), false);
      });

      // AlmiItalian only: the AI trial cap (src/lib/ai/entitlement.ts) — the real decideAiEntitlement, pure, no database.
      // It keys on `trialing`, never on a trial length, so an old 7-day trial and a new 48-hour trial are capped the same,
      // and the running 7-day trial keeps its AI access (within the cap) to its own Stripe end.
      const ent = await import(pathToFileURL(join(ROOT, "src/lib/ai/entitlement.ts")).href);
      const CAP = ent.TRIAL_EVALUATIONS_PER_SKILL;
      const old7 = { ...base, subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: new Date(now + 4 * DAY) }; // started 3 days ago
      const new48 = { ...base, subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: new Date(now + 2 * DAY - 60_000) };
      const paying = { ...base, subscriptionStatus: "active", subscriptionCurrentPeriodEnd: new Date(now + 20 * DAY) };
      await t("AI cap: a running 7-day trial past 48 h, under its allowance → still allowed (not cut at 48 h)", () => {
        assert.equal(CAP, 2);
        assert.equal(ent.decideAiEntitlement(old7, "SCRITTA", { SCRITTA: CAP - 1, ORALE: 0 }), null);
      });
      await t("AI cap: a running 7-day trial at its allowance → 402 trial-cap (still capped)", () => {
        const r = ent.decideAiEntitlement(old7, "ORALE", { SCRITTA: 0, ORALE: CAP });
        assert.equal(r?.status, 402); assert.equal(r?.reason, "trial-cap");
      });
      await t("AI cap: a new 48-hour trial under / at its allowance → allowed / 402 trial-cap", () => {
        assert.equal(ent.decideAiEntitlement(new48, "SCRITTA", { SCRITTA: 0, ORALE: 0 }), null);
        const r = ent.decideAiEntitlement(new48, "SCRITTA", { SCRITTA: CAP, ORALE: 0 });
        assert.equal(r?.status, 402); assert.equal(r?.reason, "trial-cap");
      });
      await t("AI cap: a paying subscriber is never trial-capped", () => {
        assert.equal(ent.decideAiEntitlement(paying, "SCRITTA", { SCRITTA: 50, ORALE: 50 }), null);
      });
      await t("AI cap: a 7-day trial whose Stripe end has passed → refused, not open (control)", () => {
        const r = ent.decideAiEntitlement({ ...old7, subscriptionCurrentPeriodEnd: new Date(now - DAY) }, "SCRITTA", null);
        assert.equal(r?.status, 402); assert.equal(r?.reason, "not-paid");
      });
    }
  }
  console.log(failed ? `\nOFFER TEST FAIL (${failed})` : "\nOFFER TEST PASS");
  process.exitCode = failed ? 1 : 0;
})();
