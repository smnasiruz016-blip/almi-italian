// Content gate — the /learn set is structurally sound and nothing is orphaned.
//
//   npm run gate:content                     (wired into `build`, so it blocks)
//   npm run gate:content -- --expect-full    (also asserts the 52-article shape)
//
// Offline. No database, no network, no key.
//
// Fifth port of this gate: almi-celpip -> almi-prep-v2 -> almi-cv-v2 -> almi-pte -> here.
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// Structure lives in frontmatter precisely SO THAT it can be checked. A CTA written as prose is
// unreachable by any gate, and by article 30 it has drifted into six shapes. Typed frontmatter
// turns that into a build failure the day article 41 forgets its CTA, rather than a discovery
// months later.
//
// The orphan checks are the AlmiOET lesson made mechanical. /register returned 404 there, so
// Google had no path to any register page and none were ever indexed — 144,266 pages behind a
// door that did not open. Here the hub is DERIVED from the directory, but "derived" is a claim
// about code, so it is checked: every article must be reachable from a hub that is itself
// servable and in the sitemap.
//
// ── WHY THE CTA TARGETS ARE ENUMERATED, NEVER LISTED ────────────────────────
// A hardcoded list of routes is wrong in both directions. A route added next month is missing
// from it, and a route deleted last month lingers — so the gate would bless a CTA pointing at a
// 404 while rejecting one pointing at a real page. The targets are read from the app directory
// at runtime instead, so the allowed set is whatever actually renders today.

import { readdirSync, existsSync, statSync, readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllArticles, getSections, learnUrls, SECTION_ORDER, LEARN_BASE, CONTENT_DIR } from "../../src/lib/learn/articles";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = join(ROOT, "src", "app");
const EXPECT_FULL = process.argv.includes("--expect-full");

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (cond: boolean, good: string, bad?: string) => (cond ? ok(good) : fail(bad ?? good));

/** The agreed shape of the authored set. Asserted only once it has landed — see section G. */
const EXPECTED_SECTIONS: ReadonlyArray<[string, number]> = [
  ["Start here", 8],
  ["CILS B1 Cittadinanza", 10],
  ["CILS beyond citizenship", 6],
  ["CELI", 8],
  ["Citizenship & residence", 14],
  ["Preparing honestly", 6],
];
const EXPECTED_TOTAL = EXPECTED_SECTIONS.reduce((n, [, c]) => n + c, 0); // 52

console.log("Content gate — /learn structure, links and orphans\n");

// ── THE ROUTE TREE, ENUMERATED ──────────────────────────────────────────────
/** Every route that has a page, as a URL path. Route groups like "(shell)" are transparent in
 *  the URL, so they are traversed but never contribute a segment — the whole reason /learn can
 *  live inside (shell) and still be /learn. Dynamic segments are skipped: a CTA must point at a
 *  concrete page, not at a pattern. */
function enumerateRoutes(dir: string, prefix = ""): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("_") || name === "api") continue;
    if (name.startsWith("[")) continue; // dynamic — not a concrete target
    const isGroup = name.startsWith("(") && name.endsWith(")");
    const nextPrefix = isGroup ? prefix : `${prefix}/${name}`;
    if (!isGroup && existsSync(join(full, "page.tsx"))) out.push(nextPrefix);
    out.push(...enumerateRoutes(full, nextPrefix));
  }
  return out;
}

const ROUTES = new Set(["/", ...enumerateRoutes(APP)]);

console.log("A. THE ROUTE ENUMERATION");
check(ROUTES.size > 5, `${ROUTES.size} concrete route(s) enumerated from src/app`,
  `${ROUTES.size} routes — a near-zero here is a broken scan, not a product with no pages`);
check(ROUTES.has("/practice"), "/practice is among the enumerated routes",
  "/practice was NOT enumerated — the scan is not seeing route groups correctly");
check(ROUTES.has(LEARN_BASE), `${LEARN_BASE} is among the enumerated routes`,
  `${LEARN_BASE} was NOT enumerated — the hub would be an orphan`);

// ── B. EVERY ARTICLE PARSES ─────────────────────────────────────────────────
console.log("\nB. EVERY ARTICLE PARSES AGAINST THE SCHEMA");
let articles: ReturnType<typeof getAllArticles> = [];
try {
  articles = getAllArticles();
  ok(`${articles.length} article(s) parsed — strict frontmatter, unknown keys rejected`);
} catch (e) {
  fail((e as Error).message);
}
check(articles.length > 0, `the directory scan found ${articles.length} article(s)`,
  "no articles found at all — the scan is looking in the wrong place");

// ── C. EVERY CTA POINTS AT A REAL, ENUMERATED ROUTE ─────────────────────────
console.log("\nC. EVERY CTA HREF IS A ROUTE THAT ACTUALLY EXISTS");
{
  let bad = 0;
  for (const a of articles) {
    const href = a.cta.href.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
    if (!ROUTES.has(href)) {
      bad++;
      fail(`${a.slug}: cta.href "${a.cta.href}" is not one of the ${ROUTES.size} enumerated routes`);
    }
  }
  if (!bad) ok(`${articles.length} CTA(s), every one pointing at a route that renders`);
}

