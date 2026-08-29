import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getAccessLevel } from "@/lib/access";
import { TRACKS, sectionCount } from "@/lib/practice";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practice — AlmiItalian",
  description: "Practise CILS and CELI, each on its own real scale, with instant auto-marking and an honest, engine-scaled read-out. CILS B1 Cittadinanza, CILS standard, and CELI.",
  alternates: { canonical: canonical("/practice") },
};

export default async function Page() {
  const user = await getCurrentUser();
  // The founder gate that used to sit here (`if (user && !hasPaidAccess(user))
  // redirect("/account")`) is GONE: it sent every signed-in non-subscriber away from the
  // picker, which is what made the free tier described in lib/access.ts unreachable. The
  // per-section gate in practice/[track]/[section] is the real one; this page only lists.
  // Two states now, not four: the 3-day grant was withdrawn on 2026-08-31, so a signed-in
  // learner is either PAID or not. Anonymous visitors get no banner — the picker is public
  // and a paywall notice on a page that only lists is noise.
  const level = getAccessLevel(user);

  const banner = !user
    ? null
    : level === "PAID"
      ? "AlmiItalian Pro active — every section open."
      : "Practice is part of Pro: a 7-day free trial, card saved, not charged, then $12/month, cancel anytime. The study guides in /learn stay free.";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">Practice</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Choose your Italian exam</h1>
      <p className="mt-4 text-almi-text">
        CILS and CELI are scored differently, so we keep them apart — pick the exam you&apos;re actually sitting. Ascolto,
        Lettura and Analisi are auto-marked on each engine&apos;s own scale. Produzione scritta and orale give you the task
        and that exam&apos;s official-style criteria to work against — they are not auto-marked.
      </p>
      {banner && <p className="mt-4 rounded-xl border border-almi-line bg-almi-bg-peach/40 px-4 py-2 text-sm text-almi-text">{banner}</p>}

      <div className="mt-8 space-y-4">
        {TRACKS.map((t) => (
          <div key={t.slug} className={`rounded-2xl border bg-almi-paper p-5 ${t.flag ? "border-2 border-almi-coral" : "border-almi-line"}`}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-semibold text-almi-ink">{t.label}</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-almi-text-muted">{t.family}</span>
            </div>
            <p className="mt-1 text-sm text-almi-text">{t.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {t.sections.map((s) => {
                const n = sectionCount(t, s);
                return (
                  <Link
                    key={s.slug}
                    href={`/practice/${t.slug}/${s.slug}`}
                    className="rounded-full bg-almi-coral px-4 py-1.5 font-medium text-almi-ink hover:bg-almi-coral-deep"
                  >
                    {s.label.replace(/\s*\(.*$/, "").replace(/\s*—.*$/, "")} · {n}{s.kind === "estimate" ? " est." : ""}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-almi-text-muted">
        New here? Not sure which exam or level you need? Remember: the long-term permit is A2, citizenship is B1 —{" "}
        {/* Was /guides/a2-or-b1. The 301 sends that URL to /learn/a2-or-b1, which does not
            exist until the content drop lands — so this internal link points at the HUB, which
            always resolves, rather than shipping a known 404 into the picker. The content-drop
            PR should restore the deep link once the article is there. */}
        <Link href="/learn" className="text-almi-link underline">read the honest guide</Link>.
      </p>
    </main>
  );
}
