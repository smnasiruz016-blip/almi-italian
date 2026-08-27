import type { MetadataRoute } from "next";
import { ORIGINS, DESCENT } from "@/lib/seo/data";
import { SITE } from "@/lib/seo/content";
import { learnUrls } from "@/lib/learn/articles";

// HOLDING 2026-08-09 — one keep-set chunk. Previously TOTAL_CHUNKS chunks advertising the whole
// generated surface (ateneo x origin, ateneo x course x origin, exam-level x origin). Those routes
// no longer render, so advertising them would only burn crawl budget and point Google at 404s.
// @/lib/seo/plan still holds the full chunking math untouched — restore the imports and the
// Array.from(...) below to reverse. Keep this in step with sitemap-index.xml.
export const revalidate = false;

export async function generateSitemaps() {
  return [{ id: 0 }];
}

const entry = (path: string, priority = 0.5): MetadataRoute.Sitemap[number] => ({
  url: `${SITE}${path}`,
  changeFrequency: "weekly",
  priority,
});

// /learn carries an explicit, CONSTANT lastModified.
//
// A build-time `new Date()` would stamp every article as changed on every deploy, which tells
// Google the whole set is churning when nothing was edited — it costs crawl budget and teaches
// the crawler to distrust the field. A constant is honest: it moves when someone moves it.
const LEARN_LAST_MODIFIED = new Date("2026-08-29T00:00:00Z");
const learnEntry = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
  url: `${SITE}${path}`,
  changeFrequency: "monthly",
  priority,
  lastModified: LEARN_LAST_MODIFIED,
});

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  void (await id); // Next 16: id arrives as a Promise and must still be awaited (only chunk 0 exists).

  // Chunk 0 — the keep-set: statics, core pages, the per-origin families and descent. Every one of
  // these is a prerendered static page, so none of them can produce an ISR write.
  const out: MetadataRoute.Sitemap = [
    entry("/", 1),
    entry("/pricing", 0.7),
    entry("/practice", 0.7),
    entry("/signup", 0.5),
    entry("/login", 0.3),
    entry("/about", 0.5),
    entry("/italian-descent", 0.7),
    // The /guides hub and its nine pages used to be listed here. They are now /learn articles;
    // next.config.ts 301s every old URL. They are NOT listed as /learn URLs here either --
    // learnUrls() below derives those from the content directory, so an article appears in the
    // sitemap when it exists and not a moment before.
  ];

  // /learn — hub + every article, from the SAME directory scan the routes and the hub use
  // (src/lib/learn/articles.ts). One scan, so the sitemap cannot advertise a page that does not
  // render, and cannot omit one that does. Prerendered, so none of these can produce an ISR
  // write — which is what the holding freeze below exists to prevent.
  for (const url of learnUrls()) out.push(learnEntry(url, url === "/learn" ? 0.7 : 0.6));
  // Families 4–7: per-origin routes — prerendered keep-set.
  for (const o of ORIGINS) {
    out.push(entry(`/citizenship/${o.slug}`, 0.6));
    out.push(entry(`/residence-permit/${o.slug}`, 0.6));
    out.push(entry(`/study-in-italy/${o.slug}`, 0.6));
    out.push(entry(`/exams-in/${o.slug}`, 0.6));
  }
  // Family 8: descent corridor (7 tier-1 + 4 proposed + overview above) — NEVER ×196.
  for (const t of DESCENT.tier1) out.push(entry(`/italian-descent/${t.slug}`, 0.6));
  for (const t of DESCENT.proposed) out.push(entry(`/italian-descent/proposed/${t.slug}`, 0.4));

  // HOLDING 2026-08-09 — withdrawn until the page factory rebuilds them: Family 1 ateneo x origin,
  // Family 2 ateneo x course x origin, Family 3 exam-level x origin. Those routes now 404.
  return out;
}
