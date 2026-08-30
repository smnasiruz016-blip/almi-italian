// ADMIN COUNTING GATE — the tiles and the badges cannot disagree about the same person.
//
// Run: npm run gate:admin-counting   (wired into `build`, so it blocks)
//
// ── THE TWO DEFECTS THIS EXISTS FOR ────────────────────────────────────────
// 1. /admin/accounts kept its own copy of ["trialing","active"] while @/lib/access held the
//    one the paywall reads. Two copies of a plan rule is how an admin comes to show "Pro"
//    about a person the product refuses, and nothing fails loudly when they drift apart.
// 2. The stat tiles were four queries with Free as the subtraction left over — total minus
//    comp minus pro. That arithmetic had no Owner term, so the owner fell into Free: the
//    admin counted the founder as a free user on the same screen whose row badge said
//    "Owner". A remainder tile silently absorbs any population nobody thought about.
//
// ── THE POPULATION, COUNTED BEFORE THE GUARD WAS WRITTEN (2026-08-30) ──────
// Six files in src/ mention the string "trialing". Read one by one, only ONE of them was a
// duplicate of the LIST — /admin/accounts. The other five each reference the single status
// for a different, legitimate purpose and are deliberately NOT swept:
//   src/app/(app)/account/page.tsx        display fallback text
//   src/app/api/admin/stats/route.ts      counts trialing specifically, as its own stat
//   src/app/api/webhooks/stripe/route.ts  "is this event a trial start"
//   src/lib/ai/entitlement.ts             "is this user's access a trial" (the cap's population)
//   src/lib/access.ts                     the definition itself
// So the swept population is 1, and it is stated rather than implied.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPlan, tallyPlans, PLAN_LABEL, type PlanUser } from "../../src/lib/admin/plan";

process.env.OWNER_EMAILS = "founder@almiworld.com";
process.env.STRIPE_SECRET_KEY = "sk_test_gate";
process.env.STRIPE_PRICE_ID = "price_gate";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) failures.push(m); };

console.log("ADMIN COUNTING GATE — tiles and badges from one classifier\n");

// ── A. THE CLASSIFIER, DRIVEN ──────────────────────────────────────────────
const DAY = 86_400_000;
const U = (o: Partial<PlanUser>): PlanUser => ({ email: "learner@example.com", compProUntil: null, subscriptionStatus: null, ...o });
const ahead = (d: number) => new Date(Date.now() + d * DAY);
const ago = (d: number) => new Date(Date.now() - d * DAY);

console.log("A. one person, one bucket");
{
  const CASES: [string, PlanUser, string][] = [
    ["owner, nothing else", U({ email: "founder@almiworld.com" }), "owner"],
    ["owner WITH a comp grant", U({ email: "founder@almiworld.com", compProUntil: ahead(30) }), "owner"],
    ["owner WITH a subscription", U({ email: "founder@almiworld.com", subscriptionStatus: "active" }), "owner"],
    ["comp, unexpired", U({ compProUntil: ahead(30) }), "comp"],
    ["comp AND subscribed", U({ compProUntil: ahead(30), subscriptionStatus: "active" }), "comp"],
    ["comp expired", U({ compProUntil: ago(1) }), "free"],
    ["active subscription", U({ subscriptionStatus: "active" }), "pro"],
    ["trialing subscription", U({ subscriptionStatus: "trialing" }), "pro"],
    ["canceled subscription", U({ subscriptionStatus: "canceled" }), "free"],
    ["nothing at all", U({}), "free"],
  ];
  for (const [name, u, want] of CASES) {
    const got = classifyPlan(u);
    ok(got === want, `${name}: classified "${got}", expected "${want}"`);
  }
  console.log(`  ✓ ${CASES.length} shapes, including an owner who also has comp and a subscription`);

  // 🔴 THE DEFECT, AS ITS OWN ASSERTION. This is the one that shipped.
  ok(classifyPlan(U({ email: "founder@almiworld.com" })) !== "free",
     "the owner classifies as FREE — this is the exact bug: honest columns, dishonest label");
  console.log(`  ✓ an owner is never counted as free`);

  // Control: if the classifier returned the same bucket for everything, section A would pass
  // while proving nothing.
  const buckets = new Set(CASES.map(([, u]) => classifyPlan(u)));
  ok(buckets.size >= 3, `control: the classifier only ever returns ${[...buckets].join("/")} — it is not discriminating`);
  console.log(`  ✓ control: it returns ${buckets.size} distinct buckets across the fixtures`);
}

