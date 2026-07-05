// CILS STANDARD engine (Università per Stranieri di Siena) — A1 → QUATTRO/C2.
// FIVE sections, each /20, pass floor 11 in EVERY section. Capitalization: fail some sections →
// retake ONLY those at a later sitting. This is a DISTINCT engine path — never blended with CILS
// B1 Cittadinanza (see cils-b1c.ts) or CELI (see celi.ts). Do not import section types across engines.

export type CilsStandardLevel = "A1" | "A2" | "UNO" | "DUE" | "TRE" | "QUATTRO";
export type CilsStandardSection = "ASCOLTO" | "LETTURA" | "ANALISI" | "SCRITTA" | "ORALE";
import type { SectionStatus } from "./status";

export const CILS_STANDARD_SECTION_MAX = 20;
export const CILS_STANDARD_FLOOR = 11; // ≥11/20 required in EVERY section
export const CILS_STANDARD_TOTAL_MAX = 100;

// Analisi (grammar/structures) is a CILS distinctive — a first-class section. Produzione scritta/orale
// are AI criteria estimates (only Siena awards real results); every readout carries an estimate label.
export const CILS_STANDARD_SECTIONS: { section: CilsStandardSection; label: string; isEstimate: boolean }[] = [
  { section: "ASCOLTO", label: "Ascolto (Listening)", isEstimate: false },
  { section: "LETTURA", label: "Lettura (Reading)", isEstimate: false },
  { section: "ANALISI", label: "Analisi delle strutture (grammar)", isEstimate: false },
  { section: "SCRITTA", label: "Produzione scritta (Writing)", isEstimate: true },
  { section: "ORALE", label: "Produzione orale (Speaking)", isEstimate: true },
];

const LEVEL_LABEL: Record<CilsStandardLevel, string> = {
  A1: "CILS A1", A2: "CILS A2", UNO: "CILS UNO (B1)", DUE: "CILS DUE (B2)", TRE: "CILS TRE (C1)", QUATTRO: "CILS QUATTRO (C2)",
};

export interface CilsStandardInput {
  section: CilsStandardSection;
  score: number; // 0..20 (raw for Ascolto/Lettura/Analisi; AI estimate for Scritta/Orale)
}

export interface CilsStandardSectionResult {
  section: CilsStandardSection;
  label: string;
  score: number;
  max: number; //   20
  floor: number; // 11
  status: SectionStatus;
  isEstimate: boolean;
}

export interface CilsStandardResult {
  exam: "CILS";
  variant: "standard";
  level: CilsStandardLevel;
  examLabel: string;
  sections: CilsStandardSectionResult[];
  total: number;
  totalMax: number; // 100
  passed: boolean; //           ALL five sections ≥ 11
  bankingModel: "capitalization";
  bankedToday: CilsStandardSection[]; // sections you'd bank today (≥11) — the killer feature
  toRetake: CilsStandardSection[]; //   sections you'd need to retake (<11)
  honestyLine: string;
}

function statusFor(score: number): SectionStatus {
  if (score >= CILS_STANDARD_FLOOR) return "CLEAR";
  if (score >= CILS_STANDARD_FLOOR - 2) return "BORDERLINE"; // 9–10: within striking distance of the floor
  return "BELOW";
}

export function scoreCilsStandard(level: CilsStandardLevel, inputs: CilsStandardInput[]): CilsStandardResult {
  const bySection = new Map(inputs.map((i) => [i.section, i.score]));
  const sections: CilsStandardSectionResult[] = CILS_STANDARD_SECTIONS.map((s) => {
    const score = clamp(bySection.get(s.section) ?? 0);
    return { section: s.section, label: s.label, score, max: CILS_STANDARD_SECTION_MAX, floor: CILS_STANDARD_FLOOR, status: statusFor(score), isEstimate: s.isEstimate };
  });
  const total = sections.reduce((a, s) => a + s.score, 0);
  const bankedToday = sections.filter((s) => s.score >= CILS_STANDARD_FLOOR).map((s) => s.section);
  const toRetake = sections.filter((s) => s.score < CILS_STANDARD_FLOOR).map((s) => s.section);
  return {
    exam: "CILS",
    variant: "standard",
    level,
    examLabel: LEVEL_LABEL[level],
    sections,
    total,
    totalMax: CILS_STANDARD_TOTAL_MAX,
    passed: toRetake.length === 0,
    bankingModel: "capitalization",
    bankedToday,
    toRetake,
    honestyLine:
      "CILS standard uses capitalization: you keep (bank) every section you pass and retake only the ones below 11/20 at a later sitting. Writing and Speaking here are AI criteria estimates — only Siena awards a real result.",
  };
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(CILS_STANDARD_SECTION_MAX, n));
}
