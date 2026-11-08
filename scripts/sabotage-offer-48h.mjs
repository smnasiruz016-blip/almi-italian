// RR-397 · every free-48-hours proof must turn RED when broken, and GREEN when restored (each file restored byte-for-byte).
// Run: node scripts/sabotage-offer-48h.mjs   (needs the repo's deps for the tsx test)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const DIR = existsSync("src/lib/billing/stripe.ts") ? "src/lib/billing" : "src/lib";
const pick = (c) => c.find((p) => existsSync(p));
const PAGE = pick(["src/app/pricing/page.tsx", "src/app/(marketing)/pricing/page.tsx", "src/app/page.tsx"]);
const gate = () => spawnSync(process.execPath, ["scripts/gates/offer-48h.mjs"], { encoding: "utf8" });
const test = () => spawnSync(process.platform === "win32" ? "npx.cmd tsx scripts/verify-offer-48h.ts" : "npx tsx scripts/verify-offer-48h.ts", { encoding: "utf8", shell: true });
/* RR-399 A3: the template claim test and AlmiItalian's own door claim test */
const tsx = (f) => () => spawnSync(`${process.platform === "win32" ? "npx.cmd" : "npx"} tsx ${f}`, { encoding: "utf8", shell: true });
const claimTest = tsx("scripts/verify-free-ai-claim.ts"), evalClaimTest = tsx("scripts/verify-free-evaluation-claim.ts");
/* an AI route that uses the free AI door (found at run time) — the case removes the door from it.
   ALMIITALIAN: the door is checkAiEntitlement() (src/lib/ai/entitlement.ts), the product's own AI decision. */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
