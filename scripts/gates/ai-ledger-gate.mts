// AI LEDGER GATE — no metered call without a ledger row.
//
// Run: npm run gate:ai-ledger   (wired into `build`, so it blocks)
//
// gate:ai-cost already proves no metered call happens without an ENTITLED learner. This proves
// the other half: that when the call does happen, it is written down. They are different
// properties and either can rot alone.
//
// WHY IT MATTERS MORE THAN IT LOOKS
// /admin/costs reads AICostLedger and prints the sums. A spending path that never writes a row
// does not make that page wrong-looking — it makes it QUIETLY LOW, which is worse, because a
// number that is merely too small still reads as an answer. The page is only as honest as this
// gate.
//
// THE POPULATION, COUNTED BEFORE THE GUARD WAS WRITTEN
// Two providers are reachable in this product and each has exactly one entry point:
//   · Anthropic, per token          getAnthropicClient()  -> recordCost()
//   · OpenAI Whisper, per second    transcribeAudio()     -> recordTranscriptionCost()
// Both were verified to record today, failures included. The gate walks ALL of src/ rather
// than a chosen subdirectory: AlmiPTE's cost gate walked one folder, missed thirteen modules,
// and stayed green while three unpaid paths lived in the part it never looked at.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

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

// The provider entry points, and the recorder each one owes. Comments are stripped first, so a
// file that merely DISCUSSES getAnthropicClient() is not treated as calling it — three files do
// exactly that, and counting them would have made this gate demand ledger writes from prose.
const SPENDERS: { entry: RegExp; recorder: RegExp; what: string }[] = [
  { entry: /\bgetAnthropicClient\s*\(\s*\)/, recorder: /\brecordCost\s*\(/, what: "Anthropic (per token)" },
  { entry: /\btranscribeAudio\s*\(/, recorder: /\brecordTranscriptionCost\s*\(/, what: "OpenAI Whisper (per second)" },
];

// The module that DEFINES the recorders is not a spender; it is the till.
const TILL = "src/lib/ai/anthropic-client.ts";
const TRANSCRIBE_LIB = "src/lib/ai/transcribe.ts"; // defines transcribeAudio, does not call it

let entryPointsFound = 0;
for (const abs of walk(join(root, "src"))) {
  const rel = relative(root, abs).split(String.fromCharCode(92)).join("/");
  if (rel === TILL || rel === TRANSCRIBE_LIB) continue;
  const code = stripComments(readFileSync(abs, "utf8"));
  for (const s of SPENDERS) {
    if (!s.entry.test(code)) continue;
    entryPointsFound++;
    ok(s.recorder.test(code),
       `${rel} reaches ${s.what} but never calls its recorder — this spend would be invisible in ` +
       `/admin/costs, which would then under-report rather than look broken`);
  }
}

// A walk that finds nothing proves nothing. This is the check that would have caught the
// scanner which reported "0 defects" while silently failing to compile a single file.
ok(entryPointsFound >= 2,
   `only ${entryPointsFound} provider entry point(s) found in src/ — expected at least 2 ` +
   `(Anthropic and Whisper). The walk is not reaching the code it is supposed to police.`);

// The till itself must still write, and must still write FAILURES at zero rather than skipping
// them — a failure that is not recorded is a call nobody can account for.
const till = stripComments(readFileSync(join(root, TILL), "utf8"));
ok(/prisma\.aICostLedger\.create/.test(till),
   `${TILL}: no ledger insert — nothing is being recorded at all`);
ok((till.match(/prisma\.aICostLedger\.create/g) ?? []).length >= 2,
   `${TILL}: fewer than two ledger inserts — token billing and per-second billing each need one`);
ok((till.match(/input\.success\s*\?/g) ?? []).length >= 2,
   `${TILL}: fewer than two cost expressions are conditioned on success — a failed call may now ` +
   `be billed as spend. Both recorders need it; a check that passed when only ONE did let a ` +
   `sabotage through.`);
ok(/success:\s*input\.success/.test(till),
   `${TILL}: the success flag is no longer stored, so failures cannot be told from spend`);

// The page that reads the ledger must read the field this schema actually has. AlmiPrep's
// column is `timestamp`; ours is `createdAt`, and a copied orderBy would have shipped a page
// that silently ordered by nothing.
const COSTS = "src/app/(app)/admin/costs/page.tsx";
const costs = stripComments(readFileSync(join(root, COSTS), "utf8"));
ok(/prisma\.aICostLedger\./.test(costs), `${COSTS}: does not read the ledger`);
ok(!/\btimestamp\b/.test(costs), `${COSTS}: references a \`timestamp\` column — this schema's field is \`createdAt\``);
ok(/createdAt/.test(costs), `${COSTS}: never orders or filters by createdAt`);

// ── EVERY PROVIDER CALL IS ACCOUNTED FOR ────────────────────────────────────
//
// Everything above is a FILE-LEVEL pairing check: "this module reaches a provider, so this
// module had better call the recorder". It cannot see how many times the provider is called
// per invocation, and that is precisely where the money was going missing.
//
// evaluate() calls the model TWICE whenever a guard trips. The ledger used to take its usage
// from the FINAL response and to hardcode zeros in the catch, so:
//   · a retried evaluation billed two calls and wrote one down
//   · a response that arrived HTTP 200 and then failed to parse was billed and written as zero
// The second shape is not hypothetical. Production AICostLedger row 2026-08-28T02:11 —
// orale.evaluate, in=0 out=0 costCents=0, errorMessage "Failed to parse structured output" —
// is a real call the founder paid for and this ledger recorded as free.
//
// So this section asks the only question that catches it: for one evaluate(), do the tokens
// the PROVIDER returned equal the tokens the LEDGER wrote? It is behavioural, and it is
// offline — the SDK is intercepted at globalThis.fetch and the two prisma delegates the path
// touches are replaced in memory. No database, no network, no tokens, no key.
//
// The stub is installed BEFORE the dynamic import below on purpose: `new Anthropic()` captures
// globalThis.fetch at construction and getAnthropicClient() caches the client, so a stub swapped
// in afterwards is silently ignored — a harness written that way reported case A three times
// over and looked like it had tested three things.

process.env.ANTHROPIC_API_KEY = "sk-ant-ledger-gate-0000000000000000";

let calls = 0;
let seen: { in: number; out: number }[] = [];
let bodies: string[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: unknown, init: unknown) => {
  const target = String((url as { url?: string })?.url ?? url);
  if (!target.includes("anthropic")) return realFetch(url as RequestInfo, init as RequestInit);
  calls++;
  const usage = calls === 1
    ? { input_tokens: 1111, output_tokens: 2222, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
    : { input_tokens: 3333, output_tokens: 4444, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  seen.push({ in: usage.input_tokens, out: usage.output_tokens });
  return new Response(JSON.stringify({
    id: `msg_gate_${calls}`, type: "message", role: "assistant", model: "claude-sonnet-4-6",
    content: [{ type: "text", text: bodies[calls - 1] ?? bodies[bodies.length - 1] }],
    stop_reason: "end_turn", stop_sequence: null, usage,
  }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

const { prisma } = await import("../../src/lib/prisma");
const { evaluate } = await import("../../src/lib/ai/evaluate");

/* eslint-disable @typescript-eslint/no-explicit-any */
(prisma as any).user = {
  findUnique: async () => ({
    email: "gate@example.com",
    emailVerifiedAt: new Date("2026-01-01"),
    subscriptionStatus: "active",
    subscriptionCurrentPeriodEnd: new Date("2027-01-01"),
    compProUntil: new Date("2027-01-01"),
  }),
};
let rows: { inputTokens: number; outputTokens: number; success: boolean }[] = [];
(prisma as any).aICostLedger = { create: async (a: any) => { rows.push(a.data); return a.data; } };
/* eslint-enable @typescript-eslint/no-explicit-any */

const assessment = (inventedCount: boolean) => JSON.stringify({
  criteria: [{ criterion: "Coerenza", band: "RAGGIUNTO", points: null, comment: "Il testo e coerente." }],
  sectionScoreValue: 11,
  strengths: ["Registro adeguato."],
  improvements: ["Amplia il lessico."],
  // A word count the app never gave it — the cheapest way to make a guard trip and force the
  // retry. Which guard fires does not matter here; that they cause a SECOND CALL does.
  summary: inventedCount ? "Nel complesso un buon testo di 500 parole." : "Nel complesso un buon testo.",
});
const UNPARSEABLE = "Mi dispiace, ecco la valutazione: ...";

function arm(script: string[]) { calls = 0; seen = []; rows = []; bodies = script; }
const drive = (userId: string | null) => evaluate({
  userId, skill: "SCRITTA", exam: "CILS_STANDARD", level: "UNO",
  criteria: ["Coerenza"], task: "Scrivi un invito.", response: "Ciao Marco, ti invito sabato sera.",
  minWords: 60, maxWords: 120,
});
const billed = () => ({ in: seen.reduce((n, u) => n + u.in, 0), out: seen.reduce((n, u) => n + u.out, 0) });
const recorded = () => ({ in: rows.reduce((n, r) => n + r.inputTokens, 0), out: rows.reduce((n, r) => n + r.outputTokens, 0) });

console.log("\nE. EVERY PROVIDER CALL IS ACCOUNTED FOR (offline: stubbed fetch, stubbed till)");
console.log("   NOTE: two `[ai.evaluate] call failed: Failed to parse structured output` lines below");
console.log("   are EXPECTED — cases E2 and E3 feed the evaluator a deliberately unparseable body.");

// E0 — VALIDATE THE CHECKER BEFORE TRUSTING IT.
// The two accounting methods must be distinguishable on this fixture, or a green here proves
// nothing: if the sum and the last call happened to be equal, "sum == billed" would pass even
// on code that only ever records the last one.
arm([assessment(true), assessment(false)]);
await drive("gate-user");
const twoCalls = calls === 2;
ok(twoCalls, `the retry fixture did not produce two provider calls (got ${calls}) — the guard it relies on no longer trips, so this section is vacuous`);
const lastOnly = seen.length ? seen[seen.length - 1] : { in: 0, out: 0 };
ok(billed().in !== lastOnly.in && billed().out !== lastOnly.out,
   `control failed: summing every call gives the same numbers as taking only the last one, so this section cannot tell the two apart`);
console.log(`  ✓ control: ${calls} provider call(s); sum(in=${billed().in}) is distinguishable from last(in=${lastOnly.in})`);

// E1 — the retry that then succeeds.
ok(recorded().in === billed().in && recorded().out === billed().out,
   `retry-then-success: provider billed in=${billed().in}/out=${billed().out} but the ledger recorded in=${recorded().in}/out=${recorded().out} — /admin/costs would read QUIETLY LOW`);
console.log(`  ${recorded().in === billed().in ? "✓" : "✗"} retry then success: billed in=${billed().in}/out=${billed().out}, recorded in=${recorded().in}/out=${recorded().out}`);

// E2 — the retry whose response cannot be parsed. Both calls were served; both were billed.
arm([assessment(true), UNPARSEABLE]);
await drive("gate-user");
ok(recorded().in === billed().in && recorded().out === billed().out,
   `retry-unparseable: provider billed in=${billed().in}/out=${billed().out} but the ledger recorded in=${recorded().in}/out=${recorded().out}`);
console.log(`  ${recorded().in === billed().in ? "✓" : "✗"} retry unparseable: billed in=${billed().in}/out=${billed().out}, recorded in=${recorded().in}/out=${recorded().out}`);

// E3 — one call, unparseable. THIS IS THE PRODUCTION ROW.
arm([UNPARSEABLE]);
await drive("gate-user");
ok(recorded().in === billed().in && recorded().out === billed().out,
   `single-unparseable: provider billed in=${billed().in}/out=${billed().out} but the ledger recorded in=${recorded().in}/out=${recorded().out} — this is the shape of production row 2026-08-28T02:11`);
console.log(`  ${recorded().in === billed().in ? "✓" : "✗"} single unparseable: billed in=${billed().in}/out=${billed().out}, recorded in=${recorded().in}/out=${recorded().out}`);

// E4 — the other direction, which matters just as much: a path that spends NOTHING must still
// write nothing. A "fix" that recorded a row per attempt regardless would pass E1–E3 and be a
// different lie.
arm([assessment(false)]);
const refused = await drive(null);
ok(calls === 0 && rows.length === 0,
   `an entitlement refusal made ${calls} provider call(s) and wrote ${rows.length} ledger row(s) — a refusal spends nothing and must record nothing`);
ok(refused.ok === false, `an entitlement refusal returned ok — the guard is gone`);
console.log(`  ✓ entitlement refusal: 0 provider calls, 0 ledger rows, still refused`);

if (failures.length) {
  console.error("\n❌ AI LEDGER GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `\n✅ ai-ledger gate: ${entryPointsFound} provider entry point(s) in src/, each paired with its ` +
  `recorder; the till writes both billing shapes and records failures at zero; /admin/costs ` +
  `reads createdAt, not AlmiPrep's timestamp; and across 4 driven cases every token the provider ` +
  `billed appears in the ledger, while a refusal still writes nothing.`,
);
