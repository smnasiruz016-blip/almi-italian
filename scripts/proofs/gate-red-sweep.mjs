// GATE RED SWEEP — prove every gate can fail, on the property it exists to protect.
//
//   node scripts/proofs/gate-red-sweep.mjs            # sabotage sweep + planted items
//   node scripts/proofs/gate-red-sweep.mjs --gates    # sabotage sweep only
//   node scripts/proofs/gate-red-sweep.mjs --plants   # planted items only
//
// ⚠️ THIS SCRIPT EDITS SOURCE FILES ON PURPOSE. It is NOT wired into `build` and must never be.
// It takes a byte copy of each file before touching it, restores from that copy, and verifies
// the restore with sha256 — and it re-runs the gate afterwards, because a restore that is not
// re-checked is a restore nobody has proved. Run it on a clean tree.
//
// Restore is deliberately NOT `git checkout --`: that discards uncommitted work in the same
// path silently. The only reason a previous incident was caught at all was that the RESTORED
// row came back red.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// The rule is "a gate that has never been seen red has not been tested". Measured on
// 2026-08-31, only 8 of this repo's 40 build-chain gates printed a control of their own; the
// rest were trusted on their own prose. This sweep closes that: each entry below breaks the
// ONE property its gate protects — never a syntax error, which would fell every gate equally
// and prove nothing about any of them.
//
// Three of the sabotages below started green and were MY error, not the gate's, and each miss
// is recorded next to its entry — a gate that strips comments before scanning, a check scoped
// to entity-bearing text tails, an identifier left behind by an aliased import. A sabotage
// that misses is not evidence of a hollow gate until you have read why it missed.

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const TMP = join(ROOT, ".gate-red-sweep-backups");
const argv = process.argv.slice(2);
const ONLY_GATES = argv.includes("--gates");
const ONLY_PLANTS = argv.includes("--plants");

const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const run = (cmd) => {
  try { return { code: 0, out: execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 1e8 }) }; }
  catch (e) { return { code: e.status ?? 1, out: (e.stdout || "") + (e.stderr || "") }; }
};
const why = (out) => {
  const lines = out.split("\n").map((l) => l.trimEnd()).filter(Boolean);
  const m = lines.filter((l) => /^\s*(•|✗|❌)/.test(l) || /FAILED/i.test(l));
  return (m.find((l) => /^\s*(•|✗)/.test(l)) ?? m[0] ?? lines[lines.length - 1] ?? "(no output)").trim().replace(/\s+/g, " ").slice(0, 150);
};
/** One noun from fork-hygiene own BANNED list. Never hardcoded here: see the note above. */
function bannedNoun() {
  const src = readFileSync(join(ROOT, "scripts", "seo", "fork-hygiene-gate.mjs"), "utf8");
  const start = src.indexOf("const BANNED = [");
  const block = src.slice(start, src.indexOf("];", start));
  const m = block.match(/"([A-Za-z][A-Za-z -]{6,})"/);
  if (!m) throw new Error("gate-red-sweep: could not read a noun from the BANNED list");
  return m[1];
}

const bankIndex = (b) => b.findIndex((x) => x.exam === "CILS_B1C" && x.section === "LETTURA" && /anagrafe/i.test(x.title));
const json = (s, f) => { const b = JSON.parse(s); f(b); return JSON.stringify(b, null, 2); };

