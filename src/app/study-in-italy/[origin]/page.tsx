import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, ATENEI, COURSES } from "@/lib/seo/data";
import { canonical, nativeLead, SHAMOOL_LINE, REQ_NOT_GUARANTEE, NO_LANGUAGE_CLAIM, USTAT_ATTRIBUTION } from "@/lib/seo/content";
import { OriginRecognitionSection } from "@/components/seo/OriginRecognitionSection";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ origin: string }> }): Promise<Metadata> {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) return {};
  return {
    title: `Study in Italy from ${o.name} — universities, courses & Italian`,
    description: `Studying in Italy from ${o.name}: the public university catalogue, honest Italian-language expectations (CILS or CELI), and how to prepare. Admission is a per-university decision, never a visa.`,
    alternates: { canonical: canonical(`/study-in-italy/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ origin: string }> }) {
  const { origin } = await params;
  const o = BY_ORIGIN.get(origin);
  if (!o) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Study in Italy · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Study in Italy from {o.name}</h1>
      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>
      <p className="mt-4 text-almi-text">
        Italy&apos;s public catalogue lists <strong className="text-almi-ink">{COURSES.length.toLocaleString()}</strong> current degree courses across
        {" "}<strong className="text-almi-ink">{ATENEI.length}</strong> universities. {NO_LANGUAGE_CLAIM} {REQ_NOT_GUARANTEE}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Browse universities</h2>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ATENEI.slice(0, 24).map((a) => (
          <li key={a.slug}>
            <Link href={`/university/${a.slug}/from/${o.slug}`} className="text-sm text-almi-ink hover:text-almi-coral">{a.nameShort}</Link>
            <span className="text-xs text-almi-text-muted"> · {a.citta}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-almi-text-muted">Showing 24 of {ATENEI.length}.</p>

      <OriginRecognitionSection origin={o} />

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise CILS &amp; CELI</Link>
        <Link href={`/exams-in/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Sit the exams in {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{USTAT_ATTRIBUTION}</p>
    </main>
  );
}
