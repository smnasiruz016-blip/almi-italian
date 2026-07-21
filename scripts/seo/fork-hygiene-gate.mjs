// Build-time FORK HYGIENE GATE — the AlmiWorld §7 rule, enforced instead of trusted.
//
// WHY THIS EXISTS. This repo's lineage is:
//   almi-celpip → almi-goethe → almi-japanese → almi-korean → almi-italian (you are here)
// and every hop leaked the previous product's facts into user-facing copy. Real
// examples found in THIS repo, not hypotheticals:
//   • src/lib/auth.ts wrote SESSION_COOKIE = "almi_korean_session" — every visitor to an
//     Italian product carried the KOREAN product's cookie name in their browser, inherited
//     unchanged through the fork and invisible to every check we had (renamed 2026-07-20).
//   • The scoring-comparison guide explained CILS bands by contrasting them with JLPT and
//     TOPIK levels — the Japanese and Korean ancestors' exams, presented to Italian
//     learners as if relevant (scoped to Italian exams in PR #28, 2026-07-21).
//
// The lesson: a grep for the previous language's nouns is NOT enough, because the
// dangerous cases are the ones where the LABEL was localized and the FACT was not.
// So this gate bans the ancestors' proper nouns outright — an Italian product has no
// reason to name a Korean exam, a Japanese authority, or a German certificate.
//
// Runs FIRST in the build and FAILS it on any hit. If a future fork descends from this
// repo, RE-CUT BANNED in BOTH directions: ADD the Italian nouns (CILS, CELI, Cittadinanza,
// Università per Stranieri...) — the moment Italy becomes an ancestor they become leaks —
// and REMOVE whatever the new language legitimately owns. Inheriting this list unchanged
// is itself a fork bug.
//
// ⚠️ WHAT IS DELIBERATELY *NOT* BANNED HERE — read before adding to BANNED:
//
//   1. Bare LANGUAGE names ("Korean", "Japanese", "German" / "Coreano", "Giapponese",
//      "Tedesco"). src/data/origins.json ships a langLabel per origin country because the
//      product is built as a per-origin weave: a learner FROM South Korea or Germany
//      studying Italian is the audience, and "Korean"/"German" are their native-language
//      labels. Six rows carry them (north-korea, south-korea, austria, germany,
//      liechtenstein, switzerland). Banning the bare language word would fail the gate on
//      six pieces of correct content on day one.
//   2. Bare COUNTRY names ("Korea", "Japan", "Germany", "Canada" / "Corea", "Giappone",
//      "Germania"). Same reason, plus geography items legitimately name countries.
//   3. "German" inside real Italian institutional data. src/data/it-courses.json contains
//      "Transnational German Studies" — an actual degree at the Università di Palermo,
//      from the public course registry. It is Italian content that happens to contain an
//      ancestor's language word.
//
// A language, country, or third-party course name as CONTENT is not a fork leak; only an
// ancestor's EXAM / AUTHORITY / INSTITUTION / PRODUCT / LOCALE noun is. Banning the broad
// words would fail the gate on correct content, and a gate that cries wolf gets switched off.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts", "prisma"];
const SCAN_EXT = /\.(ts|tsx|js|mjs|mts|json|prisma|css|md)$/;

// Files allowed to mention an ancestor noun, with the reason. Kept deliberately tiny —
// every entry is a hole in the gate.
const ALLOWLIST = new Map([
  // This gate documents the exact leaks it prevents.
  ["scripts/seo/fork-hygiene-gate.mjs", "documents the banned nouns"],
]);

