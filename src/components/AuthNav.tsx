"use client";

// Session-aware product nav for the family header. The header shell stays a static server
// component (keeps SEO pages static); this small client piece asks /api/me who's logged in
// and swaps the links:
//   logged out -> Practice · Log in · [Start 7-day free trial]
//   logged in  -> Practice · [Account]
// ── WHAT IS RENDERED BEFORE /api/me ANSWERS ─────────────────────────────────
// The link every visitor gets either way (Practice), and NOTHING auth-shaped.
//
// This used to render the full logged-OUT set on first paint — "Log in" plus the trial pill —
// and swap when the answer arrived. For an anonymous visitor that is right. For a SIGNED-IN
// learner it is a flash of the WRONG state: their own header inviting them to log in and start
// a trial they already have. Showing nothing for that slot until the answer lands is honest in
// both directions, and it still matches the SSR markup, so there is no hydration mismatch.
//
// The slot holds its width while pending, so resolving does not shove the row sideways.
//
// ── TREATMENT PORTED FROM almi-prep-v2 ──────────────────────────────────────
// Prep's cluster is: plain links at `text-base font-semibold`, `gap-x-4` between them, ending
// in ONE filled coral pill. This used to be `text-sm font-medium` with `gap-3`, which is why
// the same links read as lighter than the family strip sitting above them instead of as the
// product's own controls.
//
// ⚠️ ONE THING IS NOT COPIED, BECAUSE PREP HAS NOTHING TO COPY. AlmiPrep's header is
// STATELESS — PRODUCT_NAV is a hardcoded const, so it shows "Log in" and the trial button to
// everyone, signed in or not, and there is no logged-in variant anywhere in that repo. Mirroring
// that exactly would delete this product's logged-in entry point, which the brief explicitly
// says to keep. So the ARRANGEMENT is prep's and the STATE-AWARENESS is this product's own.
//
// For the logged-in state that leaves one judgement call: the cluster's shape is
// [link] [link] [pill], and if Account were a plain link a signed-in visitor would again see
// only bare words under the strip — the exact complaint this change exists to fix. So Account
// takes the pill. It is the same two-item shape, ending the same way.

import Link from "next/link";
import { useEffect, useState } from "react";

type Me = { loggedIn: boolean; email: string | null };

/** Plain link treatment — matches the family strip's weight so the cluster reads as one group. */
const LINK =
  "rounded-sm text-base font-semibold text-almi-ink hover:text-almi-coral-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-almi-coral focus-visible:ring-offset-2 focus-visible:ring-offset-almi-bg";

/** The one filled pill that ends the cluster. */
const PILL =
  "inline-flex min-h-[40px] items-center justify-center rounded-full bg-almi-coral px-5 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-almi-coral/30";

export function AuthNav() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Me) => { if (alive) setMe(d); })
      .catch(() => { if (alive) setMe({ loggedIn: false, email: null }); });
    return () => { alive = false; };
  }, []);

  // null = not answered yet. Deliberately distinct from "answered: signed out".
  const resolved = me !== null;
  const loggedIn = me?.loggedIn ?? false;

  return (
    <nav aria-label="AlmiItalian" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      <Link href="/practice" className={LINK}>
        Practice
      </Link>
      {!resolved ? (
        // Pending: reserve the row's height so the header does not jump, and say nothing about
        // who the visitor is. aria-hidden because there is no information here to announce.
        <span aria-hidden className="inline-flex min-h-[40px] items-center" />
      ) : loggedIn ? (
        <Link href="/account" className={PILL}>
          Account
        </Link>
      ) : (
        <>
          <Link href="/login" className={LINK}>
            Log in
          </Link>
          <Link href="/signup" className={PILL}>
            Start 7-day free trial
          </Link>
        </>
      )}
    </nav>
  );
}
