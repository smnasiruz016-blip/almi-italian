import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_TIER1, BY_ORIGIN } from "@/lib/seo/data";
import { canonical, SHAMOOL_LINE, DECREE_CITATION, TEST_NOT_CITIZENSHIP } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params;
  const t = BY_TIER1.get(country);
  if (!t) return {};
  return {
    title: `${t.country} & the Italian descent decree — work entry & B1`,
    description: `${t.country} is one of the 7 countries in Italy's November 2025 descent decree: out-of-quota work entry for Italian-descendant citizens, the B1 language step, and where to sit the exam. Honest and sourced.`,
    alternates: { canonical: canonical(`/italian-descent/${t.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const t = BY_TIER1.get(country);
  if (!t) notFound();
  const o = BY_ORIGIN.get(t.slug);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Italian descent · {t.country}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{t.country} &amp; the 2025 descent decree</h1>

      <p className="mt-6 text-almi-text">
        {t.country} is one of the seven countries named in the November 2025 decree. Its citizens who are descendants of Italian citizens can enter
        Italy for subordinate work <strong className="text-almi-ink">outside the flow-decree quotas</strong> (Art. 27 co. 1-octies).
      </p>
      <p className="mt-4 rounded-xl border border-almi-line bg-almi-paper p-4 text-almi-text">
        {t.aire !== null
          ? <>Registered Italian community in {t.country}: <strong className="text-almi-ink">{t.aire.toLocaleString()}</strong> (AIRE), the community-size basis the decree uses.</>
          : <>{t.country} qualifies on the size of its registered Italian community (AIRE over 100,000). The exact figure is being confirmed against the Gazzetta Ufficiale text — we do not print a number we have not verified.</>}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">The B1 language step</h2>
      <p className="mt-2 text-almi-text">
        Descent-based routes still run through Italian at <strong className="text-almi-ink">B1</strong> — via{" "}
        <Link href={`/exam/cils-b1-cittadinanza/from/${t.slug}`} className="text-almi-coral hover:underline">CILS B1 Cittadinanza</Link> or{" "}
        <Link href={`/exam/celi-2-b1/from/${t.slug}`} className="text-almi-coral hover:underline">CELI 2 (B1)</Link>, each on its own scale.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Where to sit the exam</h2>
      <p className="mt-2 text-almi-text">
        {t.celiCenters > 0
          ? <>The official CVCL list records <strong className="text-almi-ink">{t.celiCenters}</strong> CELI centre{t.celiCenters === 1 ? "" : "s"} in {t.country}.</>
          : <><strong className="text-almi-ink">No CELI centre</strong> is recorded in {t.country}{t.slug === "canada" ? " — candidates typically sit at the nearest United States centre (and CILS once its list is confirmed)" : ""}.</>}{" "}
        <Link href={`/exams-in/${t.slug}`} className="text-almi-coral hover:underline">Exam centres in {t.country} →</Link>
      </p>

      <p className="mt-6 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{TEST_NOT_CITIZENSHIP}</p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {o && <Link href={`/citizenship/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Citizenship (B1) from {t.country}</Link>}
        <Link href="/italian-descent" className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">All 7 decree countries</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{DECREE_CITATION}</p>
    </main>
  );
}
