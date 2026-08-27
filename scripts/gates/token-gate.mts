// TOKEN GATE — engine numbers rendered into /learn markdown stay equal to the engine.
//
//   npm run gate:token          normal
//   npm run gate:token:full     also enforce "no dead tokens" (see check 2)
//
// ── WHAT THIS GUARDS ────────────────────────────────────────────────────────
// Markdown cannot import. Three of the nine /guides pages rendered live scoring constants; the
// token mechanism (src/lib/learn/tokens.ts) lets markdown do the same. That mechanism is only
// worth having if the rendered number provably still equals the constant — otherwise it is a
// more elaborate way of hardcoding, with the drift hidden behind braces.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TOKENS, tokensIn, unknownTokensIn, renderTokens } from "../../src/lib/learn/tokens.ts";
import { getAllArticles, CONTENT_DIR } from "../../src/lib/learn/articles.ts";

const FULL = process.argv.includes("--expect-full");

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("Token gate — rendered engine numbers equal the engine\n");

const files = existsSync(CONTENT_DIR)
  ? readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md")).sort()
  : [];

// ── 1. EVERY TOKEN IN THE CORPUS RESOLVES ───────────────────────────────────
// Armed over ALL of content/learn/, not over a list of files known to use tokens. The 52
// articles arrive carrying PLAIN LITERALS — writers do not write tokens — and are converted in a
// later pass, so this must keep passing on a corpus that is currently token-light while still
// catching the first typo the day one appears.
console.log("1. every token in content/learn/ resolves:");
{
  let seen = 0;
  const bad: string[] = [];
  for (const f of files) {
    const raw = readFileSync(join(CONTENT_DIR, f), "utf8");
    seen += tokensIn(raw).length;
    for (const t of unknownTokensIn(raw)) bad.push(`${f}: {{${t}}}`);
  }
  if (bad.length) {
    for (const b of bad) fail(`${b} is not in the allowlist — it would render as literal braces on a public page`);
  } else {
    ok(`${seen} token use${seen === 1 ? "" : "s"} across ${files.length} file${files.length === 1 ? "" : "s"}, all resolve`);
  }
  // A clean sweep over an empty corpus is not a pass. Say what was actually measured.
  if (files.length === 0) fail("content/learn/ has no .md files — check 1 measured nothing");
  else if (seen === 0) console.log(`  · corpus is token-light (0 uses) — check 1 passed over no tokens`);
}

// ── 2. NO DEAD TOKENS ───────────────────────────────────────────────────────
// Deliberately gated behind --expect-full, exactly as the content gate's per-section counts are.
// Until the 52 articles land and their literals are converted, most of the allowlist is unused by
// design; failing on that would force the mechanism to be built page-by-page, which is the thing
// the corpus-wide scope exists to avoid. Run with --expect-full to enforce it.
console.log("\n2. no dead tokens (allowlisted but never used):");
{
  const seenNames = new Set(files.flatMap((f) => tokensIn(readFileSync(join(CONTENT_DIR, f), "utf8"))));
  // Count only ALLOWLISTED names. Counting every name seen would let an unknown token inflate
  // the tally, so the line could read "15/15 used" while also naming one that is not.
  const used = new Set([...seenNames].filter((t) => t in TOKENS));
  const dead = Object.keys(TOKENS).filter((t) => !used.has(t));
  if (!FULL) {
    console.log(`  · not enforced: corpus is token-light until the content drop converts literals.`);
    console.log(`    ${used.size}/${Object.keys(TOKENS).length} tokens used${dead.length ? `; unused: ${dead.join(", ")}` : ""}`);
    console.log(`    run \`npm run gate:token:full\` to enforce`);
  } else if (dead.length) {
    fail(`${dead.length} allowlisted token${dead.length === 1 ? " is" : "s are"} never used and should be deleted: ${dead.join(", ")}`);
  } else {
    ok(`all ${Object.keys(TOKENS).length} allowlisted tokens are used`);
  }
}

// ── 3. THE RENDERED VALUE EQUALS THE CONSTANT ───────────────────────────────
// 🔴 THIS IS THE CHECK THAT MATTERS, AND IT MUST NOT READ WHAT IT IS TESTING.
//
// The PR #38 lesson: a check fed the value it tests proves nothing. `TOKENS.X.value === X` is
// `X === X`. Comparing a rendered page against TOKENS.X.value is the same tautology with an extra
// step — both sides trace back to the same import, so changing the engine changes BOTH and the
// check stays green while the published number silently moves.
//
// So the expected values below are LITERALS, typed here by hand. Nothing imports them. Changing
// a constant in the engine turns this red, and the only way to make it green again is to come
// here, read what changed, and agree to it in a diff a reviewer can see.
//
// If you are here because the gate went red: do NOT edit the number below to match the engine
// without checking the prose. These numbers appear in sentences that describe them — "four
// sections out of 12", "48-point total" — and a floor that moves silently leaves the sentence
// around it wrong.
const EXPECTED: Record<string, number> = {
  CILS_B1C_SECTION_MAX: 12,
  CILS_B1C_TOTAL_MAX: 48,
  CILS_B1C_FLOOR: 7,
  CILS_B1C_TOTAL_FLOOR: 28,
  CILS_B1C_SCRITTA_MIN_WORDS: 80,
  CILS_B1C_SCRITTA_MAX_WORDS: 120,
  CILS_STANDARD_SECTION_MAX: 20,
  CILS_STANDARD_FLOOR: 11,
  CILS_STANDARD_TOTAL_MAX: 100,
  CELI_DUE_WRITTEN_MAX: 120,
  CELI_DUE_WRITTEN_MIN: 72,
  CELI_DUE_ORAL_MAX: 40,
  CELI_DUE_ORAL_MIN: 22,
  CELI_DUE_TOTAL_MAX: 160,
  CELI_DUE_PASS_FLOOR: 94,
};

