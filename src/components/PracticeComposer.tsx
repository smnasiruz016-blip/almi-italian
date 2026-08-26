"use client";

import { useState } from "react";
// Imports from @/lib/runner-items, not @/lib/items. Writing and Speaking carry no answer key,
// so this component never had one to leak — but importing the guards from @/lib/items pulled
// the whole keyed bank into the client bundle all the same, on every Scritta and Orale page.
import type { RunnerItem, RunnerWritingPayload, RunnerSpeakingPayload } from "@/lib/runner-items";
import { isWriting, isSpeaking } from "@/lib/runner-items";
import { AudioRecorder, type Recording } from "@/components/AudioRecorder";
import { EstimateReport } from "@/components/EstimateReport";
import type { LabelledEstimate } from "@/lib/ai/schemas";

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Produzione scritta / orale: the two skills the engine marks `kind: "estimate"`. Until this
// change the composer had no submit button at all — it showed the task and counted words. It
// now sends the response for criteria-based feedback, and what comes back is always an
// ESTIMATE: EstimateReport is the only renderer for one, and it always prints the disclaimer
// (see src/lib/ai/schemas.ts and scripts/gates/honesty-gate.mts).
export function PracticeComposer({ items, sectionLabel, trackLabel, honesty }: { items: RunnerItem[]; sectionLabel: string; trackLabel: string; honesty: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-almi-line bg-almi-bg-peach/30 p-4 text-sm text-almi-text">
        {trackLabel} · {sectionLabel} is a productive task. Write or record your answer and you get
        criteria-based feedback — an estimate, never a mark. Only Siena (CILS) / Perugia (CELI) award
        a real Writing or Speaking result.
      </div>
      {items.map((it) => (
        <div key={it.id} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">{it.title}</p>
          {isWriting(it.payload) && <WritingTask itemId={it.id} p={it.payload} />}
          {isSpeaking(it.payload) && <SpeakingTask itemId={it.id} p={it.payload} />}
        </div>
      ))}
      <p className="text-xs text-almi-text-muted">{honesty}</p>
    </div>
  );
}

/** Shared submit state. `error` is shown VERBATIM from the server: the refusals are written to
 *  be read by a learner (402 says what to do, 403 says verify your address), so paraphrasing
 *  them here would only lose information the server took care to include. */
function useEstimate() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<LabelledEstimate | null>(null);
  const [transcript, setTranscript] = useState<string | undefined>();
  const [needsReview, setNeedsReview] = useState(false);
  return { busy, setBusy, error, setError, estimate, setEstimate, transcript, setTranscript, needsReview, setNeedsReview };
}

function WritingTask({ itemId, p }: { itemId: string; p: RunnerWritingPayload }) {
  const [text, setText] = useState("");
  const s = useEstimate();
  const n = wordCount(text);
  const under = n < p.minWords;
  const over = p.maxWords !== undefined && n > p.maxWords;

  const submit = async () => {
    s.setBusy(true);
    s.setError(null);
    try {
      const res = await fetch("/api/it/evaluate/scritta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, response: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { s.setError(data.error ?? "Feedback is unavailable right now."); return; }
      s.setEstimate(data.estimate as LabelledEstimate);
    } catch {
      s.setError("Feedback is unavailable right now.");
    } finally {
      s.setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-almi-ink">{p.task}</p>
      <p className="mt-1 text-sm text-almi-text">{p.context}</p>
      {/* The task text is the label. A placeholder is not one: it disappears on first keystroke
          and screen readers are not required to announce it, so this box had no accessible name. */}
      <textarea
        aria-label={p.task}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        className="mt-3 w-full rounded-lg border border-almi-line bg-white p-3 text-sm text-almi-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almi-coral"
        placeholder="Scrivi qui la tua risposta…"
      />
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={under || over ? "text-almi-coral-deep" : "text-almi-teal"}>
          {n} word{n === 1 ? "" : "s"} · target {p.minWords}{p.maxWords ? `–${p.maxWords}` : "+"}
        </span>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-almi-text-muted">
        {p.criteria.map((c, ci) => <li key={ci}>{c}</li>)}
      </ul>
      <button
        type="button"
        onClick={submit}
        disabled={s.busy || n === 0}
        className="mt-4 inline-flex rounded-full bg-almi-coral px-6 py-2.5 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-50"
      >
        {s.busy ? "Valutazione in corso…" : "Ricevi la valutazione"}
      </button>
      {s.error && <p className="mt-2 text-sm text-almi-coral-deep">{s.error}</p>}
      {s.estimate && <EstimateReport estimate={s.estimate} />}
    </div>
  );
}

function SpeakingTask({ itemId, p }: { itemId: string; p: RunnerSpeakingPayload }) {
  const [rec, setRec] = useState<Recording | null>(null);
  const s = useEstimate();

  const submit = async () => {
    if (!rec) return;
    s.setBusy(true);
    s.setError(null);
    try {
      const form = new FormData();
      form.append("itemId", itemId);
      form.append("audio", rec.blob, rec.mimeType.includes("mp4") ? "clip.mp4" : "clip.webm");
      form.append("durationSeconds", String(rec.seconds));
      const res = await fetch("/api/it/evaluate/orale", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) { s.setError(data.error ?? "Feedback is unavailable right now."); return; }
      s.setEstimate(data.estimate as LabelledEstimate);
      s.setTranscript(data.transcript as string | undefined);
      s.setNeedsReview(Boolean(data.needsReview));
    } catch {
      s.setError("Feedback is unavailable right now.");
    } finally {
      s.setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-almi-ink">{p.task}</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-almi-text">
        {p.parts.map((part, pi) => <li key={pi}>{part}</li>)}
      </ol>
      {(p.prepSeconds || p.speakSeconds) && (
        <p className="mt-2 text-xs text-almi-text-muted">
          {p.prepSeconds ? `Prep ~${p.prepSeconds}s · ` : ""}{p.speakSeconds ? `Speak ~${p.speakSeconds}s` : ""}
        </p>
      )}
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-almi-text-muted">
        {p.criteria.map((c, ci) => <li key={ci}>{c}</li>)}
      </ul>
      <AudioRecorder maxSeconds={Math.max(60, (p.speakSeconds ?? 60) * 2)} disabled={s.busy} onRecorded={setRec} />
      <button
        type="button"
        onClick={submit}
        disabled={s.busy || !rec}
        className="mt-3 inline-flex rounded-full bg-almi-coral px-6 py-2.5 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-50"
      >
        {s.busy ? "Valutazione in corso…" : "Invia la registrazione"}
      </button>
      {/* Stated up front, not buried in the report: the estimate reads a transcript, so it
          cannot judge pronunciation however confident it sounds. */}
      <p className="mt-2 text-xs text-almi-text-muted">
        La valutazione si basa su una trascrizione automatica: non giudica la pronuncia reale.
      </p>
      {s.error && <p className="mt-2 text-sm text-almi-coral-deep">{s.error}</p>}
      {s.estimate && <EstimateReport estimate={s.estimate} transcript={s.transcript} needsReview={s.needsReview} />}
    </div>
  );
}
