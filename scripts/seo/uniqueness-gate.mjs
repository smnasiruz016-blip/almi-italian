// Build-time UNIQUENESS GATE — AlmiWorld pSEO Localization Standard.
//
// Runs before the build; fails it on any violation so a thin / name-swapped page cannot ship.
//
// ── WHY THIS WAS REWRITTEN ─────────────────────────────────────────────────
// The previous version derived its own population from the very data it was checking:
//
//     for (const slug of LOCALIZED_ORIGIN_SLUGS) { ...check originContext(slug)... }
//
// LOCALIZED_ORIGIN_SLUGS is computed inside @smnasiruz016-blip/almi-data as
// ORIGINS.filter(o => o.localization). Rename or drop that field upstream and the list
// becomes empty, the loop never runs, and the gate prints "0 checked" and exits 0. Proven,
// not assumed: renaming the field made it report `localized origins checked: 0` and pass
// green. Every origin page could lose its recognition layer with the build still succeeding.
//
// Its "self-test" did not catch that either. It ran a NEW three-line Map over ["x","x"] and
// confirmed that duplicate detection works in general — a hand-rolled copy of the logic, not
// the loop above it. It printed ✓ while the real check did nothing.
//
// ── WHAT REPLACES IT ───────────────────────────────────────────────────────
// Every population is COUNTED AGAINST A PINNED LITERAL before it is used. A population that
// collapses to zero now fails loudly instead of passing silently. The corpus population comes
// from the content directory on disk — an independent source from the module being checked —
// so a deleted article turns the gate red rather than shrinking the denominator.
//
// The literals below are NOT derived from the data. That is the entire point: a count read
// from the same list it is validating cannot detect that list emptying.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { originContext, LOCALIZED_ORIGIN_SLUGS, findOrigin } from "@smnasiruz016-blip/almi-data";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const violations = [];

// ── POPULATION 1: the learn corpus, counted on disk ────────────────────────
// Independent of any module: this is the real file count in content/learn.
const EXPECTED_ARTICLES = 52;
const learnDir = join(root, "content", "learn");
const files = readdirSync(learnDir).filter((f) => f.endsWith(".md"));

if (files.length !== EXPECTED_ARTICLES) {
  violations.push(
    `content/learn holds ${files.length} articles, expected ${EXPECTED_ARTICLES}. ` +
      `If an article was deliberately added or retired, update EXPECTED_ARTICLES in this file ` +
      `in the same commit — that edit is the record that it was intentional.`,
  );
}

// Frontmatter title/description must be unique: two articles sharing either are a name-swap
// of each other, which is the exact thinness this gate exists to stop.
const titles = new Map();
const descriptions = new Map();
for (const file of files) {
  const src = readFileSync(join(learnDir, file), "utf8");
  const fm = src.split("---")[1] ?? "";
  const grab = (key) => {
    const m = fm.match(new RegExp("^" + key + ':\\s*"(.*)"\\s*$', "m"));
    return m ? m[1].trim() : "";
  };
  const title = grab("title");
  const description = grab("description");

  if (!title) violations.push(`${file}: empty or unparseable frontmatter title.`);
  if (!description) violations.push(`${file}: empty or unparseable frontmatter description.`);

  const t = titles.get(title);
  if (title && t) violations.push(`${file} shares its title with ${t} — name-swap risk.`);
  else if (title) titles.set(title, file);

  const d = descriptions.get(description);
  if (description && d) violations.push(`${file} shares its description with ${d} — name-swap risk.`);
  else if (description) descriptions.set(description, file);
}

// ── POPULATION 2: localized origins ────────────────────────────────────────
// Pinned literal, so the empty-population failure that made the old gate hollow is now caught.
const EXPECTED_LOCALIZED_ORIGINS = 10;
if (LOCALIZED_ORIGIN_SLUGS.length !== EXPECTED_LOCALIZED_ORIGINS) {
  violations.push(
    `LOCALIZED_ORIGIN_SLUGS has ${LOCALIZED_ORIGIN_SLUGS.length} entries, expected ` +
      `${EXPECTED_LOCALIZED_ORIGINS}. A zero here means the upstream data changed shape and ` +
      `every origin page silently lost its recognition layer.`,
  );
}

const bodies = new Map();
for (const slug of LOCALIZED_ORIGIN_SLUGS) {
  const loc = originContext(slug);
  const name = findOrigin(slug)?.name ?? slug;
  if (!loc) { violations.push(`${slug}: listed as localized but originContext() is null.`); continue; }
  if (!loc.recognitionBody?.trim()) violations.push(`${name}: empty recognitionBody.`);
  if (!loc.commonConcern?.trim()) violations.push(`${name}: empty commonConcern.`);
  const prev = bodies.get(loc.recognitionBody);
  if (prev) violations.push(`${name} shares recognitionBody with ${prev} ("${loc.recognitionBody}") — name-swap risk.`);
  else bodies.set(loc.recognitionBody, name);
}

// A population that produced no comparisons proves nothing, whatever the counts above said.
if (bodies.size === 0) violations.push("no recognition bodies were compared — the check ran on an empty population.");
if (titles.size === 0) violations.push("no article titles were compared — the corpus read as empty.");

console.log("Uniqueness gate");
console.log(`  learn articles on disk:      ${files.length} (expected ${EXPECTED_ARTICLES})`);
console.log(`  distinct article titles:      ${titles.size}`);
console.log(`  distinct article descriptions:${descriptions.size}`);
console.log(`  localized origins checked:    ${LOCALIZED_ORIGIN_SLUGS.length} (expected ${EXPECTED_LOCALIZED_ORIGINS})`);
console.log(`  distinct recognition bodies:  ${bodies.size}`);

if (violations.length) {
  console.error(`\n❌ UNIQUENESS GATE FAILED — ${violations.length} violation(s):`);
  for (const v of violations) console.error("   • " + v);
  process.exit(1);
}
console.log("\n✅ Uniqueness gate passed.");
