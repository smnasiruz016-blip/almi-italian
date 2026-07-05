import type { Metadata } from "next";
import Link from "next/link";
import { canonical, SHAMOOL_LINE, TWO_EXAMS_LINE } from "@/lib/seo/content";
import { GUIDES } from "@/lib/seo/guides";

export const metadata: Metadata = {
  title: "Guides — CILS, CELI, citizenship & residence, honestly",
  description: "Plain-English guides to Italy's two language exams (CILS and CELI) and the routes that ask for them: which level for the permit vs citizenship, how each exam is really scored, banking, the 2025 reform, and result timing.",
  alternates: { canonical: canonical("/guides") },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Guides</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">CILS, CELI &amp; the routes that ask for them</h1>
      <p className="mt-4 text-almi-text">{TWO_EXAMS_LINE}</p>
      <ul className="mt-8 space-y-3">
        {GUIDES.map((g) => (
          <li key={g.slug} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
            <Link href={`/guides/${g.slug}`} className="font-semibold text-almi-ink hover:text-almi-coral">{g.title}</Link>
            <p className="mt-1 text-sm text-almi-text">{g.blurb}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
