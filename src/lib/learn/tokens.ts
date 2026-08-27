// ENGINE NUMBERS IN MARKDOWN — a closed allowlist, resolved at render time.
//
//   content/learn/*.md   {{CILS_B1C_FLOOR}}      ->   7
//                                                    ^ read from src/lib/scoring, at runtime
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// Three of the nine /guides pages IMPORT live scoring constants and render them (13 renders in
// total). Markdown cannot import. Converting those pages to markdown with the numbers typed in
// as literals would undo exactly what #38 and #39 spent two tasks making honest: the numbers
// would stop tracking the engine, and the first change to a floor would leave the prose wrong
// and silent.
//
// The alternative — keeping three TSX pages inside a 52-file markdown corpus — forks the loader,
// the content gate, the hub listing and the sitemap scan. Four forks to avoid one mechanism.
//
// ── THE RULES THIS FILE ENFORCES BY CONSTRUCTION ────────────────────────────
// 1. CLOSED. Only tokens in TOKENS resolve. An unknown token is not silently left as text and
//    not blanked — scripts/gates/token-gate.mts fails the build on it. A typo must never ship as
//    a literal "{{CILS_B1C_FLOR}}" on a public page.
//
// 2. NO EXPRESSIONS. A token is a name. There is no arithmetic, no formatting, no nesting and no
//    free-form lookup into the scoring module. `{{FLOOR}}/{{SECTION_MAX}}` is written as two
//    tokens and a slash, in the prose, where a human can read it.
//
// 3. 🔴 VALUES, NEVER CLAIMS. Every entry's `value` is a NUMBER, asserted below and re-asserted
//    by the gate. This is the mechanical form of the rule from #39: a token must never be able to
//    render the word "official" onto one of OUR derived thresholds. CILS_B1C_FLOOR_DISCLOSURE is
//    deliberately NOT a token — the 7/12 and >=28/48 admission stays written prose on every page
//    that shows those numbers, so a writer cannot summon the disclosure with a name and cannot
//    accidentally omit it either.
//
// `verified` mirrors CILS_B1C_SOURCING and celi.ts's own convention: it records whether the
// awarding body publishes the number. It is metadata for the gate and for reviewers. It is NOT
// rendered — a token emits its digits and nothing else.

import {
  CILS_B1C_SECTION_MAX,
  CILS_B1C_TOTAL_MAX,
  CILS_B1C_FLOOR,
  CILS_B1C_TOTAL_FLOOR,
  CILS_B1C_SCRITTA_MIN_WORDS,
  CILS_B1C_SCRITTA_MAX_WORDS,
  CILS_STANDARD_SECTION_MAX,
  CILS_STANDARD_FLOOR,
  CILS_STANDARD_TOTAL_MAX,
  CELI_CONFIG,
} from "@/lib/scoring";

/**
 * CELI_CONFIG's numeric fields are typed `number | null` — a level that is not yet verified may
 * legitimately have none. A token cannot render null, so assert rather than cast: `as number`
 * would let a null through to the page as the string "null", which is exactly the kind of
 * silent wrong value the mechanism exists to prevent. This throws at module load, so a build
 * fails instead of a page publishing nonsense.
 */
function num(v: number | null, what: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`learn/tokens: ${what} is ${String(v)}, not a finite number — it cannot back a token`);
  }
  return v;
}

export type TokenEntry = {
  /** The live constant's value. Always a number — see rule 3. */
  value: number;
  /** The exported identifier, for the token table and for the gate's report. */
  constant: string;
  /** Where it is declared, so a reviewer can go and read the comment above it. */
  source: string;
  /** Does the awarding body publish this number, or is it ours? Metadata only, never rendered. */
  verified: boolean;
};

/**
 * THE ALLOWLIST. Corpus-wide, not page-specific: these are the numbers the ENGINE owns, and they
 * appear across far more of the 52 articles than the three pages that import them today.
 *
 * A number that is NOT a live engine constant does not belong here — official per-criterion
 * weights, fees, session dates and body names are prose from the research briefs. See the
 * "RULED OUT" note at the bottom of this file for the ones deliberately excluded and why.
 */
