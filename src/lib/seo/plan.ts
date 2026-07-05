// AlmiItalian — Phase-3 page plan + sitemap chunking. All math is DERIVED from the real datasets
// (never hardcoded), so the exclusions (ceased atenei, no-offer atenei, descent-never-×196) cannot drift.
import { ORIGINS, ORIGIN_COUNT, ATENEI, COURSES, EXAM_LEVELS, DESCENT } from "@/lib/seo/data";

const N = ORIGIN_COUNT; // 196

// Family page-count math. The descent family is DELIBERATELY never ×196 — it is a per-country
// corridor (7 decree countries + 4 proposed-not-included + 1 overview), not an origin localization.
export const FAMILY_COUNTS = {
  ateneo: ATENEI.length * N, //        Family 1: 92 active-with-offer atenei × origins = 18,032
  course: COURSES.length * N, //       Family 2: 5,833 courses × origins = 1,143,268
  examLevel: EXAM_LEVELS.length * N, // Family 3: 13 exam-level surfaces × origins = 2,548
  citizenship: N, //                   Family 4: citizenship (B1) route × origins
  residence: N, //                     Family 5: residence-permit (A2) route × origins
  study: N, //                         Family 6: study route × origins
  examsInOrigin: N, //                 Family 7: exams-in-origin × origins
  descent: DESCENT.tier1.length + DESCENT.proposed.length + 1, // Family 8: 7 + 4 + overview (NEVER ×196)
} as const;

export const GRAND_TOTAL = Object.values(FAMILY_COUNTS).reduce((a, b) => a + b, 0);

// Sitemap chunking (Next 16 generateSitemaps). 40k URLs/chunk stays under Google's 50k cap — the
// proven network-standard chunk size (AlmiKorean/AlmiFrench). Course × origin is the big fan-out.
export const CHUNK = 40_000;

// Chunk 0        = statics + core pages + every small family (examLevel×origin, Families 4–7, descent).
// Chunks 1..A    = ateneo × origin (Family 1).
// Chunks A+1..   = course × origin (Family 2 — the big one).
export const ateneoChunks = Math.ceil(FAMILY_COUNTS.ateneo / CHUNK);
export const courseChunks = Math.ceil(FAMILY_COUNTS.course / CHUNK);
export const TOTAL_CHUNKS = 1 + ateneoChunks + courseChunks;

// Slice a (list × origins) cartesian product by global index without materialising it.
export function productSlice<T>(list: T[], lo: number, hi: number, make: (item: T, origin: (typeof ORIGINS)[number]) => string): string[] {
  const end = Math.min(hi, list.length * N);
  const out: string[] = [];
  for (let gi = lo; gi < end; gi++) out.push(make(list[Math.floor(gi / N)], ORIGINS[gi % N]));
  return out;
}
