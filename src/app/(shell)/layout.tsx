// THE LEARNER SHELL — the Sidebar, for the pages learners actually live in.
//
// ── THE DEFECT THIS CLOSES ──────────────────────────────────────────────────
// Sidebar.tsx was already the Tier-A shell, already ported and good, and it rendered only
// inside (app) — which held /account and /admin/* and nothing else. /practice and the attempt
// pages sat on the root layout, so a paying learner never saw the shell anywhere they spent
// their time. The nav existed and was invisible to the people it was for.
//
// ── WHY THIS IS A NEW GROUP AND NOT JUST A MOVE INTO (app) ──────────────────
// (app)/layout.tsx calls requireUser(), which REDIRECTS an anonymous visitor to /login.
// AlmiPrep does exactly that and it is right for AlmiPrep — its /practice is not in its
// sitemap. Ours IS: src/app/sitemap.ts ships entry("/practice", 0.7), robots allows it, and the
// page sets a canonical with no noindex. Moving it under requireUser() would hand Googlebot a
// redirect to /login and delete an indexed page.
//
// So this group gives the shell WITHOUT gating: getCurrentUser(), never requireUser().
//   signed in  → the Sidebar, exactly as /account and /admin get it
//   anonymous  → the page renders precisely as it does today, still indexable
// The per-section entitlement gate (lib/free-window.ts) is unchanged and is still the thing
// that decides what a visitor may actually practise.

import { redirect } from "next/navigation";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";
import { Sidebar } from "@/components/Sidebar";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";

async function logoutAction() {
  "use server";
  await destroySession();
  redirect("/");
}

export default async function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  // No session: render exactly what the root layout rendered before this group existed.
  // Nothing is hidden from an anonymous visitor that was visible to them yesterday.
  if (!user) return <>{children}</>;

  return (
    <div className="bg-almi-bg">
      {!user.emailVerifiedAt && <EmailVerifyBanner email={user.email} />}
      <Sidebar email={user.email} isAdmin={canAccessAdmin(user.email)} logout={logoutAction} />
      <main className="px-4 py-8 sm:px-6 md:ml-60 md:px-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
