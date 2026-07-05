import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN } from "@/lib/seo/data";
import { canonical, nativeLead, SHAMOOL_LINE, REQ_NOT_GUARANTEE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ origin: string }> }): Promise<Metadata> {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) return {};
  return {
    title: `Long-term residence & the A2 Italian exam from ${o.name}`,
    description: `The A2 Italian requirement for the EU long-term residence permit from ${o.name}: which exam (CILS A2 or CELI 1), how it is scored, and what it is for. Honest and sourced — a permit is decided by the authorities, not by a test.`,
    alternates: { canonical: canonical(`/residence-permit/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Residence permit · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Long-term residence &amp; the A2 exam from {o.name}</h1>
      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">The A2 language step</h2>
      <p className="mt-2 text-almi-text">
        The EU long-term residence permit (<em>permesso di soggiorno UE per soggiornanti di lungo periodo</em>) asks for Italian at
        {" "}<strong className="text-almi-ink">A2</strong>. You can meet it with{" "}
        <Link href={`/exam/cils-a2/from/${o.slug}`} className="text-almi-coral hover:underline">CILS A2</Link> or{" "}
        <Link href={`/exam/celi-1-a2/from/${o.slug}`} className="text-almi-coral hover:underline">CELI 1 (A2)</Link> — two separate exams, each on its own scale.
      </p>
      <p className="mt-4 text-almi-text">{REQ_NOT_GUARANTEE} The permit itself is decided by the questura on the whole file — the exam is one document in it.</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise A2</Link>
        <Link href={`/citizenship/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Citizenship (B1) from {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