// ── D. ORDERS ARE UNIQUE WITHIN A SECTION ───────────────────────────────────
console.log("\nD. ORDERS ARE UNIQUE PER SECTION");
{
  let bad = 0;
  for (const { section, articles: inSection } of getSections()) {
    const seen = new Map<number, string>();
    for (const a of inSection) {
      const prev = seen.get(a.order);
      if (prev) {
        bad++;
        fail(`"${section}" order ${a.order} used twice: ${prev} and ${a.slug} — the hub order would be arbitrary`);
      } else seen.set(a.order, a.slug);
    }
  }
  // Duplicate orders ACROSS sections are fine: "Start here" 1 and "CELI" 1 are different lists.
  if (!bad) ok("no section reuses an order");
}

// ── E. NO DANGLING RELATED SLUGS ────────────────────────────────────────────
console.log("\nE. RELATED SLUGS RESOLVE");
{
  const slugs = new Set(articles.map((a) => a.slug));
  let bad = 0;
  let unlinked = 0;
  for (const a of articles) {
    for (const r of a.related) {
      if (!r.slug) { unlinked++; continue; } // label-only: allowed while a set is being authored
      if (!slugs.has(r.slug)) {
        bad++;
        fail(`${a.slug}: related slug "${r.slug}" does not exist — a dead internal link`);
      }
    }
  }
  if (!bad) ok(`every related slug resolves (${unlinked} label-only reference(s), which is allowed)`);
}

// ── F. NO ORPHANS, IN BOTH DIRECTIONS ───────────────────────────────────────
console.log("\nF. NOTHING IS ORPHANED");
{
  const hubSlugs = new Set(getSections().flatMap((s) => s.articles.map((a) => a.slug)));
  const missing = articles.filter((a) => !hubSlugs.has(a.slug));
  check(missing.length === 0, `all ${articles.length} article(s) appear on the derived hub`,
    `${missing.length} article(s) exist but are not on the hub: ${missing.map((a) => a.slug).join(", ")}`);

  const urls = learnUrls();
  check(urls.length === articles.length + 1,
    `the sitemap scan yields ${urls.length} URL(s) — the hub plus ${articles.length} article(s)`,
    `sitemap scan yields ${urls.length}, expected ${articles.length + 1}`);
  check(urls[0] === LEARN_BASE, "the hub itself is in the sitemap set",
    "the hub is missing from the sitemap set — the AlmiOET failure exactly");
  for (const a of articles) {
    if (!urls.includes(a.path)) fail(`${a.slug} is not in the sitemap set`);
  }
}

// ── G. SECTION NAMES, AND THE SHAPE OF THE SET ──────────────────────────────
// The NAMES can be checked today: a typo in one `section:` line makes a one-article section on
// the hub, and that is wrong whether there are 2 articles or 52.
//
// The COUNTS are a different thing. They can only be true once all 52 have landed, and
// asserting them against a scaffold would be red for a state that is correct. So they activate
// automatically once the set is plausibly complete, and can be forced at any time with
// --expect-full — which is what the content-drop PR will do.
console.log("\nG. SECTION NAMES, AND THE SHAPE OF THE SET");
const expectedNames = new Set(EXPECTED_SECTIONS.map(([n]) => n));
for (const { section } of getSections()) {
  check(expectedNames.has(section), `"${section}" is one of the six agreed sections`,
    `"${section}" is not one of the six agreed sections — [${[...expectedNames].join(" | ")}]`);
}
check(SECTION_ORDER.length === EXPECTED_SECTIONS.length,
  `SECTION_ORDER lists all ${EXPECTED_SECTIONS.length} sections`,
  `SECTION_ORDER lists ${SECTION_ORDER.length} section(s) but ${EXPECTED_SECTIONS.length} are planned — an unlisted one would sort to the end of the hub`);

const full = EXPECT_FULL || articles.length >= EXPECTED_TOTAL;
if (full) {
  check(articles.length === EXPECTED_TOTAL,
    `the set is complete — ${articles.length} articles`,
    `expected ${EXPECTED_TOTAL} articles, found ${articles.length}`);
  for (const [name, want] of EXPECTED_SECTIONS) {
    const got = articles.filter((a) => a.section === name).length;
    check(got === want, `${name}: ${got}/${want}`, `${name}: ${got} article(s), expected ${want}`);
  }
} else {
  console.log(`     ${articles.length} article(s) present — the per-section counts are NOT asserted yet.`);
  console.log("     They activate automatically at 52, or now with --expect-full. Target shape:");
  for (const [name, want] of EXPECTED_SECTIONS) console.log(`       ${String(want).padStart(2)}  ${name}`);
  console.log(`       ${EXPECTED_TOTAL}  total`);
}

