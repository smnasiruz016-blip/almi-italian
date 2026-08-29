// /learn — the hub, DERIVED from content/learn/ and never hand-maintained.
//
// ── WHY THIS SITS IN (shell) AND NOT (app) ──────────────────────────────────
// Same reasoning as /practice in #39, and it matters more here. (app)/layout.tsx calls
// requireUser(), which redirects an anonymous visitor to /login. /learn is a PUBLIC SEO
// surface — it is in the sitemap, robots allows it, and its whole purpose is to be found by
// someone who has never heard of this product. Putting it behind requireUser() would hand
// Googlebot a 307 and index nothing.
//
// (shell)/layout.tsx uses getCurrentUser(), so a signed-in learner gets the Sidebar here just
// as they do on /practice, and an anonymous reader gets a plain 200.

import type { Metadata } from "next";
import Link from "next/link";
import { getSections, getAllArticles, LEARN_BASE } from "@/lib/learn/articles";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn — CILS, CELI and Italian citizenship, explained honestly",
  description:
    "Straight answers about the CILS and CELI exams and the B1 Italian citizenship requirement — what the awarding bodies actually publish, and what they do not.",
  alternates: { canonical: canonical(LEARN_BASE) },
};

export default function LearnHub() {
  const sections = getSections();
  const total = getAllArticles().length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">Learn</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">
        CILS, CELI and Italian citizenship — explained honestly
      </h1>
      <p className="mt-4 text-almi-text">
        What the awarding bodies actually publish, what they do not, and where the two get
        confused. Every article names its sources, and says plainly when a number is ours rather
        than the exam&apos;s.
      </p>

      {total === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-almi-line bg-almi-paper p-6 text-almi-text">
          No articles yet.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {sections.map(({ section, articles }) => (
            <section key={section}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-almi-text-muted">
                {section}
              </h2>
              <ul className="mt-3 space-y-3">
                {articles.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={a.path}
                      className="block rounded-2xl border border-almi-line bg-almi-paper p-4 hover:border-almi-coral"
                    >
                      <span className="font-semibold text-almi-ink">{a.title}</span>
                      <span className="mt-1 block text-sm text-almi-text">{a.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
