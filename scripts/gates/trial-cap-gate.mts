// TRIAL CAP GATE — the trial includes 2 evaluations per skill, and it applies to trials ONLY.
//
// Run: npm run gate:trial-cap   (wired into `build`, so it blocks)
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// Withdrawing the 3-day window on 2026-08-31 made every non-paying visitor a TRIAL user by
// definition, and the ads are running. `trialing` lives inside hasPaidAccess(), so a trial
// account had no total limit on AI evaluations at all — only per-hour rate limits (12 scritta,
// 8 orale), which over seven days is a ceiling of 2016 + 1344 metered calls. Priced from this
// product's own AICostLedger rows that is roughly $73 of Anthropic + OpenAI spend per account,
// on a card that has not been charged yet.
//
// ── THE POPULATION, COUNTED BEFORE THE GUARD WAS WRITTEN ────────────────────
// Production, 2026-08-31, read-only: 2 users, subscriptionStatus NULL for both.
//
//   TRIALING users in production: 0
//   ACTIVE (paying) users:        0
//   COMP active:                  0
//
// So THIS GATE RUNS ENTIRELY ON FIXTURES, and it has to. There is no live trial to observe;
// a gate that waited for one would assert nothing today and would still assert nothing on the
// day the first ad click converts. That is exactly why decideAiEntitlement() is kept pure and
// takes its tally as a parameter — the whole rule can be driven here without a database and
// without inventing rows in a production table.
//
// The cost of fixtures is that they can drift from what the loader really passes, so section D
// pins the loader's own shape: it must count AiEvaluation (one row per learner-visible result)
// and it must only count for a capped trial.

process.env.OWNER_EMAILS = "founder@almiworld.com";
process.env.STRIPE_SECRET_KEY = "sk_test_gate";
process.env.STRIPE_PRICE_ID = "price_gate";

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { User } from "@prisma/client";
import {
  decideAiEntitlement,
  isCappedTrial,
  TRIAL_EVALUATIONS_PER_SKILL as CAP,
  type AiSkillKind,
  type EntitlementUser,
  type TrialUsage,
} from "../../src/lib/ai/entitlement";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

const DAY = 24 * 60 * 60 * 1000;
const ago = (d: number) => new Date(Date.now() - d * DAY);
const ahead = (d: number) => new Date(Date.now() + d * DAY);

function U(over: Partial<User>): EntitlementUser {
  return {
    email: "learner@example.com",
    emailVerifiedAt: ago(30),
    subscriptionStatus: null,
    subscriptionCurrentPeriodEnd: null,
    compProUntil: null,
    ...over,
  } as EntitlementUser;
}

const usage = (scritta: number, orale: number): TrialUsage => ({ SCRITTA: scritta, ORALE: orale });

/** The four populations that matter, and only one of them is capped. */
const TRIALING = U({ subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(5) });
const PAYING = U({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: ahead(25) });
const OWNER = U({ email: "founder@almiworld.com" });
const COMPED = U({ compProUntil: ahead(60) });
/** A comped account that ALSO carries a trialing row — the accidental-capture case. */
const COMP_AND_TRIALING = U({ compProUntil: ahead(60), subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(5) });

const status = (u: EntitlementUser, skill: AiSkillKind, used: TrialUsage | null) =>
  decideAiEntitlement(u, skill, used)?.status ?? null;
const reason = (u: EntitlementUser, skill: AiSkillKind, used: TrialUsage | null) =>
  decideAiEntitlement(u, skill, used)?.reason ?? null;

console.log(`TRIAL CAP GATE — ${CAP} evaluations per skill, trials only (fixtures: production has 0 trialing users)\n`);