export const TOKENS: Readonly<Record<string, TokenEntry>> = {
  // ── CILS B1 Cittadinanza ──────────────────────────────────────────────────
  CILS_B1C_SECTION_MAX: { value: CILS_B1C_SECTION_MAX, constant: "CILS_B1C_SECTION_MAX", source: "src/lib/scoring/cils-b1c.ts", verified: true },
  CILS_B1C_TOTAL_MAX: { value: CILS_B1C_TOTAL_MAX, constant: "CILS_B1C_TOTAL_MAX", source: "src/lib/scoring/cils-b1c.ts", verified: true },
  CILS_B1C_FLOOR: { value: CILS_B1C_FLOOR, constant: "CILS_B1C_FLOOR", source: "src/lib/scoring/cils-b1c.ts", verified: false },
  CILS_B1C_TOTAL_FLOOR: { value: CILS_B1C_TOTAL_FLOOR, constant: "CILS_B1C_TOTAL_FLOOR", source: "src/lib/scoring/cils-b1c.ts", verified: false },
  CILS_B1C_SCRITTA_MIN_WORDS: { value: CILS_B1C_SCRITTA_MIN_WORDS, constant: "CILS_B1C_SCRITTA_MIN_WORDS", source: "src/lib/scoring/cils-b1c.ts", verified: true },
  CILS_B1C_SCRITTA_MAX_WORDS: { value: CILS_B1C_SCRITTA_MAX_WORDS, constant: "CILS_B1C_SCRITTA_MAX_WORDS", source: "src/lib/scoring/cils-b1c.ts", verified: true },

  // ── CILS standard ─────────────────────────────────────────────────────────
  CILS_STANDARD_SECTION_MAX: { value: CILS_STANDARD_SECTION_MAX, constant: "CILS_STANDARD_SECTION_MAX", source: "src/lib/scoring/cils-standard.ts", verified: true },
  CILS_STANDARD_FLOOR: { value: CILS_STANDARD_FLOOR, constant: "CILS_STANDARD_FLOOR", source: "src/lib/scoring/cils-standard.ts", verified: true },
  CILS_STANDARD_TOTAL_MAX: { value: CILS_STANDARD_TOTAL_MAX, constant: "CILS_STANDARD_TOTAL_MAX", source: "src/lib/scoring/cils-standard.ts", verified: true },

  // ── CELI 2 (B1) ───────────────────────────────────────────────────────────
  // Only CELI 2 is tokenised. It is the single CELI level this product serves (TRACKS -> celi-due)
  // and the only one any current page renders. The other five levels are in CELI_CONFIG and could
  // be added the day an article needs them — adding all thirty now would ship thirty tokens that
  // nothing uses, which check 2 of the gate exists to prevent.
  CELI_DUE_WRITTEN_MAX: { value: num(CELI_CONFIG.DUE.writtenMax, "CELI_CONFIG.DUE.writtenMax"), constant: "CELI_CONFIG.DUE.writtenMax", source: "src/lib/scoring/celi.ts", verified: true },
  CELI_DUE_WRITTEN_MIN: { value: num(CELI_CONFIG.DUE.writtenMin, "CELI_CONFIG.DUE.writtenMin"), constant: "CELI_CONFIG.DUE.writtenMin", source: "src/lib/scoring/celi.ts", verified: true },
  CELI_DUE_ORAL_MAX: { value: num(CELI_CONFIG.DUE.oralMax, "CELI_CONFIG.DUE.oralMax"), constant: "CELI_CONFIG.DUE.oralMax", source: "src/lib/scoring/celi.ts", verified: true },
  CELI_DUE_ORAL_MIN: { value: num(CELI_CONFIG.DUE.oralMin, "CELI_CONFIG.DUE.oralMin"), constant: "CELI_CONFIG.DUE.oralMin", source: "src/lib/scoring/celi.ts", verified: true },
  CELI_DUE_TOTAL_MAX: { value: num(CELI_CONFIG.DUE.totalMax, "CELI_CONFIG.DUE.totalMax"), constant: "CELI_CONFIG.DUE.totalMax", source: "src/lib/scoring/celi.ts", verified: true },
  CELI_DUE_PASS_FLOOR: { value: num(CELI_CONFIG.DUE.passFloor, "CELI_CONFIG.DUE.passFloor"), constant: "CELI_CONFIG.DUE.passFloor", source: "src/lib/scoring/celi.ts", verified: true },
};

/** `{{NAME}}` — name only: letters, digits, underscore. No dots, no spaces, no arguments. */
export const TOKEN_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;

/** Every token that appears in a body, in order of appearance, duplicates included. */
export function tokensIn(body: string): string[] {
  return [...body.matchAll(TOKEN_PATTERN)].map((m) => m[1]);
}

/** Tokens in a body that are NOT in the allowlist. The gate turns a non-empty result into a
 *  build failure; the renderer throws on it. Neither silently prints the braces. */
export function unknownTokensIn(body: string): string[] {
  return [...new Set(tokensIn(body))].filter((t) => !(t in TOKENS));
}

/**
 * Substitute every token with its live value.
 *
 * THROWS on an unknown token rather than leaving it in place. A page that renders the literal
 * text "{{CILS_B1C_FLOR}}" to a learner is worse than a build that stops: the gate is the first
 * line of defence, and this is the second, for anything that reaches a render without one.
 */
export function renderTokens(body: string, where = "content"): string {
  return body.replace(TOKEN_PATTERN, (whole, name: string) => {
    const entry = TOKENS[name];
    if (!entry) {
      throw new Error(
        `${where}: unknown token ${whole}. Allowed: ${Object.keys(TOKENS).join(", ")}`,
      );
    }
    return String(entry.value);
  });
}

// ── RULED OUT, DELIBERATELY ─────────────────────────────────────────────────
// These numbers appear in the corpus and are NOT tokens, because no live constant owns them:
//
//   · 55/100 — the standard CILS B1 pass total. Siena publishes it and cils-b1c.ts cites it in
//     the derivation of our floor, but no constant exports it: the engine never scores against
//     it. Tokenising it would mean inventing a constant to feed a token, which is the tail
//     wagging the dog. It stays prose. (CILS_STANDARD_TOTAL_MAX = 100 IS a constant and IS a
//     token, so the pair renders half-tokenised — noted rather than hidden.)
//   · The Unistrasi per-criterion weights (#39's official rubric). Prose from the research
//     briefs; they live in src/lib/ai/official-rubrics.ts as a rubric shape, not as numbers a
//     page quotes.
//   · Exam fees, session dates, and the Ministry's list of certifying bodies. Facts with a date,
//     not engine state. Two of the nine guides are stale on exactly these — the corrections
//     happen in the rewrite, and a token would give a stale number a false air of being live.
//   · CILS_B1C_FLOOR_DISCLOSURE and any other prose constant. See rule 3 above.