// ── EXPIRING PER-LINE ESCAPES ────────────────────────────────────────────────
// A narrow, auditable, DATED hole. Not a blanket "hygiene-allow" marker: a bare marker
// anyone can paste onto any line is how a gate quietly stops gating. An escape here must
// match on THREE things — the file, the exact banned term, AND an id marker written on
// that one line — so it covers exactly one occurrence and nothing else in the same file.
//
// Every escape carries an expiry. The gate FAILS once the date passes, so the hole closes
// on a deadline that is wired into the build rather than hoped for. Escapes are always
// printed on success — a hole nobody is reminded of is a hole nobody closes.
const EXPIRING_ESCAPES = [
  {
    id: "legacy-cookie-almi_korean",
    file: "src/lib/auth.ts",
    term: "almi_korean_session",
    reason:
      "read-only legacy session cookie inherited from the almi-korean fork; the current " +
      "cookie is almi_italian_session (renamed 2026-07-20). Dropping the legacy NAME before " +
      "the old cookies expire would not log anyone out (sessions resolve by tokenHash) but " +
      "the read costs nothing and keeps the rename provably zero-logout.",
    // Legacy cookies were issued with a 30-day life (SESSION_DURATION_MS) and the rename
    // shipped 2026-07-20, so every one of them is dead by 2026-08-20. Same date as the
    // scheduled Aug-2026 cookie-cleanup task and the 🔴 REMOVAL note in src/lib/auth.ts —
    // deliberately identical so the three cannot drift apart.
    expires: "2026-08-20",
  },
];

/** Marker that must appear on the escaped line itself, e.g.
 *  `// hygiene-allow: legacy-cookie-almi_korean` */
const escapeMarker = (id) => `hygiene-allow: ${id}`;

// Build-time "today". Compared as YYYY-MM-DD strings, which sort lexicographically.
const TODAY = new Date().toISOString().slice(0, 10);

// ── BANNED ───────────────────────────────────────────────────────────────────
// Ancestor proper nouns. An Italian product naming any of these is a fork leak.
// ⚠️ PRODUCT-SPECIFIC — RE-CUT AT EVERY FORK, IN BOTH DIRECTIONS. Bare language and
// country names are NOT here on purpose (see the header). Italian's OWN nouns (CILS, CELI,
// Cittadinanza, PLIDA, Università per Stranieri di Siena/Perugia, Comprensione della
// lettura/dell'ascolto...) must NEVER be added — they are this product's subject matter.
const BANNED = [
  // — Korean (the IMMEDIATE ancestor) — exam / authority / script nouns —
  "한국어", "한국어능력시험", "국립국제교육원", "세종학당",
  "King Sejong Institute", "EPS-TOPIK",
  "ko-KR",
  // — Japanese — exam / authority / script nouns —
  "日本語", "日本語能力試験", "国際交流基金", "Japan Foundation",
  "ja-JP",
  // — German (Goethe lineage) — Italian teaches no German; institution/exam/locale nouns are leaks —
  "Goethe-Institut", "Goethe-Zertifikat", "Goethe Institut",
  "de-DE",
  // — CELPIP (root ancestor) — Canadian English exam —
  "Paragon Testing", "Canadian Language Benchmark",
  "en-CA",
  // Sibling/ancestor PRODUCT names are appended below — GENERATED, not hand-listed.
];

// ── Ancestor product names, in every form a slug can ship in ─────────────────
// Hand-listing these was itself a fork bug in the lineage: a list carried "almi-x"
// (hyphen) but not "almi_x" (underscore), and an underscore identifier — a session
// cookie, a CSS class — sailed through the gate meant to ban it. That is not a
// hypothetical here: THIS repo shipped `almi_korean_session`, the underscore form, in
// every visitor's browser. A grep does not know that `almi-x` and `almi_x` are the same
// idea. So name the products once and let the code enumerate the spellings.
const ANCESTOR_PRODUCTS = ["celpip", "goethe", "japanese", "korean"];
/** Every form a product slug ships in: almi-x · almi_x · almix · AlmiX. */
function productNameForms(p) {
  return [`almi-${p}`, `almi_${p}`, `almi${p}`, `Almi${p[0].toUpperCase()}${p.slice(1)}`];
}
/** Product-name forms are matched CASE-INSENSITIVELY — `AlmiKorean`, `almikorean` and
 *  `ALMI_KOREAN` are the same leak, and casing is exactly what a careless rename varies. */
const slugForms = [];
for (const p of ANCESTOR_PRODUCTS) slugForms.push(...productNameForms(p));
// Display names the generator cannot derive from a plain capitalisation. Keep SHORT.
slugForms.push("AlmiCELPIP");
// Deduped case-insensitively: `AlmiKorean` and `almikorean` are the same needle once
// matching ignores case, and leaving both would report every hit twice.
const BANNED_SLUG = [...new Set(slugForms.map((s) => s.toLowerCase()))];