console.log("\n3. rendered value equals an independently-pinned expected value:");
{
  // The allowlist and the pinned table must describe the same set, or a token could be added and
  // never pinned — check 3 would then pass over it without ever looking at it.
  const allow = Object.keys(TOKENS).sort();
  const pinned = Object.keys(EXPECTED).sort();
  const unpinned = allow.filter((t) => !pinned.includes(t));
  const stale = pinned.filter((t) => !allow.includes(t));
  if (unpinned.length) fail(`token${unpinned.length === 1 ? "" : "s"} in the allowlist with no pinned expected value: ${unpinned.join(", ")} — check 3 would skip ${unpinned.length === 1 ? "it" : "them"}`);
  if (stale.length) fail(`pinned expected value${stale.length === 1 ? "" : "s"} for token${stale.length === 1 ? "" : "s"} that no longer exist: ${stale.join(", ")}`);
  if (!unpinned.length && !stale.length) ok(`allowlist and pinned table cover the same ${allow.length} tokens`);

  // Render through the REAL substitution path — the same function the article page calls — and
  // compare the produced digits against the literal above.
  let mismatches = 0;
  for (const [name, want] of Object.entries(EXPECTED)) {
    if (!(name in TOKENS)) continue;
    const got = renderTokens(`{{${name}}}`, "token-gate probe");
    if (got !== String(want)) {
      fail(`{{${name}}} renders "${got}", expected "${want}" — the engine constant ${TOKENS[name].constant} (${TOKENS[name].source}) has changed. Read the prose that quotes it before you update this gate.`);
      mismatches++;
    }
  }
  if (!mismatches) ok(`all ${Object.keys(EXPECTED).length} tokens render their pinned value`);

  // And through the real LOADER, on the real corpus, so the check covers the path a page
  // actually takes rather than only the substitution function in isolation.
  // The loader THROWS on an unknown token (by design — see tokens.ts). Check 1 has already named
  // that file and that token, so catch it here and fail cleanly: a gate that ends in a stack
  // trace instead of a sentence is a gate people start ignoring.
  try {
    const arts = getAllArticles();
    const leftover = arts.filter((a) => /\{\{[A-Z0-9_]+\}\}/.test(a.body + a.title + a.description));
    if (leftover.length) fail(`${leftover.length} article(s) still contain unresolved braces after loading: ${leftover.map((a) => a.slug).join(", ")}`);
    else ok(`${arts.length} article(s) load with no unresolved token left in title, description or body`);
  } catch (e) {
    fail(`the loader refused the corpus: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
  }
}

// ── 4. THE CONSTANT IS LOAD-BEARING, NOT DECORATIVE ─────────────────────────
// CILS_B1C_SCRITTA_MIN/MAX_WORDS were added so the scritta window could be a token. A constant
// that exists only to feed a token is decoration: nothing would notice if the ITEMS drifted away
// from it. #38 corrected this window in the DATA, so tie the two together.
console.log("\n4. the scritta window constant matches the items it describes:");
{
  const dir = "src/data";
  const rows: { file: string; min: number; max: number | undefined }[] = [];
  for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith(".json")) : []) {
    let j: unknown;
    try { j = JSON.parse(readFileSync(join(dir, f), "utf8")); } catch { continue; }
    const arr = (Array.isArray(j) ? j : ((j as { items?: unknown[] }).items ?? [])) as Record<string, never>[];
    for (const it of arr) {
      const rec = it as unknown as { exam?: string; section?: string; payload?: { minWords?: number; maxWords?: number } };
      const p = rec.payload ?? (it as unknown as { minWords?: number; maxWords?: number });
      if (rec.exam === "CILS_B1C" && typeof p.minWords === "number") {
        rows.push({ file: f, min: p.minWords, max: p.maxWords });
      }
    }
  }
  if (rows.length === 0) {
    fail("no CILS_B1C writing items found — check 4 measured nothing, so it cannot have passed");
  } else {
    const bad = rows.filter((r) => r.min !== EXPECTED.CILS_B1C_SCRITTA_MIN_WORDS || r.max !== EXPECTED.CILS_B1C_SCRITTA_MAX_WORDS);
    if (bad.length) fail(`${bad.length}/${rows.length} CILS_B1C writing item(s) do not carry ${EXPECTED.CILS_B1C_SCRITTA_MIN_WORDS}-${EXPECTED.CILS_B1C_SCRITTA_MAX_WORDS} words — the token would publish a window the items do not use`);
    else ok(`all ${rows.length} CILS_B1C writing items carry ${EXPECTED.CILS_B1C_SCRITTA_MIN_WORDS}-${EXPECTED.CILS_B1C_SCRITTA_MAX_WORDS} words`);
  }
}

// ── 5. TOKENS CARRY VALUES, NEVER CLAIMS ────────────────────────────────────
// The rule from #39, made mechanical: a token must not be able to render the word "official"
// onto one of OUR derived thresholds. Numbers cannot carry a claim; prose can.
console.log("\n5. every token resolves to a number, never prose:");
{
  const prose = Object.entries(TOKENS).filter(([, e]) => typeof e.value !== "number" || !Number.isFinite(e.value));
  if (prose.length) fail(`token(s) with a non-numeric value: ${prose.map(([k]) => k).join(", ")} — a token that can render a sentence can render a claim`);
  else ok(`all ${Object.keys(TOKENS).length} tokens resolve to a finite number`);
}

console.log("");
if (failed) {
  console.error("Token gate FAILED\n");
  process.exit(1);
}
console.log("Token gate passed\n");
