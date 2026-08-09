// Sitemap index — lists every /sitemap/[id].xml chunk. Next 16 does not serve an index at
// /sitemap.xml when generateSitemaps() is used, so we emit a standard <sitemapindex> here and
// point robots.txt + GSC at /sitemap-index.xml.
import { SITE } from "@/lib/seo/content";

// HOLDING 2026-08-09 — one chunk, mirroring sitemap.ts. Advertising more chunks than sitemap.ts
// fills leaves the tail as phantom 404s in GSC. Restore the TOTAL_CHUNKS import to reverse.
const HOLDING_CHUNKS = 1;

export const revalidate = false;

export function GET() {
  const items = Array.from(
    { length: HOLDING_CHUNKS },
    (_, id) => `<sitemap><loc>${SITE}/sitemap/${id}.xml</loc></sitemap>`
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</sitemapindex>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=0, must-revalidate" },
  });
}
