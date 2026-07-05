import type { MetadataRoute } from "next";
import { ORIGINS, ATENEI, COURSES, EXAM_LEVELS, DESCENT } from "@/lib/seo/data";
import { CHUNK, ateneoChunks, TOTAL_CHUNKS, productSlice } from "@/lib/seo/plan";
import { SITE } from "@/lib/seo/content";

export const revalidate = 86_400;

export async function generateSitemaps() {
  return Array.from({ length: TOTAL_CHUNKS }, (_, i) => ({ id: i }));
}

const entry = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({
  url: `${SITE}${path}`,
  changeFrequency: "weekly",
  priority,
});

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const k = Number(await id); // Next 16: id arrives as a Promise — must await + Number or chunks emit 0 URLs.

  // Chunk 0: statics + core pages + every small family (examLevel×origin, Families 4–7, descent).
  if (k === 0) {
    const out: MetadataRoute.Sitemap = [
      entry("/", 1),
      entry("/pricing", 0.7),
      entry("/practice", 0.7),
      entry("/signup", 0.5),
      entry("/login", 0.3),
      entry("/about", 0.5),
      entry("/italian-descent", 0.7),
    ];
    // Family 3: exam-level × origin
    for (const l of EXAM_LEVELS) for (const o of ORIGINS) out.push(entry(`/exam/${l.slug}/from/${o.slug}`, 0.6));
    // Families 4–7: per-origin routes
    for (const o of ORIGINS) {
      out.push(entry(`/citizenship/${o.slug}`, 0.6));
      out.push(entry(`/residence-permit/${o.slug}`, 0.6));
      out.push(entry(`/study-in-italy/${o.slug}`, 0.6));
      out.push(entry(`/exams-in/${o.slug}`, 0.6));
    }
    // Family 8: descent corridor (7 tier-1 + 4 proposed + overview above) — NEVER ×196.
    for (const t of DESCENT.tier1) out.push(entry(`/italian-descent/${t.slug}`, 0.6));
    for (const t of DESCENT.proposed) out.push(entry(`/italian-descent/proposed/${t.slug}`, 0.4));
    return out;
  }

  // Chunks 1..ateneoChunks: Family 1 — ateneo × origin, sliced by global index.
  if (k <= ateneoChunks) {
    const idx = k - 1;
    return productSlice(ATENEI, idx * CHUNK, (idx + 1) * CHUNK, (a, o) => `/university/${a.slug}/from/${o.slug}`).map((p) => entry(p));
  }

  // Remaining chunks: Family 2 — course × origin, sliced by global index.
  const idx = k - ateneoChunks - 1;
  return productSlice(COURSES, idx * CHUNK, (idx + 1) * CHUNK, (c, o) => `/university/${c.ateneoSlug}/${c.slug}/from/${o.slug}`).map((p) => entry(p));
}
