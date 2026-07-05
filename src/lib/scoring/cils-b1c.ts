// CILS B1 CITTADINANZA (B1c) engine — the citizenship module (Siena). FOUR sections, each /12,
// pass = ≥7 in EVERY section AND total ≥28/48. NO capitalization: fail any section → the ENTIRE
// exam is retaken. This is the highest-traffic surface of the product and a DISTINCT engine path —
// it must NEVER be blended with CILS standard UNO/B1 (different sections, points, banking rules).

export type CilsB1cSection = "ASCOLTO" | "LETTURA" | "SCRITTA" | "ORALE";
import type { SectionStatus } from "./status";

export const CILS_B1C_SECTION_MAX = 12;
export const CILS_B1C_FLOOR = 7; //        ≥7/12 required in EVERY section
export const CILS_B1C_TOTAL_MAX = 48;
export const CILS_B1C_TOTAL_FLOOR = 28; //  AND ≥28/48 overall

// Register is everyday/administrative Italian life (poste, comune, prefettura) — a "simplified B1"
// scoped for citizenship, not academic use. Scritta/Orale are AI criteria estimates.
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
      "CILS B1 Cittadinanza has NO capitalization: you must clear ≥7/12 in every one of the four sections AND reach ≥28/48 overall on the same sitting. Miss either condition and the whole exam is retaken — there is nothing to bank. Writing and Speaking here are AI criteria estimates.",
  };
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(CILS_B1C_SECTION_MAX, n));
}
