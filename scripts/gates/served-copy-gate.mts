// SERVED COPY GATE — no page may still promise free practice.
//
// Run: npm run gate:served-copy   (wired into `build`, AFTER `next build`, so it blocks)
//
// ── WHY THIS READS BUILD OUTPUT AND NOT src/ ────────────────────────────────
// A source grep answers "what did we write". This has to answer "what does a reader SEE",
// and those came apart in this repo before: PR #63 exists because Turbopack ate a space that
// the source clearly contained, so the served page said something the source did not. The
// same gap runs the other way — copy can survive into a bundle from a branch, a cached
// chunk, or a component nobody thought was still rendered. So this gate runs after
// `next build` and reads `.next`.
//
// It reads .html (prerendered), .rsc (the flight payload every dynamic page streams) and .js
// (server and client chunks, where a dynamic page's strings actually live). It skips
// .next/cache and .map files: a source map contains the ORIGINAL source, comments included,
// so scanning maps would fail this gate on the paragraphs in access.ts explaining that the
// window was removed.
//
// ── WHY IT EXISTS ───────────────────────────────────────────────────────────
// Changing a paywall and leaving the old promise behind is this network's recurring failure.
// AlmiCV shipped eight live "free / no signup" lines after its paywall moved, one of which
// contradicted itself inside a single sentence. Nothing failed; the pages just lied.
//
// ── AND WHY /learn IS NOT SWEPT ─────────────────────────────────────────────
// /learn is the product's free layer and it stays open, so "free" is TRUE there. This gate
// bans promises about free PRACTICE — the 3-day window, the no-card grant — not the word
// "free". Measured 2026-08-31 before this gate was written: 0 files under content/ mention
// the window at all, so nothing in the corpus had to change.

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NEXT = join(root, ".next");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "cache") continue; //           build cache, not served
    const p = join(dir, e);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|rsc|js)$/.test(e)) out.push(p); // .map excluded: it carries the source
  }
  return out;
}

console.log("SERVED COPY GATE — reading build output, not source\n");

const files = walk(NEXT);
// A walk that finds nothing proves nothing, and an unbuilt .next is the most likely way to
// get a silent green here.
ok(files.length > 200,
   `only ${files.length} served artefact(s) found under .next — run \`next build\` first. ` +
   `A gate that scanned nothing would print the same zero as a gate that scanned everything.`);

/** Promises about free PRACTICE. Not the word "free": /learn is genuinely free, and the 7-day
 *  trial is genuinely a free trial. These are the specific claims the 31 Aug decision made
 *  false. */
const BANNED: { needle: string; why: string }[] = [
  { needle: "free for 3 days", why: "the 3-day grant is withdrawn" },
  { needle: "free for 3", why: "the 3-day grant is withdrawn" },
  { needle: "3-day free", why: "the 3-day grant is withdrawn" },
  { needle: "3 day free", why: "the 3-day grant is withdrawn" },
  { needle: "3 free days", why: "the 3-day grant is withdrawn" },
  { needle: "3 days free", why: "the 3-day grant is withdrawn" },
  { needle: "no card needed", why: "a card is now collected at checkout" },
  { needle: "no card required", why: "a card is now collected at checkout" },
  { needle: "no card.", why: "a card is now collected at checkout" },
  { needle: "no card,", why: "a card is now collected at checkout" },
  { needle: "without a card", why: "a card is now collected at checkout" },
  { needle: "senza carta", why: "a card is now collected at checkout" },
  { needle: "WINDOW_EXPIRED", why: "the refusal reason no longer exists" },
  { needle: "objective sections free", why: "no section is free any more" },
];

/** Strings that MUST be in the output. Without these a zero above means "the scanner read
 *  nothing", not "the pages are clean" — the whole difference between a gate and a decoration. */
const CONTROLS: string[] = [
  "7-day free trial",
  "12/month",
  "Practice is part of AlmiItalian Pro",
  "Siena",
];

const hits = new Map<string, string[]>();
const controlHits = new Map<string, number>();
for (const c of CONTROLS) controlHits.set(c, 0);

for (const f of files) {
  let text: string;
  try { text = readFileSync(f, "utf8"); } catch { continue; }
  for (const b of BANNED) {
    if (text.includes(b.needle)) {
      const list = hits.get(b.needle) ?? [];
      if (list.length < 4) list.push(f.slice(root.length + 1).split(String.fromCharCode(92)).join("/"));
      hits.set(b.needle, list);
    }
  }
  for (const c of CONTROLS) if (text.includes(c)) controlHits.set(c, (controlHits.get(c) ?? 0) + 1);
}

console.log("  CONTROLS — these must be found, or a zero above means nothing:");
for (const c of CONTROLS) {
  const n = controlHits.get(c) ?? 0;
  ok(n > 0,
     `control string "${c}" was not found anywhere in the build output. The scanner is not ` +
     `reading served content, so its zero findings are worthless.`);
  console.log(`    ${n > 0 ? "✓" : "✗"} "${c}" in ${n} artefact(s)`);
}

console.log("\n  BANNED — promises of free practice:");
for (const b of BANNED) {
  const list = hits.get(b.needle);
  ok(!list,
     `served output still says "${b.needle}" (${b.why}) — e.g. ${(list ?? []).join(", ")}`);
}
if (![...hits.keys()].length) console.log(`    ✓ none of the ${BANNED.length} banned phrases appear in ${files.length} served artefact(s)`);
else for (const [needle, list] of hits) console.log(`    ✗ "${needle}" -> ${list.join(", ")}`);

if (failures.length) {
  console.error("\n❌ SERVED COPY GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `\n✅ served-copy gate: ${files.length} built artefact(s) scanned, ${CONTROLS.length} control ` +
  `strings found (so the read is real), ${BANNED.length} free-practice promises absent.`,
);