// ── B. THE TILES ADD UP, BY CONSTRUCTION ───────────────────────────────────
console.log("\nB. the tiles sum to the total, with no remainder tile");
{
  const people: PlanUser[] = [
    U({ email: "founder@almiworld.com" }),
    U({ compProUntil: ahead(9) }),
    U({ subscriptionStatus: "active" }),
    U({ subscriptionStatus: "trialing" }),
    U({}),
    U({ compProUntil: ago(2) }),
  ];
  const t = tallyPlans(people);
  const sum = t.owner + t.comp + t.pro + t.free;
  ok(sum === people.length, `the buckets sum to ${sum} but there are ${people.length} people — someone is in two buckets or none`);
  ok(t.owner === 1, `the owner was counted ${t.owner} time(s), expected 1`);
  ok(t.free === 2, `free counted ${t.free}, expected 2 (the plain user and the expired comp)`);
  console.log(`  ✓ owner ${t.owner} · comp ${t.comp} · pro ${t.pro} · free ${t.free} = ${sum} of ${people.length}`);
  // Control: a tally that always returned zeros would also "sum" for an empty list.
  ok(people.length > 0 && sum > 0, "control: the fixture population is empty, so the sum proves nothing");
}

// ── C. NO SECOND COPY OF THE RULE ──────────────────────────────────────────
console.log("\nC. the plan rule has one home");
{
  const walk = (d: string, out: string[] = []): string[] => {
    for (const e of readdirSync(d)) {
      if (e === "node_modules" || e === ".next") continue;
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.tsx?$/.test(e)) out.push(p);
    }
    return out;
  };
  const HOME = ["src/lib/access.ts", "src/lib/admin/plan.ts"];
  // A LIST of both statuses together — not a single mention, which five files legitimately have.
  const LIST = /\[\s*"(?:trialing|active)"\s*,\s*"(?:trialing|active)"\s*\]/;
  let scanned = 0, offenders = 0;
  for (const abs of walk(join(root, "src"))) {
    const rel = relative(root, abs).split(String.fromCharCode(92)).join("/");
    scanned++;
    if (HOME.includes(rel)) continue;
    if (LIST.test(readFileSync(abs, "utf8"))) {
      offenders++;
      failures.push(`${rel} carries its own ["trialing","active"] list. Import ACTIVE_SUBSCRIPTION_STATUSES from @/lib/access — two copies of a plan rule is how a badge and a paywall come to disagree.`);
    }
  }
  ok(scanned > 40, `only ${scanned} source file(s) walked — the scan is not reaching src/`);
  console.log(`  ${offenders === 0 ? "✓" : "✗"} ${scanned} files scanned, ${offenders} second cop${offenders === 1 ? "y" : "ies"} of the list`);
  // Control: the detector must be able to see one.
  ok(LIST.test('const X = ["trialing", "active"];'), "control: the duplicate detector does not match a duplicate");
  ok(!LIST.test('subscriptionStatus === "trialing"'), "control: the detector fires on a single legitimate mention");
  console.log(`  ✓ control: the detector matches a real list and ignores a single mention`);
}

// ── D. THE PAGE USES THEM ──────────────────────────────────────────────────
console.log("\nD. /admin/accounts counts through the classifier");
{
  const PAGE = "src/app/(app)/admin/accounts/page.tsx";
  const src = readFileSync(join(root, PAGE), "utf8");
  ok(/from "@\/lib\/admin\/plan"/.test(src), `${PAGE}: does not import the shared classifier`);
  ok(/tallyPlans\(/.test(src), `${PAGE}: the tiles are not counted with tallyPlans`);
  ok(!/total\s*-\s*\w+Count/.test(src), `${PAGE}: a tile is still computed by subtraction — that is how Owner fell into Free`);
  ok(/label: "Owner"/.test(src), `${PAGE}: there is no Owner tile`);
  for (const k of Object.keys(PLAN_LABEL)) {
    ok(new RegExp(`label: "${PLAN_LABEL[k as keyof typeof PLAN_LABEL]}"`).test(src) || k === "owner",
       `${PAGE}: no tile for "${PLAN_LABEL[k as keyof typeof PLAN_LABEL]}"`);
  }
  console.log(`  ✓ imports the classifier, tallies with it, has an Owner tile, no subtraction`);
}

if (failures.length) {
  console.error("\n❌ ADMIN COUNTING GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures.slice(0, 10)) console.error("   • " + f);
  process.exit(1);
}
console.log(`\n✅ admin-counting gate: one classifier drives both the badges and the tiles; the four buckets sum to the total with no remainder; an owner is never counted as free; and the plan rule has exactly one home.`);
