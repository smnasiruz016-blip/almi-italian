// CONTRAST GATE — WCAG 2.2 SC 1.4.3 (Contrast Minimum), across every colour pair the UI paints.
//
// Run: npm run gate:contrast   (wired into `build`, so it blocks)
//
// This began as a body-link check and was too narrow. Links were the symptom; the class of
// defect is "a foreground token painted on a background token without anyone computing the
// ratio". Fixing only links would have left coral-deep failing on error messages and band
// pills, which is exactly where it was.
//
// WHAT WAS WRONG
//   --color-almi-coral      #ff7a6b  2.45:1 on the cream page background
//   --color-almi-coral-deep #f2624f  3.05:1 on cream, 2.70:1 on peach
// Both are below the 4.5:1 AA requires for normal-weight text. Neither token changed value:
// coral is still "primary CTA + hero" and coral-deep is still "hover/active", both declared in
// globals.css, and both are fine as FILLS (ink on coral is 7.39:1). What changed is that where
// the coral family had to paint TEXT it now uses --color-almi-coral-text #a8301c.
//
// HOW THE POPULATION IS DERIVED
// Nothing here is a hardcoded list of approved colours or approved files.
//   · The token table is parsed out of globals.css.
//   · The pairs are discovered by scanning every STRING LITERAL in src/**.tsx that names a
//     text-almi-* class - not just className attributes, because the verdict colours live in
//     ternaries and lookup maps - together with the bg-almi-* in the same literal; with no
//     background there, the page background is used.
//   · Tokens whose NAME ends in -on-dark are for dark surfaces, so they are measured against
//     the darkest token in the table — found by luminance, not by being named here.
// Add a token, add a colour pair, or repaint an element and this gate follows without edits.
//
// THE THRESHOLD IS THE SPEC'S, NOT OURS
// 4.5:1 normal, 3:1 for large text. WCAG large = 24px, or 18.66px when BOLD. Tailwind's
// font-semibold is 600 and does NOT qualify — a 12px semibold label needs the full 4.5:1.
// aria-hidden content is decorative and is not text for this criterion.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const css = readFileSync(join(root, "src", "app", "globals.css"), "utf8");
const failures: string[] = [];

// ---- tokens, parsed (not listed) ------------------------------------------
const TOKENS = new Map<string, string>();
for (const m of css.matchAll(/--color-(almi-[a-z-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  TOKENS.set(m[1], m[2].toLowerCase());
}
if (TOKENS.size === 0) failures.push("no --color-almi-* tokens parsed from globals.css — this gate is looking in the wrong place");

type RGB = [number, number, number];
const rgb = (hex: string): RGB => [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16)) as RGB;
function luminance(hex: string): number {
  const lin = rgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}
function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** A Tailwind /NN opacity is the token composited over what is behind it. */
function composite(fg: string, alpha: number, bg: string): string {
  const f = rgb(fg), b = rgb(bg);
  const out = f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)));
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const PAGE_BG = TOKENS.get("almi-bg") ?? "#ffffff";
// The darkest token in the table — derived by luminance, so -on-dark text is measured against
// a real dark surface without this file naming one.
let DARKEST = PAGE_BG;
for (const [, hex] of TOKENS) if (luminance(hex) < luminance(DARKEST)) DARKEST = hex;

// ---- Tailwind size/weight -> the threshold the spec sets ------------------
const SIZE_PX: Record<string, number> = {
  xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36,
  "5xl": 48, "6xl": 60, "7xl": 72, "8xl": 96, "9xl": 128,
};
function sizeOf(cls: string): number {
  const arb = cls.match(/text-\[(\d+)px\]/);
  if (arb) return Number(arb[1]);
  const m = cls.match(/(?:^|\s)text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)(?:\s|$)/);
  return m ? SIZE_PX[m[1]] : 16; // no size class => inherits; 16px is the body default
}
const isBold = (cls: string) => /font-(bold|extrabold|black)/.test(cls);
const thresholdFor = (cls: string) => {
  const px = sizeOf(cls);
  return px >= 24 || (px >= 18.66 && isBold(cls)) ? 3.0 : 4.5;
};

// ---- discover the pairs actually painted ---------------------------------
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

