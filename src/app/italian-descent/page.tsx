import type { Metadata } from "next";
import Link from "next/link";
import { DESCENT } from "@/lib/seo/data";
import { canonical, SHAMOOL_LINE, DECREE_CITATION, TEST_NOT_CITIZENSHIP } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Italian descent & the 2025 work-entry decree — the 7 countries",
  description: "The November 2025 decree names 7 countries of historic Italian emigration whose Italian-descendant citizens get out-of-quota work entry. The honest list, who the B1 language requirement applies to, and the 4 proposed-but-not-included countries.",
  alternates: { canonical: canonical("/italian-descent") },
};

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Italian descent</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">The 2025 descent decree — 7 countries, honestly</h1>
      <p className="mt-6 text-almi-text">
        A November 2025 interministerial decree names the countries of historic Italian emigration whose citizens, if they are descendants of Italian
        citizens, can enter Italy for work <strong className="text-almi-ink">outside the flow-decree quotas</strong> (Art. 27 co. 1-octies). Seven countries are in;
        four more were proposed and left out. We list exactly what the decree says — and only that.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">The 7 decree countries</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DESCENT.tier1.map((t) => (
          <li key={t.slug}><Link href={`/italian-descent/${t.slug}`} className="text-sm font-medium text-almi-ink hover:text-almi-coral">{t.country}</Link></li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Proposed, not included</h2>
      <p className="mt-2 text-sm text-almi-text">The CGIE proposed these four; they are <strong className="text-almi-ink">not</strong> in the decree. They carry no descent work-entry right today — an extension is possible only by a future decree.</p>
      <ul className="mt-3 flex flex-wrap gap-3">
        {DESCENT.proposed.map((t) => (
          <li key={t.slug}><Link href={`/italian-descent/proposed/${t.slug}`} className="text-sm text-almi-text hover:text-almi-coral">{t.country}</Link></li>
        ))}
      </ul>

      <p className="mt-6 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{TEST_NOT_CITIZENSHIP}</p>
      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{DECREE_CITATION}</p>
    </main>
  );
}
