"use client";

import { useState } from "react";

// Shown to a signed-in user who is refused a section for the one reason a subscription fixes:
// PAYWALL. The second reason this component used to carry, WINDOW_EXPIRED, went with the 3-day
// no-card grant on 2026-08-31 — and the `reason` prop went with it, so there is no branch left
// that can render copy for a state nobody can be in. A user who merely has not verified their
// email is NOT sent here — the page shows EmailVerifyBanner instead.
//
// The feedback claim is now TRUE and may be made — but only as far as the code goes. Produzione
// scritta is assessed from the learner's text; Produzione orale is assessed from an AUTOMATIC
// TRANSCRIPT of the recording, so it judges what was said and not how it sounded. Saying
// "pronunciation feedback" here would be false again. Every result is a labelled estimate
// (src/lib/ai/schemas.ts), and scripts/gates/honesty-gate.mts fails the build if one is not.
//
// If Stripe isn't wired yet (billingLive=false) the subscribe button shows its honest
// unavailable state — the fail-closed path — rather than starting a checkout that can't complete.
// RR-397: this is shown only OUTSIDE the free 48 hours (no card) — after they end, or to an account that already had a
// subscription. `title` is "Your free 48 hours are over" when they have just ended. The button starts a checkout that charges
// $12 at once (no Stripe trial).
export function PracticeGate({ billingLive, title }: { billingLive: boolean; title?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const subscribe = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) { window.location.href = data.url; return; }
      setErr(data.error ?? "Could not start checkout. Please try again.");
    } catch {
      setErr("Could not start checkout. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
      {title && <p className="text-sm font-semibold text-almi-coral-text">{title}.</p>}
      <h2 className="text-lg font-semibold text-almi-ink">Practice is part of AlmiItalian Pro</h2>
      <p className="mt-2 text-sm text-almi-text">
        Every section — Ascolto, Lettura, Analisi, and criteria-based feedback on Produzione scritta and orale — for{" "}
        <strong className="text-almi-ink">$12/month</strong>. When you unlock, $12 is charged at checkout and then monthly;
        cancel anytime from your account.
      </p>
      <button
        onClick={subscribe}
        disabled={busy || !billingLive}
        className="mt-4 inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-60"
      >
        {busy ? "Starting…" : !billingLive ? "Checkout unavailable" : "Unlock for $12/month"}
      </button>
      {!billingLive && (
        <p className="mt-2 text-xs text-almi-text-muted">Subscriptions are being switched on. Please check back shortly.</p>
      )}
      {err && <p className="mt-2 text-xs text-almi-coral-text">{err}</p>}
    </div>
  );
}