const walk = (d) => readdirSync(d).flatMap((n) => { const f = join(d, n); return statSync(f).isDirectory() ? walk(f) : /route\.ts$/.test(n) ? [f] : []; });
const AI_ROUTE = existsSync("src/app/api") ? walk("src/app/api").find((f) => /\bcheckAiEntitlement\(/.test(readFileSync(f, "utf8"))) : null;
const ENT = "src/lib/ai/entitlement.ts";
const CASES = [
  ...(AI_ROUTE ? [{ name: "an AI route skips the free door", file: AI_ROUTE, from: "checkAiEntitlement(", to: "checkAiEntitlementSkipped(", prepend: "const checkAiEntitlementSkipped = async (..._a: unknown[]) => null;\n", run: [gate], fail: ["[FAIL] every AI route goes through the free AI door"] }] : []),
  { name: "the AI door forgets today's free-AI budget", file: ENT, from: "budgetOk: freeAiBudgetOk,", to: "budgetOk: true,", run: [test], fail: ["FAIL AlmiItalian AI door: the daily budget stops free AI"] },
  { name: "the AI door asks the free 48 hours before hasPaidAccess()", file: ENT, from: "  if (hasPaidAccess(user)) {", to: "  if (isTasteActive(user) && hasPaidAccess(user) === false) return null; if (hasPaidAccess(user)) {", run: [gate, test], fail: ["[FAIL] the free AI door (decideAiEntitlement) asks hasPaidAccess() first", "FAIL AlmiItalian AI door: 1 Produzione scritta + 1 orale"] },
  { name: "the practice door stays open after 48 hours", file: "src/lib/section-access.ts", from: "if (isTasteActive(user)) return null;", to: "if (user.createdAt) return null;", run: [test], fail: ["FAIL AlmiItalian practice door"] },
  { name: "the free time becomes 72 hours", file: `${DIR}/offer.ts`, from: "export const TASTE_HOURS = 48;", to: "export const TASTE_HOURS = 72;", run: [gate, test], fail: ["[FAIL] the free time is 48 hours", "FAIL a new sign-up gets 48 hours"] },
  { name: "free AI is allowed twice", file: `${DIR}/taste.ts`, from: "TASTE_AI_LIMITS = { WRITING: 1, SPEAKING: 1 }", to: "TASTE_AI_LIMITS = { WRITING: 2, SPEAKING: 1 }", run: [gate, test], fail: ["[FAIL] free 48 hours start at sign-up", "FAIL AI is used once and then blocked"] },
  { name: "the daily cap is switched off", file: `${DIR}/free-ai-budget.ts`, from: "return spentUnitsToday < FREE_AI_DAILY_BUDGET_UNITS;", to: "return spentUnitsToday >= 0;", run: [test], fail: ["FAIL the daily free-AI cap stops free AI"] },
  { name: "the checkout gives a card trial again", file: `${DIR}/stripe.ts`, append: "\nexport const sabotageTrial = { trial_period_days: 2 };\n", run: [gate, test], fail: ["[FAIL] the checkout code names no trial", "FAIL checkout has no trial"] },
  { name: "the free time stops being free after 48 hours", file: `${DIR}/taste.ts`, from: "return end !== null && end.getTime() > now;", to: "return end !== null;", run: [test], fail: ["FAIL after 48 hours the unlock screen appears"] },
  { name: "a page sells a card trial again", file: PAGE, append: "\n// Card not charged during the 48-hour trial\n", run: [gate], fail: ["[FAIL] no customer-facing line"] },
  /* RR-399 A3: the atomic "1 free" */
  { name: "a second claim of the free use is let through", file: "src/lib/free-ai-claim.ts", from: 'if (isUniqueViolation(e)) return "USED";', to: 'if (isUniqueViolation(e)) return "RESERVED";', run: [claimTest, evalClaimTest], fail: ["FAIL two requests at the same moment", "FAIL two free Produzione scritta requests at the same moment"] },
  { name: "the free door stops reserving the free use", file: ENT, from: "await claimFreeAi(userId, FREE_KIND[skill], store)", to: '("UNAVAILABLE" as string)', run: [gate, evalClaimTest], fail: ["[FAIL] the free door reserves the free AI use atomically", "FAIL two free Produzione scritta requests at the same moment"] },
  { name: "the evaluator's second lock claims the free use again", file: ENT, from: "checkAiEntitlement(userId, skill, { claim: false })", to: "checkAiEntitlement(userId, skill)", run: [evalClaimTest], fail: ["FAIL the door claims ONLY when it grants"] },
  { name: "a failed scritta evaluation keeps the free use", file: "src/app/api/it/evaluate/scritta/route.ts", from: "return refuse({ ok: false, error: result.error }", to: "return NextResponse.json({ ok: false, error: result.error }", run: [evalClaimTest], fail: ["FAIL both evaluate routes give the free use back"] },
];
const out = [];
for (const c of CASES) {
  const raw = readFileSync(c.file, "utf8");
  if (c.from && !raw.includes(c.from)) throw new Error(`anchor missing: ${c.name}`);
  try {
    writeFileSync(c.file, c.append ? raw + c.append : (c.prepend ?? "") + raw.split(c.from).join(c.to));
    const res = c.run.map((r) => r());
    out.push({ name: c.name, red: res.every((r, i) => r.status !== 0 && (r.stdout + r.stderr).includes(c.fail[i])) });
  } finally { writeFileSync(c.file, raw); }
  if (readFileSync(c.file, "utf8") !== raw) throw new Error(`${c.file} NOT restored`);
}
const g = gate(), t = test();
for (const o of out) console.log(`  [${o.red ? "RED as required" : "STAYED GREEN — BLIND"}] ${o.name}`);
const c1 = claimTest(), c2 = evalClaimTest();
console.log(`  restored: gate ${g.status === 0 ? "GREEN" : "NOT GREEN"}, test ${t.status === 0 ? "GREEN" : "NOT GREEN"}, claim ${c1.status === 0 ? "GREEN" : "NOT GREEN"}, door claim ${c2.status === 0 ? "GREEN" : "NOT GREEN"}`);
const pass = out.every((o) => o.red) && g.status === 0 && t.status === 0 && c1.status === 0 && c2.status === 0;
console.log(pass ? `\nSABOTAGE PASS — ${out.length}/${out.length} RED` : "\nSABOTAGE FAIL");
process.exitCode = pass ? 0 : 1;
