"use client";

// Route-level error boundary. Catches a throw anywhere under the root layout, so the header and
// footer survive and the learner is still inside the product rather than on Next's default grey
// page.
//
// ── WHAT IS DELIBERATELY NOT SHOWN ──────────────────────────────────────────
// `error.message`. In production Next already replaces server-thrown messages with a generic
// string, but that is Next's guarantee, not ours, and it does not hold for errors thrown in the
// browser — a client-side throw carries its real message straight through. Rendering it would
// mean a stack detail or a query fragment could land on a learner's screen depending on which
// side of the wire the failure happened. `error.digest` is shown instead: it is the correlation
// id Next writes to the server log and it identifies the incident without describing it.

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // The boundary is the last place that knows this happened. console.error, not .log — this is
    // an event someone should read. The message is safe HERE: this runs in the browser console,
    // not on the page, and never reaches another user.
    console.error(JSON.stringify({ evt: "route-error", digest: error.digest ?? null, message: error.message }));
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">This page did not load</h1>
      <p className="mt-4 text-almi-text">
        The error is on our side, not yours. Nothing you were working on has been submitted or
        marked — trying again is safe.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark"
        >
          Try again
        </button>
        <Link
          href="/practice"
          className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral"
        >
          Back to practice
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 text-xs text-almi-text-muted">
          If you report this, quote reference <code className="font-mono">{error.digest}</code>.
        </p>
      )}
    </main>
  );
}
