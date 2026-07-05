// AlmiItalian — Phase-3 SEO data layer. Loads the Phase-0 parsed datasets (real data only) and
// exposes the indexable splits that drive page generation. Every count is DERIVED from the data
// (never a hardcoded literal), so the hard exclusions — 11 ceased (M) atenei, the 9 active-but-no-
// current-offer atenei, and any course of a non-Family-1 ateneo — cannot drift.
import originsData from "@/data/origins.json";
import ateneiData from "@/data/it-atenei.json";
import coursesData from "@/data/it-courses.json";
import centersData from "@/data/it-exam-centers.json";
import descentData from "@/data/it-descent.json";
import { CELI_CONFIG, type CeliLevel } from "@/lib/scoring/celi";
import { CILS_STANDARD_SECTION_MAX, CILS_STANDARD_FLOOR } from "@/lib/scoring/cils-standard";
import { CILS_B1C_SECTION_MAX, CILS_B1C_FLOOR, CILS_B1C_TOTAL_FLOOR, CILS_B1C_TOTAL_MAX } from "@/lib/scoring/cils-b1c";

export type Origin = { slug: string; name: string; iso2: string; region: string; lang: string | null; langLabel: string | null };

// One page per ACTIVE ateneo that carries a current course offering (USTAT). Fields from USTAT
// (IODL 2.0) + Wikidata (CC0, where matched). No language-of-instruction field exists → never claimed.
export type Ateneo = {
  slug: string; name: string; nameShort: string;
  type: string;  // statale / non-statale / telematica
  kind: string; region: string; citta: string; code: string;
  enLabel: string | null; qid: string | null; lat: number | null; lng: number | null;
};

// One page per {ateneo, course}. All fields from USTAT open data. The dataset does NOT carry the
// language of instruction — pages never claim it. Delivery mode (didattica) IS in the data → shown honestly.
export type Course = {
  ateneoSlug: string; slug: string; nomeCorso: string;
  classe: string; classeDes: string;
  level: string;      // triennale / magistrale / ciclo-unico
  area: string; gruppo: string; comune: string; provincia: string;
  didattica: string;  // in presenza / mista / a distanza
  accesso: string;
};

export const ORIGINS = (originsData as Origin[]).slice().sort((a, b) => a.slug.localeCompare(b.slug));
export const ORIGIN_COUNT = ORIGINS.length; // 196
export const ATENEI = (ateneiData as Ateneo[]).slice().sort((a, b) => a.slug.localeCompare(b.slug));
export const COURSES = coursesData as Course[];

// Courses grouped by ateneo for the ateneo-page index + O(1) lookup.
export const COURSES_BY_ATENEO = new Map<string, Course[]>();
for (const c of COURSES) {
  const arr = COURSES_BY_ATENEO.get(c.ateneoSlug);
  if (arr) arr.push(c); else COURSES_BY_ATENEO.set(c.ateneoSlug, [c]);
}

// ---- The 13 exam-level surfaces (Family 3). Each carries ITS OWN exam's real rules, pulled from the
// scoring engines (single source of truth) so the scales are NEVER mixed in copy. ----
export type ExamLevel = {
  slug: string; exam: "CILS" | "CELI"; cefr: string; name: string; official: string; ruleLine: string;
};

const CILS_STD = (label: string) =>
  `CILS is scored over 5 sections, each out of ${CILS_STANDARD_SECTION_MAX}; you must reach ${CILS_STANDARD_FLOOR}/${CILS_STANDARD_SECTION_MAX} in every section. Sections you clear capitalise (bank) for a later sitting — you resit only what you missed.`;

const CILS_STD_LEVELS: { slug: string; cefr: string; name: string }[] = [
  { slug: "cils-a1", cefr: "A1", name: "CILS A1" },
  { slug: "cils-a2", cefr: "A2", name: "CILS A2" },
  { slug: "cils-uno-b1", cefr: "B1", name: "CILS UNO – B1" },
  { slug: "cils-due-b2", cefr: "B2", name: "CILS DUE – B2" },
  { slug: "cils-tre-c1", cefr: "C1", name: "CILS TRE – C1" },
  { slug: "cils-quattro-c2", cefr: "C2", name: "CILS QUATTRO – C2" },
];