// ── A. THE CAP EXISTS AND BITES AT EXACTLY THE RIGHT ATTEMPT ────────────────
console.log("A. the cap bites on the attempt after the allowance");
for (const skill of ["SCRITTA", "ORALE"] as AiSkillKind[]) {
  const other: AiSkillKind = skill === "SCRITTA" ? "ORALE" : "SCRITTA";
  for (let used = 0; used < CAP; used++) {
    const u = skill === "SCRITTA" ? usage(used, 0) : usage(0, used);
    ok(status(TRIALING, skill, u) === null,
       `trialing user with ${used} ${skill} evaluation(s) was refused — the trial includes ${CAP}`);
  }
  const atCap = skill === "SCRITTA" ? usage(CAP, 0) : usage(0, CAP);
  ok(status(TRIALING, skill, atCap) === 402,
     `trialing user at the ${skill} cap got ${status(TRIALING, skill, atCap)}, expected 402`);
  ok(reason(TRIALING, skill, atCap) === "trial-cap",
     `the refusal at the ${skill} cap is not labelled "trial-cap", so logRefusal cannot tell it from a paywall`);
  const overCap = skill === "SCRITTA" ? usage(CAP + 5, 0) : usage(0, CAP + 5);
  ok(status(TRIALING, skill, overCap) === 402, `past the ${skill} cap must stay refused`);
  // The two skills are counted SEPARATELY: spending the writing allowance must not consume
  // the speaking one.
  const otherSpent = skill === "SCRITTA" ? usage(0, CAP + 3) : usage(CAP + 3, 0);
  ok(status(TRIALING, skill, otherSpent) === null,
     `${skill} was refused because the ${other} allowance was spent — the skills are separate`);
  console.log(`  ✓ ${skill}: 0..${CAP - 1} allowed, ${CAP} refused 402 "trial-cap", ${other} allowance independent`);
}

// A0 — VACUITY CONTROL. If the tally made no difference, everything above would still pass on
// a decision that ignores usage entirely. Prove 1, 2 and 3 are distinguishable OUTCOMES.
const outcomes = [0, 1, 2, 3].map((n) => String(status(TRIALING, "SCRITTA", usage(n, 0))));
ok(new Set(outcomes).size >= 2,
   `control failed: usage 0,1,2,3 all produce the same answer (${outcomes.join(",")}). The counter ` +
   `is not being read, so every green above is vacuous.`);
ok(outcomes[0] === "null" && outcomes[1] === "null" && outcomes[2] === "402" && outcomes[3] === "402",
   `control failed: expected allow,allow,402,402 across usage 0,1,2,3 — got ${outcomes.join(",")}`);
console.log(`  ✓ control: usage 0,1,2,3 → ${outcomes.join(", ")} (the counter is genuinely read)`);

// ── B. THE OTHER DIRECTION, WHICH IS WORSE: NEVER CAP SOMEONE WHO PAYS ──────
// Refusing a trial user their third writing costs a little patience. Refusing a PAYING user,
// an owner, or a comped account costs the customer, and is a worse bug than the one the cap
// exists to fix. Driven far past the cap so a mistake cannot hide behind a small tally.
console.log("\nB. paying, owner and comped accounts are NEVER capped");
const NEVER_CAPPED: { name: string; u: EntitlementUser }[] = [
  { name: "paying (active)", u: PAYING },
  { name: "owner", u: OWNER },
  { name: "comped", u: COMPED },
  { name: "comped AND trialing", u: COMP_AND_TRIALING },
];
for (const { name, u } of NEVER_CAPPED) {
  ok(isCappedTrial(u) === false, `${name} is classified as a capped trial — it must not be`);
  for (const skill of ["SCRITTA", "ORALE"] as AiSkillKind[]) {
    for (const n of [CAP, CAP + 1, 50, 5000]) {
      const s = status(u, skill, usage(n, n));
      ok(s === null, `${name} was refused ${skill} with ${n} evaluations (${s}) — the cap must not touch them`);
    }
  }
  console.log(`  ✓ ${name}: allowed at ${CAP}, ${CAP + 1}, 50 and 5000 evaluations, both skills`);
}
ok(isCappedTrial(TRIALING) === true, `a plain trialing user is NOT classified as a capped trial — the cap governs nobody`);
console.log(`  ✓ a plain trialing user IS the capped population (so B is not vacuous)`);

// ── C. NEVER A 500, AND THE UNENTITLED STILL ANSWER FIRST ───────────────────
console.log("\nC. shape of the answer");
for (const skill of ["SCRITTA", "ORALE"] as AiSkillKind[]) {
  for (const u of [TRIALING, PAYING, OWNER, COMPED]) {
    for (const tally of [null, usage(0, 0), usage(CAP, CAP), undefined as unknown as TrialUsage | null]) {
      let threw = false;
      let s: number | null = null;
      try { s = status(u, skill, tally); } catch { threw = true; }
      ok(!threw, `decideAiEntitlement THREW — that is a 500 on a request that must answer 402`);
      ok(s === null || s === 401 || s === 402 || s === 403, `unexpected status ${s} — only 401/402/403 or allow`);
    }
  }
}
console.log(`  ✓ no input shape throws; every refusal is 401/402/403, never a 500`);
// A missing tally is "not asked", never "refuse" — and never a throw. Wrapped, so a
// regression here is REPORTED as a violation rather than crashing this gate: a stack trace
// exits 1 too, but it does not say what broke.
let nullTally: number | null | "THREW";
try { nullTally = status(TRIALING, "SCRITTA", null); } catch { nullTally = "THREW"; }
ok(nullTally !== "THREW",
   `decideAiEntitlement THREW on a null tally — that is a 500 on the exact request the cap is ` +
   `supposed to answer with 402`);
