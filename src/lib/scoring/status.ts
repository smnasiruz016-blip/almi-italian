// Shared presentation-only status for per-section readouts. This is NOT scale data — the three
// engines keep their own scales/floors; this only labels how close a section is to its own floor.
export type SectionStatus = "CLEAR" | "BORDERLINE" | "BELOW";
