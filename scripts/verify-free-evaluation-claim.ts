// RR-399 A3 · AlmiItalian's own door: when decideAiEntitlement GRANTS a free-48-hours evaluation, checkAiEntitlement reserves it
// atomically (reserveFreeEvaluation → claimFreeAi, unique userId + kind). Of two requests at the same moment only ONE gets the free
// Produzione scritta; the other gets the same 402 "free-used" answer as the count. A failed evaluation gives it back.
// Pure: a fake store with the database's unique rule, plus source checks of the wiring. No DB, no AI, no secrets.
// Run: npx tsx scripts/verify-free-evaluation-claim.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
let failed = 0;
const t = async (name: string, fn: () => unknown) => { try { await fn(); console.log(`  PASS ${name}`); } catch (e) { failed++; console.log(`  FAIL ${name}\n       ${(e as Error).message.split("\n")[0]}`); } };
const strip = (s: string) => s.replace(/\r/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

function uniqueStore() {
  const rows = new Set<string>();
  return {
    rows,
    freeAiUse: {
      async create({ data }: { data: { userId: string; kind: string } }) {
        await new Promise((r) => setTimeout(r, Math.random() * 5));
        const k = `${data.userId}|${data.kind}`;
        if (rows.has(k)) throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        rows.add(k);
        return data;
      },
      async deleteMany({ where }: { where: { userId: string; kind: string } }) { rows.delete(`${where.userId}|${where.kind}`); return { count: 1 }; },
    },
  };
}
const missingTable = { freeAiUse: { async create() { throw Object.assign(new Error("no table"), { code: "P2021" }); }, async deleteMany() { throw new Error("no table"); } } };

(async () => {
  const ent = await import(pathToFileURL(join(ROOT, "src/lib/ai/entitlement.ts")).href);
  await t("two free Produzione scritta requests at the same moment: ONE is allowed, the other is refused 402 free-used", async () => {
    const s = uniqueStore();
    const r = await Promise.all([ent.reserveFreeEvaluation("u1", "SCRITTA", s), ent.reserveFreeEvaluation("u1", "SCRITTA", s)]);
    assert.equal(r.filter((x: unknown) => x === null).length, 1);
    const refused = r.find((x: unknown) => x !== null) as { status: number; reason: string; error: string };
    assert.equal(refused.status, 402);
    assert.equal(refused.reason, "free-used");
    assert.match(refused.error, /Your free 48 hours include 1 AI-assessed Produzione scritta, and you have used it/);
  });
  await t("ten Produzione orale requests at once: still exactly one", async () => {
    const s = uniqueStore();
    const r = await Promise.all(Array.from({ length: 10 }, () => ent.reserveFreeEvaluation("u2", "ORALE", s)));
    assert.equal(r.filter((x: unknown) => x === null).length, 1);
  });
  await t("scritta and orale are separate free uses (WRITING / SPEAKING)", async () => {
    const s = uniqueStore();
    assert.equal(await ent.reserveFreeEvaluation("u3", "SCRITTA", s), null);
    assert.equal(await ent.reserveFreeEvaluation("u3", "ORALE", s), null);
    assert.deepEqual([...s.rows].sort(), ["u3|SPEAKING", "u3|WRITING"]);
  });
  await t("a failed evaluation gives the free use back", async () => {
    const s = uniqueStore();
    assert.equal(await ent.reserveFreeEvaluation("u4", "SCRITTA", s), null);
    await ent.releaseFreeEvaluation("u4", "SCRITTA", s);
    assert.equal(await ent.reserveFreeEvaluation("u4", "SCRITTA", s), null);
  });
  await t("before the migration (no table): allowed, the count decision stands and nothing breaks", async () => {
    assert.equal(await ent.reserveFreeEvaluation("u5", "SCRITTA", missingTable), null);
    await ent.releaseFreeEvaluation("u5", "SCRITTA", missingTable);
  });
  await t("the door claims ONLY when it grants a free evaluation, and the evaluator's second lock never claims again", () => {
    const src = strip(readFileSync(join(ROOT, "src/lib/ai/entitlement.ts"), "utf8"));
    const check = src.slice(src.indexOf("export async function checkAiEntitlement"), src.indexOf("export async function refuseUnlessEntitled"));
    assert.match(check, /if \(decision === null && freeTime && opts\.claim !== false\) return reserveFreeEvaluation\(userId, skill\);/);
    assert.ok(check.indexOf("reserveFreeEvaluation(") > check.indexOf("decideAiEntitlement("), "the claim must come after the decision");
    const second = src.slice(src.indexOf("export async function refuseUnlessEntitled"));
    assert.match(second, /checkAiEntitlement\(userId, skill, \{ claim: false \}\)/);
  });
  await t("both evaluate routes give the free use back on every answer that is not an estimate", () => {
    for (const [route, skill] of [["scritta", "SCRITTA"], ["orale", "ORALE"]]) {
      const src = strip(readFileSync(join(ROOT, `src/app/api/it/evaluate/${route}/route.ts`), "utf8"));
      assert.match(src, new RegExp(`releaseFreeEvaluation\\(user\\.id, "${skill}"\\)`), `${route}: no release`);
      const after = src.slice(src.indexOf("const release ="));
      const last = after.lastIndexOf("return NextResponse.json(");
      const plain = (after.slice(0, last).match(/return NextResponse\.json\(/g) ?? []).length;
      assert.equal(plain, 1, `${route}: an error answer after the door returns without giving the free use back`); // the one inside refuse()
      assert.match(after, /\.catch\(async \(e: unknown\) => \{\s*await release\(\);/, `${route}: a thrown AI call does not give it back`);
    }
  });
  console.log(failed ? `\nFREE EVALUATION CLAIM TEST FAIL (${failed})` : "\nFREE EVALUATION CLAIM TEST PASS");
  process.exitCode = failed ? 1 : 0;
})();
