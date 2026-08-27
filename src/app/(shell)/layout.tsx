// THE LEARNER SHELL — the Sidebar, for the pages learners actually live in.
//
// ── WHY THIS FILE READS NO SESSION ──────────────────────────────────────────
// It used to call getCurrentUser(). A layout that reads the session cookie opts EVERY route in
// its group into dynamic rendering, so /learn and its articles rendered `ƒ` and returned no
// `x-nextjs-cache` header at all, while the /guides pages they replace were static and returned
// `HIT`. Across the 52 articles that is 53 server renders per crawl instead of 53 CDN hits, on a
// repo that already has a crawl-cost history and an ISR holding freeze.
//
// So the session moved to the client, exactly as AuthNav already does for the root layout:
// src/components/ShellChrome.tsx asks /api/me and renders the sidebar, the verify banner and the
// sidebar's page margin. This file is now pure, and the group is static by default.
//
// ⚠️ DO NOT REINTRODUCE A SERVER SESSION READ HERE. A route in this group that genuinely needs
// the server session must opt into dynamic ITSELF, in its own file — /practice does exactly
// that, because its page calls getCurrentUser() for the entitlement decision, and it stays `ƒ`
// on its own terms while its siblings prerender. Putting the read back here would silently drag
// /learn back with it. scripts/gates/static-shell-gate.mts fails the build if it returns.
//
// ── WHY THE GROUP STILL EXISTS ──────────────────────────────────────────────
// It is not (app). (app)/layout.tsx calls requireUser() and redirects anonymous visitors to
// /login; /learn and /practice are public surfaces in the sitemap and must answer 200 to a
// crawler. This group gives the shell without gating.

import { ShellChrome } from "@/components/ShellChrome";

export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ShellChrome>{children}</ShellChrome>;
}
