import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, BY_ATENEO, BY_COURSE } from "@/lib/seo/data";
import { canonical, nativeLead, USTAT_ATTRIBUTION, SHAMOOL_LINE, REQ_NOT_GUARANTEE, NO_LANGUAGE_CLAIM, TWO_EXAMS_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

const LEVEL_LABEL: Record<string, string> = { triennale: "Triennale (Bachelor)", magistrale: "Magistrale (Master)", "ciclo-unico": "Ciclo unico (single-cycle)" };

export async function generateMetadata({ params }: { params: Promise<{ ateneo: string; course: string; origin: string }> }): Promise<Metadata> {
  const { ateneo, course, origin } = await params;
  const a = BY_ATENEO.get(ateneo); const c = BY_COURSE.get(`${ateneo}/${course}`); const o = BY_ORIGIN.get(origin);
  if (!a || !c || !o) return {};
  return {
    title: `${c.nomeCorso} at ${a.nameShort} from ${o.name} — CILS/CELI & admission`,
    description: `${c.nomeCorso} (${c.classe}) at ${a.name} for students from ${o.name}: honest Italian-language expectations (CILS or CELI), per-institution admission reality, and how to prepare. Admission is a university decision, not a visa.`,
    alternates: { canonical: canonical(`/university/${a.slug}/${c.slug}/from/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ ateneo: string; course: string; origin: string }> }) {
  const { ateneo, course, origin } = await params;
  const a = BY_ATENEO.get(ateneo); const c = BY_COURSE.get(`${ateneo}/${course}`); const o = BY_ORIGIN.get(origin);
  if (!a || !c || !o) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Study in Italy · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{c.nomeCorso}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">{c.classeDes} · {a.name} · {a.region}</p>
      <p className="mt-2 text-sm">
        <Link href={`/university/${a.slug}/from/${o.slug}`} className="text-almi-coral hover:underline">← all of {a.nameShort}&apos;s courses</Link>
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-almi-line bg-almi-paper p-5 text-sm sm:grid-cols-3">
        <div><dt className="text-almi-text-muted">Level</dt><dd className="font-medium text-almi-ink">{LEVEL_LABEL[c.level] ?? c.level}</dd></div>
        <div><dt className="text-almi-text-muted">National class</dt><dd className="font-medium text-almi-ink">{c.classe}</dd></div>
        <div><dt className="text-almi-text-muted">Delivery</dt><dd className="font-medium text-almi-ink">{c.didattica}</dd></div>
        {c.comune && <div><dt className="text-almi-text-muted">Location</dt><dd className="font-medium text-almi-ink">{c.comune}</dd></div>}
        {c.accesso && <div><dt className="text-almi-text-muted">Access</dt><dd className="font-medium text-almi-ink">{c.accesso}</dd></div>}
        {c.area && <div className="col-span-2 sm:col-span-3"><dt className="text-almi-text-muted">Field</dt><dd className="font-medium text-almi-ink">{c.area}{c.gruppo ? ` › ${c.gruppo}` : ""}</dd></div>}
      </dl>

      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Italian for {c.nomeCorso}</h2>
      <p className="mt-2 text-almi-text">
        Admission is set <strong className="text-almi-ink">per institution</strong>, so always verify with {a.nameShort}. {NO_LANGUAGE_CLAIM} {REQ_NOT_GUARANTEE}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">CILS or CELI — pick the right one</h2>
      <p className="mt-2 text-almi-text">{TWO_EXAMS_LINE} Practise the exact sections against each exam&apos;s real cutoff — we show your raw performance, never a fabricated score.</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise CILS &amp; CELI</Link>
        <Link href={`/study-in-italy/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Study in Italy from {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-3 text-xs text-almi-text-muted">{USTAT_ATTRIBUTION}</p>
    </main>
  );
}
