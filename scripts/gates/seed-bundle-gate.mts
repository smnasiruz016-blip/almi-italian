// SEED / BUNDLE GATE — the authored source and the shipped bundle say the same thing.
//
// Run: npm run gate:seed-bundle   (wired into `build`, so it blocks)
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// src/data/items-batch1.json is what the product serves. scripts/seed/batch1/ is what authors
// read. scripts/seed/_gen_bank_json.mjs turns the second into the first — and until this gate,
// nothing in the build compared them. So they drifted: two fixes landed on the bundle (#38's
// 80-120 word windows, #39's dialogue dashes) and never reached the seed, and running the
// generator would silently have reverted both.
//
// Every content gate in this repo was pointed at ONE side. validate:batch1 and gate:bank read
// the seed; gate:token:full and gate:ascolto-audio read the bundle. All four were green while
// the two disagreed on sixteen items. A gap between two checked things is not checked by
// checking each of them harder.
//
// ── REWRITTEN AFTER THE SYNC (PR-E) ─────────────────────────────────────────
// This gate used to FREEZE a known disagreement: a KNOWN_DRIFT list of sixteen ids that had to
// match the live drift exactly. That was the right shape while the two sides disagreed and the
// decision about which was correct had not been made.
//
// The decision was made and the seed was synced to the bundle, so the list is empty and the
// gate asserts something stronger and simpler in its place: RUN THE GENERATOR AND THE BUNDLE
// MUST COME BACK BYTE-FOR-BYTE. That is not a claim about a list somebody maintains; it is the
// actual round trip, executed. If any item drifts again in either direction, the bytes change
// and this goes red.
//
// The guard inside the generator is now dormant BY DESIGN — it computes the drift live and
// refuses only when there is drift. Proving it still refuses therefore means creating drift,
// which a gate must not do to the working tree. That half is proven by the sabotage run
// recorded in the PR, not here.

import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BATCH1_ITEMS } from "../seed/batch1/index";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BUNDLE = join(ROOT, "src", "data", "items-batch1.json");
const GENERATOR = "scripts/seed/_gen_bank_json.mjs";
const DOC = "docs/seed-bundle-drift.md";

const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };
const sha = (p: string) => createHash("sha256").update(readFileSync(p)).digest("hex");

console.log("SEED / BUNDLE GATE — the authored source and the shipped bundle agree\n");

// ── THE POPULATION, COUNTED FIRST ──────────────────────────────────────────
const seed = BATCH1_ITEMS as unknown as Record<string, unknown>[];
const bundle = JSON.parse(readFileSync(BUNDLE, "utf8")) as Record<string, unknown>[];
const key = (i: Record<string, unknown>) => `${i.exam}|${i.level}|${i.section}|${i.title}`;

console.log("population");
console.log(`  authored seed items : ${seed.length}`);
console.log(`  shipped bundle items: ${bundle.length}`);
ok(seed.length > 200, `only ${seed.length} seed item(s) — the import is not reaching the bank`);
ok(bundle.length > 200, `only ${bundle.length} bundle item(s) — the bundle is not being read`);
ok(seed.length === bundle.length, `the seed has ${seed.length} items and the bundle has ${bundle.length}`);

// ── A. NOTHING DRIFTS ──────────────────────────────────────────────────────
const shipped = new Map(bundle.map((i) => [key(i), i]));
const drift: { key: string; fields: string[] }[] = [];
for (const s of seed) {
  const b = shipped.get(key(s));
  if (!b) { drift.push({ key: key(s), fields: ["MISSING FROM BUNDLE"] }); continue; }
  if (JSON.stringify(s) === JSON.stringify(b)) continue;
  const sp = (s.payload ?? {}) as Record<string, unknown>;
  const bp = (b.payload ?? {}) as Record<string, unknown>;
  const fields = [...new Set([...Object.keys(sp), ...Object.keys(bp)])].filter((f) => JSON.stringify(sp[f]) !== JSON.stringify(bp[f]));
  for (const f of new Set([...Object.keys(s), ...Object.keys(b)])) {
    if (f !== "payload" && JSON.stringify(s[f]) !== JSON.stringify(b[f])) fields.push(f);
  }
  drift.push({ key: key(s), fields });
}
for (const b of bundle) if (!seed.some((s) => key(s) === key(b))) drift.push({ key: key(b), fields: ["ONLY IN BUNDLE"] });

console.log(`\nA. no item differs between the seed and the bundle`);
for (const d of drift) {
  failures.push(
    `${d.key} differs on [${d.fields.join(", ")}]. The seed and the bundle were edited apart. ` +
    `The bundle is what ships, so a change made only to the seed does not reach a learner and a ` +
    `change made only to the bundle is lost the next time the generator runs. Change BOTH, or ` +
    `change the seed and regenerate.`,
  );
}
console.log(`  ${drift.length === 0 ? "✓" : "✗"} ${drift.length} drifting item(s) across ${seed.length}`);

