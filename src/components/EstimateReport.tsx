"use client";

// The ONLY renderer for an AI estimate.
//
// It accepts LabelledEstimate and nothing else. That type carries `labelKind: "ESTIMATE"` as a
// required literal, so there is no unlabelled estimate anywhere in the codebase to pass in —
// "render a score without saying it is an estimate" is not a mistake this component can be
// asked to make.
//
// The disclaimer is rendered from the shared constant, above the number, always. It is not a
// prop, so a caller cannot omit it or replace it with something softer.
// scripts/gates/honesty-gate.mts fails the build if this file stops importing it.

import { ESTIMATE_DISCLAIMER, type LabelledEstimate } from "@/lib/ai/schemas";

const BAND_LABEL: Record<string, { text: string; cls: string }> = {
  RAGGIUNTO: { text: "Raggiunto", cls: "bg-almi-teal/15 text-almi-teal" },
  PARZIALE: { text: "Parziale", cls: "bg-almi-bg-peach text-almi-ink" },
  NON_RAGGIUNTO: { text: "Non raggiunto", cls: "bg-almi-coral/15 text-almi-coral-deep" },
};

export function EstimateReport({ estimate, transcript, needsReview }: {
  estimate: LabelledEstimate;
  transcript?: string;
  needsReview?: boolean;
}) {
  const s = estimate.score;
  return (
    <div className="mt-6 rounded-2xl border border-almi-line bg-almi-paper p-6">
      {/* THE LABEL. First, before any number, and not optional. */}
      <p className="rounded-lg bg-almi-bg-peach/60 px-3 py-2 text-xs font-medium text-almi-ink">
        {ESTIMATE_DISCLAIMER}
      </p>

      {s ? (
        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold text-almi-ink">{s.value}<span className="text-lg text-almi-text-muted">/{s.max}</span></span>
          <span className="text-sm text-almi-text-muted">soglia {s.floor}/{s.max}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            s.status === "CLEAR" ? "bg-almi-teal/15 text-almi-teal"
              : s.status === "BORDERLINE" ? "bg-almi-bg-peach text-almi-ink"
                : "bg-almi-coral/15 text-almi-coral-deep"
          }`}>
            {s.status === "CLEAR" ? "Sopra la soglia (stima)" : s.status === "BORDERLINE" ? "Al limite (stima)" : "Sotto la soglia (stima)"}
          </span>
        </div>
      ) : (
        <p className="mt-4 text-sm text-almi-text">
          Nessun punteggio di sezione per questo esame — è valutato per parte.
        </p>
      )}

      <p className="mt-3 text-xs text-almi-text-muted">{estimate.engineNote}</p>

      {needsReview && (
        <p className="mt-3 rounded-lg border border-almi-coral/40 bg-almi-coral/10 px-3 py-2 text-xs text-almi-coral-deep">
          La trascrizione automatica di questa registrazione è poco affidabile, quindi questa stima
          potrebbe riferirsi a parole diverse da quelle che hai detto. Riprova in un ambiente più silenzioso.
        </p>
      )}

      <h3 className="mt-6 text-sm font-semibold text-almi-ink">Criteri</h3>
      <ul className="mt-2 space-y-3">
        {estimate.criteria.map((c, i) => {
          const b = BAND_LABEL[c.band] ?? { text: c.band, cls: "bg-almi-line" };
          return (
            <li key={i} className="rounded-lg border border-almi-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-almi-ink">{c.criterion}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b.cls}`}>{b.text}</span>
              </div>
              <p className="mt-1 text-sm text-almi-text">{c.comment}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-almi-ink">Punti di forza</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-almi-text">
            {estimate.strengths.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-almi-ink">Da migliorare</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-almi-text">
            {estimate.improvements.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </div>
      </div>

      <p className="mt-5 text-sm text-almi-text">{estimate.summary}</p>

      {transcript && (
        <details className="mt-5 rounded-lg bg-almi-bg-peach/30 p-3 text-sm">
          <summary className="cursor-pointer text-xs font-medium text-almi-coral">Mostra la trascrizione</summary>
          <p className="mt-2 whitespace-pre-line text-almi-text">{transcript}</p>
        </details>
      )}
    </div>
  );
}
