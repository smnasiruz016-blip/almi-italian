// MOCKED END-TO-END for both estimate skills.
//
//   npx tsx scripts/ai/mock-e2e.mts
//
// Runs the whole path a real attempt takes — rubric resolved from the source, prompt built,
// model response parsed and validated, unassessable criteria appended, points summed, label
// attached, stored shape validated — with the model call MOCKED. No key, no network, no
// tokens, no bill.
//
// WHAT IS MOCKED IS EXACTLY ONE THING: the bytes the model returns. Everything on either side
// of that is the real code path.

import { BANK } from "../../src/lib/items";
import { stableItemId } from "../../src/lib/item-id";
import { rubricFor, scoreFrom } from "../../src/lib/ai/rubric";
import { scrittaSystemPrompt, oraleSystemPrompt } from "../../src/lib/ai/prompts";
import { officialMax, assessableMax, CILS_B1C_SCRITTA, CILS_B1C_ORALE } from "../../src/lib/ai/official-rubrics";
import { wordCount, contradictingWordCounts } from "../../src/lib/text/word-count";
import {
  ModelAssessmentSchema,
  LabelledEstimateSchema,
  labelEstimate,
  ESTIMATE_LABEL,
  type ModelAssessment,
} from "../../src/lib/ai/schemas";

let failed = 0;
const check = (label: string, cond: boolean, detail = "") => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
};

console.log("Mocked end-to-end — Produzione scritta and orale\n");

/** A learner response long enough to be plausible for any of the tracks. */
const RESPONSE = Array.from({ length: 96 }, (_, i) => `parola${i}`).join(" ");
const WORDS = wordCount(RESPONSE);

/** What a well-behaved model returns for a rubric — awards ~60% of each ceiling. */
function mockModel(criteriaLabels: string[], ceilings: (number | null)[], sectionMax: number | null): string {
  return JSON.stringify({
    criteria: criteriaLabels.map((c, i) => ({
      criterion: c,
      band: i === 1 ? "PARZIALE" : "RAGGIUNTO",
      points: ceilings[i] === null ? null : Math.round(ceilings[i]! * 0.6),
      comment: `Commento concreto su "${c.slice(0, 28)}" riferito alla risposta del candidato.`,
    })),
    sectionScoreValue: sectionMax === null ? null : Math.round(sectionMax * 0.6),
    strengths: ["Struttura chiara.", "Registro adeguato."],
    improvements: ["Aggiungi il motivo della richiesta.", "Controlla gli accordi al passato."],
    summary: "Risposta comprensibile e pertinente, con qualche imprecisione grammaticale.",
  });
}

/** The evaluator's post-parse step, mirrored: append what we cannot assess, stamp ceilings. */
function withNotAssessed(parsed: ModelAssessment, rubric: ReturnType<typeof rubricFor>): ModelAssessment {
  const ceiling = (label: string) =>
    (rubric.official ?? []).find((c) => c.label.toLowerCase() === label.toLowerCase())?.max ?? null;
  return {
    ...parsed,
    criteria: [
      ...parsed.criteria.map((c) => ({ ...c, pointsMax: ceiling(c.criterion) })),
      ...(rubric.official ?? []).filter((c) => c.notAssessed).map((c) => ({
        criterion: c.label,
        band: null,
        points: null,
        pointsMax: c.max,
        comment: c.notAssessedReason ?? "Non valutabile con questa fonte.",
      })),
    ],
  };
}

const SKILLS = ["SCRITTA", "ORALE"] as const;
const worked: string[] = [];

