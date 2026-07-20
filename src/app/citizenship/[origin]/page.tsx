import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, isTier1Origin } from "@/lib/seo/data";
import { canonical, nativeLead, SHAMOOL_LINE, TEST_NOT_CITIZENSHIP, DECREE_CITATION, CITIZENSHIP_ACCEPTED_HEDGE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ origin: string }> }): Promise<Metadata> {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) return {};
  return {
    title: `Italian citizenship & the B1 exam from ${o.name}`,
    description: `The B1 Italian requirement in a citizenship application from ${o.name}: which exam (CILS B1 Cittadinanza or CELI 2), how it is scored, and what the exam does — and does not — do. Honest, sourced, no predictions.`,
    alternates: { canonical: canonical(`/citizenship/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) notFound();
  const tier1 = isTier1Origin(o);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Citizenship · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Italian citizenship &amp; the B1 exam from {o.name}</h1>
      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">The B1 language step</h2>
      <p className="mt-2 text-almi-text">
        Citizenship by naturalisation asks for Italian at <strong className="text-almi-ink">B1</strong>. The dedicated exam is
        {" "}<Link href={`/exam/cils-b1-cittadinanza/from/${o.slug}`} className="text-almi-coral hover:underline">CILS B1 Cittadinanza</Link>{" "}
        — 4 sections, and you must clear a floor in every one <em>and</em> the overall total; it is all-or-nothing with no banking.
        {" "}<Link href={`/exam/celi-2-b1/from/${o.slug}`} className="text-almi-coral hover:underline">CELI 2 (B1)</Link> is another accepted certificate, on its own separate scale.
      </p>

      <p className="mt-3 text-sm text-almi-text-muted">{CITIZENSHIP_ACCEPTED_HEDGE}</p>

      <p className="mt-4 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{TEST_NOT_CITIZENSHIP}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">2025 reform — what changed</h2>
      <p className="mt-2 text-almi-text">
        Applications filed before <strong className="text-almi-ink">27 March 2025</strong> are assessed under the earlier rules; the 2025 reform
        (DL 36/2025, converted by L. 74/2025) tightened descent-based routes to roughly two generations. A review of the reform is pending before
        the Constitutional Court — we state this and do not predict its outcome.
      </p>
      {tier1 && (
        <p className="mt-4 text-almi-text">
          {o.name} is also one of the seven countries named in the November 2025 descent decree — see the{" "}
          <Link href={`/italian-descent/${o.slug}`} className="text-almi-coral hover:underline">{o.name} descent corridor</Link> for the out-of-quota work route.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise B1</Link>
        <Link href={`/residence-permit/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Residence permit (A2) from {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{DECREE_CITATION}</p>
    </main>
  );
}