// Acronyms need word boundaries — they collide with ordinary substrings. Matched
// case-insensitively so a lowercased `topik` cannot walk past a capitalised list.
// ⚠️ CILS, CELI and PLIDA are Italy's OWN exams — they are DELIBERATELY ABSENT. The
// ancestor gates ban what for THIS product is the subject matter; that inversion is the
// whole point of re-cutting the list at every fork.
const BANNED_WORD = ["TOPIK", "JLPT", "CELPIP", "CLB", "NIIED", "JEES", "TestDaF", "telc"];

// SELF-CHECK. A blanket find-replace of an ancestor's product name across the repo can
// also rewrite THIS list, making the gate ban "AlmiItalian" — this product's own name —
// and report a leak storm of false positives (swiss hit exactly this, 90 of them). A
// careless global replace is the very thing this gate exists to catch, so assert it
// outright rather than relying on someone noticing the count moved the wrong way.
const SELF_NAMES = ["AlmiItalian", "almi-italian", "almi_italian", "almiitalian"];
for (const n of SELF_NAMES) {
  if ([...BANNED, ...BANNED_SLUG, ...BANNED_WORD].some((b) => b.toLowerCase() === n.toLowerCase())) {
    console.error("");
    console.error(`FORK-HYGIENE GATE IS MISCONFIGURED: the banned list contains "${n}", which is THIS product's own name.`);
    console.error("Every legitimate mention of ourselves would be reported as an ancestor leak.");
    console.error("Almost certainly a global find-replace that rewrote the banned list. Fix the list.");
    console.error("");
    process.exit(2);
  }
}

// ── Scanning machinery (the real-entity-gate design: strip comments, scan STRING
//    values, never raw JSON). COMMENTS ARE NOT SCANNED — a comment naming an ancestor
//    is documentation, usually the note explaining the fork so it is not mistaken for
//    original work. STRING LITERALS ARE SCANNED — they are the copy that ships.

// The stripper tracks string state so a `//` inside "https://…" is not mistaken for a
// comment — the common way a naive stripper eats real copy.
function stripComments(text) {
  let out = "";
  let i = 0;
  let quote = null;
  let inLine = false;
  let inBlock = false;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (inLine) {
      if (c === "\n") { inLine = false; out += c; }
      else out += " ";
      i++; continue;
    }
    if (inBlock) {
      if (c === "*" && n === "/") { inBlock = false; out += "  "; i += 2; continue; }
      out += c === "\n" ? c : " ";
      i++; continue;
    }
    if (quote) {
      if (c === "\\") { out += text.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { inLine = true; out += "  "; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; out += "  "; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

// Prisma comments are `//` and `///` — NOT `#` (a common wrong assumption; the swiss
// original stripped `#` and so scanned prisma's `//` provenance comments as if they were
// shipping copy, flagging every "forked from AlmiCELPIP" note). stripComments handles
// `//` while respecting string literals, so prisma reuses it. CSS block comments are
// `/* */` and are handled by the same stripper.

// JSON is scanned as PARSED STRING VALUES: scanning raw JSON text matches escape
// sequences rather than content (an escaped newline is a backslash and an "n", which
// silently breaks word-boundary matching), and a gate that scans the wrong thing has
// never truly been red.
function jsonStrings(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const v of node) jsonStrings(v, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) jsonStrings(v, out);
  return out;
}

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e === ".git") continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(e)) out.push(full);
  }
  return out;
}

