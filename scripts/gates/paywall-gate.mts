// PAYWALL GATE — one door, and the thing that keeps the card mandatory.
//
// Run: npm run gate:paywall   (wired into `build`, so it blocks)
//
// The 3-day no-card window was withdrawn network-wide on 2026-08-31. RR-397 (8 Nov 2026) brought a different free grant:
// 48 hours from sign-up (User.createdAt), no card, asked only after hasPaidAccess(); a checkout charges $12 at once.
// These properties have to hold, and none of them is visible by reading any single file:
//
//   A. Nothing that serves or marks practice content is reachable without hasPaidAccess() (asked first, by the gatekeepers).
//   C. payment_method_collection is pinned to "always", and the checkout hands Stripe no trial.
//   D. The free 48 hours are asked strictly after hasPaidAccess(), keyed on createdAt.
//
// (B — "no served page promises free practice" — is a different question and lives in
// scripts/gates/served-copy-gate.mts, because it can only be answered from BUILD OUTPUT.)
//
// ── WHY A IS ENUMERATED AND NOT LISTED ──────────────────────────────────────
// AlmiPrep's equivalent check carried a hardcoded "known free" list of routes. A route that
// should have been on neither list read as free, the gate reported ALL PASS, and an open door
// stayed open. So this gate never asks "is this route allowed to be free". It DERIVES the
// population — every route file that can reach item content or marking — and demands the
// paywall of all of them. A new route that touches items is in the population the moment it
// is written, and nobody has to remember to add it anywhere.
//
// ── THE POPULATION, COUNTED BEFORE THE GUARD WAS WRITTEN (2026-08-31) ───────
//   src/app/(shell)/practice/[track]/[section]/page.tsx   serves items
//   src/app/api/it/submit/route.ts                        marks them (discloses the key)
//   src/app/api/it/evaluate/scritta/route.ts              spends on Anthropic
//   src/app/api/it/evaluate/orale/route.ts                spends on Whisper + Anthropic
// Four. src/app/(shell)/practice/page.tsx is NOT in it — it lists tracks and counts and
// carries no item, which is why it may stay public. That exclusion is DERIVED (it imports no
// content symbol), not granted, and section A0 below proves the classifier can tell the two
// apart. A classifier that said "content-bearing" about everything, or nothing, would make
// this gate vacuous while printing the same green.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

/** Comments are stripped so a file that DISCUSSES hasPaidAccess is not credited with calling
 *  it — several files in this repo explain the policy at length and call nothing. */
