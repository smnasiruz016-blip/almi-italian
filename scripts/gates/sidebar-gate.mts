// Sidebar gate — every nav item goes somewhere that exists, and "My Progress" goes somewhere
// that actually shows progress.
//
//   npm run gate:sidebar        (wired into `build`, so it blocks)
//
// Offline. Parses the item table out of the component and enumerates routes from the app
// directory; no browser, no request.
//
// ── WHAT THIS GATE USED TO ASSERT, AND WHY THAT WAS WRONG ───────────────────
// An earlier version of this file (PR #51, superseded) failed the build when two items shared
// a destination, on the reasoning that "My Progress" and "Account" both pointing at /account
// meant one of them was lying about where it went.
//
// That reasoning did not survive contact with the network. All NINETEEN products point
// "My Progress" at /account — AlmiPrep, AlmiPTE, AlmiTOEFL, every language sibling. It is the
// shipped pattern, not an Italian defect, and a gate that fails a pattern every sibling ships
// is a gate that will be deleted the first time it blocks someone.
//
// DROPPED, deliberately:
//   · "no two items resolve to the same route" — AlmiPrep's own sidebar violates it.
//   · "no two items share a match prefix"      — same reason; the tie-break in activeKey is
//     the intended behaviour for this pair, not an accident.
//
// KEPT, because it is still true and still catches a real defect:
//   · every href resolves to a route that renders (section B).
//
// ADDED, because it is the thing that was ACTUALLY broken:
//   · "My Progress" must point at a page that renders progress content (section C). The
//     complaint was never the shared URL — it was that /account showed a plan and a log-out
//     button and nothing about the learner's work. A link is only honest if its destination
//     answers for its label.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = join(ROOT, "src", "app");

let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Sidebar gate — every item goes somewhere, and My Progress shows progress\n");

/** Concrete routes, as URL paths. Route groups like (app) are transparent in the URL. */
function enumerateRoutes(dir: string, prefix = ""): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) continue;
    if (name.startsWith("_") || name === "api") continue;
    if (name.startsWith("[")) continue; // dynamic — a nav item must point at a concrete page
    const isGroup = name.startsWith("(") && name.endsWith(")");
    const next = isGroup ? prefix : `${prefix}/${name}`;
    if (!isGroup && existsSync(join(full, "page.tsx"))) out.push(next);
    out.push(...enumerateRoutes(full, next));
  }
  return out;
}

const ROUTES = new Set(["/", ...enumerateRoutes(APP)]);

const src = readFileSync(join(ROOT, "src", "components", "Sidebar.tsx"), "utf8");
// Comments stripped: the notes above the item table mention hrefs, and a scan that reads a
// comment as a live item produces a false positive.
const live = src.replace(/(^|[^:])\/\/[^\r\n]*/g, "$1 ");
const items = [...live.matchAll(/\{\s*key:\s*"([^"]+)",\s*href:\s*"([^"]+)"[^}]*label:\s*"([^"]+)"[^}]*\}/g)]
  .map((m) => ({ key: m[1], href: m[2], label: m[3] }));

console.log("A. THE TABLE PARSES");
check(ROUTES.size > 5, `${ROUTES.size} concrete route(s) enumerated from src/app`,
  `${ROUTES.size} routes — the scan is broken, not the product`);
check(items.length >= 3, `${items.length} sidebar item(s) parsed`,
  "fewer than 3 sidebar items parsed — the table shape changed and this gate is now blind");

console.log("\nB. EVERY ITEM GOES SOMEWHERE THAT EXISTS");
{
  let bad = 0;
  for (const it of items) {
    const path = it.href.split("#")[0].split("?")[0].replace(/\/$/, "") || "/";
    if (!ROUTES.has(path)) {
      bad++;
      fail(`"${it.label}" points at ${it.href}, which is not one of the ${ROUTES.size} routes that render — the learner gets a 404 or a redirect`);
    }
  }
  if (!bad) ok(`all ${items.length} item(s) point at a route that renders`);
}

console.log("\nC. \"MY PROGRESS\" LANDS ON A PAGE THAT SHOWS PROGRESS");
// The real defect. Sharing /account with Account is fine — every sibling does it. What is not
// fine is a link labelled "My Progress" whose destination says nothing about the learner's work.
{
  const progress = items.find((it) => /progress/i.test(it.label));
  check(Boolean(progress), "a My Progress item is present",
    "there is no My Progress item — removing it was the superseded fix; the network ships it");
  if (progress) {
    const path = progress.href.replace(/\/$/, "") || "/";
    const segs = path.split("/").filter(Boolean);
    const pageFile = join(APP, "(app)", ...segs, "page.tsx");
    const alt = join(APP, ...segs, "page.tsx");
    const file = existsSync(pageFile) ? pageFile : existsSync(alt) ? alt : null;
    check(Boolean(file), `its destination ${path} has a page file`,
      `no page file found for ${path} — this check cannot see what it renders`);
    if (file) {
      const dest = readFileSync(file, "utf8");
      check(/ProgressSection/.test(dest),
        `${path} renders progress sections`,
        `${path} renders no progress sections — "My Progress" would land on a page with nothing about the learner's attempts, which is the defect this PR exists to fix`);
      check(/recentAttempts\(/.test(dest),
        `${path} reads the learner's attempts`,
        `${path} renders progress sections but never reads any attempts — the sections would be empty for everyone`);
    }
  }
}

console.log("\nD. THE SCORES ON THAT PAGE STAY LABELLED AS ESTIMATES");
// A progress list is where the estimate label is easiest to lose: the rows are terse and the
// disclaimer reads as clutter next to a small number. The full report cannot drop it —
// EstimateReport always prints it — but this list is new code with its own render path.
{
  const comp = join(ROOT, "src", "components", "ProgressSection.tsx");
  check(existsSync(comp), "the progress section component exists",
    "ProgressSection.tsx is missing — section C is asserting a component that is not there");
  if (existsSync(comp)) {
    const c = readFileSync(comp, "utf8");
    check(/stima/.test(c), "the list tells the learner these are estimates",
      "the progress list prints scores with no estimate wording — a learner would read them as official results");
    check(/isEstimate/.test(c) || /ESTIMATE_LABEL/.test(c),
      "the estimate label travels with the row, not just the page",
      "nothing ties the label to the individual rows");
  }
}

console.log("");
if (failed) {
  console.error("Sidebar gate FAILED\n");
  process.exit(1);
}
console.log("Sidebar gate passed\n");
