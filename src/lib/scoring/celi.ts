// CELI engine (CVCL, Università per Stranieri di Perugia). TWO PARTS — Written + Oral — both must
// clear their own minimum (a strong written cannot rescue a failed oral, or vice versa). Result is a
// five-grade band (A/B/C pass · D/E fail) from the aggregate, shown as a labelled ESTIMATE. Pass one
// part, fail the other → the passed part banks for ONE YEAR (two sessions); resit only the failed part.
//
// Numeric point totals are VERIFY-AT-BUILD. Locked levels below were read directly from the official
// CVCL criteria-di-valutazione PDFs (unistrapg.it, July 2026). Un-verified levels are marked
// verified:false and the engine refuses to fabricate a pass/band for them — PENDING-FOUNDER-CHECK.
// This is a DISTINCT engine path — never blended with either CILS engine.

export type CeliLevel = "IMPATTO" | "UNO" | "DUE" | "TRE" | "QUATTRO" | "CINQUE";
export type CeliPart = "WRITTEN" | "ORAL";
export type CeliGrade = "A" | "B" | "C" | "D" | "E";

export interface CeliBand { grade: CeliGrade; min: number; max: number; label: string }

export interface CeliLevelConfig {
  cefr: string;
  label: string;
  gradedBands: boolean; //  Impatto & CELI 1 are pass/fail only; CELI 2–5 use A–E bands
  verified: boolean; //     true = locked from official CVCL PDF; false = PENDING-FOUNDER-CHECK
  writtenMax: number | null;
  oralMax: number | null;
  totalMax: number | null;
  writtenMin: number | null; // minimum to clear the Written part
  oralMin: number | null; //    minimum to clear the Oral part
  passFloor: number | null; //  overall pass threshold (C band floor)
  bands: CeliBand[] | null;
}

const A_E = (a: number, b: number, c: number, d: number, top: number): CeliBand[] => [
  { grade: "A", min: a, max: top, label: "ottimo" },
  { grade: "B", min: b, max: a - 1, label: "buono" },
  { grade: "C", min: c, max: b - 1, label: "sufficiente (pass)" },
  { grade: "D", min: d, max: c - 1, label: "insufficiente" },
  { grade: "E", min: 0, max: d - 1, label: "gravemente insufficiente" },
];

// CELI 2 (B1) and CELI 3 (B2): locked from official CVCL PDFs. Others PENDING official read.
export const CELI_CONFIG: Record<CeliLevel, CeliLevelConfig> = {
  IMPATTO: { cefr: "A1", label: "CELI Impatto", gradedBands: false, verified: false, writtenMax: null, oralMax: null, totalMax: null, writtenMin: null, oralMin: null, passFloor: null, bands: null },
  UNO: { cefr: "A2", label: "CELI 1", gradedBands: false, verified: false, writtenMax: null, oralMax: null, totalMax: null, writtenMin: null, oralMin: null, passFloor: null, bands: null },
  DUE: { cefr: "B1", label: "CELI 2", gradedBands: true, verified: true, writtenMax: 120, oralMax: 40, totalMax: 160, writtenMin: 72, oralMin: 22, passFloor: 94, bands: A_E(138, 115, 94, 60, 160) },
  TRE: { cefr: "B2", label: "CELI 3", gradedBands: true, verified: true, writtenMax: 140, oralMax: 60, totalMax: 200, writtenMin: 84, oralMin: 33, passFloor: 117, bands: A_E(173, 144, 117, 69, 200) },
  QUATTRO: { cefr: "C1", label: "CELI 4", gradedBands: true, verified: false, writtenMax: null, oralMax: null, totalMax: null, writtenMin: null, oralMin: null, passFloor: null, bands: null },
  CINQUE: { cefr: "C2", label: "CELI 5", gradedBands: true, verified: false, writtenMax: null, oralMax: null, totalMax: null, writtenMin: null, oralMin: null, passFloor: null, bands: null },
};

export interface CeliInput {
  writtenScore: number; // aggregate Written-part points
  oralScore: number; //   aggregate Oral-part points
}

export interface CeliPendingResult {
  exam: "CELI";
  level: CeliLevel;
  cefr: string;
  examLabel: string;
  verified: false;
  pending: true;
  note: string;
}

export interface CeliScoredResult {
  exam: "CELI";
  level: CeliLevel;
  cefr: string;
  examLabel: string;
  verified: true;
  pending: false;
  written: { score: number; max: number; min: number; pass: boolean };
  oral: { score: number; max: number; min: number; pass: boolean };
  passed: boolean; //     BOTH parts clear their minimum
  total: number;
  totalMax: number;
  gradeBand: CeliGrade | "PASS" | "FAIL"; // A–E when graded; PASS/FAIL for Impatto/CELI 1
  gradeLabel: string;
  isEstimate: true; //    the band is always an estimate (only CVCL awards the real grade)
  banking: { bankablePart: CeliPart; years: 1 } | null; // one part cleared, other not → bank 1 year
  honestyLine: string;
}

export type CeliResult = CeliPendingResult | CeliScoredResult;

export function scoreCeli(level: CeliLevel, input: CeliInput): CeliResult {
  const cfg = CELI_CONFIG[level];
  if (!cfg.verified || cfg.writtenMin === null || cfg.oralMin === null || cfg.writtenMax === null || cfg.oralMax === null || cfg.totalMax === null) {
    return {
      exam: "CELI",
      level,
      cefr: cfg.cefr,
      examLabel: cfg.label,
      verified: false,
      pending: true,
      note: `${cfg.label} (${cfg.cefr}) numeric thresholds are PENDING-FOUNDER-CHECK — not yet locked from the official CVCL specs. We do not fabricate a pass or grade for unverified levels.`,
    };
  }
  const w = clamp(input.writtenScore, cfg.writtenMax);
  const o = clamp(input.oralScore, cfg.oralMax);
  const writtenPass = w >= cfg.writtenMin;
  const oralPass = o >= cfg.oralMin;
  const passed = writtenPass && oralPass;
  const total = w + o;

  let gradeBand: CeliGrade | "PASS" | "FAIL";
  let gradeLabel: string;
  if (cfg.gradedBands && cfg.bands) {
    const band = cfg.bands.find((b) => total >= b.min && total <= b.max) ?? cfg.bands[cfg.bands.length - 1];
    gradeBand = band.grade;
    gradeLabel = band.label;
  } else {
    gradeBand = passed ? "PASS" : "FAIL";
    gradeLabel = passed ? "superato" : "non superato";
  }

  // Banking: exactly one part cleared → the cleared part banks for one year (two sessions).
  let banking: { bankablePart: CeliPart; years: 1 } | null = null;
  if (writtenPass !== oralPass) banking = { bankablePart: writtenPass ? "WRITTEN" : "ORAL", years: 1 };

  return {
    exam: "CELI",
    level,
    cefr: cfg.cefr,
    examLabel: cfg.label,
    verified: true,
    pending: false,
    written: { score: w, max: cfg.writtenMax, min: cfg.writtenMin, pass: writtenPass },
    oral: { score: o, max: cfg.oralMax, min: cfg.oralMin, pass: oralPass },
    passed,
    total,
    totalMax: cfg.totalMax,
    gradeBand,
    gradeLabel,
    isEstimate: true,
    banking,
    honestyLine:
      "CELI is two parts — Written and Oral — and you must clear the minimum in BOTH; one cannot rescue the other. If you clear one part and not the other, the passed part banks for one year (two sessions) and you resit only the failed part. The A–E grade here is a labelled estimate — only CVCL awards the real result.",
  };
}

function clamp(n: number, max: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(max, n));
}