const violations = [];
/** Escapes actually used, so they can be surfaced on success. */
const escapesUsed = new Map();
const expiredEscapes = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    const raw = readFileSync(file, "utf8");
    let text;
    if (rel.endsWith(".json")) {
      try { text = jsonStrings(JSON.parse(raw)).join("\n"); }
      catch { text = raw; }   // malformed JSON: fall back rather than skip silently
    } else {
      text = stripComments(raw);
    }
    const lines = text.split(/\r?\n/);
    // The escape marker lives in a TRAILING COMMENT, so it must be read from the RAW
    // line — stripping comments removed the marker along with them.
    const rawLines = raw.split(/\r?\n/);

    /** An escape applies only if the FILE matches, the escaped TERM is present on that
     *  line, and the line carries the escape's id MARKER. All three, or no escape.
     *
     *  Note it does NOT compare against the detected term: a single string trips several
     *  banned entries at once (`almi_korean_session` contains the slug `almi_korean`), and
     *  keying on whichever one happened to fire first would leave the others unescaped.
     *  Anchoring on the escape's own term keeps the hole exactly one line wide — a fresh
     *  write of the same cookie elsewhere carries no marker and still fails. */
    function escapeFor(lineNo) {
      const rawLine = rawLines[lineNo] ?? "";
      return EXPIRING_ESCAPES.find(
        (e) => e.file === rel && rawLine.includes(e.term) && rawLine.includes(escapeMarker(e.id)),
      );
    }

    function record(term, i, line) {
      const esc = escapeFor(i);
      if (esc) {
        if (TODAY > esc.expires) {
          expiredEscapes.push({ ...esc, where: `${rel}:${i + 1}` });
        } else {
          escapesUsed.set(esc.id, { ...esc, where: `${rel}:${i + 1}` });
        }
        return;
      }
      violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
    }

    lines.forEach((line, i) => {
      for (const term of BANNED) {
        if (line.includes(term)) record(term, i, line);
      }
      for (const term of BANNED_SLUG) {
        if (line.toLowerCase().includes(term.toLowerCase())) record(term, i, line);
      }
      for (const term of BANNED_WORD) {
        if (new RegExp(`\\b${term}\\b`, "i").test(line)) record(term, i, line);
      }
    });
  }
}

// An escape that matches nothing is a hole left open over a leak that is already gone.
// Fail on it: the entry must be deleted, not left lying around for the next fork to
// inherit as a pre-authorised exception.
const unusedEscapes = EXPIRING_ESCAPES.filter(
  (e) => !escapesUsed.has(e.id) && !expiredEscapes.some((x) => x.id === e.id),
);

if (expiredEscapes.length) {
  console.error("\n✗ FORK HYGIENE GATE FAILED — an escape has EXPIRED.\n");
  for (const e of expiredEscapes) {
    console.error(`  ${e.where}  "${e.term}"  escape "${e.id}" expired ${e.expires} (today ${TODAY})`);
    console.error(`      ${e.reason}`);
  }
  console.error("\n  The deadline was the point. Remove the ancestor reference, then delete");
  console.error("  its entry from EXPIRING_ESCAPES. Extending the date is not the fix.\n");
  process.exit(1);
}

if (violations.length) {
  console.error("\n✗ FORK HYGIENE GATE FAILED — ancestor content found.\n");
  console.error("  Italy must read as Italy. These are leaks from the fork lineage");
  console.error("  (celpip → goethe → japanese → korean → italian).\n");
  for (const v of [...new Set(violations)]) console.error(`  ${v}`);
  console.error(`\n  ${violations.length} violation(s). Fix the FACT, not just the label —`);
  console.error("  the worst leaks are the ones where only the language word was swapped.\n");
  process.exit(1);
}

// Checked LAST, so a real leak is reported before this bookkeeping complaint: when the
// marker is missing from an escaped line, that line is ALSO a violation, and the leak is
// the more useful message.
if (unusedEscapes.length) {
  console.error("\n✗ FORK HYGIENE GATE FAILED — an escape matches nothing.\n");
  for (const e of unusedEscapes) {
    console.error(`  escape "${e.id}" expects "${e.term}" in ${e.file}, but no such line carries its marker.`);
  }
  console.error("\n  The leak it covered is gone (or moved). Delete the entry — a standing");
  console.error("  exception nobody needs is a pre-authorised hole for the next fork.\n");
  process.exit(1);
}

console.log(`✓ Fork hygiene gate: clean (no ancestor nouns across ${SCAN_DIRS.join(", ")}).`);
if (escapesUsed.size) {
  console.log(`  ${escapesUsed.size} intentional legacy escape(s), each on a deadline:`);
  for (const e of escapesUsed.values()) {
    console.log(`    • ${e.where} → "${e.term}" (${e.id}), expires ${e.expires}`);
  }
}
