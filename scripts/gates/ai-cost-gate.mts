// AI COST GATE — no metered call without an entitled learner.
//
//   npm run gate:ai-cost   (wired into `build`, so it blocks)
//
// Ported from AlmiPTE's scripts/gates/ai-cost-gate.mts, including its scar tissue. Three
// independent checks, because the property has three parts and each can rot separately:
//
//   1. THE DECISION      decideAiEntitlement over every user shape that matters — pure, no DB
//   2. THE STATIC WIRING every learner-facing model-caller guards itself BEFORE the client
//   3. THE BEHAVIOUR     an unentitled call refuses and provably never reaches a provider
//
// ── THE WALK IS THE THING THAT MATTERS ──────────────────────────────────────
// AlmiPTE's version of check 2 walked src/lib/pte only. That covered 9 modules and MISSED 13,
// and three unpaid model paths lived in the 13 it never looked at — the gate was green the
// whole time. A gate whose walk excludes the hole is green and blind. This one walks ALL of
// src/, and treats transcription as metered because it is.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { decideAiEntitlement, type EntitlementUser } from "../../src/lib/ai/entitlement";

// The decision reads OWNER_EMAILS and the billing flags; give it a world where billing is on
// so "active subscription" means something, and one owner it can recognise.
process.env.OWNER_EMAILS = "founder@almiworld.com";
process.env.STRIPE_SECRET_KEY = "sk_test_gate";
process.env.STRIPE_PRICE_ID = "price_gate";

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("AI cost gate — no metered call without an entitled learner\n");

// ── 1. THE DECISION ─────────────────────────────────────────────────────────
const DAY = 86_400_000;
const future = new Date(Date.now() + 30 * DAY);
const past = new Date(Date.now() - 30 * DAY);
const U = (o: Partial<EntitlementUser>): EntitlementUser => ({
  email: "learner@example.com",
  emailVerifiedAt: null,
  subscriptionStatus: null,
  subscriptionCurrentPeriodEnd: null,
  compProUntil: null,
  ...o,
});

const CASES: [string, EntitlementUser | null, number | null][] = [
  ["no user at all",                       null,                                                                                  401],
  ["signed in, email UNVERIFIED, no sub",  U({}),                                                                                 403],
  ["signed in, VERIFIED, no subscription", U({ emailVerifiedAt: past }),                                                          402],
  ["verified, subscription CANCELED",      U({ emailVerifiedAt: past, subscriptionStatus: "canceled" }),                          402],
  ["verified, sub active but EXPIRED",     U({ emailVerifiedAt: past, subscriptionStatus: "active", subscriptionCurrentPeriodEnd: past }),   402],
  ["UNVERIFIED but subscription active",   U({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: future }),             403],
  ["verified + active subscription",       U({ emailVerifiedAt: past, subscriptionStatus: "active", subscriptionCurrentPeriodEnd: future }), null],
  ["verified + trialing",                  U({ emailVerifiedAt: past, subscriptionStatus: "trialing", subscriptionCurrentPeriodEnd: future }), null],
  ["comped (admin grant), UNVERIFIED",     U({ compProUntil: future }),                                                           null],
  ["comp EXPIRED, nothing else",           U({ emailVerifiedAt: past, compProUntil: past }),                                      402],
  ["owner, UNVERIFIED",                    U({ email: "founder@almiworld.com" }),                                                 null],
];

console.log("1. the decision (pure — no database):");
for (const [label, user, want] of CASES) {
  const status = decideAiEntitlement(user)?.status ?? null;
  if (status !== want) fail(`${label}: expected ${want ?? "ALLOW"}, got ${status ?? "ALLOW"}`);
  else console.log(`     ${(status ?? "ALLOW").toString().padEnd(5)} ${label}`);
}
// The RED direction as its own assertion: if the decision allowed everyone, the table above
// would still print eleven lines and mean nothing.
const refused = CASES.filter(([, , w]) => w !== null);
if (refused.every(([, u]) => decideAiEntitlement(u) === null)) {
  fail("RED PROOF FAILED — decideAiEntitlement allowed every unentitled shape. It is not deciding anything.");
} else {
  ok(`decision refuses ${refused.length} unentitled shape(s) and allows ${CASES.length - refused.length}`);
}
// The comp case is called out because it is the one AlmiPTE got wrong: checking email
// verification before hasPaidAccess locks a comped user out with a 403 for a mailbox nobody
// asked them to confirm.
if (decideAiEntitlement(U({ compProUntil: future })) !== null) {
  fail("a comped user was refused — the decision is checking verification before hasPaidAccess");
} else ok("a comped, unverified user is ALLOWED (the order is hasPaidAccess first)");

