import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BY_ORIGIN, BY_LEVEL } from "@/lib/seo/data";
import { canonical, nativeLead, SHAMOOL_LINE, REQ_NOT_GUARANTEE, TWO_EXAMS_LINE } from "@/lib/seo/content";

export const dynamicParams = true;
export function generateStaticParams() { return []; }

export async function generateMetadata({ params }: { params: Promise<{ level: string; origin: string }> }): Promise<Metadata> {
  const { level, origin } = await params;
  const l = BY_LEVEL.get(level); const o = BY_ORIGIN.get(origin);
  if (!l || !o) return {};
  return {
    title: `${l.name} (${l.cefr}) from ${o.name} — real rules & practice`,
    description: `${l.name}, the ${l.cefr} certificate from ${l.official}, for learners in ${o.name}: exactly how it is scored, what a pass takes, and how to practise. Honest — never blended with the other exam.`,
    alternates: { canonical: canonical(`/exam/${l.slug}/from/${o.slug}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ level: string; origin: string }> }) {
  const { level, origin } = await params;
  const l = BY_LEVEL.get(level); const o = BY_ORIGIN.get(origin);
  if (!l || !o) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{l.exam} · {o.name}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{l.name}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">{l.cefr} · {l.official}</p>

      <p className="mt-6 text-almi-text">{nativeLead(o)}</p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">How {l.name} is scored</h2>
      <p className="mt-2 rounded-xl border border-almi-line bg-almi-paper p-4 text-almi-text">{l.ruleLine}</p>
      <p className="mt-3 text-sm text-almi-text-muted">
        These are {l.exam}&apos;s own rules on {l.exam}&apos;s own scale. {TWO_EXAMS_LINE}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-almi-ink">Practise {l.name} from {o.name}</h2>
      <p className="mt-2 text-almi-text">
        Our practice mirrors these exact rules and shows your raw performance against them — writing and speaking are always labelled as an estimate, because only the awarding university issues the real result. {REQ_NOT_GUARANTEE}
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/practice" className="rounded-full bg-almi-coral px-5 py-2 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Practise {l.name}</Link>
        <Link href={`/exams-in/${o.slug}`} className="rounded-full border border-almi-line px-5 py-2 text-almi-text hover:border-almi-coral">Sitting {l.exam} in {o.name}</Link>
      </div>

      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
