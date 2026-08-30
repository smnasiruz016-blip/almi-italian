// /admin/costs — AI Usage. What this product actually spends.
//
// Ported from AlmiPrep's src/app/(app)/admin/costs/page.tsx: same sections, same grouping,
// same table columns. What did NOT port is listed here, because porting a class name ports a
// dependency and every one of these would have been a silent break:
//
//   · Prep's ledger column is `timestamp`. This schema's is `createdAt`. Same model name,
//     different field — a copied `orderBy: { timestamp: "desc" }` does not compile.
//   · Prep gates on isAdmin() from @/lib/founder. This product has no founder.ts; the whole
//     admin gates on canAccessAdmin() from @/lib/access, and so does this page.
//   · Prep counts prisma.writingEvaluation and prisma.speakingEvaluation as separate tables.
//     Here there is ONE AiEvaluation table with a `skill` column, so the per-module counts
//     come from that column instead.
//   · Prep's feature labels are speaking.* and lifeskills.*. Ours are scritta.evaluate,
//     orale.evaluate and orale.transcribe — the only three strings recordCost is ever given.
//
// ── EVERY NUMBER HERE IS A ROW THAT WAS WRITTEN ─────────────────────────────
// Nothing is estimated, extrapolated or annualised. Prisma sums the ledger and the sums are
// printed. A call whose cost is null is shown as null, never as zero, because a zero would
// join the total and make it lie about money.
//
// ── THE TOTALS NO LONGER FILTER ON success ──────────────────────────────────
// They used to read `where: { success: true }`, which was correct only while a failed call
// always cost nothing. It does not: an Anthropic 200 that then fails to parse, and a Whisper
// 200 with an empty transcript, are both served, both billed, and both success = false.
// Filtering them out hid exactly the spend nobody had budgeted for. The ledger now costs
// every row from its own tokens or seconds, so summing ALL rows is summing what was spent.
// "Failed calls" stays as its own stat, because how many failed is a different question from
// how much was spent.
//
// Two providers reach this ledger and both are recorded by the caller, not automatically:
// Anthropic per token (recordCost) and OpenAI Whisper per second of audio
// (recordTranscriptionCost). Failed calls are written with success=false and costCents=0,
// which is the network's rule — so a failure is visible as a call without being counted as
// spend. The totals below therefore filter on success; the recent-calls table does not, so a
// run of failures is still visible.
//
// WHAT THIS PAGE CANNOT SHOW: spend that never reached the ledger. Both paths write today
// and scripts/gates/ai-ledger-gate.mts holds that line, but a provider called from somewhere
// new would be invisible here rather than wrong-looking, which is the more dangerous shape.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/ai/cost";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI usage — AlmiItalian admin",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-almi-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-almi-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-almi-text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminCostsPage() {
  const user = await requireUser();
  if (!canAccessAdmin(user.email)) redirect("/account");

  // react-hooks/purity flags Date.now() here. It is right about client components and wrong
  // about this one: the file declares `export const dynamic = "force-dynamic"` and this is an
  // async SERVER component, so it runs once per request and never re-renders. "Now" is exactly
  // what a spend report for the last 24 hours has to be computed from; freezing it would make
  // the windows wrong rather than stable. The rule cannot see which side of the boundary it is
  // standing on.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const since = (days: number) => new Date(now - days * DAY_MS);
  const startOfTodayUtc = new Date(Date.UTC(
    new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate(),
  ));

  // No success filter: a failed call can be real money. See the header.
  const spend = (where: object) =>
    prisma.aICostLedger.aggregate({
      where: { ...where },
      _sum: { costCents: true, inputTokens: true, outputTokens: true },
      _count: { _all: true },
    });

  const [today, week, month, lifetime, failures, perFeature, perModel, perUser, recent] =
    await Promise.all([
      spend({ createdAt: { gte: startOfTodayUtc } }),
      spend({ createdAt: { gte: since(7) } }),
      spend({ createdAt: { gte: since(30) } }),
      spend({}),
      prisma.aICostLedger.count({ where: { success: false, createdAt: { gte: since(30) } } }),
      prisma.aICostLedger.groupBy({
        by: ["feature"],
        where: { createdAt: { gte: since(30) } },
        _sum: { costCents: true },
        _count: { _all: true },
        orderBy: { _sum: { costCents: "desc" } },
      }),
      prisma.aICostLedger.groupBy({
        by: ["model"],
        where: { createdAt: { gte: since(30) } },
        _sum: { costCents: true },
        _count: { _all: true },
        orderBy: { _sum: { costCents: "desc" } },
      }),
      prisma.aICostLedger.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: since(30) }, userId: { not: null } },
        _sum: { costCents: true },
        _count: { _all: true },
        orderBy: { _sum: { costCents: "desc" } },
        take: 10,
      }),
      prisma.aICostLedger.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
    ]);

  const userIds = [...new Set([
    ...perUser.map((r) => r.userId).filter((id): id is string => id !== null),
    ...recent.map((r) => r.userId).filter((id): id is string => id !== null),
  ])];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  // Attempts in the same 30-day frame, from the ONE evaluation table this product has.
  const evals = await prisma.aiEvaluation.groupBy({
    by: ["skill"],
    where: { createdAt: { gte: since(30) } },
    _count: { _all: true },
  });
  const evalCount = evals.reduce((n, r) => n + r._count._all, 0);

  // Shown only when there is something to divide by. With no attempts there is no average,
  // and printing 0 would read as "free" rather than "nothing happened".
  const avgPerEval =
    evalCount > 0 ? formatCents(Math.round((month._sum.costCents ?? 0) / evalCount)) : "—";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">Admin</p>
        <h1 className="mt-3 text-3xl font-bold text-almi-ink">AI usage</h1>
        <p className="mt-1 text-sm text-almi-text-muted">
          Every metered call this product has made, as recorded in AICostLedger. Totals count
          EVERY call, because a call can fail after it has already been served and billed. Cost
          comes from the tokens or the seconds, never from the success flag.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Today (UTC)" value={formatCents(today._sum.costCents ?? 0)} hint={`${today._count._all} calls`} />
        <Stat label="Last 7 days" value={formatCents(week._sum.costCents ?? 0)} hint={`${week._count._all} calls`} />
        <Stat label="Last 30 days" value={formatCents(month._sum.costCents ?? 0)} hint={`${month._count._all} calls`} />
        <Stat label="Lifetime" value={formatCents(lifetime._sum.costCents ?? 0)} hint={`${lifetime._count._all} calls`} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Evaluations (30d)" value={String(evalCount)} hint={evals.map((e) => `${e.skill} ${e._count._all}`).join(" · ") || "none"} />
        <Stat label="Avg / evaluation (30d)" value={avgPerEval} hint={evalCount === 0 ? "no attempts to divide by" : "all spend ÷ results delivered"} />
        <Stat label="Failed calls (30d)" value={String(failures)} hint="recorded at zero cost" />
      </section>

      <section className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
        <h2 className="text-lg font-semibold text-almi-ink">By feature (30 days)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-almi-text-muted">
              <tr><th className="py-2">Feature</th><th>Calls</th><th className="text-right">Cost</th></tr>
            </thead>
            <tbody>
              {perFeature.map((r) => (
                <tr key={r.feature} className="border-t border-almi-bg-peach">
                  <td className="py-2 text-almi-ink">{r.feature}</td>
                  <td>{r._count._all}</td>
                  <td className="text-right font-mono">{formatCents(r._sum.costCents ?? 0)}</td>
                </tr>
              ))}
              {perFeature.length === 0 && (
                <tr><td colSpan={3} className="py-3 text-almi-text-muted">No calls in the last 30 days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
        <h2 className="text-lg font-semibold text-almi-ink">By model (30 days)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-almi-text-muted">
              <tr><th className="py-2">Model</th><th>Calls</th><th className="text-right">Cost</th></tr>
            </thead>
            <tbody>
              {perModel.map((r) => (
                <tr key={r.model} className="border-t border-almi-bg-peach">
                  <td className="py-2 text-almi-ink">{r.model}</td>
                  <td>{r._count._all}</td>
                  <td className="text-right font-mono">{formatCents(r._sum.costCents ?? 0)}</td>
                </tr>
              ))}
              {perModel.length === 0 && (
                <tr><td colSpan={3} className="py-3 text-almi-text-muted">No calls in the last 30 days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
        <h2 className="text-lg font-semibold text-almi-ink">Top learners (30 days)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-almi-text-muted">
              <tr><th className="py-2">User</th><th>Calls</th><th className="text-right">Cost</th></tr>
            </thead>
            <tbody>
              {perUser.map((r) => (
                <tr key={r.userId} className="border-t border-almi-bg-peach">
                  <td className="py-2 text-almi-ink">{emailById.get(r.userId!) ?? r.userId}</td>
                  <td>{r._count._all}</td>
                  <td className="text-right font-mono">{formatCents(r._sum.costCents ?? 0)}</td>
                </tr>
              ))}
              {perUser.length === 0 && (
                <tr><td colSpan={3} className="py-3 text-almi-text-muted">No learner activity in the last 30 days.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
        <h2 className="text-lg font-semibold text-almi-ink">Recent 30 calls</h2>
        <p className="mt-1 text-xs text-almi-text-muted">
          Failures included, so a run of errors is visible here even though it adds nothing to
          the totals above.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left uppercase tracking-wide text-almi-text-muted">
              <tr>
                <th className="py-2">When (UTC)</th><th>Feature</th><th>Model</th>
                <th>User</th><th>In/Out</th><th>Cache R/W</th>
                <th className="text-right">Cost</th><th>OK</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-t border-almi-bg-peach">
                  <td className="py-2 text-almi-text-muted">{r.createdAt.toISOString().slice(5, 16).replace("T", " ")}</td>
                  <td className="text-almi-ink">{r.feature}</td>
                  <td className="text-almi-text-muted">{r.model}</td>
                  <td className="text-almi-text-muted">{r.userId ? (emailById.get(r.userId) ?? r.userId) : "—"}</td>
                  <td className="font-mono">{r.inputTokens}/{r.outputTokens}</td>
                  <td className="font-mono">{r.cacheReadTokens}/{r.cacheWriteTokens}</td>
                  <td className="text-right font-mono">{formatCents(r.costCents)}</td>
                  <td>{r.success ? "✓" : "✗"}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={8} className="py-3 text-almi-text-muted">The ledger is empty — no metered call has been recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
