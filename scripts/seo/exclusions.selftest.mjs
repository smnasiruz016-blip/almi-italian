// AlmiItalian Phase-3 exclusion tests. Asserts the locked page-family math and the hard real-data
// exclusions directly against the committed datasets. Run in build:  node scripts/seo/exclusions.selftest.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = (p) => JSON.parse(readFileSync(join(root, "src", "data", p), "utf8"));

const origins = load("origins.json");
const atenei = load("it-atenei.json");
const courses = load("it-courses.json");
const centers = load("it-exam-centers.json");
const descent = load("it-descent.json");

let failed = 0;
const ok = (cond, msg) => { if (!cond) { console.error("✗ " + msg); failed++; } else console.log("✓ " + msg); };
const N = origins.length;

// ---- Origins ----
ok(N === 196, `196 origins (got ${N})`);

// ---- Family 1: atenei (active-with-current-offer only) ----
ok(atenei.length === 92, `92 active-with-offer atenei (got ${atenei.length})`);
ok(new Set(atenei.map((a) => a.slug)).size === 92, "92 unique ateneo slugs (no duplicate pages)");
ok(atenei.every((a) => a.slug && a.name), "every ateneo has a slug + name (never blank)");
ok(atenei.every((a) => ["statale", "non-statale", "telematica"].includes(a.type)), "every ateneo type ∈ {statale, non-statale, telematica}");
const tele = atenei.filter((a) => a.type === "telematica").length;
console.log(`   → ${atenei.filter((a) => a.type === "statale").length} statale · ${atenei.filter((a) => a.type === "non-statale").length} non-statale · ${tele} telematica`);

// ---- Family 2: courses ----
const ateneoSlugs = new Set(atenei.map((a) => a.slug));
ok(courses.length === 5833, `5,833 current courses (got ${courses.length})`);
ok(courses.every((c) => ateneoSlugs.has(c.ateneoSlug)), "every course belongs to a Family-1 ateneo (ceased/no-offer atenei contribute ZERO)");
ok(new Set(courses.map((c) => `${c.ateneoSlug}/${c.slug}`)).size === courses.length, "no duplicate {ateneo, course} pages");
ok(courses.every((c) => ["triennale", "magistrale", "ciclo-unico"].includes(c.level)), "every course level ∈ {triennale, magistrale, ciclo-unico}");
ok(courses.every((c) => ["in presenza", "mista", "a distanza"].includes(c.didattica)), "every course carries a real delivery mode (in-presenza/mista/a-distanza)");
// NO language-of-instruction fabrication: the data must not carry, and pages must not invent, a language field.
ok(courses.every((c) => !("language" in c) && !("lingua" in c)), "no language-of-instruction field in the course data (never claimed on-page)");
const lv = { triennale: 0, magistrale: 0, "ciclo-unico": 0 };
for (const c of courses) lv[c.level]++;
ok(lv.triennale === 2754 && lv.magistrale === 2855 && lv["ciclo-unico"] === 224, `level split 2754/2855/224 (got ${lv.triennale}/${lv.magistrale}/${lv["ciclo-unico"]})`);

// ---- Family 8: descent corridor — NEVER ×196 ----
const originSlugs = new Set(origins.map((o) => o.slug));
ok(descent.tier1.length === 7, `7 Tier-1 decree countries (got ${descent.tier1.length})`);
ok(descent.proposed.length === 4, `4 CGIE-proposed (deferred) countries (got ${descent.proposed.length})`);
ok(descent.tier1.every((t) => originSlugs.has(t.slug)), "every Tier-1 country maps to a real origin slug");
const descentPages = descent.tier1.length + descent.proposed.length + 1;
ok(descentPages === 12 && descentPages < N, `descent family = ${descentPages} pages — NOT ×196 (deliberate)`);
// AIRE figures: cited ONLY where on record from the decree body; the rest MUST stay null (no fabrication).
const arg = descent.tier1.find((t) => t.slug === "argentina");
const uru = descent.tier1.find((t) => t.slug === "uruguay");
ok(arg.aire === 989901 && uru.aire === 115658, "AIRE cited verbatim for Argentina (989,901) + Uruguay (115,658)");
ok(descent.tier1.filter((t) => t.aire === null).length === 5, "the 5 unconfirmed AIRE figures are null — not fabricated");
// Canada routing truth: 0 CELI centers.
const canada = descent.tier1.find((t) => t.slug === "canada");
ok(canada.celiCenters === 0, "Canada has 0 CELI centers (nearest-center routing truth stated, not hidden)");

// ---- Exam centers (CELI real; CILS pending) ----
ok(centers.celi.length === 103 && Object.keys(centers.celiByCountry).length === 37, `103 CELI centers across 37 countries (got ${centers.celi.length}/${Object.keys(centers.celiByCountry).length})`);
ok(centers.cilsStatus === "pending-founder-save", "CILS centers marked pending — never fabricated");

// ---- Locked math (derived, never hardcoded literals in app code) ----
const fam = {
  ateneo: atenei.length * N, course: courses.length * N, examLevel: 13 * N,
  citizenship: N, residence: N, study: N, examsInOrigin: N, descent: descentPages,
};
const total = Object.values(fam).reduce((a, b) => a + b, 0);
ok(fam.ateneo === 18032, `Family 1 = ${fam.ateneo} (92×196)`);
ok(fam.course === 1143268, `Family 2 = ${fam.course} (5,833×196)`);
ok(fam.examLevel === 2548, `Family 3 = ${fam.examLevel} (13×196)`);
ok(total === 1164644, `Families 1–8 total = ${total} (+ ~50 core ≈ 1,164,694)`);
console.log("   families:", JSON.stringify(fam), "→ total", total);

if (failed) { console.error(`\n${failed} assertion(s) FAILED`); process.exit(1); }
console.log("\nAll Phase-3 exclusion tests passed.");
