import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin, isOwner } from "@/lib/access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Plan = "owner" | "comp" | "pro" | "free";

const ACTIVE_STATUSES = ["trialing", "active"];

// One source for "what is this person". /account said "Owner - full access" while this
// table said "Free" about the same person: it read only compProUntil and
// subscriptionStatus and never asked isOwner(), which is the predicate every other
// surface uses. An owner has no subscription row, so the honest columns were producing a
// dishonest label.
//
// The "3-day free" tier that used to sit between Pro and Free is GONE (founder decision
// 2026-08-31, network-wide): the tile, the badge and the query that fed them are removed
// rather than left showing a permanent zero. A tile that can only ever read 0 is not
// information; it is a question every reader has to re-answer. Counted before removing it:
// production held 0 users with freeAccessStartedAt set, so no row changes label because of
// this. The COLUMN survives in the database - see src/lib/access.ts for why it is not
// dropped.
function classifyPlan(u: {
  email: string;
  compProUntil: Date | null;
  subscriptionStatus: string | null;
}): Plan {
  const now = Date.now();
  if (isOwner(u.email)) return "owner";
  if (u.compProUntil && u.compProUntil.getTime() > now) return "comp";
  if (u.subscriptionStatus && ACTIVE_STATUSES.includes(u.subscriptionStatus)) {
    return "pro";
  }
  return "free";
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const BADGE: Record<Plan, string> = {
  owner: "bg-almi-ink text-almi-on-dark",
  comp: "bg-amber-100 text-amber-800",
  pro: "bg-emerald-100 text-emerald-800",
  free: "bg-gray-100 text-gray-600",
};
const BADGE_LABEL: Record<Plan, string> = {
  // The same words the learner sees on /account, from the same predicates.
  owner: "Owner",
  comp: "Comp",
  pro: "Pro",
  free: "Free",
};

export default async function AccountsPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user.email)) redirect("/account");

  const nowDate = new Date();

  const [total, compCount, proCount, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { compProUntil: { gt: nowDate } } }),
    prisma.user.count({
      where: {
        subscriptionStatus: { in: ACTIVE_STATUSES },
        OR: [{ compProUntil: null }, { compProUntil: { lte: nowDate } }],
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        compProUntil: true,
        subscriptionStatus: true,
        authSessions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ]);

  const freeCount = Math.max(0, total - compCount - proCount);

  const stats: { label: string; value: number }[] = [
    { label: "Total", value: total },
    { label: "Free", value: freeCount },
    { label: "Pro", value: proCount },
    { label: "Comp", value: compCount },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
        <p className="mt-1 text-sm text-gray-600">
          A snapshot of registered users and their current plan. Showing the 20
          most recent sign-ups.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-gray-400">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Recent sign-ups</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Created</th>
                <th className="py-2 pr-3 font-medium">Plan</th>
                <th className="py-2 pr-0 font-medium">Last active</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u) => {
                const plan = classifyPlan(u);
                return (
                  <tr key={u.id} className="border-b border-gray-100 text-gray-900">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{u.email}</div>
                      {u.name && <div className="text-xs text-gray-500">{u.name}</div>}
                    </td>
                    <td className="py-2 pr-3">{formatDate(u.createdAt)}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " +
                          BADGE[plan]
                        }
                      >
                        {BADGE_LABEL[plan]}
                      </span>
                    </td>
                    <td className="py-2 pr-0">{formatDate(u.authSessions[0]?.createdAt ?? null)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
