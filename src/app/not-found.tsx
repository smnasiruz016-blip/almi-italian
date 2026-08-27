// Branded 404. A 404 was previously a dead end — Next's default page, no header, no way back
// into the product.
//
// The links are the point rather than the styling. This app's 404s are overwhelmingly one of two
// things: a mistyped or stale pSEO URL (the surface is ~1.16M pages, so a dead link is normal
// wear rather than a bug), or a practice route for a track that is not routed — the nine exam
// levels declared OUT_OF_SCOPE in lib/practice. Both cases want the same thing: the four tracks
// that DO exist, named, one click away.

import type { Metadata } from "next";
import Link from "next/link";
import { TRACKS } from "@/lib/practice";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 must never be indexed — it is the one page whose whole content is "this is not a page".
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">404</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">We could not find that page</h1>
      <p className="mt-4 text-almi-text">
        The link may be out of date, or the exam level may not be one we have built practice for
        yet. Here is what is live right now.
      </p>

      <ul className="mt-8 space-y-2">
        {TRACKS.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/practice/${t.slug}/${t.sections[0].slug}`}
              className="text-almi-ink underline decoration-almi-coral underline-offset-4 hover:text-almi-coral-deep"
            >
              {t.label}
            </Link>
            <span className="text-sm text-almi-text-muted"> — {t.tagline}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/practice" className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          All practice tracks
        </Link>
        <Link href="/learn" className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral">
          Read the guides
        </Link>
      </div>
    </main>
  );
}
