import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { isInTrial, trialDaysLeft, hasPracticeAccess } from "@/lib/access";
import { TRACKS, sectionCount } from "@/lib/practice";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practice — AlmiItalian",
  description: "Practise CILS and CELI, each on its own real scale, with instant auto-marking and an honest, engine-scaled read-out. CILS B1 Cittadinanza, CILS standard, and CELI.",
  alternates: { canonical: canonical("/practice") },
};

export default async function Page() {
  const user = await getCurrentUser();
  const banner = !user ? null : hasPracticeAccess(user)
    ? (isInTrial(user)
        ? `Free trial active — ${trialDaysLeft(user)} day${trialDaysLeft(user) === 1 ? "" : "s"} left. Full CILS and CELI practice.`
        : "Subscription active — full CILS and CELI practice.")
    : "Your free trial has ended — subscribe to keep practising ($12/month).";

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Practice</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Choose your Italian exam</h1>
      <p className="mt-4 text-almi-text">
        CILS and CELI are scored differently, so we keep them apart — pick the exam you&apos;re actually sitting. Listening,
        Reading and Grammar are auto-marked on each engine&apos;s own scale; Writing and Speaking are practised against the
        official-style criteria and always labelled AI estimates.
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
                    className="rounded-full bg-almi-coral px-4 py-1.5 font-medium text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark"
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
        <Link href="/guides/a2-or-b1" className="text-almi-coral hover:underline">read the honest guide</Link>.
      </p>
    </main>
  );
}