for (const section of SKILLS) {
  const seen = new Set<string>();
  const items = BANK.filter((i) => i.section === section).filter((i) => {
    const k = `${i.exam}::${i.level}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`\n${section} — ${items.length} track(s)`);
  for (const item of items) {
    const p = item.payload as { task?: string; criteria?: string[]; minWords?: number; maxWords?: number; speakSeconds?: number };
    const label = `${item.exam}/${item.level}`;
    const rubric = rubricFor({ exam: item.exam, level: item.level, section, criteria: p.criteria ?? [] });

    check(`${label}: rubric mode = ${rubric.mode}`, true);
    if (rubric.mode === "OFFICIAL") {
      check(`${label}: official criteria sum to the engine's section max`,
        officialMax(rubric.official!) === (rubric.scale?.max ?? -1),
        `sum=${officialMax(rubric.official!)} engine=${rubric.scale?.max}`);
      check(`${label}: source URL cited`, Boolean(rubric.sourceUrl));
    } else {
      check(`${label}: falls back to the item's own authored criteria`,
        rubric.criteria.length === (p.criteria ?? []).length && rubric.criteria.every((c, i) => c === p.criteria![i]));
    }

    // Prompt: exact word count stated as fact, never asked for an estimate.
    const sys = section === "SCRITTA"
      ? scrittaSystemPrompt(rubric, { words: WORDS, minWords: p.minWords ?? 0, maxWords: p.maxWords })
      : oraleSystemPrompt(rubric, { words: WORDS, speakSeconds: p.speakSeconds });
    check(`${label}: prompt states the exact word count (${WORDS})`, sys.includes(`ESATTAMENTE ${WORDS} parole`));
    check(`${label}: prompt forbids self-counting`, /NON CONTARE E NON STIMARE MAI/.test(sys));
    check(`${label}: prompt names every criterion it asks for`, rubric.criteria.filter((c) => {
      const oc = (rubric.official ?? []).find((x) => x.label === c);
      return !oc?.notAssessed;
    }).every((c) => sys.includes(c)));
    if (rubric.mode === "OFFICIAL") {
      const na = (rubric.official ?? []).filter((c) => c.notAssessed);
      for (const c of na) {
        check(`${label}: "${c.label}" is NOT shown to the model`, !sys.includes(c.label));
      }
    }

    // Mocked response through the real parser.
    const assessableLabels = rubric.mode === "OFFICIAL"
      ? rubric.official!.filter((c) => !c.notAssessed).map((c) => c.label)
      : rubric.criteria;
    const ceilings = rubric.mode === "OFFICIAL"
      ? rubric.official!.filter((c) => !c.notAssessed).map((c) => c.max)
      : assessableLabels.map(() => null);
    const sectionMax = rubric.mode === "OFFICIAL" ? null : rubric.scale?.max ?? null;

    const parsedRes = ModelAssessmentSchema.safeParse(JSON.parse(mockModel(assessableLabels, ceilings, sectionMax)));
    check(`${label}: model response validates`, parsedRes.success, parsedRes.success ? "" : JSON.stringify(parsedRes.error.issues[0]));
    if (!parsedRes.success) continue;

    const full = withNotAssessed(parsedRes.data, rubric);
    const score = scoreFrom(rubric, full);
    const estimate = labelEstimate(full, score, rubric.engineNote);

    check(`${label}: labelKind is ${ESTIMATE_LABEL}`, estimate.labelKind === ESTIMATE_LABEL);
    check(`${label}: stored shape validates`, LabelledEstimateSchema.safeParse(estimate).success);

    if (rubric.mode === "OFFICIAL") {
      const expected = ceilings.reduce<number>((n, c) => n + Math.round((c ?? 0) * 0.6), 0);
      check(`${label}: section total is the SUM of the awarded points (${score?.value})`, score?.value === expected, `expected ${expected}`);
      check(`${label}: max is the ASSESSABLE max, not the official one`, score?.max === assessableMax(rubric.official!));
      const na = rubric.official!.filter((c) => c.notAssessed);
      if (na.length) {
        check(`${label}: officialMax reported alongside (${score?.officialMax})`, score?.officialMax === officialMax(rubric.official!));
        check(`${label}: a not-assessed note is present`, Boolean(score?.notAssessedNote));
        const row = estimate.criteria.find((c) => c.criterion === na[0].label);
        check(`${label}: "${na[0].label}" appears with NO points and NO band`, row?.points === null && row?.band === null);
      } else {
        check(`${label}: nothing excluded, max equals official max`, score?.max === officialMax(rubric.official!));
      }
      worked.push(`${section} ${label}: ${estimate.criteria.map((c) => `${c.criterion} ${c.points ?? "—"}/${c.pointsMax ?? "?"}`).join(" · ")}  =>  ${score?.value}/${score?.max}${score?.officialMax ? ` (esame: /${score.officialMax})` : ""} ${score?.status}`);
    } else if (rubric.scale) {
      check(`${label}: authored mode still uses the model's section number`, score?.value === Math.round(rubric.scale.max * 0.6));
      worked.push(`${section} ${label}: AUTHORED, ${score?.value}/${score?.max} ${score?.status}`);
    } else {
      check(`${label}: part-scored exam yields NO invented section score`, score === null);
      worked.push(`${section} ${label}: part-scored, no section number`);
    }
  }
}