// CELI rule line, derived from the verified CELI_CONFIG (both-parts vs overall pass models).
function celiRule(level: CeliLevel): string {
  const c = CELI_CONFIG[level];
  if (!c.verified || c.totalMax === null || c.passFloor === null) return "Scoring for this level is being confirmed against the official CVCL specs.";
  if (c.passMode === "overall")
    return `CELI Impatto is one overall mark out of ${c.totalMax}: ${c.passFloor} or more is a pass (P), below is not (N). Written and oral sub-scores are indicative — the total decides it. No part-banking.`;
  const parts = `Written out of ${c.writtenMax} (min ${c.writtenMin}) plus Oral out of ${c.oralMax} (min ${c.oralMin}); you must clear BOTH`;
  if (c.gradedBands)
    return `${parts}. Pass from ${c.passFloor}/${c.totalMax}, reported as an A–E band. Clear one part and not the other → the passed part banks for one year.`;
  return `${parts}, passing from ${c.passFloor}/${c.totalMax}. Clear one part and not the other → the passed part banks for one year.`;
}

const CELI_LEVELS: { slug: string; cefr: string; name: string; level: CeliLevel }[] = [
  { slug: "celi-impatto-a1", cefr: "A1", name: "CELI Impatto", level: "IMPATTO" },
  { slug: "celi-1-a2", cefr: "A2", name: "CELI 1", level: "UNO" },
  { slug: "celi-2-b1", cefr: "B1", name: "CELI 2", level: "DUE" },
  { slug: "celi-3-b2", cefr: "B2", name: "CELI 3", level: "TRE" },
  { slug: "celi-4-c1", cefr: "C1", name: "CELI 4", level: "QUATTRO" },
  { slug: "celi-5-c2", cefr: "C2", name: "CELI 5", level: "CINQUE" },
];

export const EXAM_LEVELS: ExamLevel[] = [
  ...CILS_STD_LEVELS.map((l) => ({ slug: l.slug, exam: "CILS" as const, cefr: l.cefr, name: l.name, official: "Università per Stranieri di Siena", ruleLine: CILS_STD(l.name) })),
  // CILS B1 Cittadinanza (flagship) — the all-or-nothing citizenship variant, NEVER blended with CILS standard.
  { slug: "cils-b1-cittadinanza", exam: "CILS", cefr: "B1", name: "CILS B1 Cittadinanza", official: "Università per Stranieri di Siena",
    ruleLine: `The citizenship exam has 4 sections, each out of ${CILS_B1C_SECTION_MAX}; you need ${CILS_B1C_FLOOR}/${CILS_B1C_SECTION_MAX} in EVERY section AND ${CILS_B1C_TOTAL_FLOOR}/${CILS_B1C_TOTAL_MAX} overall. It is all-or-nothing — there is NO banking; a strong section cannot rescue a weak one.` },
  ...CELI_LEVELS.map((l) => ({ slug: l.slug, exam: "CELI" as const, cefr: l.cefr, name: l.name, official: "Università per Stranieri di Perugia (CVCL)", ruleLine: celiRule(l.level) })),
];

// ---- Descent corridor (Family 8): the 7 Tier-1 decree countries + 4 CGIE-proposed (deferred) ----
export type DescentTier1 = { slug: string; country: string; aire: number | null; celiCenters: number };
export type DescentProposed = { slug: string; country: string };
export const DESCENT = descentData as { tier1: DescentTier1[]; proposed: DescentProposed[]; decree: string };
export const TIER1_SLUGS = new Set(DESCENT.tier1.map((t) => t.slug));
export const isTier1Origin = (o: Origin) => TIER1_SLUGS.has(o.slug);

// ---- Exam centers ----
export type CeliCenter = { exam: "CELI"; country: string; city: string; institution: string };
export const EXAM_CENTERS = centersData as { celi: CeliCenter[]; celiByCountry: Record<string, number>; cilsStatus: string };
// origin.name → Italian country label used in the CELI centers dataset (only where they differ).
const ORIGIN_TO_CELI_COUNTRY: Record<string, string> = {
  Brazil: "Brasile", "United States": "Stati Uniti d'America",
};
export function celiCentersForOrigin(o: Origin): number {
  return EXAM_CENTERS.celiByCountry[ORIGIN_TO_CELI_COUNTRY[o.name] ?? o.name] ?? 0;
}

// ---- Lookups ----
export const BY_ORIGIN = new Map(ORIGINS.map((o) => [o.slug, o]));
export const BY_ATENEO = new Map(ATENEI.map((a) => [a.slug, a]));
export const BY_COURSE = new Map(COURSES.map((c) => [`${c.ateneoSlug}/${c.slug}`, c]));
export const BY_LEVEL = new Map(EXAM_LEVELS.map((l) => [l.slug, l]));
export const BY_TIER1 = new Map(DESCENT.tier1.map((t) => [t.slug, t]));
export const BY_PROPOSED = new Map(DESCENT.proposed.map((t) => [t.slug, t]));