type Pair = { fg: string; bg: string; threshold: number; where: string };
const pairs = new Map<string, Pair>();

for (const abs of walk(join(root, "src"))) {
  const rel = relative(root, abs).split(String.fromCharCode(92)).join("/");
  for (const raw of readFileSync(abs, "utf8").split("\n")) {
    if (raw.includes("aria-hidden")) continue; // decorative: not text for SC 1.4.3
    // Every string literal that names a colour class, NOT only `className="..."`.
    // The first version of this gate matched className attributes only, and missed
    //     className={clears ? "font-semibold text-almi-teal" : "..."}
    // which is precisely where the verdict colours live: the status ternaries. A sabotage
    // reverting one of those to the failing token stayed green, so the scan was widened to
    // any quoted or templated literal mentioning a colour class - ternaries, lookup maps
    // (ProgressSection keeps one), and helper functions included.
    for (const cm of raw.matchAll(/"([^"]*text-almi-[^"]*)"|`([^`]*text-almi-[^`]*)`|'([^']*text-almi-[^']*)'/g)) {
      const cls = cm[1] ?? cm[2] ?? cm[3] ?? "";
      for (const fm of cls.matchAll(/(?:^|\s|:)text-(almi-[a-z-]+?)(?:\/(\d+))?(?![-a-zA-Z0-9])/g)) {
        const fgName = fm[1];
        const fgHex = TOKENS.get(fgName);
        if (!fgHex) continue; // not a colour token (text-sm, text-left, ...)
        // The surface: a bg in the same className, else dark for -on-dark text, else the page.
        const bm = cls.match(/(?:^|\s|:)bg-(almi-[a-z-]+?)(?:\/(\d+))?(?![-a-zA-Z0-9])/);
        let bgHex = fgName.endsWith("-on-dark") ? DARKEST : PAGE_BG;
        if (bm && TOKENS.has(bm[1])) {
          bgHex = bm[2] ? composite(TOKENS.get(bm[1])!, Number(bm[2]) / 100, PAGE_BG) : TOKENS.get(bm[1])!;
        }
        const fgFinal = fm[2] ? composite(fgHex, Number(fm[2]) / 100, bgHex) : fgHex;
        const threshold = thresholdFor(cls);
        const key = `${fgFinal}|${bgHex}|${threshold}`;
        if (!pairs.has(key)) pairs.set(key, { fg: fgFinal, bg: bgHex, threshold, where: rel });
      }
    }
  }
}

// globals.css declares link colour outside any className.
const proseRule = css.match(/\.learn-prose\s+a\s*\{[^}]*\}/);
if (!proseRule) failures.push(".learn-prose a rule not found — this gate is looking in the wrong place");
else {
  const m = proseRule[0].match(/color:\s*var\(--color-(almi-[a-z-]+)\)/);
  if (!m || !TOKENS.has(m[1])) failures.push(`.learn-prose a does not paint from a token: ${proseRule[0].replace(/\s+/g, " ")}`);
  else pairs.set(`prose|${m[1]}`, { fg: TOKENS.get(m[1])!, bg: PAGE_BG, threshold: 4.5, where: "globals.css .learn-prose a" });
}

if (pairs.size === 0) failures.push("no colour pairs were discovered — the scan found nothing to check");

for (const p of pairs.values()) {
  const r = contrast(p.fg, p.bg);
  if (r < p.threshold) {
    failures.push(
      `${p.fg} on ${p.bg} is ${r.toFixed(2)}:1 — needs ${p.threshold}:1 ` +
      `(${p.threshold === 3 ? "large text" : "normal-weight text under 24px; font-semibold is 600 and does not qualify as bold"}). ` +
      `First seen in ${p.where}.`);
  }
}

if (failures.length) {
  console.error("\n❌ CONTRAST GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
const worst = [...pairs.values()].reduce((a, p) => Math.min(a, contrast(p.fg, p.bg) / p.threshold), Infinity);
console.log(
  `✅ contrast gate: ${TOKENS.size} tokens parsed, ${pairs.size} foreground×background pairs discovered ` +
  `from the source, all at or above their WCAG threshold (tightest is ${worst.toFixed(2)}× its ` +
  `requirement). Ratios computed here from token values — no approved-colour list.`,
);