function stripComments(src: string): string {
  let out = "", i = 0, inLine = false, inBlock = false;
  let inStr: string | null = null;
  const BS = String.fromCharCode(92);
  while (i < src.length) {
    const c = src[i], n = i + 1 < src.length ? src[i + 1] : "";
    if (inLine) { if (c === "\n") { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i += 2; } else i++; continue; }
    if (inStr) { if (c === BS) { out += c + n; i += 2; continue; } if (c === inStr) inStr = null; out += c; i++; continue; }
    if (c === "/" && n === "/") { inLine = true; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; i += 2; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}

const rel = (abs: string) => relative(root, abs).split(String.fromCharCode(92)).join("/");

console.log("PAYWALL GATE — paid door (hasPaidAccess) first, then the free 48 hours (no card); checkout charges $12 at once\n");

// ── A. NOTHING SERVES OR MARKS PRACTICE CONTENT WITHOUT hasPaidAccess ───────

/** Reaching any of these means the file can hand a learner an item, mark one, or spend on
 *  one. This is the definition of the population; it is not a list of routes. */
const CONTENT_REACH = /\b(itemsFor|runnerItemsFor|toRunnerItem|getItemByStableId|gradeAttempt)\s*\(/;
const SPEND_REACH = /\bevaluate\s*\(|\btranscribeAudio\s*\(/;

/** hasPaidAccess() directly, or one of the two functions PROVEN below to call it. */
const PAYWALL_REACH = /\bhasPaidAccess\s*\(|\brefuseSection\s*\(|\bcheckAiEntitlement\s*\(|\brefuseUnlessEntitled\s*\(/;

/** The indirection must not be a hole: each gatekeeper is itself required to reach
 *  hasPaidAccess, or "calls refuseSection" would prove nothing about payment. */
const GATEKEEPERS: { file: string; why: string }[] = [
  { file: "src/lib/section-access.ts", why: "refuseSection — the page + submit decision" },
  { file: "src/lib/ai/entitlement.ts", why: "checkAiEntitlement / refuseUnlessEntitled — the metered decision" },
];
for (const g of GATEKEEPERS) {
  const src = stripComments(readFileSync(join(root, g.file), "utf8"));
  ok(/\bhasPaidAccess\s*\(/.test(src),
     `${g.file}: ${g.why} no longer calls hasPaidAccess(), so every route that delegates to it ` +
     `is unguarded while still looking guarded`);
}
console.log(`  ✓ both gatekeepers still call hasPaidAccess() themselves`);

const routeFiles = walk(join(root, "src", "app")).filter((p) => /[\\/](page|route)\.tsx?$/.test(p));
ok(routeFiles.length > 20, `only ${routeFiles.length} route file(s) found under src/app — the walk is not reaching the app`);

const population: string[] = [];
const excluded: string[] = [];
for (const abs of routeFiles) {
  const code = stripComments(readFileSync(abs, "utf8"));
  if (CONTENT_REACH.test(code) || SPEND_REACH.test(code)) population.push(rel(abs));
  else excluded.push(rel(abs));
}

// A0 — VALIDATE THE CLASSIFIER BEFORE TRUSTING ANY GREEN IT PRODUCES.
// A classifier that matched everything, or nothing, would report the same success.
ok(population.length >= 4,
   `only ${population.length} content-bearing route(s) found — expected at least 4 ` +
   `(the section page, /api/it/submit, and the two evaluate routes). The detector is not ` +
   `matching the code it is supposed to police, so a green here would be vacuous.`);
ok(excluded.length > 0, `every route classified as content-bearing — the detector cannot discriminate`);
ok(excluded.includes("src/app/(shell)/practice/page.tsx"),
   `src/app/(shell)/practice/page.tsx is now classified as content-bearing. Either it started ` +
   `serving items (then it needs the paywall) or the detector broke.`);
console.log(`  ✓ classifier discriminates: ${population.length} content-bearing, ${excluded.length} not`);

for (const f of population) {
  const code = stripComments(readFileSync(join(root, f), "utf8"));
  ok(PAYWALL_REACH.test(code),
     `${f} can serve, mark or spend on practice content but never reaches hasPaidAccess() — ` +
     `directly or through refuseSection/checkAiEntitlement. This is an open door.`);
}
for (const f of population) console.log(`  ✓ ${f}`);

// The withdrawn grant must not survive anywhere as a second way in.
const WITHDRAWN = /\bisFreeWindowActive\s*\(|\bisFreeWindowExpired\s*\(|\bgetFreeAccessDaysRemaining\s*\(|\bisFreeWindowSection\s*\(|\bopenSection\s*\(|\bFREE_ACCESS_DAYS\b|WINDOW_EXPIRED/;
for (const abs of walk(join(root, "src"))) {
  const code = stripComments(readFileSync(abs, "utf8"));
  ok(!WITHDRAWN.test(code),
     `${rel(abs)} still references the withdrawn 3-day window (isFreeWindow*/openSection/` +
     `FREE_ACCESS_DAYS/WINDOW_EXPIRED). The grant is gone; a surviving reference is either a ` +
     `second door or copy that lies.`);
}
console.log(`  ✓ no source file still reaches the withdrawn window`);

// ── C. THE CARD IS MANDATORY, AND WE OWN THAT — NOT A STRIPE DEFAULT ────────
const STRIPE = "src/lib/stripe.ts";
const stripeSrc = stripComments(readFileSync(join(root, STRIPE), "utf8"));
ok(/payment_method_collection\s*:\s*["']always["']/.test(stripeSrc),
   `${STRIPE}: payment_method_collection is not pinned to "always". With the no-card window ` +
   `gone this is the only thing that makes a card mandatory for the free trial; leaving it to ` +
   `a Stripe default means the paywall depends on somebody else's release notes.`);
ok(!/payment_method_collection\s*:\s*["']if_required["']/.test(stripeSrc),
   `${STRIPE}: payment_method_collection is "if_required" — the trial can be started with no ` +
   `payment method at all`);
// RR-397 (owner decision 8 Nov 2026): "Try free for 48 hours, no card. Then $12/month. Cancel anytime."
// RR-394 asserted here that the checkout took a 2-day Stripe trial from ./offer. That is now the WRONG offer, so the same
// checks are kept just as strict against the new one: the checkout spreads ...trialForNewCheckout() imported from ./offer,
// that function returns {} (Stripe is handed nothing about a trial, so $12 is charged at checkout), the checkout code names
// no trial at all, and the free time is exactly 48 hours (TASTE_HOURS) and lives in the app (src/lib/taste.ts), keyed on
// createdAt. (scripts/gates/offer-48h.mjs holds the rest of the offer.)
const OFFER = "src/lib/offer.ts";
const offerSrc = stripComments(readFileSync(join(root, OFFER), "utf8"));
ok(/\.\.\.trialForNewCheckout\(\)/.test(stripeSrc), `${STRIPE}: the checkout does not spread ...trialForNewCheckout() — the trial decision no longer comes from the offer`);
ok(/import\s*\{\s*trialForNewCheckout\s*\}\s*from\s*["']\.\/offer["']/.test(stripeSrc), `${STRIPE}: trialForNewCheckout is not imported from ./offer`);
ok(!/trial_period_days|trialPeriodDays|trial_end|trial_from_plan/.test(stripeSrc), `${STRIPE}: the checkout names a trial again — new checkouts must charge $12 at once, with no card trial`);
ok(/trialForNewCheckout\(\)\s*:\s*Record<string,\s*never>\s*\{\s*return\s*\{\s*\}\s*;/.test(offerSrc), `${OFFER}: trialForNewCheckout() no longer returns {} — Stripe would be handed a trial`);
ok(/export const TASTE_HOURS\s*=\s*48\s*;/.test(offerSrc), `${OFFER}: the free time is no longer 48 hours`);
ok(/mode\s*:\s*["']subscription["']/.test(stripeSrc), `${STRIPE}: checkout is not in subscription mode`);
console.log(`  ✓ ${STRIPE}: payment_method_collection "always", no Stripe trial (trialForNewCheckout() = {} from ${OFFER}), subscription mode; free time 48 hours`);

// ── D. RR-397: THE FREE 48 HOURS ARE A SECOND DOOR, ASKED ONLY AFTER hasPaidAccess() ─────────
// Both gatekeepers now also open for an account inside its free 48 hours (no card). That must never change what a paying
// learner or a running card trial gets, so in each gatekeeper hasPaidAccess(user) must come BEFORE isTasteActive(user), and the
// free door must be keyed on User.createdAt (src/lib/taste.ts), never on the withdrawn freeAccessStartedAt clock.
for (const g of GATEKEEPERS) {
  const src = stripComments(readFileSync(join(root, g.file), "utf8"));
  const iPaid = src.indexOf("hasPaidAccess(user)"), iTaste = src.indexOf("isTasteActive(user)");
  ok(iTaste > 0 && iPaid > 0 && iPaid < iTaste,
     `${g.file}: the free 48 hours (isTasteActive) are not asked strictly AFTER hasPaidAccess(user) — a paying learner or a ` +
     `running card trial could be answered by the free door`);
  ok(!/freeAccessStartedAt/.test(src), `${g.file}: reads freeAccessStartedAt — the withdrawn 3-day clock must stay inert`);
}
{
  const taste = stripComments(readFileSync(join(root, "src/lib/taste.ts"), "utf8"));
  ok(/user\.createdAt/.test(taste) && !/freeAccessStartedAt/.test(taste), `src/lib/taste.ts: the free 48 hours are not keyed on User.createdAt`);
}
console.log(`  ✓ both gatekeepers ask hasPaidAccess() before the free 48 hours; the free door is keyed on createdAt`);

// C0 — the detector must be able to FAIL. A regex that matches nothing passes every file.
const SABOTAGED = stripeSrc.replace(/payment_method_collection\s*:\s*["']always["']/, 'payment_method_collection: "if_required"');
ok(SABOTAGED !== stripeSrc, `control: could not construct the sabotaged form, so the pin check is untested`);
ok(!/payment_method_collection\s*:\s*["']always["']/.test(SABOTAGED),
   `control: the "always" check still passes on a sabotaged copy — it is not actually reading the value`);
console.log(`  ✓ control: the pin check fires on a sabotaged copy of ${STRIPE}`);

if (failures.length) {
  console.error("\n❌ PAYWALL GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `\n✅ paywall gate: ${population.length} content-bearing route(s) derived from ${routeFiles.length} ` +
  `route files, every one behind hasPaidAccess(); both gatekeepers still call it; no reference to ` +
  `the withdrawn window survives; the card is pinned by us, not inherited from Stripe.`,
);
