// Bank gate — Rule #7 (>=15 items per module) AND the CELI part flag.
//
// Run: npm run gate:bank   (wired into `build`, so it blocks)
//
// Both checks live here because both derive from the same source: TRACKS. Splitting
// them would mean two files walking the same registry and drifting apart.
//
// ---------------------------------------------------------------------------
// 1. RULE #7 — every exam-level-section module carries at least 15 items.
//
// The rule was family policy and was enforced by nobody. This bank sat at 100 items
// with all 18 modules under the line - Writing and Speaking at 4 apiece on three of
// the four tracks - and that survived a scoring rebuild, an SEO pass and a live
// launch without anyone noticing.
//
// It is wired LAST, after the content batches, on purpose. Wired earlier it would
// have failed on 18 of 18 modules, and the only route to a green build would have
// been to weaken the gate. A gate introduced against a red tree gets negotiated
// down; against a green tree it only ever has to hold the line.
//
// MODULES ARE ENUMERATED FROM THE REGISTRY, NOT FROM THE DATA. A gate that counts
// what it finds cannot see what is missing: a module whose items stopped loading
// simply vanishes from the counts and the gate passes with a smile. TRACKS says
// which modules must exist; this checks each one.
//
// AN EMPTY MODULE FAILS, and is reported separately. AlmiSwiss skips modules at 0,
// reasoning "empty is honest, half-full is not" - true while a bank is being
// written, false here. Every module is populated, so 0 no longer means "not written
// yet": it means the bundle is not loading, or the registry and the item data have
// drifted apart on an exam, level or section key.
//
// ---------------------------------------------------------------------------
// 2. THE CELI PART FLAG — ORALE means ORAL, every other section means WRITTEN.
//
// This is the check with no other line of defence. CELI is scored BY PART, not by
// section: an ORALE item tagged WRITTEN is graded into the written minimum, and a
// candidate clears or misses a threshold on the strength of a field nobody reads.
//
// Nothing else in this repo can see it. The per-section counts can't - the item sits
// exactly where it belongs and is counted there. The scoring selftest can't - it
// tests the engine, not the bank. tsc can't - "WRITTEN" and "ORAL" are both valid
// values of the same union. It shows up only in a score, which is the worst place to
// find a bug and the last place anyone looks.
//
// CILS items carry no part - the CILS engines score by section - so they are
// checked for the opposite: that the field is absent rather than quietly wrong.

import { TRACKS } from "../../src/lib/practice";
import { itemsFor } from "../../src/lib/items";

const MIN_ITEMS_PER_MODULE = 15;

const shortfalls: string[] = [];
const empties: string[] = [];
const partErrors: string[] = [];
let modules = 0;
let total = 0;

console.log(`Bank gate — Rule #7 (>=${MIN_ITEMS_PER_MODULE}/module) + CELI part flag\n`);

for (const track of TRACKS) {
  const cells = track.sections.map((section) => {
    const items = itemsFor(track.exam, track.level, section.code);
    const n = items.length;
    modules++;
    total += n;

    if (n === 0) empties.push(`${track.slug} ${section.code}`);
    else if (n < MIN_ITEMS_PER_MODULE) {
      shortfalls.push(`${track.slug} ${section.code}: ${n}/${MIN_ITEMS_PER_MODULE}`);
    }

    // The part flag, derived from the registry rather than from the item.
    const wantsPart = track.exam === "CELI";
    const expected = section.code === "ORALE" ? "ORAL" : "WRITTEN";
    for (const item of items) {
      const got = (item.payload as { part?: string }).part;
      if (wantsPart && got !== expected) {
        partErrors.push(
          `${track.slug} ${section.code} — "${item.title}": part=${got ?? "(missing)"}, expected ${expected}`,
        );
      } else if (!wantsPart && got !== undefined) {
        partErrors.push(
          `${track.slug} ${section.code} — "${item.title}": part=${got} on a CILS item, which is scored by section`,
        );
      }
    }

    const mark = n === 0 ? "!!" : n < MIN_ITEMS_PER_MODULE ? " <" : "  ";
    return `${section.code.toLowerCase().padEnd(8)}${String(n).padStart(2)}${mark}`;
  });
  console.log(`  ${track.slug.padEnd(18)} ${cells.join("  ")}`);
}

console.log(`\n  ${modules} modules, ${total} items\n`);

if (empties.length > 0) {
  console.error("❌ Rule #7: module(s) with ZERO items.\n");
  for (const e of empties) console.error(`     ${e}`);
  console.error(
    "\n  Zero does not mean 'not written yet' — every module in this bank is\n" +
      "  populated. It means the items are not loading, or TRACKS and the item data\n" +
      "  disagree on an exam, level or section key. Check src/lib/practice.ts against\n" +
      "  scripts/seed/batch1/*.ts before adding anything.\n",
  );
}

if (shortfalls.length > 0) {
  console.error("❌ Rule #7: module(s) below the minimum.\n");
  for (const s of shortfalls) console.error(`     ${s}`);
  console.error(
    "\n  Every module ships at least 15 original items. Top up the module rather than\n" +
      "  lowering the threshold.\n",
  );
}

if (partErrors.length > 0) {
  console.error("❌ CELI part flag wrong or missing.\n");
  for (const p of partErrors) console.error(`     ${p}`);
  console.error(
    "\n  CELI is scored BY PART, not by section. An ORALE item tagged WRITTEN is\n" +
      "  graded into the written minimum, and a candidate clears or misses a threshold\n" +
      "  on a field nobody reads. Nothing else in this repo catches it: the counts see\n" +
      "  the item in the right place, and tsc sees a valid union member.\n",
  );
}

if (empties.length > 0 || shortfalls.length > 0 || partErrors.length > 0) process.exit(1);

console.log(
  `✅ Bank gate: all ${modules} modules at ${MIN_ITEMS_PER_MODULE}+ items; CELI part flags correct.`,
);
