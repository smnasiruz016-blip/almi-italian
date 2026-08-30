import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";
import { classifyPlan, tallyPlans, PLAN_LABEL, type Plan } from "@/lib/admin/plan";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

export default async function AccountsPage() {
  const user = await getCurrentUser();
  if (!user || !canAccessAdmin(user.email)) redirect("/account");

  const nowDate = new Date();

  // ── THE TILES ARE COUNTED WITH classifyPlan(), THE SAME FUNCTION THE ROWS USE ─────
  // They were four separate queries with Free as the subtraction left over. That
  // arithmetic had no Owner term, so the owner landed in Free — the admin counted the
  // founder as a free user on the same screen whose row badge said "Owner". Counting the
  // tiles and the rows through one function makes that disagreement unrepresentable.
  //
  // Owner is NOT a database predicate — isOwner() reads OWNER_EMAILS — so it cannot be a
  // SQL `where`. The classification therefore happens in JS over the three fields it needs.
  // At this scale that is a small read; if the table ever grows this becomes a grouped query
  // plus a separate owner lookup, and the thing to preserve is that both still go through
  // classifyPlan rather than re-deriving the rule.
  const [everyone, recent] = await Promise.all([
    prisma.user.findMany({
      select: { email: true, compProUntil: true, subscriptionStatus: true },
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

  const tally = tallyPlans(everyone);
  const total = everyone.length;

  // Every user lands in exactly one bucket, so the four add up to the total by construction
  // rather than by subtraction. No tile is the remainder of the others any more.
  const stats: { label: string; value: number }[] = [
    { label: "Total", value: total },
    { label: "Owner", value: tally.owner },
    { label: "Free", value: tally.free },
    { label: "Pro", value: tally.pro },
    { label: "Comp", value: tally.comp },
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
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
                        {PLAN_LABEL[plan]}
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
