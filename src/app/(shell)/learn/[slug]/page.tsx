// /learn/[slug] — one article.
//
// Every article is prerendered: generateStaticParams enumerates the directory and
// dynamicParams=false makes an unknown slug a 404 rather than an on-demand render. That is
// deliberate here — this repo is under an ISR holding freeze, and a route that renders on
// demand is exactly what the freeze exists to prevent.
//
// Public, like the hub: it lives in (shell), not (app), so an anonymous reader gets 200.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllArticles, getArticle, LEARN_BASE } from "@/lib/learn/articles";
import { canonical, SHAMOOL_LINE } from "@/lib/site";

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

/** An unknown slug is a 404, not a render. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: `${a.title} — AlmiItalian`,
    description: a.description,
    alternates: { canonical: canonical(a.path) },
  };
}

export default async function LearnArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = article.related.map((r) => ({
    ...r,
    // Link only when the target actually exists — an article may reference one not yet written.
    resolved: r.slug ? getArticle(r.slug) : null,
  }));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">
        <Link href={LEARN_BASE} className="hover:underline">
          Learn
        </Link>{" "}
        · {article.section}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{article.title}</h1>
      <p className="mt-3 text-lg text-almi-text">{article.description}</p>

      {/* .learn-prose (src/app/globals.css) styles the markdown, so tables, blockquotes, lists
          and headings render as real HTML with no per-element class injection. Deliberately NOT
          Tailwind's `prose`: @tailwindcss/typography is not installed in this repo, so `prose`
          would compile, ship green, and render every article unstyled.
          remark-gfm is what makes GitHub-flavoured TABLES parse at all — without it a pipe table
          renders as a paragraph of pipe characters. */}
      <article className="learn-prose mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.body}</ReactMarkdown>
      </article>

      <div className="mt-10 rounded-2xl border border-almi-line bg-almi-paper p-5">
        <Link
          href={article.cta.href}
          className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep"
        >
          {article.cta.label}
        </Link>
        {article.cta.note && <p className="mt-2 text-xs text-almi-text-muted">{article.cta.note}</p>}
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-almi-text-muted">
            Related
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {related.map((r, i) => (
              <li key={i}>
                {r.resolved ? (
                  <Link href={r.resolved.path} className="text-almi-link underline">
                    {r.label}
                  </Link>
                ) : (
                  <span className="text-almi-text-muted">{r.label}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {article.sources.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-almi-text-muted">
            Sources
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {article.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  rel="nofollow noopener"
                  target="_blank"
                  className="text-almi-link underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Carried over from GuideShell in the /guides -> /learn migration. Every /guides page
          printed this line, and so does every other pSEO surface in the repo (citizenship,
          exams-in, italian-descent, study-in-italy, university, residence-permit). Dropping it
          here would have quietly removed it from 52 pages while the migration looked complete. */}
      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
    </main>
  );
}
