// LINK CONTRAST GATE — WCAG 2.2 SC 1.4.3 (Contrast Minimum) for body/prose links.
//
// Run: npm run gate:link-contrast   (wired into `build`, so it blocks)
//
// WHY THIS EXISTS
// Body links were --color-almi-coral (#ff7a6b) on the cream page background (#fffaf3): a
// contrast ratio of 2.45:1 against the 4.5:1 AA requires. Every one of those links is 12-16px
// at normal weight, so the large-text exemption (18pt/14pt bold at 3:1) does not apply. They
// carried an underline, which is why it read as fine — but an underline satisfies SC 1.4.1
// (Use of Color), NOT SC 1.4.3. The colour of the text has to meet the ratio on its own.
//
// HOW THIS GATE WORKS, AND WHY IT IS NOT A LIST
// It reads the two token VALUES out of globals.css and computes the WCAG relative-luminance
// ratio here. There is no table of approved colours to fall out of date: change either token
// and the arithmetic changes with it. The threshold 4.5 is the only literal, because that one
// comes from the specification rather than from us.
//
// It also asserts that the CSS actually USES the link token. A token can be perfectly
// compliant while the rule next to it still says `color: var(--color-almi-coral)` — then this
// gate would be measuring a value nobody renders, which is the exact shape of a check that
// proves nothing.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CSS = join(root, "src", "app", "globals.css");
const css = readFileSync(CSS, "utf8");

const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

/** WCAG 2.x relative luminance. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = ch.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
/** WCAG 2.x contrast ratio, order-independent. */
function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Read a custom property's value out of the @theme block. */
function token(name: string): string {
  const m = css.match(new RegExp("--color-" + name + "\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;"));
  if (!m) { failures.push(`token --color-${name} not found in globals.css`); return "#000000"; }
  return m[1].toLowerCase();
}

// AA for normal-weight text under 18pt. The one literal, and it is the spec's, not ours.
const AA_NORMAL = 4.5;

const link = token("almi-link");
const bg = token("almi-bg");
const paper = token("almi-paper");

// A body link sits on the page background or on a card. Both have to clear AA.
for (const [surfaceName, surface] of [["page background", bg], ["card/paper", paper]] as const) {
  const ratio = contrast(link, surface);
  ok(ratio >= AA_NORMAL,
     `body-link ${link} on ${surfaceName} ${surface} is ${ratio.toFixed(2)}:1 — WCAG AA needs ` +
     `${AA_NORMAL}:1 for normal-weight text under 18pt. These links are 12-16px at normal ` +
     `weight, so the 3:1 large-text exemption does not apply, and an underline does not ` +
     `substitute for colour contrast (that is SC 1.4.1, not SC 1.4.3).`);
}

// The token must actually be the one the prose rule renders. Without this, the gate could be
// measuring a compliant token while the stylesheet still paints links coral.
const proseRule = css.match(/\.learn-prose\s+a\s*\{[^}]*\}/);
ok(Boolean(proseRule), ".learn-prose a rule not found — this gate is looking in the wrong place");
if (proseRule) {
  ok(/var\(--color-almi-link\)/.test(proseRule[0]),
     `.learn-prose a does not use var(--color-almi-link): ${proseRule[0].replace(/\s+/g, " ")}`);
}

// No body/prose link may go back to painting itself coral. Scoped to <Link>/<a> so buttons,
// headings, accents and hover states — where coral is correct and passes on its own ground —
// are untouched.
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}
const coralLinks: string[] = [];
for (const abs of walk(join(root, "src"))) {
  const src = readFileSync(abs, "utf8");
  // A link element whose className paints the TEXT coral. `bg-almi-coral` (a button) and
  // `hover:text-almi-coral` are deliberately not matched.
  const re = /<(?:Link|a)\b[^>]*className="[^"]*(?<![\w:-])text-almi-coral(?![\w-])[^"]*"/g;
  if (re.test(src)) coralLinks.push(relative(root, abs).split(String.fromCharCode(92)).join("/"));
}
ok(coralLinks.length === 0,
   `body link(s) painted text-almi-coral (2.45:1 on the page background): ${coralLinks.join(", ")}`);

if (failures.length) {
  console.error("\n❌ LINK CONTRAST GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `✅ link-contrast gate: --color-almi-link ${link} measures ` +
  `${contrast(link, bg).toFixed(2)}:1 on ${bg} and ${contrast(link, paper).toFixed(2)}:1 on ${paper} ` +
  `(AA needs ${AA_NORMAL}:1 at normal weight); .learn-prose a renders the token; no <Link>/<a> ` +
  `paints its text coral. Ratios computed from the tokens, not from a list.`,
);