ok(nullTally === null, `a null tally refused a trialing user (${nullTally}) — null means "not asked"`);
console.log(`  ✓ a null tally allows: it means "not counted", not "zero left"`);
// The paywall still answers before the cap for someone with no subscription at all.
ok(reason(U({}), "SCRITTA", usage(99, 99)) === "not-paid",
   `an unsubscribed user was answered with the trial cap instead of the paywall`);
ok(reason(U({ emailVerifiedAt: null, subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: ahead(5) }), "SCRITTA", usage(99, 99)) === "unverified",
   `an unverified subscriber was answered with the trial cap instead of "verify your email"`);
console.log(`  ✓ paywall and verify-email still answer before the cap`);

// ── D. THE LOADER MATCHES THE FIXTURES ──────────────────────────────────────
// Fixtures prove the rule; they cannot prove the rule is fed the right numbers. These pin the
// two decisions the loader makes, because both were chosen against measured production data:
// AiEvaluation is one row per learner-visible result, while AICostLedger held 13 rows for the
// same 8 attempts (ORALE writes two, and billed failures write one).
console.log("\nD. the loader counts the right thing");
const ENT = "src/lib/ai/entitlement.ts";
const src = readFileSync(join(root, ENT), "utf8");
ok(/prisma\.aiEvaluation\.groupBy/.test(src),
   `${ENT}: the tally no longer comes from prisma.aiEvaluation`);
ok(!/prisma\.aICostLedger/.test(src),
   `${ENT}: the tally reads AICostLedger — that counts CALLS, not results: one ORALE attempt ` +
   `writes two rows and a billed failure writes one, so a learner would be charged twice for ` +
   `one recording and charged for our own parse failures`);
ok(/isCappedTrial\(user\)\s*\?\s*await countTrialUsage/.test(src),
   `${ENT}: the usage query is no longer conditional on isCappedTrial — a paying subscriber ` +
   `would take a database round-trip that could never refuse them, and could fail on them`);
ok(/checkAiEntitlement\(\s*\n?\s*userId[^)]*skill: AiSkillKind/.test(src.replace(/\r/g, "")) || /skill: AiSkillKind,/.test(src),
   `${ENT}: checkAiEntitlement no longer takes a skill, so the cap cannot be per-skill`);
console.log(`  ✓ ${ENT}: counts AiEvaluation, never AICostLedger, and only for a capped trial`);

// Both routes must pass their own skill and log the refusal.
for (const [route, skill] of [
  ["src/app/api/it/evaluate/scritta/route.ts", "SCRITTA"],
  ["src/app/api/it/evaluate/orale/route.ts", "ORALE"],
] as const) {
  const r = readFileSync(join(root, route), "utf8");
  ok(new RegExp(`checkAiEntitlement\\(user\\.id,\\s*"${skill}"\\)`).test(r),
     `${route}: does not call checkAiEntitlement(user.id, "${skill}") — the cap would count the wrong skill`);
  ok(/logRefusal\(\{/.test(r),
     `${route}: the refusal does not go through logRefusal(), so a run of capped attempts leaves no trace`);
  console.log(`  ✓ ${route}: passes "${skill}" and logs the refusal`);
}

if (failures.length) {
  console.error("\n❌ TRIAL CAP GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures.slice(0, 12)) console.error("   • " + f);
  if (failures.length > 12) console.error(`   … and ${failures.length - 12} more`);
  process.exit(1);
}
console.log(
  `\n✅ trial-cap gate: ${CAP} per skill on trials only; paying/owner/comp untouched at up to 5000 ` +
  `evaluations; the counter is proven to discriminate 0/1/2/3; no input shape throws; the loader ` +
  `counts AiEvaluation and both routes pass their own skill.`,
);
