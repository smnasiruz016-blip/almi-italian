// Regenerate src/data/items-batch1.json — the bundle the product actually serves — from the
// authored seed files in scripts/seed/batch1/.
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  🔴 THIS SCRIPT IS CURRENTLY BLOCKED. DO NOT REMOVE THE GUARD BELOW.      ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// ── WHY, AND WHY IT IS NOT JUST DELETED ────────────────────────────────────
// The seed is STALE and the bundle is CORRECT. That is the wrong way round from what this
// script assumes, so running it does not "rebuild" the bundle — it OVERWRITES the shipped bank
// with older content and reintroduces two defects that were found, fixed and gated:
//
//   · 15 CILS_B1C writing items go back to 40-80 / 50-90 / 60-100 word windows.
//     PR #38 moved them to 80-120 because Unistrasi publishes "Prova a tema (80 - 120
//     parole)", and a learner trained to 40-80 is trained to fail. scripts/gates/token-gate.mts
//     asserts 80-120 and goes RED on the regenerated bundle.
//
//   · One ASCOLTO audio script loses the Italian dialogue dashes that mark its speaker turns.
//     PR #39 added them so the renderer gives each turn its own voice instead of reading the
//     whole conversation as one narrator. scripts/gates/ascolto-audio-gate.mts goes RED on the
//     regenerated bundle: "manifest records 4 segment(s) but the plan produces 1".
//
// Measured, not argued: with the regenerated bundle in place, gate:token:full and
// gate:ascolto-audio both fail, while validate:batch1 and gate:bank stay green — because those
// two read the SEED, not the bundle. That asymmetry is exactly how the drift survived: nothing
// in the build compares the two.
//
// The full inventory of what differs, item by item, is docs/seed-bundle-drift.md.
//
// ── WHY THE SCRIPT SURVIVES ────────────────────────────────────────────────
// Deleting it would remove the only path back. The seed SHOULD become the source of truth
// again; it just has to be brought up to the bundle first (or the bundle's values consciously
// rejected, which is a content decision, not a tooling one). When that happens this guard
// retires itself: it computes the drift live, so a synced seed means zero drift means the
// script runs with no flag at all. It cannot go stale, and nobody has to remember to remove it.
//
// ── IF YOU ARE HERE TO "CLEAN THIS UP" ─────────────────────────────────────
// The cleanup is to sync scripts/seed/batch1/ with the bundle. It is not to delete these lines.
// scripts/gates/seed-bundle-gate.mts asserts that this guard is still here and still refuses.

import { BATCH1_ITEMS } from "./batch1/index.ts";
import { writeFileSync, readFileSync } from "node:fs";

const BUNDLE = new URL("../../src/data/items-batch1.json", import.meta.url);
const OVERRIDE = "ALMI_REGENERATE_BANK";
const OVERRIDE_VALUE = "i-have-synced-the-seed";

/** Items that differ between the authored seed and the shipped bundle, computed now rather
 *  than hardcoded, so this guard is never a stale number. */
export function bankDrift() {
  let bundle;
  try {
    bundle = JSON.parse(readFileSync(BUNDLE, "utf8"));
  } catch {
    return null; // no bundle yet: nothing to protect, let the generator create it
  }
  const key = (i) => `${i.exam}|${i.level}|${i.section}|${i.title}`;
  const shipped = new Map(bundle.map((i) => [key(i), i]));
  const drift = [];
  for (const s of BATCH1_ITEMS) {
    const b = shipped.get(key(s));
    if (!b) { drift.push({ key: key(s), fields: ["MISSING FROM BUNDLE"] }); continue; }
    if (JSON.stringify(s) === JSON.stringify(b)) continue;
    const sp = s.payload ?? {}, bp = b.payload ?? {};
    const fields = [...new Set([...Object.keys(sp), ...Object.keys(bp)])]
      .filter((f) => JSON.stringify(sp[f]) !== JSON.stringify(bp[f]));
    for (const f of new Set([...Object.keys(s), ...Object.keys(b)])) {
      if (f !== "payload" && JSON.stringify(s[f]) !== JSON.stringify(b[f])) fields.push(f);
    }
    drift.push({ key: key(s), fields });
  }
  for (const b of bundle) if (!BATCH1_ITEMS.some((s) => key(s) === key(b))) drift.push({ key: key(b), fields: ["ONLY IN BUNDLE"] });
  return drift;
}

const drift = bankDrift();
if (drift && drift.length > 0 && process.env[OVERRIDE] !== OVERRIDE_VALUE) {
  console.error("");
  console.error("🔴 REFUSING TO REGENERATE — the seed is stale and the bundle is what ships.");
  console.error("");
  console.error(`   ${drift.length} item(s) differ between scripts/seed/batch1/ and src/data/items-batch1.json.`);
  console.error("   Running this script would overwrite the shipped bank with the older seed and");
  console.error("   reintroduce two fixed, gated defects:");
  console.error("     · 15 CILS_B1C writing items would revert to pre-#38 word windows (40-80 etc.);");
  console.error("       Unistrasi publishes 80-120 and gate:token:full asserts it.");
  console.error("     · one ASCOLTO script would lose the dialogue dashes added in #39, so the");
  console.error("       renderer reads four speakers as one; gate:ascolto-audio asserts it.");
  console.error("");
  console.error("   The item-by-item inventory is in docs/seed-bundle-drift.md.");
  console.error("");
  console.error("   THE FIX IS TO SYNC THE SEED, not to bypass this. Once the seed matches the");
  console.error("   bundle the drift is zero and this guard lets the script run with no flag.");
  console.error("");
  console.error(`   If you have already synced the seed and mean it, set ${OVERRIDE}=${OVERRIDE_VALUE}`);
  console.error("");
  console.error("   Differing items:");
  for (const d of drift) console.error(`     ${d.key}  [${d.fields.join(", ")}]`);
  console.error("");
  process.exit(1);
}

if (drift && drift.length > 0) {
  console.warn(`⚠️  ${OVERRIDE} set — regenerating over ${drift.length} drifting item(s). You said you meant it.`);
}

writeFileSync(BUNDLE, JSON.stringify(BATCH1_ITEMS, null, 0));
const key = (i) => `${i.exam} | ${i.level} | ${i.section} | part=${i.payload?.part ?? "-"} | ${i.taskType}`;
const m = new Map();
for (const i of BATCH1_ITEMS) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
console.log("TOTAL", BATCH1_ITEMS.length);
for (const [k, v] of [...m.entries()].sort()) console.log(`${String(v).padStart(3)}  ${k}`);
