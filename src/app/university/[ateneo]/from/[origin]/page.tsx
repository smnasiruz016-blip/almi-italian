import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, BY_ATENEO, COURSES_BY_ATENEO } from "@/lib/seo/data";
import { canonical, nativeLead, USTAT_ATTRIBUTION, SHAMOOL_LINE, REQ_NOT_GUARANTEE, TWO_EXAMS_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ ateneo: string; origin: string }> }): Promise<Metadata> {
  const { ateneo, origin } = await params;
  const a = BY_ATENEO.get(ateneo); const o = BY_ORIGIN.get(origin);
  if (!a || !o) return {};
  return {
    title: `${a.name} from ${o.name} — courses, CILS/CELI & admission`,
    description: `${a.name} (${a.citta}) for students from ${o.name}: its degree courses, honest Italian-language expectations (CILS or CELI), and how to prepare. Admission is a university decision, not a visa.`,
    alternates: { canonical: canonical(`/university/${a.slug}/from/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ ateneo: string; origin: string }> }) {
  const { ateneo, origin } = await params;
  const a = BY_ATENEO.get(ateneo); const o = BY_ORIGIN.get(origin);
  if (!a || !o) notFound();
  const courses = COURSES_BY_ATENEO.get(a.slug) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Study in Italy · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{a.name}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">
        {a.enLabel && a.enLabel !== a.name ? `${a.enLabel} · ` : ""}{a.type} · {a.citta} · {a.region}
      </p>

      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>
      <p className="mt-4 text-almi-text">
        {a.nameShort} lists <strong className="text-almi-ink">{courses.length}</strong> current degree course{courses.length === 1 ? "" : "s"} in the public USTAT catalogue. {REQ_NOT_GUARANTEE} {TWO_EXAMS_LINE}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Courses at {a.nameShort}</h2>
      <ul className="mt-3 divide-y divide-almi-line rounded-2xl border border-almi-line bg-almi-paper">
        {courses.slice(0, 300).map((c) => (
          <li key={c.slug} className="px-4 py-3 text-sm">
            <Link href={`/university/${a.slug}/${c.slug}/from/${o.slug}`} className="font-medium text-almi-ink hover:text-almi-coral">{c.nomeCorso}</Link>
            <span className="text-almi-text-muted"> · {c.classe} · {c.level} · {c.didattica}</span>
          </li>
        ))}
      </ul>
      {courses.length > 300 && <p className="mt-2 text-xs text-almi-text-muted">Showing the first 300 of {courses.length}.</p>}

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise CILS &amp; CELI</Link>
        <Link href={`/study-in-italy/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Study in Italy from {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{USTAT_ATTRIBUTION}</p>
    </main>
  );
}
