import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";

// Lightweight session probe for the client-side header (AuthNav). Kept out of
// the server layout on purpose: reading the session cookie in the root layout
// would opt every marketing/SEO page into dynamic rendering. This endpoint is
// dynamic + no-store; the static pages stay static and just fetch it on mount.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    // isAdmin and emailVerified join loggedIn/email because the SHELL now resolves from here
    // too, not just the header. They are facts about the caller's own account, so returning
    // them to that caller discloses nothing they cannot already see.
    {
      loggedIn: Boolean(user),
      email: user?.email ?? null,
      isAdmin: user ? canAccessAdmin(user.email) : false,
      emailVerified: user ? user.emailVerifiedAt !== null : false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
