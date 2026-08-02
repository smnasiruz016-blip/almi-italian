// Item-id gate — every bank item has a stable id, and no two share one.
//
// Run: npm run gate:item-id   (wired into `build`, so it blocks)
//
// ── WHY THIS GATE EXISTS ────────────────────────────────────────────────────
// Bank items had no id at all. The runner indexed them by array position, so there was nothing
// to name an item by and nothing to re-load one from — server-authoritative grading was not
// just absent, it was unwritable. src/lib/item-id.ts gives every item
// sha256({exam, level, section, title}), which is also the ItalianItem @@unique key, so one
// string identifies the item in the bundle and resolves the row in Neon.
//
// A collision is the failure mode worth blocking a build over. Two items with the same id means
// the seed merges them into one row, and the grader marks a learner's answers against whichever
// of the two it found first — a wrong mark that is indistinguishable from a right one, on an
// item that looks perfectly normal.
//
// ── THE GATE IS SHOWN RED BEFORE IT IS TRUSTED ──────────────────────────────
// A gate nobody has seen fail is a gate nobody has tested. Before checking the real bank this
// runs findIdCollisions() — the same pure function, not a re-implementation — over a synthetic
// pair that shares {exam, level, section, title}, and FAILS if that does not come back as a
// collision. So "0 collisions in the bank" means the detector works and found none, rather than
// a detector that cannot find anything.

import { BANK, type BankItem } from "../../src/lib/items";
import { stableItemId, findIdCollisions } from "../../src/lib/item-id";

let failed = false;
const fail = (msg: string) => { console.error(`  ✗ ${msg}`); failed = true; };

console.log("Item-id gate — stable ids, no collisions\n");

// ── 1. RED PROOF: the detector must catch a known duplicate ─────────────────
const synthetic: BankItem[] = [
  {
    exam: "CILS_B1C", level: "B1C", section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "GATE FIXTURE — duplicate title", payload: { questions: [] },
  } as unknown as BankItem,
  {
    // Same {exam, level, section, title}; a different payload, deliberately, because the id must
    // NOT depend on the payload — the bank is de-gamed at load, so a payload-derived id would
    // differ between the authored bank and the served one.
    exam: "CILS_B1C", level: "B1C", section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "GATE FIXTURE — duplicate title", payload: { questions: [{ q: "x", options: ["a", "b"], answerIndex: 0 }] },
  } as unknown as BankItem,
];
const redProof = findIdCollisions(synthetic);
if (redProof.length === 0) {
  fail("RED PROOF FAILED — findIdCollisions() did not flag two items sharing {exam, level, section, title}. The detector is blind; every result below is meaningless.");
} else {
  console.log(`  ✓ RED proof: detector caught the synthetic duplicate (${redProof.length} collision reported)`);
}
if (stableItemId(synthetic[0]) !== stableItemId(synthetic[1])) {
  fail("RED PROOF FAILED — two items with identical {exam, level, section, title} hashed differently. The id is reading something it should not.");
} else {
  console.log("  ✓ RED proof: the id ignores payload and difficulty, as it must");
}

// ── 2. Every item produces a non-empty id ───────────────────────────────────
let missing = 0;
for (const it of BANK) {
  const id = stableItemId(it);
  if (!id || id.length !== 16) {
    fail(`"${it.exam} | ${it.level} | ${it.section} | ${it.title}" produced id ${JSON.stringify(id)} — expected 16 hex chars`);
    missing++;
  }
}
if (missing === 0) console.log(`  ✓ ${BANK.length} item(s) each carry a 16-char stable id`);

// ── 3. No collisions in the real bank ───────────────────────────────────────
const collisions = findIdCollisions(BANK);
if (collisions.length > 0) {
  for (const c of collisions) fail(c);
} else {
  console.log(`  ✓ ${new Set(BANK.map(stableItemId)).size} distinct id(s) across ${BANK.length} item(s) — no collisions`);
}

// ── 4. Ids resolve — round-trip every item through the server-side loader ───
// Checks the thing the grader actually does, not just that the strings differ. An id that is
// unique but does not resolve would fail every submission with a 404.
const { getItemByStableId } = await import("../../src/lib/item-id");
let unresolved = 0;
for (const it of BANK) {
  const back = getItemByStableId(stableItemId(it));
  if (!back || back.title !== it.title || back.section !== it.section) {
    fail(`id for "${it.title}" (${it.exam}/${it.level}/${it.section}) did not round-trip through getItemByStableId`);
    unresolved++;
  }
}
if (unresolved === 0) console.log(`  ✓ every id round-trips: getItemByStableId returns the same item`);

console.log("");
if (failed) {
  console.error("Item-id gate FAILED\n");
  process.exit(1);
}
console.log("Item-id gate passed\n");
