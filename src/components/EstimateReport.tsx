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
import { criterionBand } from "@/lib/scoring/section-status";

const BAND_LABEL: Record<string, { text: string; cls: string }> = {
  RAGGIUNTO: { text: "Raggiunto", cls: "bg-almi-teal/15 text-almi-teal-text" },
  PARZIALE: { text: "Parziale", cls: "bg-almi-bg-peach text-almi-ink" },
  NON_RAGGIUNTO: { text: "Non raggiunto", cls: "bg-almi-coral/15 text-almi-coral-text" },
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
          <span className="text-sm text-almi-text-muted">soglia {s.floor}/{s.officialMax ?? s.max}</span>
          {s.officialMax && s.officialMax !== s.max && (
            <span className="text-xs text-almi-text-muted">(l&apos;esame assegna {s.officialMax} punti; qui se ne valutano {s.max})</span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            s.status === "CLEAR" ? "bg-almi-teal/15 text-almi-teal-text"
              : s.status === "BORDERLINE" ? "bg-almi-bg-peach text-almi-ink"
                : "bg-almi-coral/15 text-almi-coral-text"
          }`}>
            {s.status === "CLEAR" ? "Sopra la soglia (stima)" : s.status === "BORDERLINE" ? "Al limite (stima)" : "Sotto la soglia (stima)"}
          </span>
        </div>
      ) : (
        <p className="mt-4 text-sm text-almi-text">
          Nessun punteggio di sezione per questo esame — è valutato per parte.
        </p>
      )}

      {s?.notAssessedNote && (
        <p className="mt-3 rounded-lg border border-dashed border-almi-line px-3 py-2 text-xs text-almi-text-muted">
          {s.notAssessedNote}
        </p>
      )}

      <p className="mt-3 text-xs text-almi-text-muted">{estimate.engineNote}</p>

      {needsReview && (
        <p className="mt-3 rounded-lg border border-almi-coral/40 bg-almi-coral/10 px-3 py-2 text-xs text-almi-coral-text">
          La trascrizione automatica di questa registrazione è poco affidabile, quindi questa stima
          potrebbe riferirsi a parole diverse da quelle che hai detto. Riprova in un ambiente più silenzioso.
        </p>
      )}

      <h3 className="mt-6 text-sm font-semibold text-almi-ink">Criteri</h3>
      <ul className="mt-2 space-y-3">
        {estimate.criteria.map((c, i) => {
          // A criterion with no band is one this product could not assess — it is appended by
          // our own code, never by the model, and it must never look like a zero.
          const notAssessed = c.band === null;
          // WHERE THERE IS A NUMBER, THE NUMBER DECIDES THE WORD.
          // The model returns `band` alongside `points`, unconstrained by them, and a live
          // report showed two criteria at 0/1 carrying different verdicts. criterionBand()
          // derives it from the score instead; the model's word is ignored in that case.
          // It is derived at RENDER, not at evaluation, for two reasons: the stored row
          // keeps the model's raw answer so a past report stays auditable, and every
          // already-stored attempt is re-banded the next time a learner opens it.
          // Returns null when the module publishes no per-criterion weight (CILS UNO/DUE,
          // CELI) — there the band IS the verdict and the model's word stands.
          const derived = criterionBand(c.points, c.pointsMax);
          const band = derived ?? c.band;
          const b = band ? (BAND_LABEL[band] ?? { text: band, cls: "bg-almi-line" }) : null;
          return (
            <li key={i} className={`rounded-lg border p-3 ${notAssessed ? "border-dashed border-almi-line bg-almi-bg-peach/20" : "border-almi-line"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-almi-ink">{c.criterion}</span>
                <span className="flex items-center gap-2">
                  {typeof c.points === "number" && (
                    <span className="text-sm font-semibold text-almi-ink">{c.points}<span className="text-xs text-almi-text-muted">/{c.pointsMax ?? "?"}</span></span>
                  )}
                  {notAssessed ? (
                    <span className="rounded-full bg-almi-line px-2 py-0.5 text-xs font-semibold text-almi-text-muted">Non valutato</span>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${b!.cls}`}>{b!.text}</span>
                  )}
                </span>
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
          <summary className="cursor-pointer text-xs font-medium text-almi-coral-text">Mostra la trascrizione</summary>
          <p className="mt-2 whitespace-pre-line text-almi-text">{transcript}</p>
        </details>
      )}
    </div>
  );
}
