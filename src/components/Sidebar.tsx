"use client";

// Left navigation for logged-in app pages (the Tier-A standard shell, ported
// to AlmiItalian). Desktop: a fixed full-height rail (main content gets
// md:ml-60). Mobile: collapsed to a hamburger that opens a slide-in drawer
// with a backdrop; body scroll locks while open.
//
// "Choose a Test" is the user-facing label for /practice (CILS / CELI; the URL
// is unchanged). "My Progress" and "Account" both point to /account — active
// highlighting is computed centrally so they don't both light up.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarItem } from "@/components/SidebarItem";
import { HamburgerButton } from "@/components/HamburgerButton";

type Item = { key: string; href: string; icon: string; label: string; match: string };

function buildItems(isAdmin: boolean): Item[] {
  const items: Item[] = [
    { key: "home", href: "/", icon: "🏠", label: "Home", match: "/" },
    { key: "practice", href: "/practice", icon: "✏️", label: "Choose a Test", match: "/practice" },
    // "My Progress" (📊, href "/account") used to sit here. It was REMOVED, not repointed.
    //
    // It shared its href and its match with Account, which produced all three reported
    // symptoms at once: clicking My Progress showed the Account page, the highlight went to
    // My Progress because activeKey broke the tie by array order, and clicking Account then
    // did nothing because the URL was already /account.
    //
    // There is NO progress page in this repo. /progress and /my-progress both 404 on
    // production, and src/app/(app)/account/page.tsx contains no attempt history, no streak
    // and no score summary — only name, plan, review CTA and log out.
    //
    // So there was nowhere honest to point it. Sending it to /practice or to the account page
    // under a truthful-sounding label would have removed the symptom and kept the lie: a nav
    // item promising something the product does not have. The item is gone until a progress
    // page exists; putting it back is then one line, next to a route that answers for it.
    { key: "account", href: "/account", icon: "👤", label: "Account", match: "/account" },
  ];
  if (isAdmin) {
    items.push({ key: "admin", href: "/admin/accounts", icon: "🛡️", label: "Admin", match: "/admin" });
    // More specific match than "Admin" (/admin), so the longest-prefix rule in
    // activeKey lights Reviews — not Admin — on /admin/reviews.
    items.push({ key: "reviews", href: "/admin/reviews", icon: "⭐", label: "Reviews", match: "/admin/reviews" });
  }
  return items;
}

// Longest matching prefix wins, so /admin/reviews lights Reviews rather than Admin.
//
// This used to add "ties keep the first item (so My Progress owns /account and Account stays
// unhighlighted rather than both lighting)". That tie-break was not a rule — it was the
// duplicate destination being made to look tidy. Two items sharing a route is now a build
// failure (scripts/gates/sidebar-gate.mts), so no tie can reach this function.
function activeKey(pathname: string, items: Item[]): string | null {
  let best: string | null = null;
  let bestLen = -1;
  for (const it of items) {
    const m = it.match;
    const hit = m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(m + "/");
    if (hit && m.length > bestLen) {
      best = it.key;
      bestLen = m.length;
    }
  }
  return best;
}

function NavBody({
  items,
  active,
  email,
  logout,
  onNavigate,
}: {
  items: Item[];
  active: string | null;
  email: string;
  logout: () => Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((it) => (
          <SidebarItem
            key={it.key}
            href={it.href}
            icon={it.icon}
            label={it.label}
            active={active === it.key}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <div className="mt-3 border-t border-almi-bg-peach pt-3">
        <p className="truncate px-3 pb-2 text-xs text-almi-text-muted" title={email}>
          {email}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-almi-coral-deep hover:bg-almi-coral/10"
          >
            <span aria-hidden className="w-5 text-center text-base leading-none">🚪</span>
            <span>Log out</span>
          </button>
        </form>
      </div>
    </>
  );
}

export function Sidebar({
  email,
  isAdmin,
  logout,
}: {
  email: string;
  isAdmin: boolean;
  logout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = buildItems(isAdmin);
  const active = activeKey(pathname, items);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Escape closes the drawer. Without it this dialog was dismissable by mouse only: the
    // backdrop takes a click, and a keyboard user who opened the drawer had no way out of it
    // except tabbing to the close button. That is the real accessibility defect here — not the
    // backdrop's missing key handler, which is decoration and correctly aria-hidden.
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar (below the family header) */}
      <div className="flex items-center gap-3 border-b border-almi-bg-peach bg-almi-paper px-4 py-3 md:hidden">
        <HamburgerButton onClick={() => setOpen(true)} />
        <span className="text-sm font-semibold leading-tight text-almi-ink">AlmiItalian</span>
      </div>

      {/* Desktop fixed rail. The family header is sticky with a variable height
          (it wraps to 2–3 lines at lg+), so the rail top padding clears the
          worst-case header — modest at md, opening up at lg+. */}
      <aside className="fixed bottom-0 left-0 top-16 z-30 hidden w-60 flex-col border-r border-almi-bg-peach bg-almi-paper px-3 pb-4 pt-8 md:flex lg:pt-16">
        <p className="px-3 pb-4 text-base font-semibold leading-tight text-almi-ink">AlmiItalian</p>
        <NavBody items={items} active={active} email={email} logout={logout} />
      </aside>

      {/* Mobile drawer.
          The backdrop below is aria-hidden with an onClick, which is correct — it is decoration,
          and the drawer has its own visible close button. What was missing is Escape: a dialog a
          mouse can dismiss and a keyboard cannot is the actual defect, and closing the backdrop's
          "click without key handler" by bolting a role onto a decorative div would have satisfied
          a checker without helping anyone. */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-almi-ink/40" aria-hidden onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 max-w-[82%] flex-col border-r border-almi-bg-peach bg-almi-paper px-3 pb-4 pt-6 shadow-xl">
            <div className="flex items-center justify-between px-3 pb-4">
              <span className="text-base font-semibold leading-tight text-almi-ink">AlmiItalian</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-full text-almi-text-muted hover:bg-almi-bg-peach hover:text-almi-ink"
              >
                <span aria-hidden className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <NavBody
              items={items}
              active={active}
              email={email}
              logout={logout}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
