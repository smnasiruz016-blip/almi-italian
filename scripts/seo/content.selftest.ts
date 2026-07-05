// AlmiItalian Phase-3 CONTENT exclusion tests (the copy-level invariants the .mjs can't see because
// they are derived in TS). Asserts the 13 exam-level surfaces + scales-never-mixed-in-copy, pulling
// from the same engine constants the app uses. Run:  tsx scripts/seo/content.selftest.ts
import { EXAM_LEVELS, DESCENT } from "../../src/lib/seo/data";

let failed = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error("✗ " + m); failed++; } else console.log("✓ " + m); };

// 13 surfaces: 7 CILS (6 standard + B1c) + 6 CELI.
ok(EXAM_LEVELS.length === 13, `13 exam-level surfaces (got ${EXAM_LEVELS.length})`);
const cils = EXAM_LEVELS.filter((l) => l.exam === "CILS");
const celi = EXAM_LEVELS.filter((l) => l.exam === "CELI");
ok(cils.length === 7, `7 CILS surfaces incl. B1 Cittadinanza (got ${cils.length})`);
ok(celi.length === 6, `6 CELI surfaces (got ${celi.length})`);
ok(EXAM_LEVELS.some((l) => l.slug === "cils-b1-cittadinanza"), "CILS B1 Cittadinanza present");
ok(new Set(EXAM_LEVELS.map((l) => l.slug)).size === 13, "13 unique level slugs");

// SCALES NEVER MIXED IN COPY: a CILS rule line must not carry CELI's scale vocabulary, and vice versa.
const CELI_MARKERS = ["/200", "/130", "/160", "/32", "A–E band", "part banks", "P/N", "pass (P)"];
const CILS_MARKERS = ["capitalise (bank)", "all-or-nothing", "5 sections", "4 sections"];
ok(cils.every((l) => !CELI_MARKERS.some((m) => l.ruleLine.includes(m))), "no CELI scale vocabulary in any CILS rule line");
ok(celi.every((l) => !CILS_MARKERS.some((m) => l.ruleLine.includes(m))), "no CILS scale vocabulary in any CELI rule line");

// B1c is the all-or-nothing flagship — its copy must say so, and must NOT offer banking.
const b1c = EXAM_LEVELS.find((l) => l.slug === "cils-b1-cittadinanza")!;
ok(/all-or-nothing/i.test(b1c.ruleLine) && /NO banking/i.test(b1c.ruleLine), "B1c copy states all-or-nothing + NO banking");
// The 28/48 + floor 7 numbers must come through from the engine constants (not a stray literal).
ok(b1c.ruleLine.includes("28/48") && b1c.ruleLine.includes("7/12"), "B1c copy carries the engine floors (7/12 each AND 28/48)");

// CELI Impatto (A1) uses the overall-threshold wording; the others use both-parts wording.
const impatto = EXAM_LEVELS.find((l) => l.slug === "celi-impatto-a1")!;
ok(/one overall mark/i.test(impatto.ruleLine) && impatto.ruleLine.includes("out of 32") && /pass \(P\)/.test(impatto.ruleLine), "CELI Impatto copy = overall total (out of 32) → P/N");
ok(EXAM_LEVELS.find((l) => l.slug === "celi-5-c2")!.ruleLine.includes("/200"), "CELI 5 copy carries its /200 total from config");

// Descent family stays 7 + 4 (never ×196).
ok(DESCENT.tier1.length === 7 && DESCENT.proposed.length === 4, "descent = 7 tier-1 + 4 proposed");

if (failed) { console.error(`\n${failed} content assertion(s) FAILED`); process.exit(1); }
console.log("\nAll Phase-3 content (scales-never-mixed) tests passed.");
