// AlmiItalian — shared honest-content helpers for SEO pages. Every corridor page draws its framing
// from here so no page is a country-name find-replace, and the doctrine lines (requirement-not-
// guarantee, test-≠-citizenship, attribution, Shamool) are identical everywhere.
import type { Origin } from "@/lib/seo/data";
export { SITE, canonical, SHAMOOL_LINE } from "@/lib/site";

// USTAT attribution — reflects what we actually publish: ateneo/course identity from USTAT Open Data
// (IODL 2.0; the Atenei resource is Public Domain), English names/coordinates from Wikidata (CC0).
export const USTAT_ATTRIBUTION =
  "Ateneo & course data: MUR — USTAT Open Data (IODL 2.0; the Atenei resource is Public Domain), data ref. 2024. English names & coordinates: Wikidata (CC0). Processed/edited by AlmiWorld, not presented as issued by the Government of Italy.";

// Decree citation — carried on every descent-corridor page (Family 8).
export const DECREE_CITATION =
  "Source: Decreto interministeriale 17 novembre 2025, Gazzetta Ufficiale Serie Generale n. 273 del 24-11-2025 (25A06275), implementing Art. 27 co. 1-octies D.Lgs. 286/1998 (DL 36/2025 conv. L. 74/2025). Summarised by AlmiWorld; verify against the official text.";

// FACT BASE — CITIZENSHIP LANGUAGE REQUIREMENT (verified 2026-07-20).
//
//   • The level is B1. That part is not in dispute anywhere in this repo.
//
//   • CILS B1 Cittadinanza is NOT the only accepted certificate. The accepted list
//     also includes CELI 2 (B1), PLIDA B1, DILS-PG and IT (cert.it). This product
//     ships practice for CILS and CELI only — a SCOPE decision — and the copy must
//     not let that scope read as the accepted list. Say "among the certificates
//     accepted", never "the exam" or "the two exams you can take".
//
//   • Descent applicants are EXEMPT from the B1 requirement.
//
//   • The 2025 reform concerned DESCENT, not the B1 requirement. Do not describe it
//     as having introduced or changed the language level.
//
// ⚠️ UNRESOLVED CONTRADICTION, LEFT IN PLACE ON PURPOSE:
//   src/app/italian-descent/[country]/page.tsx currently tells the reader that
//   "descent-based routes still run through Italian at B1", which is the opposite of
//   the exemption above. That page is live and makes a legal claim about who must
//   sit an exam, so it is not being rewritten as a side effect of a hedge fix — it
//   needs its own decision and its own change. Whoever picks this up: one of the two
//   is wrong, and it is not a wording problem.

// The accepted-certificate hedge. Load-bearing: without it, naming CILS and CELI on
// a citizenship page tells an applicant who already holds PLIDA or IT that they need
// to sit another exam.
export const CITIZENSHIP_ACCEPTED_HEDGE =
  "CILS and CELI are two of the certificates accepted for the B1 citizenship requirement, not the whole list — PLIDA, DILS-PG and IT (cert.it) are accepted too. We ship practice for CILS and CELI, which is a choice about this product, not a statement about what counts.";

// Requirement-not-guarantee doctrine — a certificate is never a visa, a place, or citizenship.
export const REQ_NOT_GUARANTEE =
  "A CILS or CELI certificate is a requirement some universities and routes ask for — never a visa, an admission, or citizenship on its own.";

// Test-≠-citizenship line for the citizenship/descent pages.
export const TEST_NOT_CITIZENSHIP =
  "Passing a B1 exam is one document in a citizenship or residence file — it does not by itself grant status. The authorities decide; the deadlines and rules are theirs, and a court review of the 2025 reform is pending.";

// Language-of-instruction silence — the USTAT data carries no language field, so we never claim one.
export const NO_LANGUAGE_CLAIM =
  "The public course data does not record the language of instruction, so we do not claim this course is Italian- or English-taught — confirm directly with the ateneo. As a convention, Italian-taught degrees commonly expect B2 (CILS DUE / CELI 3), which is a guideline, not a national threshold.";

// Honest native-language mention (uses the origin's real search language label, never a country swap).
export function nativeLead(o: Origin): string {
  const lang = o.langLabel ? `${o.langLabel}-speaking learners in ` : "learners in ";
  return `For ${lang}${o.name}, this page keeps the facts local and honest — the two separate exams (CILS and CELI), each on its own real scale, with no invented thresholds.`;
}

// The two-exams / scales-never-mixed line — the core AlmiItalian differentiator, stated everywhere.
export const TWO_EXAMS_LINE =
  "Italy has two main certificates — CILS (Siena) and CELI (Perugia) — scored on entirely different scales. We keep them separate and show each one's real rules; we never blend the two.";
