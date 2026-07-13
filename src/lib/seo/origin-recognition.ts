// Origin-recognition resolver — the enforcement seam for the AlmiWorld pSEO
// Localization Standard (rules #1, #2, #4) inside AlmiItalian.
//
// AlmiItalian already localises the STUDY intent (nativeLead, descent corridors,
// CELI centres per origin). The Standard adds the missing dimension: what using
// an Italian degree back home actually requires — the origin's real degree-
// recognition body, its credential-equivalence norm, the concern that
// nationality brings, and the vocabulary it searches with. Verified facts come
// from the shared @smnasiruz016-blip/almi-data layer; unresearched origins get
// an honest-generic block (hedged, "confirm with the authority") — NEVER an
// invented body or a name-swap.

import { originContext } from "@smnasiruz016-blip/almi-data";
import type { Origin } from "@/lib/seo/data";

export type OriginRecognition = {
  /** true = verified per-origin facts; false = honest-generic fallback. */
  localized: boolean;
  recognitionBody: string;
  recognitionUrl?: string;
  equivalenceNote: string;
  commonConcern: string;
  searchTerms: string[];
  sourceNote?: string;
};

/** Strip trailing punctuation so a concern reads cleanly when quoted inline. */
export const cleanConcern = (s: string) => s.replace(/\s*[.?;]+\s*$/, "").trim();

/**
 * Resolve the degree-recognition block for an origin. NEVER null — an
 * unresearched origin still gets an origin-aware, hedged block so the page is
 * localized without fabricating a body or a number.
 */
export function resolveOriginRecognition(o: Origin): OriginRecognition {
  const loc = originContext(o.slug);
  if (loc) {
    return {
      localized: true,
      recognitionBody: loc.recognitionBody,
      recognitionUrl: loc.recognitionUrl,
      equivalenceNote: loc.equivalenceNote,
      commonConcern: loc.commonConcern,
      searchTerms: loc.searchTerms,
      sourceNote: loc.sourceNote,
    };
  }
  return {
    localized: false,
    recognitionBody: `the official degree-recognition authority in ${o.name}`,
    equivalenceNote: `If you plan to use an Italian degree back in ${o.name}, confirm how a foreign qualification is recognised with the relevant authority there before relying on it.`,
    commonConcern: `how an Italian qualification is recognised back in ${o.name}`,
    searchTerms: [],
  };
}