// ── THE PUBLISHED RUBRIC, AS ABSOLUTE FACTS ─────────────────────────────────
// These are stated as LITERALS on purpose. Every other rubric check above derives its
// expectation from the rubric object itself, which means it moves whenever the rubric moves —
// I proved that by removing `notAssessed` from pronunciation and watching the whole suite stay
// green. A check fed the very value it is testing is not a check. So the weights, the sums and
// the one criterion this product may never score are pinned to the numbers in Unistrasi's PDF.
console.log("\nofficial rubric — pinned to the source document");
{
  const scritta = CILS_B1C_SCRITTA.map((c) => `${c.label}=${c.max}`).join(",");
  check("scritta weights are the published ones (3/1/4/3/1)",
    scritta === "Efficacia comunicativa=3,Adeguatezza stilistica=1,Correttezza morfosintattica=4,Adeguatezza e ricchezza lessicale=3,Ortografia e punteggiatura=1",
    scritta);
  const orale = CILS_B1C_ORALE.map((c) => `${c.label}=${c.max}`).join(",");
  check("orale weights are the published ones (4/4/3/1)",
    orale === "Efficacia comunicativa=4,Correttezza morfosintattica=4,Adeguatezza e ricchezza lessicale=3,Pronuncia e intonazione=1",
    orale);
  check("scritta sums to 12", officialMax(CILS_B1C_SCRITTA) === 12);
  check("orale sums to 12", officialMax(CILS_B1C_ORALE) === 12);

  // THE HONESTY INVARIANT. A transcript does not carry pronunciation, so this criterion can
  // never be scored here — not "should not", cannot. Pinned as a literal so switching it on
  // turns this red rather than silently re-weighting everything around it.
  const pron = CILS_B1C_ORALE.find((c) => /pronuncia|intonazione/i.test(c.label));
  check("orale has a pronunciation criterion", Boolean(pron));
  check("pronunciation is marked NOT ASSESSED (we read a transcript, not audio)", pron?.notAssessed === true);
  check("pronunciation carries a reason for the learner", Boolean(pron?.notAssessedReason));
  check("orale assessable max is exactly 11, not 12", assessableMax(CILS_B1C_ORALE) === 11, String(assessableMax(CILS_B1C_ORALE)));
  check("scritta is fully assessable (12 of 12)", assessableMax(CILS_B1C_SCRITTA) === 12);
  check("exactly ONE criterion is unassessable across both rubrics",
    [...CILS_B1C_SCRITTA, ...CILS_B1C_ORALE].filter((c) => c.notAssessed).length === 1);
}

// ── SOURCED WORD LIMITS ─────────────────────────────────────────────────────
// The first live attempt showed "target 40-80" on a CILS B1 Cittadinanza task and flagged the
// answer for passing 80. Unistrasi's own criteria PDF says the task is "Prova a tema (80 - 120
// parole)", and the syllabus agrees. A learner trained to 40-80 UNDER-WRITES at the real exam,
// so this is a content defect, not a formatting one — and it is asserted here so it cannot
// come back.
//
// ⚠️ ONLY CILS B1 CITTADINANZA IS ASSERTED. No official per-task word count was found for CILS
// UNO/DUE, and CELI 2's figures came back as paraphrase rather than verbatim quotes, so those
// modules are deliberately NOT pinned — pinning an unsourced number is the same defect wearing
// the opposite coat.
console.log("\nsourced word limits");
{
  const B1C_MIN = 80, B1C_MAX = 120; // https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza_nuovi.pdf
  const b1c = BANK.filter((i) => i.exam === "CILS_B1C" && i.level === "B1C" && i.section === "SCRITTA");
  check(`found CILS B1C scritta items to check (${b1c.length})`, b1c.length > 0);
  const wrong = b1c.filter((i) => {
    const p = i.payload as { minWords?: number; maxWords?: number };
    return p.minWords !== B1C_MIN || p.maxWords !== B1C_MAX;
  });
  check(`all ${b1c.length} CILS B1C scritta items target ${B1C_MIN}-${B1C_MAX} (Unistrasi)`,
    wrong.length === 0,
    wrong.length ? wrong.slice(0, 3).map((i) => `${i.title}: ${(i.payload as {minWords?:number}).minWords}-${(i.payload as {maxWords?:number}).maxWords}`).join("; ") : "");
}

// ── the invented-word-count check ───────────────────────────────────────────
console.log("\nword-count claims");
check("a contradicting count is caught", contradictingWordCounts("Hai scritto circa 110 parole.", 96).length === 1);
check("the true count is allowed", contradictingWordCounts("Hai scritto 96 parole.", 96).length === 0);
check("the task's own bounds are allowed", contradictingWordCounts("Il compito chiede 80-120 parole.", 96, [80, 120]).length === 0);
check("a bound that is NOT the task's is still caught", contradictingWordCounts("circa 200 parole", 96, [80, 120]).length === 1);
check("English 'words' is caught too", contradictingWordCounts("about 110 words", 96).length === 1);

// ── negatives ───────────────────────────────────────────────────────────────
console.log("\nnegative cases");
check("a response missing `criteria` is REJECTED", !ModelAssessmentSchema.safeParse({ sectionScoreValue: 5, strengths: ["a"], improvements: ["b"], summary: "c" }).success);
check("an unknown band is REJECTED", !ModelAssessmentSchema.safeParse({ criteria: [{ criterion: "x", band: "OTTIMO", points: 1, comment: "y" }], sectionScoreValue: 5, strengths: ["a"], improvements: ["b"], summary: "c" }).success);
check("points above the schema ceiling are REJECTED", !ModelAssessmentSchema.safeParse({ criteria: [{ criterion: "x", band: "RAGGIUNTO", points: 99, comment: "y" }], sectionScoreValue: null, strengths: ["a"], improvements: ["b"], summary: "c" }).success);

console.log("\nWORKED EXAMPLES");
for (const w of worked) console.log("  " + w);

console.log("");
if (failed) {
  console.error(`Mocked end-to-end FAILED — ${failed} check(s)\n`);
  process.exit(1);
}
console.log("Mocked end-to-end passed — both skills, every routed track, zero tokens spent\n");
