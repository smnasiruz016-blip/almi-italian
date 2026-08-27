// CILS B1 CITTADINANZA (B1c) engine — the citizenship module (Siena). FOUR sections, each /12,
// total /48. NO capitalization: fail any section → the ENTIRE exam is retaken. This is the
// highest-traffic surface of the product and a DISTINCT engine path — it must NEVER be blended
// with CILS standard UNO/B1 (different sections, points, banking rules).

export type CilsB1cSection = "ASCOLTO" | "LETTURA" | "SCRITTA" | "ORALE";
import type { SectionStatus } from "./status";

// ── WHAT IS OFFICIAL HERE, AND WHAT IS OURS ─────────────────────────────────
// Mirrors celi.ts's `verified` convention: a number is either read from the awarding body's own
// document or it is flagged as not being one.
//
// OFFICIAL (Unistrasi's criteria PDF — 4 abilità × 12 punti):
//   https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza_nuovi.pdf
export const CILS_B1C_SECTION_MAX = 12; //  official
export const CILS_B1C_TOTAL_MAX = 48; //    official (12 × 4)

// 🔴 NOT OFFICIAL — OURS, DERIVED. Unistrasi publishes the 48-point total and the per-criterion
// weights for this module, but NO pass mark and NO per-section floor: not in the criteria PDF,
// not in the syllabus, not in the FAQ. Searched for "minimo", "sufficienza", "soglia",
// "superare", "punteggio complessivo". Any "you need X/48" seen elsewhere traces to a school or
// a video, not to Siena.
//
// So these two are a PRACTICE BENCHMARK we derived, and they are labelled as such everywhere a
// learner can see them. The derivation, from the STANDARD CILS UNO–B1 rule that IS published:
//   five abilità × 20 = 100, 55 to pass, minimum 11 per skill
//   https://cils.unistrasi.it/public/articoli/52/Linee_guida_cils_pdf.pdf
//   11/20 = 55%  →  55% of 12 = 6.6  →  7 rounded up   →  4 × 7 = 28 of 48
//
// ⚠️ Do NOT delete them and do NOT dress them as official. If Siena ever publishes a real floor,
// replace these and flip the flag.
export const CILS_B1C_FLOOR = 7; //         OURS, derived (see above)
export const CILS_B1C_TOTAL_FLOOR = 28; //  OURS, derived (4 × 7)

/** Whether each number above comes from the awarding body. Same idea as celi.ts's `verified`,
 *  so the two engines answer "is this official?" the same way. */
export const CILS_B1C_SOURCING = {
  sectionMax: { value: CILS_B1C_SECTION_MAX, verified: true, source: "Unistrasi criteri di valutazione B1 cittadinanza (PDF)" },
  totalMax: { value: CILS_B1C_TOTAL_MAX, verified: true, source: "Unistrasi criteri di valutazione B1 cittadinanza (PDF)" },
  floor: { value: CILS_B1C_FLOOR, verified: false, source: "AlmiItalian practice benchmark, derived from CILS UNO–B1 Linee guida (11/20 per skill)" },
  totalFloor: { value: CILS_B1C_TOTAL_FLOOR, verified: false, source: "AlmiItalian practice benchmark, derived (4 × 7)" },
} as const;

/** One sentence, used wherever the floor is shown to a learner, so a practice benchmark is never
 *  presented as the exam's own rule. */
export const CILS_B1C_FLOOR_DISCLOSURE =
  "Siena publishes the 48-point total for this module but not a pass mark: the 7-per-section floor is our practice benchmark, taken from the standard CILS B1 rule of 11/20 per skill.";

// Register is everyday/administrative Italian life (poste, comune, prefettura) — a "simplified B1"
// scoped for citizenship, not academic use. Scritta/Orale are criteria-based estimates: Scritta
// from the learner's text, Orale from an automatic transcript (so it cannot judge pronunciation).
export const CILS_B1C_SECTIONS: { section: CilsB1cSection; label: string; isEstimate: boolean }[] = [
  { section: "ASCOLTO", label: "Ascolto (Listening)", isEstimate: false },
  { section: "LETTURA", label: "Lettura + strutture (Reading)", isEstimate: false },
  { section: "SCRITTA", label: "Produzione scritta (Writing)", isEstimate: true },
  { section: "ORALE", label: "Produzione orale (Speaking)", isEstimate: true },
];

export interface CilsB1cInput {
  section: CilsB1cSection;
  score: number; // 0..12
}

export interface CilsB1cSectionResult {
  section: CilsB1cSection;
  label: string;
  score: number;
  max: number; //   12
  floor: number; // 7
  status: SectionStatus;
  isEstimate: boolean;
}

export interface CilsB1cResult {
  exam: "CILS";
  variant: "b1-cittadinanza";
  examLabel: string;
  sections: CilsB1cSectionResult[];
  total: number;
  totalMax: number; // 48
  bankingModel: "none";
  // BOTH conditions are shown, always — all-or-nothing:
  conditions: { perSectionFloorMet: boolean; totalThresholdMet: boolean };
  passed: boolean; // perSectionFloorMet AND totalThresholdMet
  honestyLine: string;
}

function statusFor(score: number): SectionStatus {
  if (score >= CILS_B1C_FLOOR) return "CLEAR";
  if (score >= CILS_B1C_FLOOR - 1) return "BORDERLINE"; // 6: one point from the floor
  return "BELOW";
}

export function scoreCilsB1c(inputs: CilsB1cInput[]): CilsB1cResult {
  const bySection = new Map(inputs.map((i) => [i.section, i.score]));
  const sections: CilsB1cSectionResult[] = CILS_B1C_SECTIONS.map((s) => {
    const score = clamp(bySection.get(s.section) ?? 0);
    return { section: s.section, label: s.label, score, max: CILS_B1C_SECTION_MAX, floor: CILS_B1C_FLOOR, status: statusFor(score), isEstimate: s.isEstimate };
  });
  const total = sections.reduce((a, s) => a + s.score, 0);
  const perSectionFloorMet = sections.every((s) => s.score >= CILS_B1C_FLOOR);
  const totalThresholdMet = total >= CILS_B1C_TOTAL_FLOOR;
  return {
    exam: "CILS",
    variant: "b1-cittadinanza",
    examLabel: "CILS B1 Cittadinanza",
    sections,
    total,
    totalMax: CILS_B1C_TOTAL_MAX,
    bankingModel: "none",
    conditions: { perSectionFloorMet, totalThresholdMet },
    passed: perSectionFloorMet && totalThresholdMet,
    honestyLine:
      "CILS B1 Cittadinanza has NO capitalization: you must clear ≥7/12 in every one of the four sections AND reach ≥28/48 overall on the same sitting. Miss either condition and the whole exam is retaken — there is nothing to bank. Writing is estimated from your text and Speaking from an automatic transcript of your recording, both against this task's own criteria — estimates, never a mark.",
  };
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(CILS_B1C_SECTION_MAX, n));
}
