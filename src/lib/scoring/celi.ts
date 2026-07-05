// CELI engine (CVCL, Università per Stranieri di Perugia). Two PASS MODELS, keyed per level:
//  • "both-parts" (CELI 1–5): Written + Oral must EACH clear their own minimum (a strong written cannot
//    rescue a failed oral, or vice versa). Pass one part / fail the other → the passed part banks for ONE
//    YEAR (two sessions); resit only the failed part. CELI 2–5 also map the aggregate to an A–E band.
//  • "overall" (CELI Impatto/A1 only): certificate is decided by a SINGLE overall threshold — total ≥16 of
//    32 → P, else N. No per-part minima gate the certificate and there is NO capitalizzazione (banking).
//    The published oral sub-mark (≥8,01) is shown as an indicative sub-result, but per the official spec it
//    is the OVERALL total that governs P/N.
// Bands/grades are always a labelled ESTIMATE — only CVCL awards the real result.
//
// Numeric point totals are VERIFY-AT-BUILD, read directly from the official CVCL criteri-di-valutazione
// PDFs (unistrapg.it, 2026). Any level not yet read stays verified:false and the engine refuses to
// fabricate a pass/band — PENDING-FOUNDER-CHECK. DISTINCT engine path — never blended with either CILS engine.

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
  writtenMin: number | null; // minimum to clear the Written part (indicative-only in "overall" mode)
  oralMin: number | null; //    minimum to clear the Oral part (indicative-only in "overall" mode)
  passFloor: number | null; //  overall pass threshold — C-band floor (both-parts) / total pass mark (overall)
  bands: CeliBand[] | null;
  passMode: "both-parts" | "overall"; // how the certificate P/N is decided
}

const A_E = (a: number, b: number, c: number, d: number, top: number): CeliBand[] => [
  { grade: "A", min: a, max: top, label: "ottimo" },
  { grade: "B", min: b, max: a - 1, label: "buono" },
  { grade: "C", min: c, max: b - 1, label: "sufficiente (pass)" },
  { grade: "D", min: d, max: c - 1, label: "insufficiente" },
  { grade: "E", min: 0, max: d - 1, label: "gravemente insufficiente" },
];

// CELI 1–5 (A2–C2) both-parts; Impatto (A1) overall-threshold. All read from official CVCL
// criteri-di-valutazione PDFs (unistrapg.it, read 2026-07-05; see almi-italian-data/celi-numerics-verified.md).
// CELI 3 (B2) and CELI 4 (C1) legitimately share the identical 140/60/200 frame — confirmed against both
// official PDFs, not a copy error.
// IMPATTO (A1): Written (Lettura 0–8 + Interazione scritta 0–8) = 0–16; Oral raw 0–6 ×2,67 = 0–16; TOTALE
// 0–32; certificate superato at total ≥16 → P/N. writtenMin 0 / oralMin 8.01 are INDICATIVE sub-marks only
// (oral raw ≥3 → 8,01) — in "overall" mode they do NOT gate the certificate. No capitalizzazione.
export const CELI_CONFIG: Record<CeliLevel, CeliLevelConfig> = {
  IMPATTO: { cefr: "A1", label: "CELI Impatto", gradedBands: false, verified: true, writtenMax: 16, oralMax: 16, totalMax: 32, writtenMin: 0, oralMin: 8.01, passFloor: 16, bands: null, passMode: "overall" },
  UNO: { cefr: "A2", label: "CELI 1", gradedBands: false, verified: true, writtenMax: 90, oralMax: 40, totalMax: 130, writtenMin: 54, oralMin: 25, passFloor: 79, bands: null, passMode: "both-parts" },
  DUE: { cefr: "B1", label: "CELI 2", gradedBands: true, verified: true, writtenMax: 120, oralMax: 40, totalMax: 160, writtenMin: 72, oralMin: 22, passFloor: 94, bands: A_E(138, 115, 94, 60, 160), passMode: "both-parts" },
  TRE: { cefr: "B2", label: "CELI 3", gradedBands: true, verified: true, writtenMax: 140, oralMax: 60, totalMax: 200, writtenMin: 84, oralMin: 33, passFloor: 117, bands: A_E(173, 144, 117, 69, 200), passMode: "both-parts" },
  QUATTRO: { cefr: "C1", label: "CELI 4", gradedBands: true, verified: true, writtenMax: 140, oralMax: 60, totalMax: 200, writtenMin: 84, oralMin: 33, passFloor: 117, bands: A_E(173, 144, 117, 69, 200), passMode: "both-parts" },
  CINQUE: { cefr: "C2", label: "CELI 5", gradedBands: true, verified: true, writtenMax: 150, oralMax: 50, totalMax: 200, writtenMin: 89, oralMin: 28, passFloor: 117, bands: A_E(173, 144, 117, 72, 200), passMode: "both-parts" },
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
  if (!cfg.verified || cfg.writtenMin === null || cfg.oralMin === null || cfg.writtenMax === null || cfg.oralMax === null || cfg.totalMax === null || cfg.passFloor === null) {
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
  const total = w + o;
  const writtenPass = w >= cfg.writtenMin; // indicative in "overall" mode
  const oralPass = o >= cfg.oralMin; //      indicative in "overall" mode
  // "overall": certificate = single total threshold (A1). "both-parts": each part must clear its minimum.
  const passed = cfg.passMode === "overall" ? total >= cfg.passFloor : writtenPass && oralPass;

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

  // Banking (both-parts only — A1/overall has NO capitalizzazione): exactly one part cleared → it banks
  // for one year (two sessions).
  let banking: { bankablePart: CeliPart; years: 1 } | null = null;
  if (cfg.passMode === "both-parts" && writtenPass !== oralPass) banking = { bankablePart: writtenPass ? "WRITTEN" : "ORAL", years: 1 };

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
      cfg.passMode === "overall"
        ? "CELI Impatto (A1) is decided by your OVERALL total: 16 or more out of 32 is a pass (P), below is not (N). The Written and Oral sub-marks shown are indicative — it is the total that governs the certificate, and there is no part-banking at this level. The result here is a labelled estimate — only CVCL awards the real one."
        : "CELI is two parts — Written and Oral — and you must clear the minimum in BOTH; one cannot rescue the other. If you clear one part and not the other, the passed part banks for one year (two sessions) and you resit only the failed part. The A–E grade here is a labelled estimate — only CVCL awards the real result.",
  };
}

function clamp(n: number, max: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(max, n));
}
