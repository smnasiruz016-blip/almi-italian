// DB-free validation of Batch 1: counts, the dedup key, the distribution vs the
// approved bucket table, per-taskType payload integrity, and the mandated guards
// (scales never mixed, every Writing/Speaking item labelled estimate, listening carries audio).
// Run: npm run validate:batch1
import { BATCH1_ITEMS, CILS_B1C_ITEMS, CILS_UNO_ITEMS, CILS_DUE_ITEMS, CELI_DUE_ITEMS } from "./index";
import { ESTIMATE_NOTE, type RawItem } from "./types";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) passed++;
  else { failed++; console.error("✗ " + msg); }
}
function eq<T>(a: T, b: T, msg: string) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`); }

// ---------- 1. Bucket sizes match the approved table ----------
eq(CILS_B1C_ITEMS.length, 42, "B1c flagship = 42 items");
eq(CILS_UNO_ITEMS.length, 26, "CILS UNO = 26 items");
eq(CILS_DUE_ITEMS.length, 26, "CILS DUE = 26 items");
eq(CELI_DUE_ITEMS.length, 18, "CELI 2 = 18 items");
eq(BATCH1_ITEMS.length, 112, "Batch 1 total = 112 items");

// ---------- 2. Dedup key {exam, level, section, title} is unique (mirrors DB @@unique) ----------
const keys = new Map<string, number>();
for (const it of BATCH1_ITEMS) {
  const k = `${it.exam}::${it.level}::${it.section}::${it.title}`;
  keys.set(k, (keys.get(k) ?? 0) + 1);
}
const dups = [...keys.entries()].filter(([, n]) => n > 1);
assert(dups.length === 0, `no duplicate dedup keys (found: ${dups.map(([k]) => k).join(" | ")})`);
eq(keys.size, 112, "112 distinct dedup keys");

// ---------- 3. Per (exam, level, section) distribution matches the proposal ----------
function countBy(pred: (i: RawItem) => boolean) { return BATCH1_ITEMS.filter(pred).length; }
const at = (exam: string, level: string, section: string) =>
  countBy((i) => i.exam === exam && i.level === level && i.section === section);
// B1c
assert(at("CILS_B1C", "B1C", "ASCOLTO") >= 15, "B1c Ascolto >= 15");
assert(at("CILS_B1C", "B1C", "LETTURA") >= 15, "B1c Lettura >= 15");
eq(at("CILS_B1C", "B1C", "SCRITTA"), 6, "B1c Scritta = 6");
eq(at("CILS_B1C", "B1C", "ORALE"), 6, "B1c Orale = 6");
// CILS UNO
eq(at("CILS_STANDARD", "UNO", "ASCOLTO"), 6, "UNO Ascolto = 6");
eq(at("CILS_STANDARD", "UNO", "LETTURA"), 6, "UNO Lettura = 6");
eq(at("CILS_STANDARD", "UNO", "ANALISI"), 6, "UNO Analisi = 6");
eq(at("CILS_STANDARD", "UNO", "SCRITTA"), 4, "UNO Scritta = 4");
eq(at("CILS_STANDARD", "UNO", "ORALE"), 4, "UNO Orale = 4");
// CILS DUE
eq(at("CILS_STANDARD", "DUE", "ASCOLTO"), 6, "DUE Ascolto = 6");
eq(at("CILS_STANDARD", "DUE", "LETTURA"), 6, "DUE Lettura = 6");
eq(at("CILS_STANDARD", "DUE", "ANALISI"), 6, "DUE Analisi = 6");
eq(at("CILS_STANDARD", "DUE", "SCRITTA"), 4, "DUE Scritta = 4");
eq(at("CILS_STANDARD", "DUE", "ORALE"), 4, "DUE Orale = 4");
// CELI 2
eq(at("CELI", "DUE", "ASCOLTO"), 5, "CELI Ascolto = 5");
eq(at("CELI", "DUE", "LETTURA"), 5, "CELI Lettura = 5");
eq(at("CELI", "DUE", "SCRITTA"), 4, "CELI Scritta = 4");
eq(at("CELI", "DUE", "ORALE"), 4, "CELI Orale = 4");

// ---------- 4. MANDATED GUARD: scales never mixed ----------
// B1c has NO Analisi section (that's a CILS-standard distinctive).
assert(!CILS_B1C_ITEMS.some((i) => i.section === "ANALISI"), "B1c never uses the ANALISI section");
// Only CILS_STANDARD carries ANALISI items, and only as taskType ANALISI.
assert(BATCH1_ITEMS.filter((i) => i.section === "ANALISI").every((i) => i.exam === "CILS_STANDARD" && i.taskType === "ANALISI"),
  "ANALISI items are CILS_STANDARD-only with taskType ANALISI");
// Every CELI item declares which PART it belongs to (CELI is scored by part, not section).
assert(BATCH1_ITEMS.filter((i) => i.exam === "CELI").every((i) => {
  const p = (i.payload as { part?: string }).part;
  return p === "WRITTEN" || p === "ORAL";
}), "every CELI item declares payload.part = WRITTEN | ORAL");
// CELI ORALE → ORAL part; CELI written sub-skills → WRITTEN part.
assert(CELI_DUE_ITEMS.filter((i) => i.section === "ORALE").every((i) => (i.payload as { part?: string }).part === "ORAL"),
  "CELI ORALE items are in the ORAL part");
assert(CELI_DUE_ITEMS.filter((i) => i.section !== "ORALE").every((i) => (i.payload as { part?: string }).part === "WRITTEN"),
  "CELI Ascolto/Lettura/Scritta items are in the WRITTEN part");
// No CELI item ever lands on a CILS-only section.
assert(!CELI_DUE_ITEMS.some((i) => i.section === "ANALISI"), "CELI never uses ANALISI");

// ---------- 5. MANDATED GUARD: every Writing/Speaking item is labelled an estimate ----------
const estItems = BATCH1_ITEMS.filter((i) => i.taskType === "WRITING" || i.taskType === "SPEAKING");
assert(estItems.every((i) => i.guidanceNote === ESTIMATE_NOTE), "every WRITING/SPEAKING item carries the ESTIMATE_NOTE label");
// Auto-marked items must NOT carry the estimate label (they're objectively keyed).
const autoItems = BATCH1_ITEMS.filter((i) => ["MCQ", "MATCHING", "ORDERING", "CLOZE", "ANALISI"].includes(i.taskType));
assert(autoItems.every((i) => i.guidanceNote !== ESTIMATE_NOTE), "auto-marked items are not mislabelled as estimates");

// ---------- 6. Listening carries a TTS audio script (rendered via network pipeline) ----------
const listening = BATCH1_ITEMS.filter((i) => i.section === "ASCOLTO");
assert(listening.every((i) => {
  const s = (i.payload as { audioScript?: string }).audioScript;
  return typeof s === "string" && s.trim().length > 0;
}), "every ASCOLTO item has a non-empty audioScript for TTS");

// ---------- 7. Per-taskType payload integrity ----------
for (const it of BATCH1_ITEMS) {
  const p = it.payload as unknown as Record<string, unknown>;
  const where = `${it.exam}/${it.level}/${it.section} "${it.title}"`;
  switch (it.taskType) {
    case "MCQ": {
      const qs = p.questions as { q: string; options: string[]; answerIndex: number }[];
      assert(Array.isArray(qs) && qs.length > 0, `MCQ has questions — ${where}`);
      assert(qs.every((q) => Array.isArray(q.options) && q.options.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.options.length),
        `MCQ answerIndex in range, ≥2 options — ${where}`);
      break;
    }
    case "MATCHING": {
      const prompts = p.prompts as string[];
      const options = p.options as string[];
      const map = p.answerMap as number[];
      assert(Array.isArray(prompts) && Array.isArray(options) && Array.isArray(map), `MATCHING has prompts/options/answerMap — ${where}`);
      assert(prompts.length === map.length, `MATCHING answerMap length == prompts — ${where}`);
      assert(map.every((m) => m >= 0 && m < options.length), `MATCHING indices in range — ${where}`);
      assert(new Set(map).size === map.length, `MATCHING is a 1:1 mapping (no repeated option) — ${where}`);
      break;
    }
    case "ORDERING": {
      const sh = p.shuffled as string[];
      const ord = p.correctOrder as number[];
      assert(Array.isArray(sh) && Array.isArray(ord) && sh.length === ord.length, `ORDERING lengths match — ${where}`);
      assert([...ord].sort((a, b) => a - b).every((v, idx) => v === idx), `ORDERING is a permutation of 0..n-1 — ${where}`);
      break;
    }
    case "CLOZE":
    case "ANALISI": {
      const text = p.text as string;
      const blanks = p.blanks as { answer: string; options?: string[] }[];
      const gaps = (text.match(/___/g) || []).length;
      assert(typeof text === "string" && text.includes("___"), `ANALISI/CLOZE text has blanks — ${where}`);
      assert(Array.isArray(blanks) && blanks.length === gaps, `blanks count == '___' count (${blanks?.length} vs ${gaps}) — ${where}`);
      assert(blanks.every((b) => typeof b.answer === "string" && b.answer.trim().length > 0), `every blank has a non-empty answer — ${where}`);
      assert(blanks.every((b) => !b.options || b.options.includes(b.answer)), `if options given, they include the answer — ${where}`);
      break;
    }
    case "WRITING": {
      assert(typeof p.task === "string" && (p.task as string).length > 0, `WRITING has a task — ${where}`);
      assert(typeof p.minWords === "number" && (p.minWords as number) > 0, `WRITING has minWords — ${where}`);
      assert(Array.isArray(p.criteria) && (p.criteria as string[]).length >= 2, `WRITING has ≥2 criteria — ${where}`);
      break;
    }
    case "SPEAKING": {
      assert(typeof p.task === "string" && (p.task as string).length > 0, `SPEAKING has a task — ${where}`);
      assert(Array.isArray(p.parts) && (p.parts as string[]).length >= 2, `SPEAKING has ≥2 parts — ${where}`);
      assert(Array.isArray(p.criteria) && (p.criteria as string[]).length >= 2, `SPEAKING has ≥2 criteria — ${where}`);
      break;
    }
  }
}

// ---------- 8. Enum sanity: exam/level/section/taskType/difficulty are all valid ----------
const EXAMS = new Set(["CILS_STANDARD", "CILS_B1C", "CELI"]);
const SECTIONS = new Set(["ASCOLTO", "LETTURA", "ANALISI", "SCRITTA", "ORALE"]);
const TASKS = new Set(["MCQ", "MATCHING", "ORDERING", "CLOZE", "ANALISI", "WRITING", "SPEAKING"]);
const DIFFS = new Set(["FOUNDATION", "CORE", "STRETCH"]);
assert(BATCH1_ITEMS.every((i) => EXAMS.has(i.exam)), "every item has a valid exam enum");
assert(BATCH1_ITEMS.every((i) => SECTIONS.has(i.section)), "every item has a valid section code");
assert(BATCH1_ITEMS.every((i) => TASKS.has(i.taskType)), "every item has a valid taskType enum");
assert(BATCH1_ITEMS.every((i) => DIFFS.has(i.difficulty)), "every item has a valid difficulty enum");
// Titles are non-empty and trimmed.
assert(BATCH1_ITEMS.every((i) => i.title.trim().length > 0), "every item has a non-empty title");

console.log(failed === 0
  ? `\n✓ All ${passed} Batch-1 checks passed — ${BATCH1_ITEMS.length} items, 4 buckets, dedup clean, scales isolated, estimates labelled.`
  : `\n✗ ${failed} FAILED, ${passed} passed`);
if (failed > 0) process.exit(1);
