// Practice tracks — the ONE source of truth for the /practice picker and the section runner.
// Every scale/floor/honesty value is pulled from the scoring engines (never hardcoded), so a change
// to a threshold in src/lib/scoring/* flows straight through here. The three engines' scales are
// kept apart: a track carries exactly one engine's numbers and never blends them.
import type { ItalianExam } from "@/lib/items";
import { countFor } from "@/lib/items";
import {
  CILS_B1C_SECTION_MAX, CILS_B1C_FLOOR, CILS_B1C_TOTAL_MAX, CILS_B1C_TOTAL_FLOOR, scoreCilsB1c,
  CILS_STANDARD_SECTION_MAX, CILS_STANDARD_FLOOR, scoreCilsStandard,
  CELI_CONFIG, scoreCeli,
} from "@/lib/scoring";

export type SectionMeta = {
  slug: string;
  code: string; //  ASCOLTO | LETTURA | ANALISI | SCRITTA | ORALE
  label: string;
  kind: "objective" | "estimate"; // objective = auto-marked; estimate = AI Writing/Speaking (no auto-score)
};

// A per-section scale for section-scored engines (CILS). CELI is part-scored → scale is null and the
// runner shows raw + the part thresholds instead (never mis-scaling one section onto a part max).
export type Scale = { max: number; floor: number } | null;

export type Track = {
  slug: string;
  exam: ItalianExam;
  level: string; //   engine level key (B1C | UNO | DUE …)
  family: "CILS B1 Cittadinanza" | "CILS standard" | "CELI";
  label: string;
  tagline: string;
  flag?: boolean; //  flagship styling
  scale: Scale;
  honesty: string; // the engine's own honestyLine
  sections: SectionMeta[];
  modelNote: string; // all-or-nothing / capitalization / both-parts reminder (engine-derived)
};

const S = (slug: string, code: string, label: string, kind: SectionMeta["kind"]): SectionMeta => ({ slug, code, label, kind });

// honestyLine straight from each engine (call with empty/zero input — we only want the prose).
const B1C_HONESTY = scoreCilsB1c([]).honestyLine;
const STD_HONESTY = scoreCilsStandard("DUE", []).honestyLine;
const CELI_DUE = scoreCeli("DUE", { writtenScore: 0, oralScore: 0 });
const CELI_HONESTY = "honestyLine" in CELI_DUE ? CELI_DUE.honestyLine : "";

const CILS_STD_SECTIONS: SectionMeta[] = [
  S("ascolto", "ASCOLTO", "Ascolto (Listening)", "objective"),
  S("lettura", "LETTURA", "Lettura (Reading)", "objective"),
  S("analisi", "ANALISI", "Analisi delle strutture (Grammar)", "objective"),
  S("scritta", "SCRITTA", "Produzione scritta (Writing)", "estimate"),
  S("orale", "ORALE", "Produzione orale (Speaking)", "estimate"),
];

export const TRACKS: Track[] = [
  {
    slug: "b1-cittadinanza",
    exam: "CILS_B1C",
    level: "B1C",
    family: "CILS B1 Cittadinanza",
    label: "CILS B1 Cittadinanza",
    tagline: "The citizenship module — flagship, all-or-nothing.",
    flag: true,
    scale: { max: CILS_B1C_SECTION_MAX, floor: CILS_B1C_FLOOR },
    honesty: B1C_HONESTY,
    modelNote: `All-or-nothing: you must clear ≥${CILS_B1C_FLOOR}/${CILS_B1C_SECTION_MAX} in EVERY section AND reach ≥${CILS_B1C_TOTAL_FLOOR}/${CILS_B1C_TOTAL_MAX} overall on one sitting. Nothing banks.`,
    sections: [
      S("ascolto", "ASCOLTO", "Ascolto (Listening)", "objective"),
      S("lettura", "LETTURA", "Lettura + strutture (Reading)", "objective"),
      S("scritta", "SCRITTA", "Produzione scritta (Writing)", "estimate"),
      S("orale", "ORALE", "Produzione orale (Speaking)", "estimate"),
    ],
  },
  {
    slug: "cils-uno",
    exam: "CILS_STANDARD",
    level: "UNO",
    family: "CILS standard",
    label: "CILS UNO · B1",
    tagline: "Standard CILS at B1 — five sections, capitalization banking.",
    scale: { max: CILS_STANDARD_SECTION_MAX, floor: CILS_STANDARD_FLOOR },
    honesty: STD_HONESTY,
    modelNote: `Capitalization: you bank every section you clear (≥${CILS_STANDARD_FLOOR}/${CILS_STANDARD_SECTION_MAX}) and retake only those below the floor at a later sitting.`,
    sections: CILS_STD_SECTIONS,
  },
  {
    slug: "cils-due",
    exam: "CILS_STANDARD",
    level: "DUE",
    family: "CILS standard",
    label: "CILS DUE · B2",
    tagline: "Standard CILS at B2 — five sections, capitalization banking.",
    scale: { max: CILS_STANDARD_SECTION_MAX, floor: CILS_STANDARD_FLOOR },
    honesty: STD_HONESTY,
    modelNote: `Capitalization: you bank every section you clear (≥${CILS_STANDARD_FLOOR}/${CILS_STANDARD_SECTION_MAX}) and retake only those below the floor at a later sitting.`,
    sections: CILS_STD_SECTIONS,
  },
  {
    slug: "celi-due",
    exam: "CELI",
    level: "DUE",
    family: "CELI",
    label: "CELI 2 · B1",
    tagline: "CELI at B1 — scored by part (Written + Oral), both must clear.",
    scale: null, // part-scored: the runner shows raw + the Written/Oral thresholds from CELI_CONFIG
    honesty: CELI_HONESTY,
    modelNote: `Scored by part: the Written part must reach ≥${CELI_CONFIG.DUE.writtenMin}/${CELI_CONFIG.DUE.writtenMax} AND the Oral part ≥${CELI_CONFIG.DUE.oralMin}/${CELI_CONFIG.DUE.oralMax}; the A–E grade is an estimate. Each objective set below is one component of the Written part, not the whole part.`,
    sections: [
      S("ascolto", "ASCOLTO", "Ascolto — Written part (Listening)", "objective"),
      S("lettura", "LETTURA", "Lettura — Written part (Reading)", "objective"),
      S("scritta", "SCRITTA", "Produzione scritta — Written part", "estimate"),
      S("orale", "ORALE", "Produzione orale — Oral part", "estimate"),
    ],
  },
];

