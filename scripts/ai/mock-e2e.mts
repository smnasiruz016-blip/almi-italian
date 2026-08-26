// MOCKED END-TO-END for both estimate skills.
//
//   npx tsx scripts/ai/mock-e2e.mts
//
// Runs the whole path a real attempt takes — rubric from the engine, prompt built from the
// item's own criteria, model response parsed and validated, label attached, stored shape
// validated, renderer contract checked — with the model call MOCKED. No key, no network, no
// tokens, no bill.
//
// WHAT IS MOCKED IS EXACTLY ONE THING: the bytes the model returns. Everything on either side
// of that is the real code path, including the Zod schema, labelEstimate(), the engine scale
// lookup and the CLEAR/BORDERLINE/BELOW banding. A mock that stubbed the evaluator itself
// would prove only that the mock works.

import { BANK } from "../../src/lib/items";
import { stableItemId } from "../../src/lib/item-id";
import { rubricFor, scoreFrom } from "../../src/lib/ai/rubric";
import { scrittaSystemPrompt, oraleSystemPrompt } from "../../src/lib/ai/prompts";
import {
  ModelAssessmentSchema,
  LabelledEstimateSchema,
  labelEstimate,
  ESTIMATE_LABEL,
} from "../../src/lib/ai/schemas";

let failed = 0;
const check = (label: string, cond: boolean, detail = "") => {
  if (cond) console.log(`  ✓ ${label}`);
  else { failed++; console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`); }
};

console.log("Mocked end-to-end — Produzione scritta and orale\n");

/** What a well-behaved model returns for a given rubric: one entry per authored criterion. */
function mockModelJson(criteria: string[], sectionMax: number | null) {
  return JSON.stringify({
    criteria: criteria.map((c, i) => ({
      criterion: c,
      band: i === 0 ? "RAGGIUNTO" : i === 1 ? "PARZIALE" : "RAGGIUNTO",
      comment: `Commento concreto sul criterio "${c.slice(0, 30)}" riferito al testo del candidato.`,
    })),
    sectionScoreValue: sectionMax === null ? null : Math.round(sectionMax * 0.6),
    strengths: ["Struttura chiara.", "Registro adeguato."],
    improvements: ["Aggiungi il motivo della richiesta.", "Controlla gli accordi al passato."],
    summary: "Risposta comprensibile e pertinente, con qualche imprecisione grammaticale.",
  });
}

const SKILLS = [
  { skill: "SCRITTA" as const, section: "SCRITTA" },
  { skill: "ORALE" as const, section: "ORALE" },
];

// One item per skill per TRACK, so both a section-scored engine (CILS) and a part-scored one
// (CELI) are exercised — the CELI case is the one where a section score must come back null.
for (const { skill, section } of SKILLS) {
  const seen = new Set<string>();
  const items = BANK.filter((i) => i.section === section).filter((i) => {
    const k = `${i.exam}::${i.level}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`\n${skill} — ${items.length} track(s)`);
  for (const item of items) {
    const id = stableItemId(item);
    const p = item.payload as { task?: string; criteria?: string[]; minWords?: number; maxWords?: number; speakSeconds?: number };
    const criteria = p.criteria ?? [];
    const label = `${item.exam}/${item.level}`;

    // 1. Rubric from the engine + the item's own criteria.
    const rubric = rubricFor({ exam: item.exam, level: item.level, criteria });
    check(`${label}: rubric resolved (${rubric.scale ? `/${rubric.scale.max} floor ${rubric.scale.floor}` : "part-scored, no section max"})`, true);
    check(`${label}: criteria came from the ITEM, verbatim`, rubric.criteria.length === criteria.length && rubric.criteria.every((c, i) => c === criteria[i]));

    // 2. Prompt carries this task's criteria and this engine's numbers, and no other's.
    const sys = skill === "SCRITTA"
      ? scrittaSystemPrompt(rubric, p.minWords ?? 0, p.maxWords)
      : oraleSystemPrompt(rubric, p.speakSeconds);
    check(`${label}: prompt names every authored criterion`, criteria.every((c) => sys.includes(c)));
    if (rubric.scale) {
      check(`${label}: prompt states the engine's own max and floor`, sys.includes(String(rubric.scale.max)) && sys.includes(String(rubric.scale.floor)));
      // Cross-engine contamination check: a /12 track must not mention the /20 floor.
      const otherFloor = rubric.scale.max === 12 ? "11/20" : "7/12";
      check(`${label}: prompt does NOT carry the other engine's scale (${otherFloor})`, !sys.includes(otherFloor));
    } else {
      check(`${label}: part-scored prompt tells the model to return null`, /sectionScoreValue = null/.test(sys));
    }
    if (skill === "ORALE") {
      check(`${label}: prompt states the transcript limit`, /TRASCRIZIONE AUTOMATICA/.test(sys) && /pronuncia/.test(sys));
    }

    // 3. The mocked model response through the REAL parser.
    const raw = mockModelJson(criteria, rubric.scale?.max ?? null);
    const parsed = ModelAssessmentSchema.safeParse(JSON.parse(raw));
    check(`${label}: model response validates`, parsed.success, parsed.success ? "" : JSON.stringify(parsed.error.issues[0]));
    if (!parsed.success) continue;

    // 4. The label is attached by OUR code, and the score is banded by the engine's rule.
    const score = scoreFrom(rubric, parsed.data.sectionScoreValue);
    const estimate = labelEstimate(parsed.data, score, rubric.engineNote);
    check(`${label}: labelKind is ${ESTIMATE_LABEL}`, estimate.labelKind === ESTIMATE_LABEL);
    check(`${label}: disclaimer is non-empty`, estimate.disclaimer.length > 20);
    if (rubric.scale) {
      check(`${label}: score is on the engine's scale`, estimate.score !== null && estimate.score.max === rubric.scale.max && estimate.score.floor === rubric.scale.floor);
      check(`${label}: banded (${estimate.score?.value}/${estimate.score?.max} → ${estimate.score?.status})`, estimate.score !== null);
    } else {
      check(`${label}: part-scored exam yields NO invented section score`, estimate.score === null);
    }

    // 5. The stored shape — the same validation the route runs before the DB write.
    check(`${label}: stored shape validates`, LabelledEstimateSchema.safeParse(estimate).success);
    check(`${label}: one assessment per authored criterion`, estimate.criteria.length === criteria.length);
  }
}

// The negative direction: a model that omits a required field must not produce an estimate.
console.log("\nnegative cases");
check("a model response missing `criteria` is REJECTED", !ModelAssessmentSchema.safeParse({ sectionScoreValue: 5, strengths: ["a"], improvements: ["b"], summary: "c" }).success);
check("a model response with an unknown band is REJECTED", !ModelAssessmentSchema.safeParse({ criteria: [{ criterion: "x", band: "OTTIMO", comment: "y" }], sectionScoreValue: 5, strengths: ["a"], improvements: ["b"], summary: "c" }).success);
check("a model-supplied labelKind does not survive", !("labelKind" in (ModelAssessmentSchema.parse({ criteria: [{ criterion: "x", band: "RAGGIUNTO", comment: "y" }], sectionScoreValue: 5, strengths: ["a"], improvements: ["b"], summary: "c", labelKind: "OFFICIAL" }) as object)));

console.log("");
if (failed) {
  console.error(`Mocked end-to-end FAILED — ${failed} check(s)\n`);
  process.exit(1);
}
console.log("Mocked end-to-end passed — both skills, every routed track, zero tokens spent\n");
