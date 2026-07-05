import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_PROPOSED } from "@/lib/seo/data";
import { canonical, SHAMOOL_LINE, DECREE_CITATION } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const t = BY_PROPOSED.get(country);
  if (!t) return {};
  return {
    title: `${t.country} & Italian descent — proposed, not yet included`,
    description: `${t.country} was proposed by the CGIE for Italy's descent work-entry decree but was NOT included in the first phase. What that means today, honestly — no rights are implied, an extension is possible only by a future decree.`,
    alternates: { canonical: canonical(`/italian-descent/proposed/${t.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const t = BY_PROPOSED.get(country);
  if (!t) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Italian descent · proposed</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{t.country} — proposed, not yet included</h1>

      <p className="mt-6 rounded-xl border border-almi-line bg-almi-paper p-4 text-almi-text">
        {t.country} was <strong className="text-almi-ink">proposed by the CGIE</strong> for the descent work-entry route but was <strong className="text-almi-ink">not included</strong> in
        the November 2025 decree. As of today it carries <strong className="text-almi-ink">no</strong> out-of-quota descent work-entry right — an extension is possible only by a future decree,
        which we are watching and will not predict.
      </p>

      <p className="mt-6 text-almi-text">
        The ordinary Italian-language routes still apply: if you are pursuing citizenship or study, the exams are the same two — CILS and CELI — on their own separate scales.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise CILS &amp; CELI</Link>
        <Link href="/italian-descent" className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">The 7 included countries</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{DECREE_CITATION}</p>
    </main>
  );
}
