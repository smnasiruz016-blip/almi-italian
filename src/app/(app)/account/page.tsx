import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { hasPaidAccess, isBillingEnabled, isOwner } from "@/lib/access";
import { BillingButtons } from "@/components/BillingButtons";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ProgressSection } from "@/components/ProgressSection";
import { recentAttempts } from "@/lib/progress";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  // Both lists are scoped to this user in the query. Fetched together rather than in sequence:
  // the page already waits on the session, and two short indexed reads should not stack.
  const [scritta, orale] = await Promise.all([
    recentAttempts(user.id, "SCRITTA"),
    recentAttempts(user.id, "ORALE"),
  ]);
  const paid = hasPaidAccess(user);
  const billingOn = isBillingEnabled();

  const planLabel = isOwner(user.email)
    ? "Owner — full access"
    : paid
      ? `Active (${user.subscriptionStatus ?? "trialing"})`
      : "Free";

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">Account</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{user.name ?? user.email}</h1>
      <p className="mt-1 text-sm text-almi-text-muted">{user.email}</p>

      {sp.welcome && !paid && (
        <div className="mt-6 rounded-2xl border border-almi-coral/30 bg-almi-coral/10 p-4">
          <p className="text-sm text-almi-ink">
            Welcome — your account is ready. Ascolto, Lettura and Analisi are free for 3 days, no card. Start the 7-day free trial below to add Produzione scritta and orale.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
        <p className="text-almi-text">Plan: <strong className="text-almi-ink">{planLabel}</strong></p>
        {!paid && (
          <p className="mt-2 text-sm text-almi-text-muted">
            Ascolto, Lettura and Analisi are free for 3 days — no card. A 7-day free trial (card saved, not charged) adds Produzione scritta and orale; $12/month after the trial, cancel anytime.
          </p>
        )}
        {isOwner(user.email) ? (
          <p className="mt-2 text-sm text-almi-text-muted">Owner access — practice is open.</p>
        ) : !billingOn ? (
          <p className="mt-3 text-sm text-almi-text-muted">Checkout opens shortly — hang tight.</p>
        ) : (
          <BillingButtons hasSubscription={Boolean(user.stripeSubscriptionId)} />
        )}
      </div>

      <ProgressSection
        title="Produzione scritta"
        practiseHref="/practice"
        practiseLabel="Esercitati nello scritto"
        emptyLine="Nessuna prova valutata per ora. Quando completi una Produzione scritta, la stima compare qui."
        attempts={scritta}
      />

      <ProgressSection
        title="Produzione orale"
        practiseHref="/practice"
        practiseLabel="Esercitati nel parlato"
        emptyLine="Nessuna prova valutata per ora. Quando registri una Produzione orale, la stima compare qui."
        attempts={orale}
      />
      <div className="mt-8">
        <ReviewCard />
      </div>

      <div className="mt-6 flex items-center gap-4 text-sm">
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="text-almi-text-muted hover:text-almi-coral-text">Log out</button>
        </form>
      </div>
    </main>
  );
}