console.log("");
// -- H. THE HONESTY INVARIANTS ---------------------------------------------
// This corpus refuses to overclaim, and that refusal has to survive edits by people who were
// never in this conversation. Each check is a property of the RENDERED page -- what a reader
// actually receives -- not of the markdown source: after the token conversion the source no
// longer contains the digits a reader sees.
console.log("\nH. THE HONESTY INVARIANTS");

/** Lowercased word set, so "ours" cannot be satisfied by "hours" or "yours". */
function wordsOf(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z]+/g) ?? []);
}

// H1. Our derived thresholds are never stated without the admission that they are ours.
// Siena publishes NO pass mark and NO per-skill minimum for the Cittadinanza module; 7/12 and
// 28/48 are OUR derivation from the standard UNO-B1 rule. A page printing them as bare fact
// tells a citizenship applicant an official threshold exists. The COUNT is asserted too, so a
// page that gains the number without the admission moves the count and goes red.
{
  const THRESHOLDS = ["7/12", "7 out of 12", "28/48", "28 out of 48"];
  const OURS = ["our own", "our numbers", "our figures", "our thresholds", "we derived", "our derived"];
  const DERIVED = ["derived", "derivation", "publishes no", "has not published", "not published", "not siena"];
  const EXPECTED_THRESHOLD_PAGES = 18;
  const stating = articles.filter((a) => THRESHOLDS.some((t) => a.body.includes(t)));
  let bad = 0;
  for (const a of stating) {
    const lower = a.body.toLowerCase();
    const ours = wordsOf(a.body).has("ours") || OURS.some((p) => lower.includes(p));
    const derived = DERIVED.some((p) => lower.includes(p));
    if (!ours || !derived) {
      bad++;
      fail(`${a.slug}: states a derived threshold (7/12 or 28/48) without admitting it is ours and derived - a reader would take it as an official Siena minimum`);
    }
  }
  if (!bad) ok(`${stating.length} page(s) state a derived threshold, and every one admits it is ours and derived`);
  check(stating.length === EXPECTED_THRESHOLD_PAGES,
    `${stating.length} page(s) carry the derived thresholds, as expected`,
    `${stating.length} page(s) carry the derived thresholds, expected ${EXPECTED_THRESHOLD_PAGES} - a page gained or lost the figures; re-read it and update this count deliberately`);
}

// H2. The 40-80 word limit never returns. This product told learners the CILS B1 Cittadinanza
// email was 40-80 words until PR #38. The real window is 80-120. That was a defect in the
// SCORER; content is the other way it could come back, and content is not covered by the
// scorer own tests.
{
  const BANNED = ["40-80", "40–80"];
  let bad = 0;
  for (const a of articles) {
    for (const b of BANNED) {
      if (a.body.includes(b) || a.title.includes(b) || a.description.includes(b)) {
        bad++;
        fail(`${a.slug}: contains "${b}" - the word limit corrected in PR #38; the real window is 80-120`);
      }
    }
  }
  if (!bad) ok("no article states the 40-80 word limit that PR #38 corrected");
}

// H3. No agent-tooling footer reaches the corpus. Two research briefs arrived with an agent
// footer appended by the tooling that produced them; the writers treated it as data. Checked
// against the RAW file, because that is where such a footer would be pasted.
{
  const BANNED = ["agentId", "SendMessage", "subagent_tokens"];
  let bad = 0;
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(CONTENT_DIR, file), "utf8");
    for (const b of BANNED) {
      if (raw.includes(b)) { bad++; fail(`content/learn/${file}: contains agent-tooling string "${b}"`); }
    }
  }
  if (!bad) ok(`no file carries an agent-tooling footer (${BANNED.join(", ")})`);
}

// H4. The editorial trailers never reach a reader. Every delivered file ends with
// `FACTS I WANTED:` and `UNSURE OF:`. src/lib/learn/articles.ts strips them at import. This
// asserts the strip happened on the rendered body AND that the raw files still carry them, so
// the strip is proven to do the work rather than the corpus having lost its provenance notes.
{
  const MARKERS = ["FACTS I WANTED", "UNSURE OF"];
  let leaked = 0;
  for (const a of articles) {
    for (const m of MARKERS) {
      if (a.body.includes(m) || a.title.includes(m) || a.description.includes(m)) {
        leaked++;
        fail(`${a.slug}: editorial trailer "${m}" reached the rendered page - a reader would see it`);
      }
    }
  }
  if (!leaked) ok(`no rendered page contains an editorial trailer (${MARKERS.join(", ")})`);
  const rawFiles = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const carrying = rawFiles.filter((f) => {
    const raw = readFileSync(join(CONTENT_DIR, f), "utf8");
    return MARKERS.every((m) => raw.includes(m));
  });
  check(carrying.length === rawFiles.length,
    `all ${rawFiles.length} source file(s) still carry their trailers - the strip is doing the work`,
    `${carrying.length}/${rawFiles.length} source file(s) carry both trailers - if they were deleted from source, this check no longer proves the strip works`);
}

if (failed) { console.error("Content gate FAILED\n"); process.exit(1); }
console.log("Content gate passed\n");
