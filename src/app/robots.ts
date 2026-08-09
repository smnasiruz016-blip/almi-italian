import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo/content";

// Deep per-origin long-tail leaves. Origin HUBS (/citizenship/<origin>,
// /residence-permit/<origin>, /study-in-italy/<origin>, /exams-in/<origin>) stay
// crawlable; only /from/ leaves are trimmed. "/university/*/from/" covers both
// /university/[ateneo]/from/ and /university/[ateneo]/[course]/from/.
const DEEP_LEAVES = ["/exam/*/from/", "/university/*/from/"];

const HEAVY_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "anthropic-ai",
  "CCBot", "Bytespider", "Amazonbot", "PerplexityBot", "Google-Extended",
  "AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "DataForSeoBot", "PetalBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // HOLDING 2026-08-09 — DEEP_LEAVES now applies to Googlebot and Bingbot too; those routes
      // no longer render. Advisory only — the route config is what stops the ISR writes.
      { userAgent: ["Googlebot", "Bingbot"], allow: "/", disallow: ["/api/", ...DEEP_LEAVES] },
      { userAgent: "*", allow: "/", disallow: ["/api/", ...DEEP_LEAVES], crawlDelay: 10 },
      { userAgent: HEAVY_BOTS, disallow: "/" },
    ],
    sitemap: `${SITE}/sitemap-index.xml`,
    host: SITE,
  };
}