// ── ONE SABOTAGE PER GATE, EACH AIMED AT THAT GATE'S OWN PROPERTY ──────────
const SABOTAGES = [
  { gate: "gate:fork-hygiene", file: "src/lib/site.ts",
    what: "a banned ancestor noun in a string literal",
    // MISSED FIRST TIME in a comment: this gate strips comments before scanning, by design.
    //
    // The noun is READ FROM THE GATE OWN LIST, never written here. Writing one as a literal
    // in this file made fork-hygiene fail on THIS file - correctly - and that failure then
    // appeared attributed to every planted item below. Reading the list also keeps the
    // sabotage honest if the list is ever edited.
    edit: (s) => s + `
export const ANCESTOR_NOTE = "${bannedNoun()} wording, ported.";
` },
  { gate: "seo:test", file: "src/data/it-descent.json",
    what: "one tier-1 descent country removed",
    edit: (s) => json(s, (j) => { const k = Object.keys(j); if (Array.isArray(j[k[0]])) j[k[0]].pop(); }) },
  { gate: "selftest:engine", file: "src/lib/scoring/cils-standard.ts",
    what: "CILS standard floor moved 11/20 -> 12/20",
    edit: (s) => s.replace("CILS_STANDARD_FLOOR = 11", "CILS_STANDARD_FLOOR = 12") },
  { gate: "gate:status-band", file: "src/lib/scoring/section-status.ts",
    what: "default BORDERLINE width widened 1 -> 3",
    edit: (s) => s.replace("const DEFAULT_BORDERLINE_WIDTH = 1;", "const DEFAULT_BORDERLINE_WIDTH = 3;") },
  { gate: "gate:exam-verdict", file: "src/lib/scoring/celi.ts",
    what: "CELI 2 written-part minimum lowered 72 -> 70",
    edit: (s) => s.replace("writtenMin: 72", "writtenMin: 70") },
  { gate: "gate:contrast", file: "src/app/globals.css",
    what: "a foreground token lightened below its WCAG threshold",
    edit: (s) => s.replace("--color-almi-coral-text: #a8301c;", "--color-almi-coral-text: #f0c8c0;") },
  { gate: "gate:jsx-space", file: "src/components/ProgressSection.tsx",
    what: "a trailing space after </strong> in an entity-bearing text tail that continues next line",
    // MISSED TWICE: the check is deliberately scoped to tails carrying an HTML entity, because
    // 13 other sites have the bare shape and keep their space. The shape alone is not the bug.
    edit: (s) => "const Risky = () => (\n  <p>\n    Ogni punteggio è una <strong>stima</strong> dell&apos;ente\n    e non un punteggio ufficiale.\n  </p>\n);\n" + s },
  { gate: "gate:criterion-band", file: "src/lib/scoring/section-status.ts",
    what: "1 point reads as NON_RAGGIUNTO instead of PARZIALE",
    edit: (s) => s.replace('if (points <= 0) return "NON_RAGGIUNTO";', 'if (points <= 1) return "NON_RAGGIUNTO";') },
  { gate: "gate:derived-verdict", file: "src/lib/ai/rubric.ts",
    what: "per-criterion accumulation no longer clamps to the official ceiling",
    edit: (s) => s.replace(/value \+= Math\.max\(\s*0,\s*Math\.min\(c\.max, pts\)\s*\)/, "value += pts") },
  { gate: "validate:batch1", file: "scripts/seed/batch1/cils-uno.ts",
    what: "a WRITING item's authored criteria emptied IN THE SEED SOURCE",
    // MISSED FIRST TIME against the JSON bundle: this selftest reads the TS seed, not the bundle.
    edit: (s) => s.replace(/criteria:\s*\[[^\]]*\]/, "criteria: []") },
  { gate: "gate:bank", file: "src/data/items-batch1.json",
    what: "one item deleted so a bucket falls to 14",
    edit: (s) => json(s, (b) => b.splice(b.findIndex((x) => x.exam === "CELI" && x.section === "ASCOLTO"), 1)) },
  { gate: "gate:item-id", file: "src/data/items-batch1.json",
    what: "two items in one module given the same {exam,level,section,title}, so their ids collide",
    edit: (s) => json(s, (b) => { const k = (x) => x.exam + x.level + x.section; const f = b[0];
      const t = b.find((x, n) => n > 0 && k(x) === k(f)); t.title = f.title; }) },
  { gate: "gate:real-entity", file: "src/data/items-batch1.json",
    what: "a tier-1 real brand name placed in an item title",
    // MISSED FIRST TIME with "Microsoft": the gate knows 48 brands and says so. Use one it knows.
    edit: (s) => json(s, (b) => { b[0].title += " a Esselunga"; }) },
  { gate: "gate:titles", file: "src/data/items-batch1.json",
    what: "a title repeated inside one module",
    edit: (s) => json(s, (b) => { const k = (x) => x.exam + x.level + x.section; const f = b[0];
      const t = b.find((x, n) => n > 0 && k(x) === k(f)); t.title = f.title; }) },
  { gate: "gate:ascolto-audio", file: "src/data/ascolto-audio.json",
    what: "a manifest entry pointed at a clip that is not on disk",
    edit: (s) => json(s, (m) => { m[Object.keys(m)[0]].url = "/audio/ascolto/does-not-exist.mp3"; }) },
  { gate: "gate:honesty", file: "src/components/EstimateReport.tsx",
    what: "the renderer stops referencing the estimate disclaimer",
    // MISSED FIRST TIME by renaming ESTIMATE_LABEL: the gate imports that constant, so it was
    // comparing it to itself. Break what the gate can actually observe from outside.
    edit: (s) => s.replace('import { ESTIMATE_DISCLAIMER, type LabelledEstimate } from "@/lib/ai/schemas";', 'import { type LabelledEstimate } from "@/lib/ai/schemas";')
                  .replace("{ESTIMATE_DISCLAIMER}", '{"Criteria-based read-out."}') },
  { gate: "gate:ai-e2e", file: "src/lib/ai/schemas.ts",
    what: "the band enum loosened so an invented band parses",
    edit: (s) => s.replace("band: z.enum(BAND).nullable(),", "band: z.string().nullable(),") },
  { gate: "gate:marking", file: "src/lib/it/grade.ts",
    what: "the NFD accent fold removed, so accented answers stop matching",
    edit: (s) => s.replace('.normalize("NFD")', '.normalize("NFC")') },
  { gate: "gate:reveal", file: "src/components/PracticeComposer.tsx",
    what: "a protected field rendered in a component that never uses the chokepoint",
    edit: (s) => s.replace("export function PracticeComposer", "function Leak(p: { audioScript?: string }) { return <p>{p.audioScript}</p>; }\nexport function PracticeComposer") },
  { gate: "gate:content:full", file: "next.config.ts",
    what: "a /guides redirect pointed at a page that does not exist",
    edit: (s) => s.replace('to: "/learn/cils-b1-cittadinanza-overview"', 'to: "/learn/does-not-exist"') },
  { gate: "gate:static-shell", file: "src/app/(shell)/learn/[slug]/page.tsx",
    what: "unknown slugs allowed to render on demand",
    edit: (s) => s.replace("export const dynamicParams = false;", "export const dynamicParams = true;") },
  { gate: "gate:token:full", file: "src/lib/learn/tokens.ts",
    what: "a numeric token made to resolve to prose",
    edit: (s) => s.replace("CILS_B1C_SECTION_MAX: { value: CILS_B1C_SECTION_MAX,", 'CILS_B1C_SECTION_MAX: { value: "twelve" as unknown as number,') },
  { gate: "gate:webhook-idempotency", file: "src/app/api/webhooks/stripe/route.ts",
    what: "a failed handler no longer releases its claim",
    edit: (s) => s.replace("await releaseClaim(prisma.processedWebhook, event.id);", "// claim not released") },
  { gate: "gate:billing-health", file: "src/app/api/billing/health/route.ts",
    what: "the rate limit removed from a route that makes three live Stripe calls",
    edit: (s) => s.replace('const limited = limitByClient("billingHealth", req);', "const limited = { ok: true } as const;") },
  { gate: "gate:spend-limits", file: "src/app/api/it/evaluate/scritta/route.ts",
    what: "the per-hour spend limit removed from a metered AI route",
    edit: (s) => s.replace('const limited = limitByClient("aiScritta", req);', "const limited = { ok: true } as const;") },
  { gate: "gate:audio-retention", file: "src/app/privacy/page.tsx",
    what: "the 30-day deletion disclosure removed from the privacy page",
    edit: (s) => s.replace("deleted after 30 days", "kept for our records") },
  { gate: "gate:speaking-claims", file: "src/lib/ai/transcribe.ts",
    what: "the confidence threshold put back to the 0.7 that cried wolf on good audio",
    edit: (s) => s.replace("CONFIDENCE_REVIEW_THRESHOLD = 0.38", "CONFIDENCE_REVIEW_THRESHOLD = 0.7") },
  { gate: "gate:summary-consistency", file: "src/lib/ai/evaluate.ts",
    what: "the summary-contradiction retry branch removed at BOTH sites",
    // MISSED FIRST TIME at one site only: the string occurs twice and one survivor satisfied it.
    edit: (s) => s.split('bad === "summary-contradiction"').join('bad === "never-fires"') },
  { gate: "gate:sidebar", file: "src/components/Sidebar.tsx",
    what: "a sidebar item pointed at a route that does not render",
    edit: (s) => s.replace('href: "/practice", icon: "✏️"', 'href: "/nowhere", icon: "✏️"') },
];