// ── 2. THE STATIC WIRING ────────────────────────────────────────────────────
console.log("\n2. static wiring (every model-caller guards itself, before the client):");
const SRC = "src";
const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : [],
      )
    : [];
const norm = (f: string) => f.split("\\").join("/");
/** Read CODE, not prose. Without this the gate reads its own documentation and fails the
 *  person who wrote the comment explaining the rule. */
const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// Transcription counts: Whisper is metered exactly like Anthropic is, and Blob storage is a
// bill too — an unpaid user must not be able to make us STORE a file either.
const REACHES_MODEL = [
  /getAnthropicClient\s*\(/,
  /new\s+Anthropic\s*\(/,
  /@anthropic-ai\/sdk/,
  /ANTHROPIC_API_KEY/,
  /OPENAI_API_KEY/,
  /api\.(anthropic|openai)\.com/,
  /\btranscribeAudio\s*\(/,
  /\bputAudio\s*\(/,
];
const GUARDS = /refuseUnlessEntitled\s*\(|checkAiEntitlement\s*\(|hasPaidAccess\s*\(/;
/** Where the spending actually begins, for the ORDER check. */
const REACHES = /getAnthropicClient\s*\(|transcribeAudio\s*\(|putAudio\s*\(|new\s+Anthropic\s*\(/;

// Exempt ONLY with a written reason. An unlisted, unguarded model-caller fails the build.
const EXEMPT: Record<string, string> = {
  "src/lib/ai/anthropic-client.ts": "the shared client plus the cost recorders — it is what guarded callers call; guarding it here would be circular, and it has no user",
  "src/lib/ai/transcribe.ts": "the Whisper wrapper, same role as the Anthropic client; its CALLERS must guard and they are checked here",
  "src/lib/storage/blob.ts": "the Blob primitive; its CALLERS must guard, and the orale route does so before it uploads",
};

let wiringBad = false;
const all = walk(SRC);
const metered = all.filter((f) => REACHES_MODEL.some((re) => re.test(code(f))));
if (metered.length === 0) fail("found no model-caller at all — this check is looking in the wrong place");
console.log(`     scanned ${all.length} file(s) under ${SRC}/ — ${metered.length} reach a metered provider`);
for (const f of metered) {
  const rel = norm(f);
  const src = code(f);
  if (rel in EXEMPT) { console.log(`       exempt  ${rel}`); continue; }
  const guardAt = src.search(GUARDS);
  const reachAt = src.search(REACHES);
  if (guardAt < 0) {
    wiringBad = true;
    fail(`${rel}: reaches a metered provider but never guards (refuseUnlessEntitled / checkAiEntitlement / hasPaidAccess)`);
  } else if (reachAt >= 0 && guardAt > reachAt) {
    wiringBad = true;
    fail(`${rel}: guards AFTER reaching the provider — move the guard above it`);
  } else {
    console.log(`       guarded ${rel}`);
  }
}
const meteredRel = metered.map(norm);
const stale = Object.keys(EXEMPT).filter((f) => !meteredRel.includes(f));
if (stale.length) { wiringBad = true; fail(`stale exemption(s): ${stale.join(", ")}`); }
if (!wiringBad) ok(`${metered.length} module(s) reach a provider; all guard first (${Object.keys(EXEMPT).length} explained exemptions)`);

// INDIRECT SPENDERS. A route that calls evaluate() spends money without matching any pattern
// above — it never names a provider, it just calls the thing that does. lib/ai/evaluate.ts
// guards itself, so such a route cannot burn tokens; but it CAN answer a paywall with the
// wrong shape (a lib-level 401 instead of an HTTP 402 with an upgrade url), and the next one
// added is the one that forgets entirely. So they are checked too, and the check is separate
// because the failure it prevents is different.
const indirect = all.filter((f) => /@\/lib\/ai\/evaluate/.test(code(f))).map(norm);
let indirectBad = false;
for (const f of indirect) {
  if (!GUARDS.test(code(join(f)))) {
    indirectBad = true;
    wiringBad = true;
    fail(`${f} calls the evaluator but does not check entitlement itself — the learner gets the wrong refusal`);
  }
}
if (!indirectBad) ok(`${indirect.length} caller(s) of the evaluator check entitlement themselves as well`);

// ── 3. THE BEHAVIOUR — and the zero-burn proof ──────────────────────────────
// This calls the real evaluator with no user and asserts a clean refusal.
//
// WHY THAT PROVES NOTHING WAS SPENT: the gate runs with ANTHROPIC_API_KEY deliberately unset.
// getAnthropicClient() throws when the key is missing, so a path that REACHED it would come
// back as a THROW, not as a refusal. A clean refusal is therefore positive evidence that the
// client was never constructed — the absence of a bill, demonstrated rather than assumed.
//
// The precondition assertion is what makes the first one mean anything: if a key leaked in
// from somewhere, "no throw" would prove nothing at all.
console.log("\n3. behaviour (an unentitled call never reaches a provider):");
// BOTH providers, not just Anthropic. A developer machine can legitimately carry an
// OPENAI_API_KEY for some other project, and if this gate ever grows a check that reaches the
// transcription path, a live key would turn a "proof" into a real, billed call. Unsetting both
// keeps the property identical for every provider this repo can spend on.
delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;

const { getAnthropicClient } = await import("../../src/lib/ai/anthropic-client");
const { isTranscriptionConfigured } = await import("../../src/lib/ai/transcribe");
let clientThrows = false;
try { getAnthropicClient(); } catch { clientThrows = true; }
if (isTranscriptionConfigured()) {
  fail("PRECONDITION FAILED — an OpenAI key is still visible to the transcription path during this gate");
} else {
  ok("precondition: no transcription key is visible either, so neither provider can be reached");
}
if (!clientThrows) {
  fail("PRECONDITION FAILED — getAnthropicClient() did not throw with ANTHROPIC_API_KEY unset, so 'no throw' cannot prove 'no call'. Is a key leaking in?");
} else {
  ok("precondition: with no API key, any call that REACHES Anthropic throws — so a clean refusal proves it did not");
}

const { evaluate } = await import("../../src/lib/ai/evaluate");

// THE LOAD-BEARING CASE, AND IT NEEDS NO DATABASE.
// A null userId is refused by decideAiEntitlement before any query, so this exercises exactly
// what the gate is about — is the guard POSITIONED before the client — without depending on
// infrastructure. A gate that goes red for a reason unrelated to what it checks is a gate
// people learn to re-run with a shrug.
for (const skill of ["SCRITTA", "ORALE"] as const) {
  try {
    const r = await evaluate({
      userId: null,
      skill,
      exam: "CILS_B1C",
      level: "B1C",
      criteria: ["Fixture criterion"],
      task: "Fixture task.",
      response: "Fixture response.",
    });
    if (r.ok) fail(`evaluate(${skill}) returned ok with no user at all`);
    else if (r.status !== 401) fail(`evaluate(${skill}) refused with status ${r.status}, expected 401`);
    else ok(`evaluate(${skill}, no user) → clean 401, client never constructed, zero tokens`);
  } catch (e) {
    fail(`evaluate(${skill}) THREW instead of refusing (${(e as Error).message.slice(0, 90)}) — it reached the client before the guard`);
  }
}

// THE DATABASE-BACKED CASE. Additive: it proves the lookup path refuses too. Reported as NOT
// EXERCISED rather than passed when there is no database, because "we could not check" and
// "we checked and it was fine" must never print the same way.
if (process.env.DATABASE_URL) {
  try {
    const r = await evaluate({
      userId: "gate-fixture-no-such-user",
      skill: "SCRITTA",
      exam: "CILS_B1C",
      level: "B1C",
      criteria: ["Fixture criterion"],
      task: "Fixture task.",
      response: "Fixture response.",
    });
    if (r.ok) fail("evaluate returned ok for a user that does not exist");
    else if (r.status !== 401) fail(`unknown user refused with ${r.status}, expected 401`);
    else ok("evaluate(unknown user) → the DB lookup path also refuses");
  } catch (e) {
    fail(`evaluate THREW for an unknown user (${(e as Error).message.slice(0, 90)})`);
  }
} else {
  console.log("  · NOT EXERCISED: no DATABASE_URL, so the unknown-user lookup path was not checked");
}

console.log("");
if (failed) {
  console.error("AI cost gate FAILED\n");
  process.exit(1);
}
console.log("AI cost gate passed\n");