// ── COVERAGE: WHAT THE ENGINES KNOW vs WHAT LEARNERS CAN PRACTISE ───────────
// The three scoring engines between them declare 13 exam levels. TRACKS routes 4 of them. The
// other 9 have a verified scoring engine and NO item bank — so the product can score them and
// cannot give anyone anything to answer.
//
// That gap was previously invisible: it existed only as the difference between two lists nobody
// compared, so a reader of TRACKS saw four tracks and no indication that nine more were implied
// elsewhere. Declaring them here makes the gap a stated fact with a reason attached, and
// scripts/items/coverage-gate.mts fails the build if an engine level appears in neither list —
// so a level can be added to an engine and forgotten, but it cannot be added and hidden.
//
// This is a declaration of scope, not a plan. Routing one of these means authoring a full bank
// at that CEFR level (4–5 sections × 15 items, calibrated), which is content work and belongs in
// its own batch, not in a grading-integrity change.
export type Coverage = {
  exam: ItalianExam;
  level: string;
  cefr: string;
  label: string;
  status: "ROUTED" | "OUT_OF_SCOPE";
  note: string;
};

const NO_BANK = "Scoring engine verified; no item bank authored, so the level is not routed and no practice surface claims it.";

export const COVERAGE: Coverage[] = [
  { exam: "CILS_B1C", level: "B1C", cefr: "B1", label: "CILS B1 Cittadinanza", status: "ROUTED", note: "Flagship. 4 sections × 15." },

  { exam: "CILS_STANDARD", level: "A1", cefr: "A1", label: "CILS A1", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CILS_STANDARD", level: "A2", cefr: "A2", label: "CILS A2", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CILS_STANDARD", level: "UNO", cefr: "B1", label: "CILS UNO", status: "ROUTED", note: "5 sections × 15." },
  { exam: "CILS_STANDARD", level: "DUE", cefr: "B2", label: "CILS DUE", status: "ROUTED", note: "5 sections × 15." },
  { exam: "CILS_STANDARD", level: "TRE", cefr: "C1", label: "CILS TRE", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CILS_STANDARD", level: "QUATTRO", cefr: "C2", label: "CILS QUATTRO", status: "OUT_OF_SCOPE", note: NO_BANK },

  // CELI level→CEFR follows the CVCL (Perugia) mapping the engine encodes and the scoring
  // selftest asserts: Impatto A1 · CELI 1 A2 · CELI 2 B1 · CELI 3 B2 · CELI 4 C1 · CELI 5 C2.
  { exam: "CELI", level: "IMPATTO", cefr: "A1", label: "CELI Impatto", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CELI", level: "UNO", cefr: "A2", label: "CELI 1", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CELI", level: "DUE", cefr: "B1", label: "CELI 2", status: "ROUTED", note: "4 sections × 15." },
  { exam: "CELI", level: "TRE", cefr: "B2", label: "CELI 3", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CELI", level: "QUATTRO", cefr: "C1", label: "CELI 4", status: "OUT_OF_SCOPE", note: NO_BANK },
  { exam: "CELI", level: "CINQUE", cefr: "C2", label: "CELI 5", status: "OUT_OF_SCOPE", note: NO_BANK },
];

export const trackBySlug = (slug: string): Track | undefined => TRACKS.find((t) => t.slug === slug);
export const sectionBySlug = (t: Track, slug: string): SectionMeta | undefined => t.sections.find((s) => s.slug === slug);
export const sectionCount = (t: Track, s: SectionMeta): number => countFor(t.exam, t.level, s.code);
