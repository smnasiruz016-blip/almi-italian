// STATIC SHELL GATE — the (shell) group's layout reads no session, so its routes stay static.
//
//   npm run gate:static-shell
//
// ── WHAT THIS GUARDS ────────────────────────────────────────────────────────
// One line in one layout decides whether 53 pages are served from the CDN or re-rendered on
// every crawl. (shell)/layout.tsx used to call getCurrentUser(); reading the session cookie in a
// layout opts EVERY route in the group into dynamic rendering, so /learn returned no
// `x-nextjs-cache` header at all while the /guides pages it replaces returned `HIT`.
//
// The fix is invisible in the diff of any single future change: someone adding a "small" bit of
// personalisation to the shell layout would reintroduce it, the build would stay green, and the
// only symptom would be a hosting bill and a slower crawl. So it is asserted here.
//
// ── WHAT IS DELIBERATELY ALLOWED ────────────────────────────────────────────
// A route in the group that genuinely needs the server session opts into dynamic ITSELF, in its
// own file. /practice does: its page calls getCurrentUser() for the entitlement decision and is
// `ƒ` on its own terms. That is correct and must keep working — this gate checks the LAYOUT,
// never the pages under it.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("Static shell gate — the shell layout reads no server session\n");

const LAYOUT = "src/app/(shell)/layout.tsx";
/** Server-session helpers. Any of these in the group layout makes the whole group dynamic. */
const SERVER_SESSION = [
  "getCurrentUser",
  "requireUser",
  "cookies(",
  "headers(",
  "draftMode(",
  "next/headers",
];

/** Read CODE, not prose — this file's own rule is documented in the layout it scans. */
const code = (f: string) =>
  readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

// ── A. THE LAYOUT ───────────────────────────────────────────────────────────
console.log("A. the group layout:");
if (!existsSync(LAYOUT)) {
  fail(`${LAYOUT} does not exist — has the shell group moved?`);
} else {
  const src = code(LAYOUT);
  const found = SERVER_SESSION.filter((n) => src.includes(n));
  if (found.length) {
    fail(`${LAYOUT} references ${found.join(", ")} — that makes EVERY route in (shell) dynamic, including all of /learn. A route needing the server session must opt in from its own file.`);
  } else {
    ok(`${LAYOUT} references no server-session helper (${SERVER_SESSION.length} checked)`);
  }
  // A layout that renders nothing at all would also "pass" the check above.
  if (!/ShellChrome|children/.test(src)) {
    fail(`${LAYOUT} renders neither ShellChrome nor children — this gate would pass over a broken layout`);
  } else {
    ok("the layout still renders its children");
  }
}

// ── B. THE CLIENT REPLACEMENT IS REAL ───────────────────────────────────────
// Otherwise "no server session" could be satisfied by simply deleting the sidebar.
console.log("\nB. the chrome moved rather than vanished:");
{
  const CHROME = "src/components/ShellChrome.tsx";
  if (!existsSync(CHROME)) fail(`${CHROME} is missing — the shell chrome has been deleted, not relocated`);
  else {
    const src = readFileSync(CHROME, "utf8");
    if (!src.startsWith('"use client"')) fail(`${CHROME} is not a client component`);
    else ok("ShellChrome is a client component");
    if (!/\/api\/me/.test(src)) fail(`${CHROME} never calls /api/me — the session is not being resolved anywhere`);
    else ok("ShellChrome resolves the session from /api/me");
    // `<Sidebar`, not `Sidebar`. A bare substring test passes on `Sidebar_REMOVED` — renaming a
    // symbol disables it while leaving its letters in the file, and this check went GREEN on
    // exactly that sabotage before it was tightened.
    if (!/<Sidebar[\s/>]/.test(src)) fail(`${CHROME} does not render a <Sidebar> element`);
    else ok("ShellChrome still renders <Sidebar>");
  }
}

// ── C. THE ROUTES THAT MUST STAY STATIC ─────────────────────────────────────
// /learn/[slug] is a DYNAMIC SEGMENT: a static layout does not prerender it on its own. It needs
// generateStaticParams, and it needs dynamicParams=false so an unknown slug 404s instead of
// rendering on demand — which is what the ISR holding freeze exists to prevent.
console.log("\nC. /learn is prerenderable on its own terms:");
{
  const HUB = "src/app/(shell)/learn/page.tsx";
  const ART = "src/app/(shell)/learn/[slug]/page.tsx";
  for (const [f, label] of [[HUB, "hub"], [ART, "article"]] as const) {
    if (!existsSync(f)) { fail(`${f} is missing`); continue; }
    const src = code(f);
    const dyn = SERVER_SESSION.filter((n) => src.includes(n));
    if (dyn.length) fail(`${f} (${label}) references ${dyn.join(", ")} — it would render dynamic`);
    else ok(`the ${label} reads no server session`);
  }
  const art = code(ART);
  // The DECLARATION, not the letters: `/generateStaticParams/` matches `generateStaticParams_GONE`,
  // so the substring form went GREEN on a sabotage that had genuinely removed the export — the one
  // check standing behind "a static layout does not make a dynamic segment static".
  if (!/export\s+(?:async\s+)?function\s+generateStaticParams\s*\(/.test(art)) {
    fail(`${ART} has no generateStaticParams — a dynamic segment does NOT prerender just because its layout is static`);
  } else ok("the article route declares generateStaticParams");
  if (!/export\s+const\s+dynamicParams\s*=\s*false/.test(art)) {
    fail(`${ART} does not set dynamicParams = false — an unknown slug would render on demand instead of 404ing`);
  } else ok("dynamicParams = false (unknown slug 404s, no on-demand render)");
}

console.log("");
if (failed) {
  console.error("Static shell gate FAILED");
  console.error("  One line in a layout decides whether 53 pages are CDN hits or server renders.\n");
  process.exit(1);
}
console.log("Static shell gate passed\n");