// ── PLANTED ITEMS: the content-quality probe ───────────────────────────────
// One real item, CILS_B1C / B1C / LETTURA, whose passage states "Il giovedì l'ufficio è chiuso."
const PLANTS = [
  { id: "(a) wrong answer key",
    detail: 'answerIndex moved from 2 ("Giovedì", what the passage says) to 0 ("Lunedì", a day it is OPEN)',
    edit: (s) => json(s, (b) => { b[bankIndex(b)].payload.questions[0].answerIndex = 0; }) },
  { id: "(b) two options with one meaning",
    detail: 'option 3 "Venerdì" -> "Di giovedì": options 2 and 3 now both name Thursday, so the item has two correct answers',
    edit: (s) => json(s, (b) => { b[bankIndex(b)].payload.questions[0].options[3] = "Di giovedì"; }) },
  { id: "(c) the stem gives the answer away",
    detail: 'stem -> "Il giovedì l\'ufficio è chiuso. In quale giorno l\'ufficio è chiuso?" — answerable without the passage',
    edit: (s) => json(s, (b) => { b[bankIndex(b)].payload.questions[0].q = "Il giovedì l'ufficio è chiuso. In quale giorno l'ufficio è chiuso?"; }) },
];

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const ALL_STEPS = pkg.scripts.build.split("&&").map((s) => s.trim())
  .filter((s) => !/^(prisma generate|next build)$/.test(s) && !/served-copy/.test(s));