// ── B. THE ROUND TRIP, EXECUTED ────────────────────────────────────────────
// The strongest form of "they agree": generate the bundle from the seed and compare the bytes.
// A field-by-field comparison can be fooled by a field nobody thought to compare; this cannot.
console.log("\nB. the generator reproduces the shipped bundle byte-for-byte");
{
  const before = sha(BUNDLE);
  const bak = join(ROOT, ".seed-bundle-gate.bak");
  copyFileSync(BUNDLE, bak);
  let code = 0, out = "";
  try {
    execSync(`npx tsx ${GENERATOR}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    code = err.status ?? 1;
    out = (err.stdout ?? "") + (err.stderr ?? "");
  }
  const after = sha(BUNDLE);
  // Restore FIRST, whatever happened, so a failing assertion can never leave a rewritten bundle.
  copyFileSync(bak, BUNDLE);
  if (existsSync(bak)) { try { unlinkSync(bak); } catch { /* best effort */ } }

  ok(code === 0,
     `${GENERATOR} exited ${code} with no drift to refuse. Its guard only fires when the seed and ` +
     `the bundle disagree, so a refusal here means either drift this gate did not see, or the ` +
     `guard has stopped computing the drift and started refusing unconditionally. Output: ` +
     `${out.split("\n").filter(Boolean).slice(0, 2).join(" / ").slice(0, 200)}`);
  ok(after === before,
     `regenerating the bundle from the seed produced DIFFERENT bytes. The two sides disagree in a ` +
     `way the field comparison above did not catch — compare the files directly.`);
  console.log(`  ${after === before && code === 0 ? "✓" : "✗"} generator exits ${code}; bundle sha256 unchanged`);

  // The control. If the bundle were rewritten to something wrong, would this notice? Prove the
  // comparison can tell two different byte strings apart before trusting that it matched.
  const fake = createHash("sha256").update(readFileSync(BUNDLE) + " ").digest("hex");
  ok(fake !== before, "control: the hash cannot distinguish the bundle from the bundle plus a byte");
  console.log(`  ✓ control: the byte comparison distinguishes a one-character difference`);
}

// ── C. THE GUARD IS STILL THERE, DORMANT ───────────────────────────────────
// It must not be deleted just because it is currently quiet. The day the seed and the bundle
// come apart again is the day it has to speak.
console.log("\nC. the generator's guard survives, dormant");
{
  // Comments stripped BEFORE scanning, and every check tied to the statement it is about.
  //
  // The first version of this section asked whether the string "drift && drift.length > 0"
  // appeared ANYWHERE in the generator. It appears TWICE — once in the refusal and once in the
  // warn-on-override branch below it — so the sabotage that replaced the REFUSAL's condition
  // with `if (false)` left the second copy standing and this gate stayed GREEN. The sabotage
  // run caught that; nothing else would have. A check that names a string is satisfied by any
  // occurrence of that string, including one in a branch that only prints.
  const rawGen = readFileSync(join(ROOT, GENERATOR), "utf8");
  const gen = rawGen.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n");
  ok(/export function bankDrift\(\)/.test(gen), `${GENERATOR}: the live drift computation is gone`);
  ok(/REFUSING TO REGENERATE/.test(gen), `${GENERATOR}: the refusal path has been removed. It is dormant, not unnecessary — the drift it guards against is what this whole gate exists for.`);
  ok(/ALMI_REGENERATE_BANK/.test(gen), `${GENERATOR}: the override is gone`);
  // The conditional AND the refusal it opens, matched as ONE thing. This is the assertion the
  // string-anywhere version could not make: the block that prints the refusal must be the block
  // guarded by live drift and the override. `if (false)` does not match it. Neither does a warn
  // branch that tests the drift but refuses nothing.
  ok(/if \(\s*drift && drift\.length > 0\s*&&[^)]*OVERRIDE[^)]*\)\s*\{[\s\S]{0,400}?REFUSING TO REGENERATE/.test(gen),
     `${GENERATOR}: the refusal is no longer opened by a conditional on LIVE drift and the ` +
     `override. Either it refuses unconditionally or it never refuses at all, and both are wrong — ` +
     `this guard has to be dormant, not absent. Testing the drift somewhere in the file is not ` +
     `enough: the branch that tests it must be the branch that refuses.`);
  ok(/REFUSING TO REGENERATE[\s\S]{0,4000}?process\.exit\(1\)/.test(gen),
     `${GENERATOR}: the refusal prints and then carries on regenerating — it no longer exits ` +
     `non-zero, so it is a message, not a guard`);
  console.log(`  ✓ bankDrift(), and a refusal opened by live drift that exits non-zero`);
}

// ── D. THE RECORD SAYS WHAT HAPPENED ───────────────────────────────────────
console.log("\nD. the written record is current");
{
  const path = join(ROOT, "docs", "seed-bundle-drift.md");
  ok(existsSync(path), `${DOC} is missing — the history of this drift has no record`);
  if (existsSync(path)) {
    const doc = readFileSync(path, "utf8");
    ok(/RESOLVED/.test(doc), `${DOC} does not record that the drift was resolved — a reader would still think 16 items disagree`);
    console.log(`  ✓ ${DOC} records the resolution`);
  }
}

if (failures.length) {
  console.error("\n❌ SEED / BUNDLE GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures.slice(0, 10)) console.error("   • " + f);
  if (failures.length > 10) console.error(`   … and ${failures.length - 10} more`);
  process.exit(1);
}
console.log(
  `\n✅ seed-bundle gate: ${seed.length} authored and ${bundle.length} shipped items agree on every ` +
  `field, and regenerating from the seed reproduces the shipped bundle byte-for-byte. The ` +
  `generator's guard is present and dormant, which is what zero drift is supposed to look like.`,
);
