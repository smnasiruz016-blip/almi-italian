import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, celiCentersForOrigin } from "@/lib/seo/data";
import { canonical, nativeLead, SHAMOOL_LINE, TWO_EXAMS_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ origin: string }> }): Promise<Metadata> {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) return {};
  return {
    title: `Sitting CILS & CELI in ${o.name} — exam centres`,
    description: `Where to sit the Italian exams from ${o.name}: CELI centres on record, the CILS centre list status, and honest nearest-centre routing where there is no local centre.`,
    alternates: { canonical: canonical(`/exams-in/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) notFound();
  const celi = celiCentersForOrigin(o);
  const isCanada = o.slug === "canada";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Exam centres · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Sitting CILS &amp; CELI in {o.name}</h1>
      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">CELI centres</h2>
      <p className="mt-2 text-almi-text">
        {celi > 0
          ? <>The official CVCL list records <strong className="text-almi-ink">{celi}</strong> CELI centre{celi === 1 ? "" : "s"} in {o.name}. Confirm the current session and address with the centre before you register.</>
          : <>The official CVCL list records <strong className="text-almi-ink">no CELI centre</strong> in {o.name} at the moment{isCanada ? " — Canadian candidates typically sit CELI at the nearest United States centre (and CILS once its centre list is confirmed)." : ". You would sit at the nearest centre in a neighbouring country."}</>}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">CILS centres</h2>
      <p className="mt-2 text-almi-text">
        The CILS (Siena) worldwide centre list is being verified from the official source — we will not list CILS locations we have not confirmed. Until then, check the University for Foreigners of Siena directly for a centre in {o.name}.
      </p>

      <p className="mt-4 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{TWO_EXAMS_LINE}</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise before you sit</Link>
        <Link href={`/study-in-italy/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Study in Italy from {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">CELI centres: official CVCL list (Università per Stranieri di Perugia), updated 2026-03-19. CILS list pending verification.</p>
    </main>
  );
}
