"use client";

// The learner shell's auth-dependent chrome, resolved CLIENT-side.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// (shell)/layout.tsx used to call getCurrentUser(). Reading the session cookie in a layout opts
// EVERY route in the group into dynamic rendering — so /learn and its articles were `ƒ`, served
// by a server render per request, while the /guides pages they replace were `ƒ`-free static with
// `x-nextjs-cache: HIT`. Across 52 articles that is 53 server renders per crawl instead of 53
// CDN hits.
//
// The pattern is this repo's own: AuthNav already keeps the root layout static by asking
// /api/me from the client. This does the same for the shell.
//
// ── WHAT IS RENDERED BEFORE /api/me ANSWERS ─────────────────────────────────
// Nothing auth-shaped. Not a logged-out sidebar, not a logged-in one — the chrome is simply
// absent until the answer arrives, then appears. Rendering the logged-out state first and
// swapping would show a signed-in learner a page with no sidebar and then flip it, which is a
// flash of the WRONG state rather than of no state.
//
// The honest cost, stated: on desktop a signed-in learner sees the content column shift right
// once, when the sidebar appears. That is a layout shift, not a wrong state. Removing it would
// need the server to know the session before render — which is the very thing this change
// exists to stop doing. A non-httpOnly hint cookie could restore it if the shift ever matters
// more than the caching does.

import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import { logoutAction } from "@/app/actions/session";

type Me = { loggedIn: boolean; email: string | null; isAdmin: boolean; emailVerified: boolean };

export function ShellChrome({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: Me) => { if (alive) setMe(d); })
      .catch(() => { if (alive) setMe({ loggedIn: false, email: null, isAdmin: false, emailVerified: true }); });
    return () => { alive = false; };
  }, []);

  // Unresolved, or genuinely signed out: render exactly what an anonymous visitor got before
  // this change — the bare page, no shell. This is also the SSR output, so the static HTML in
  // the CDN is the anonymous page and nothing about a session is baked into it.
  if (!me?.loggedIn || !me.email) return <>{children}</>;

  return (
    <div className="bg-almi-bg">
      {!me.emailVerified && <EmailVerifyBanner email={me.email} />}
      <Sidebar email={me.email} isAdmin={me.isAdmin} logout={logoutAction} />
      <main className="px-4 py-8 sm:px-6 md:ml-60 md:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
