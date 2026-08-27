// THE PUBLISHED CILS B1 CITTADINANZA RUBRIC — Unistrasi's own criteria and weights.
//
// Source (verbatim, both the criteria and the point ceilings):
//   https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza.pdf
//   https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza_nuovi.pdf
//
// ── WHY THIS REPLACED WHAT WAS HERE ─────────────────────────────────────────
// Until now the estimate scored four criteria of OUR OWN devising, authored per item. They were
// reasonable and they were not the exam's. Unistrasi publishes the real criteria with weights,
// and they sum to exactly the 12 this engine already uses — so scoring against ours was
// inventing a rubric while an official one sat published at a public URL.
//
// ⚠️ SCOPE. These are CILS B1 CITTADINANZA's criteria and nothing else's. CILS UNO/DUE score
// five abilità out of 20 with a different rulebook, and CELI is part-scored by CVCL Perugia.
// Their engines are deliberately isolated (src/lib/scoring/*) and this rubric must NOT be
// copied across — no official sub-criteria for those modules were found, so they keep scoring
// against each item's own authored criteria until a source turns up.

export type OfficialCriterion = {
  /** Verbatim from the criteria PDF. Italian, because that is what the document says. */
  label: string;
  /** "fino a punti N" — the official ceiling for this criterion. */
  max: number;
  /** English gloss for the report; never replaces the official label. */
  gloss: string;
  /**
   * True when THIS product cannot honestly score it.
   *
   * Only "pronuncia e intonazione" is marked, and the reason is structural rather than a
   * limitation we might tune away: the orale estimate reads a Whisper TRANSCRIPT, not audio.
   * A transcript does not carry pronunciation or intonation, so any score here would be the
   * model inventing one. It is shown as NOT ASSESSED and excluded from the total.
   */
  notAssessed?: true;
  /** Shown to the learner wherever a criterion is not assessed. */
  notAssessedReason?: string;
};

export const CILS_B1C_SOURCE_URL =
  "https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza.pdf";

/** Produzione scritta — "Prova a tema (80 - 120 parole)", max 12. Sums to 12. */
export const CILS_B1C_SCRITTA: OfficialCriterion[] = [
  { label: "Efficacia comunicativa", max: 3, gloss: "does the text achieve what the task asked" },
  { label: "Adeguatezza stilistica", max: 1, gloss: "register and conventions fit the situation" },
  { label: "Correttezza morfosintattica", max: 4, gloss: "grammar and sentence structure" },
  { label: "Adeguatezza e ricchezza lessicale", max: 3, gloss: "vocabulary, precise and varied enough" },
  { label: "Ortografia e punteggiatura", max: 1, gloss: "spelling and punctuation" },
];

/** Produzione orale — "Prova a tema", max 12. Sums to 12; 11 are assessable here. */
export const CILS_B1C_ORALE: OfficialCriterion[] = [
  { label: "Efficacia comunicativa", max: 4, gloss: "does the response achieve what the task asked" },
  { label: "Correttezza morfosintattica", max: 4, gloss: "grammar and sentence structure" },
  { label: "Adeguatezza e ricchezza lessicale", max: 3, gloss: "vocabulary, precise and varied enough" },
  {
    label: "Pronuncia e intonazione",
    max: 1,
    gloss: "pronunciation and intonation",
    notAssessed: true,
    notAssessedReason:
      "Questa valutazione legge una trascrizione automatica, non l'audio: la pronuncia e l'intonazione non sono valutabili qui. Punto non assegnato.",
  },
];

/** The official section maximum — the sum of every criterion, assessed or not. */
export const officialMax = (cs: OfficialCriterion[]): number =>
  cs.reduce((n, c) => n + c.max, 0);

/** What this product can actually award — the official maximum minus anything it cannot hear. */
export const assessableMax = (cs: OfficialCriterion[]): number =>
  cs.filter((c) => !c.notAssessed).reduce((n, c) => n + c.max, 0);

/** Does this module have a published rubric to score against? Only B1 Cittadinanza, today. */
export function officialRubricFor(exam: string, level: string, section: string): OfficialCriterion[] | null {
  if (exam !== "CILS_B1C" || level !== "B1C") return null;
  if (section === "SCRITTA") return CILS_B1C_SCRITTA;
  if (section === "ORALE") return CILS_B1C_ORALE;
  return null;
}
