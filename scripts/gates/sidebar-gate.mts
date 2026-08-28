// Sidebar gate — every nav item goes somewhere that exists, and no two go to the same place.
//
//   npm run gate:sidebar        (wired into `build`, so it blocks)
//
// Offline. Parses the item table out of the component and enumerates routes from the app
// directory; no browser, no request.
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// "My Progress" and "Account" both carried href "/account". One defect produced three
// symptoms that looked like three bugs:
//
//   · clicking My Progress showed the Account page — same href;
//   · the sidebar highlighted MY PROGRESS while Account content was on screen — activeKey
//     broke the tie by array order, and progress came first;
//   · clicking Account did nothing — the URL was already /account, so there was no navigation.
//
// The highlight is what makes this worth a gate rather than a one-line fix. It was not a
// rendering accident: activeKey carried a comment explaining that ties keep the first item "so
// My Progress owns /account". The duplication had been noticed and tidied instead of removed,
// which is how it survived. A check makes the tidying impossible.
//
// The routes are ENUMERATED from src/app rather than listed here. A hardcoded list is wrong in
// both directions — it misses a route added next month and keeps one deleted last month — so
// the allowed set is whatever actually renders today.

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

console.log("Sidebar gate — every item goes somewhere, and somewhere different\n");

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
// Only the live table: everything after a `//` is ignored, so the comment recording the removed
// My Progress item cannot be read back as a live item.
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

console.log("\nC. NO TWO ITEMS GO TO THE SAME PLACE");
// The defect this gate was written for. Two labels on one destination means at least one of
// them is lying about where it goes, and the highlight cannot be right for both.
{
  const byHref = new Map<string, string[]>();
  for (const it of items) byHref.set(it.href, [...(byHref.get(it.href) ?? []), it.label]);
  const dupes = [...byHref.entries()].filter(([, labels]) => labels.length > 1);
  check(dupes.length === 0,
    `all ${items.length} item(s) have a distinct destination`,
    dupes.map(([href, labels]) => `${labels.map((l) => `"${l}"`).join(" and ")} both point at ${href} — one of them is mislabelled, and the active highlight can only be right for one`).join("; "));
}

console.log("\nD. NO TWO ITEMS CLAIM THE SAME ACTIVE RANGE");
// Distinct hrefs are not enough: two items can differ in href and still share a `match`, which
// puts the highlight back on array order.
{
  const matches = [...live.matchAll(/\{\s*key:\s*"([^"]+)"[^}]*match:\s*"([^"]+)"\s*\}/g)]
    .map((m) => ({ key: m[1], match: m[2] }));
  const byMatch = new Map<string, string[]>();
  for (const m of matches) byMatch.set(m.match, [...(byMatch.get(m.match) ?? []), m.key]);
  const dupes = [...byMatch.entries()].filter(([, keys]) => keys.length > 1);
  check(matches.length >= 3, `${matches.length} match prefix(es) parsed`,
    "match prefixes did not parse — section D is blind");
  check(dupes.length === 0,
    "no two items share an active-match prefix",
    dupes.map(([m, keys]) => `${keys.join(" and ")} both match ${m} — the highlight would fall back to array order`).join("; "));
}

console.log("\nE. THE REMOVED ITEM HAS NOT COME BACK POINTING AT A LIE");
// "My Progress" may return the day a progress page exists. It may not return pointing at
// /account, which is what it did before.
{
  const progressItem = items.find((it) => /progress/i.test(it.label) || /progress/i.test(it.key));
  if (!progressItem) {
    ok("no progress item is present, and no progress route exists — consistent");
  } else {
    const path = progressItem.href.replace(/\/$/, "") || "/";
    check(/progress/i.test(path),
      `"${progressItem.label}" points at ${progressItem.href}, a route of its own`,
      `"${progressItem.label}" is back but points at ${progressItem.href} — a progress link must go to a progress page, not to whatever renders`);
  }
}

console.log("");
if (failed) {
  console.error("Sidebar gate FAILED\n");
  process.exit(1);
}
console.log("Sidebar gate passed\n");
