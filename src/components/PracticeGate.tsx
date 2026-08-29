"use client";

import { useState } from "react";

// Shown to a signed-in user who is refused a section, for the two reasons that a subscription
// would fix:
//   PAYWALL         — Produzione scritta/orale, which are never in the no-card window.
//   WINDOW_EXPIRED  — the 3-day objective window has run out.
// The two need different words: telling someone whose free days ended that "Writing is part of
// Pro" answers a question they did not ask. A user who merely has not verified their email is
// NOT sent here — the page shows EmailVerifyBanner instead.
//
// The feedback claim is now TRUE and may be made — but only as far as the code goes. Produzione
// scritta is assessed from the learner's text; Produzione orale is assessed from an AUTOMATIC
// TRANSCRIPT of the recording, so it judges what was said and not how it sounded. Saying
// "pronunciation feedback" here would be false again. Every result is a labelled estimate
// (src/lib/ai/schemas.ts), and scripts/gates/honesty-gate.mts fails the build if one is not.
//
// If Stripe isn't wired yet (billingLive=false) the subscribe button shows its honest
// unavailable state — the fail-closed path — rather than starting a checkout that can't complete.
export function PracticeGate({
  billingLive,
  reason = "PAYWALL",
}: {
  billingLive: boolean;
  reason?: "PAYWALL" | "WINDOW_EXPIRED";
}) {
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
      <h2 className="text-lg font-semibold text-almi-ink">
        {reason === "WINDOW_EXPIRED"
          ? "Your 3 free days have ended"
          : "Produzione scritta & orale are part of AlmiItalian Pro"}
      </h2>
      <p className="mt-2 text-sm text-almi-text">
        {reason === "WINDOW_EXPIRED"
          ? "Ascolto, Lettura and Analisi were free for 3 days, no card. To keep practising them — and to open criteria-based feedback on Produzione scritta and orale — "
          : "Ascolto, Lettura and Analisi are free for 3 days, no card. Produzione scritta and orale add criteria-based feedback on what you write and say — 100% original material — for "}
        <strong className="text-almi-ink">$12/month</strong>. Start with a 7-day free trial: your card is saved but not
        charged, and you can cancel anytime before the trial ends and pay nothing.
      </p>
      <button
        onClick={subscribe}
        disabled={busy || !billingLive}
        className="mt-4 inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-60"
      >
        {busy ? "Starting…" : !billingLive ? "Checkout unavailable" : "Start 7-day free trial"}
      </button>
      {!billingLive && (
        <p className="mt-2 text-xs text-almi-text-muted">Subscriptions are being switched on. Please check back shortly.</p>
      )}
      {err && <p className="mt-2 text-xs text-almi-coral-text">{err}</p>}
    </div>
  );
}
