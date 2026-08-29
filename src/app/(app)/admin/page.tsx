// /admin — the door.
//
// Every real admin page (Accounts, Comp Accounts, Reviews) is gated correctly and reachable
// only if you already know its URL. Typing the bare /admin — the obvious thing to try, and what
// works on the sibling products — returned a 404, which reads as "this product has no admin
// panel" even though the whole panel is present one segment deeper. That is what Nasir hit.
//
// AlmiPrep's /admin redirects to /admin/costs, because it has one obvious landing page. This
// product has three surfaces of equal standing and no cost ledger view yet, so an index that
// LISTS them is more useful than picking a winner.
//
// The gate: (app)/admin/layout.tsx already runs requireUser() + canAccessAdmin() and wraps this
// route, so a non-admin never reaches this component. The explicit check below is kept anyway,
// matching what every sibling admin page does — the layout is the common chrome, not the only
// guard.
//
// NO NEW CAPABILITY HERE. This links what exists; it does not invent an admin surface.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";

export const metadata: Metadata = {
  title: "Admin — AlmiItalian",
  // Same as /admin/reviews: an admin door has no business in an index.
  robots: { index: false, follow: false },
};

const SURFACES = [
  {
    href: "/admin/accounts",
    title: "Accounts",
    blurb: "Every registered learner, their plan, and when they last signed in.",
  },
  {
    href: "/admin/comp-accounts",
    title: "Comp accounts",
    blurb: "Grant complimentary Pro access — beta testers, support cases, partners.",
  },
  {
    href: "/admin/reviews",
    title: "Reviews",
    blurb: "Read, approve or reject the testimonials learners have submitted.",
  },
] as const;

export default async function AdminIndex() {
  const user = await requireUser();
  if (!canAccessAdmin(user.email)) redirect("/account");

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">Admin</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">AlmiItalian admin</h1>
      <p className="mt-3 text-almi-text">
        Signed in as <strong className="text-almi-ink">{user.email}</strong>.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SURFACES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl border border-almi-line bg-almi-paper p-5 hover:border-almi-coral"
          >
            <h2 className="text-lg font-semibold text-almi-ink">{s.title}</h2>
            <p className="mt-1 text-sm text-almi-text">{s.blurb}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-almi-text-muted">
        Content lives in <code>src/data/items-batch1.json</code> and ships with a deploy — there is
        no in-app content editor, by design.
      </p>
    </div>
  );
}
