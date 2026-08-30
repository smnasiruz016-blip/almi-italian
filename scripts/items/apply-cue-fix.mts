// One-shot authoring patch: lengthen one distractor per item so the answer key stops being
// distinctively the longest option.
//
// Run: npx tsx scripts/items/apply-cue-fix.mts   (then: npx tsx scripts/seed/_gen_bank_json.mjs)
//
// ── WHY A SCRIPT AND NOT 92 HAND EDITS ──────────────────────────────────────
// The edits themselves are authoring — each replacement is a distractor written by hand, chosen
// to stay clearly wrong against its own passage or audio script, and they live in cue-fix.json
// where they can be read and argued with. What this script contributes is not the wording but
// the ANCHORING: 92 hand edits across four seed files is 92 chances to change the right string
// in the wrong item, and the ones that go wrong look exactly like the ones that go right.
//
// So every replacement is scoped to its own item's object literal, located by title, and the old
// string must occur EXACTLY ONCE inside it. Zero matches or two matches is a hard failure with
// nothing written — never a silent skip, and never a "closest match". A patch that half-applied
// would leave the bank in a state no one measured.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SEED_DIR = join(process.cwd(), "scripts/seed/batch1");
const FILES = ["cils-b1c.ts", "cils-uno.ts", "cils-due.ts", "celi-due.ts"];
// ── ONE-SHOT, AND THAT IS THE POINT ─────────────────────────────────────────
// Every entry in a table is spent the moment it is applied: the old string is gone, so a
// re-run finds it 0 times and the script exits 1 having written nothing. That was verified,
// not assumed — re-running the original table reports "cue-fix: 0 of 92" and refuses.
//
// So a later round of cue work gets its OWN table rather than editing the spent one, and this
// script takes the table as an argument. cue-fix.json stays exactly as it was: it is the record
// of what was changed in the de-game pass, and rewriting it would erase that.
//
//   npx tsx scripts/items/apply-cue-fix.mts scripts/items/cue-fix-analisi.json
const TABLE = process.argv[2] ?? "scripts/items/cue-fix.json";
const table: [string, string, string][] = JSON.parse(
  readFileSync(join(process.cwd(), TABLE), "utf8"),
);

const sources = new Map(FILES.map((f) => [f, readFileSync(join(SEED_DIR, f), "utf8")]));

/** The source span of the item whose `title:` is `title`, from that title to the start of the
 *  next one (or end of file). Crude by design: an item's own options are the only strings
 *  between its title and the next, which is exactly the scope we want. */
function itemSpan(src: string, title: string): [number, number] | null {
  const needle = `title: ${JSON.stringify(title)}`;
  const start = src.indexOf(needle);
  if (start < 0) return null;
  const next = src.indexOf("title: ", start + needle.length);
  return [start, next < 0 ? src.length : next];
}

let applied = 0;
const problems: string[] = [];

for (const [title, oldText, newText] of table) {
  let hits = 0;
  for (const [file, src] of sources) {
    const span = itemSpan(src, title);
    if (!span) continue;
    hits++;
    const [from, to] = span;
    const block = src.slice(from, to);
    const oldLit = JSON.stringify(oldText);
    const newLit = JSON.stringify(newText);
    const occurrences = block.split(oldLit).length - 1;
    if (occurrences !== 1) {
      problems.push(`"${title}": option ${oldLit} occurs ${occurrences}× in its item block (need exactly 1) — not applied`);
      continue;
    }
    sources.set(file, src.slice(0, from) + block.replace(oldLit, newLit) + src.slice(to));
    applied++;
  }
  if (hits === 0) problems.push(`"${title}": no item with this title in any seed file`);
  if (hits > 1) problems.push(`"${title}": ${hits} items share this title — ambiguous, not applied`);
}

console.log(`${TABLE}: ${applied} of ${table.length} replacement(s) applied`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s) — NOTHING WRITTEN:`);
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}

for (const [file, src] of sources) writeFileSync(join(SEED_DIR, file), src, "utf8");
console.log("seed files written — now run: npx tsx scripts/seed/_gen_bank_json.mjs");