mkdirSync(TMP, { recursive: true });
let bad = 0;

function cycle(label, file, edit, steps) {
  const abs = join(ROOT, file);
  const before = sha(abs);
  const bak = join(TMP, label.replace(/[^a-z0-9]/gi, "_") + ".bak");
  copyFileSync(abs, bak);
  const src = readFileSync(abs, "utf8");
  const out = edit(src);
  const applied = out !== src;
  if (applied) writeFileSync(abs, out, "utf8");

  const caught = [];
  if (applied) for (const st of steps) { const r = run(st); if (r.code !== 0) caught.push({ step: st.replace(/^npm run /, ""), why: why(r.out) }); }

  copyFileSync(bak, abs);
  const bytesOk = sha(abs) === before;
  return { applied, caught, bytesOk };
}

if (!ONLY_PLANTS) {
  console.log(`SABOTAGE SWEEP — ${SABOTAGES.length} gates, one property each\n`);
  for (const s of SABOTAGES) {
    const r = cycle(s.gate, s.file, s.edit, [s.gate.startsWith("gate:") || s.gate.includes(":") ? `npm run ${s.gate}` : s.gate]);
    const red = r.caught.length > 0;
    const restored = run(`npm run ${s.gate}`).code === 0;
    if (!r.applied || !red || !r.bytesOk || !restored) bad++;
    console.log(`${(!r.applied ? "PATTERN-NOT-FOUND" : red ? "RED" : "!! STAYED GREEN !!").padEnd(18)} ${s.gate.padEnd(26)} restore=${r.bytesOk ? "bytes-ok" : "BYTES-DIFFER"} ${restored ? "GREEN" : "!! RESTORED-RED !!"}`);
    console.log(`                   sabotage: ${s.what}`);
    if (red) console.log(`                   why: ${r.caught[0].why}`);
  }
}

if (!ONLY_GATES) {
  console.log(`\nPLANTED ITEMS — ${PLANTS.length} bad items against all ${ALL_STEPS.length} content gates\n`);
  const bankHash = sha(join(ROOT, "src/data/items-batch1.json"));
  console.log("bank sha256 BEFORE:", bankHash);
  for (const p of PLANTS) {
    const r = cycle("plant_" + p.id, "src/data/items-batch1.json", p.edit, ALL_STEPS);
    console.log(`\n  ${p.id}\n    ${p.detail}`);
    if (!r.caught.length) { console.log(`    🔴 CAUGHT BY NOTHING — all ${ALL_STEPS.length} gates passed. This is a QUALITY BLIND SPOT.`); bad++; }
    else for (const c of r.caught) console.log(`    caught by ${c.step}: ${c.why}`);
  }
  const after = sha(join(ROOT, "src/data/items-batch1.json"));
  console.log("\nbank sha256 AFTER :", after);
  console.log("byte-identical    :", after === bankHash);
  if (after !== bankHash) bad++;
}

if (existsSync(TMP)) rmSync(TMP, { recursive: true, force: true });
console.log(`\n${bad === 0 ? "sweep complete — every gate seen red, every file restored byte-exact" : `sweep complete — ${bad} row(s) need reading (a planted item caught by nothing is expected today; see docs/gate-red-proofs.md)`}`);
