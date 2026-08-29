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

if (failures.length) {
  console.error("\n❌ AI LEDGER GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `✅ ai-ledger gate: ${entryPointsFound} provider entry point(s) in src/, each paired with its ` +
  `recorder; the till writes both billing shapes and records failures at zero; /admin/costs ` +
  `reads createdAt, not AlmiPrep's timestamp.`,
);
