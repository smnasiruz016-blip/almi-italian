"use client";

// AlmiItalian practice runner.
//
// ── WHAT CHANGED, AND WHY IT IS NOT A REFACTOR ──────────────────────────────
// This component used to grade the section. It received the authored bank as props — keys
// included — built a list of gradable atoms, compared each one against `answerIndex` /
// `answerMap` / `correctOrder` / `blank.answer`, and computed the raw score, the percentage,
// the scaled section result and the CLEAR / BORDERLINE / BELOW verdict, all in the page.
//
// It now knows none of that. It collects answers, POSTs them to /api/it/submit, and renders
// what comes back. The arithmetic did not move for tidiness: a verdict the client computes is
// a verdict the client can choose, and every number this component used to produce was one a
// learner could edit into whatever they preferred.
//
// It imports from @/lib/runner-items — which imports nothing — rather than @/lib/items. That
// is load-bearing: the old import of the type guards pulled the entire keyed bank into the
// client bundle, so the key shipped on every practice page regardless of what the props said.

import { useState } from "react";
import {
  ATOM,
  isMcq,
  isMatching,
  isOrdering,
  isCloze,
  type AtomMark,
  type RunnerItem,
  type SubmitResult,
} from "@/lib/runner-items";

// A browser-voice player (free, client-side Web Speech — no Blob, degrades to transcript-only).
function AudioPlay({ script }: { script: string }) {
  const [on, setOn] = useState(false);
  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(script);
    u.lang = "it-IT";
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };
  return (
    <div className="mb-3 rounded-lg bg-almi-bg-peach/40 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={speak} className="rounded-full bg-almi-ink px-3 py-1 text-xs font-semibold text-almi-on-dark">▶ Play (browser voice)</button>
        <button type="button" onClick={() => setOn((v) => !v)} className="text-xs font-medium text-almi-coral hover:underline">{on ? "Hide" : "Show"} transcript</button>
      </div>
      {on && <p className="mt-2 whitespace-pre-line text-almi-text">{script}</p>}
    </div>
  );
}

/** Local answer-map key. The envelope posted to the server is grouped by item, so the atom key
 *  travels scoped to its item; this flat key exists only to drive one React state object. */
const localKey = (itemId: string, atom: string) => `${itemId}::${atom}`;

export function PracticeRunner({
  items, honesty, modelNote, celiContext, sectionLabel, trackLabel,
}: {
  items: RunnerItem[];
  honesty: string;
  modelNote: string;
  celiContext: string | null; // set for CELI (part-scored) — shown instead of a scaled score
  sectionLabel: string;
  trackLabel: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));

  const submitted = result !== null;

  // Marks, indexed for lookup while rendering. Empty until the server has replied — which is
  // also when the correct answers first exist on this side of the wire.
  const markBy = new Map<string, AtomMark>();
  if (result) for (const m of result.marks) markBy.set(localKey(m.itemId, m.atom), m);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // Only the item id and the chosen values. No key, no score, no exam/level/section — the
      // server derives all of those from the items it loads.
      const payload = {
        items: items.map((it) => {
          const own: Record<string, string> = {};
          for (const [k, v] of Object.entries(answers)) {
            if (k.startsWith(`${it.id}::`)) own[k.slice(it.id.length + 2)] = v;
          }
          return { itemId: it.id, answers: own };
        }),
      };
      const res = await fetch("/api/it/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not mark this section.");
        return;
      }
      setResult(data as SubmitResult);
    } catch {
      setError("Could not reach the marking service. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {items.map((it) => {
        const p = it.payload;
        const mark = (atom: string) => markBy.get(localKey(it.id, atom));
        return (
          <div key={it.id} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">{it.title}</p>
            {it.prompt && <p className="mt-1 text-sm text-almi-text">{it.prompt}</p>}

            {"audioScript" in p && p.audioScript && <div className="mt-3"><AudioPlay script={p.audioScript} /></div>}
            {"passage" in p && p.passage && <p className="mt-3 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{p.passage}</p>}

            {/* MCQ */}
            {isMcq(p) && p.questions.map((q, qi) => {
              const atom = ATOM.mcq(qi);
              const k = localKey(it.id, atom);
              const m = mark(atom);
              return (
                <fieldset key={qi} className="mt-3">
                  <legend className="text-sm font-medium text-almi-ink">{q.q}</legend>
                  <div className="mt-2 grid gap-1.5">
                    {q.options.map((o, oi) => (
                      <Choice
                        key={oi}
                        name={k}
                        chosen={answers[k] === String(oi)}
                        // Correctness comes from the server's mark, never from a local comparison.
                        isAnswer={!!m && m.correctValue === String(oi)}
                        wrong={!!m && answers[k] === String(oi) && m.correctValue !== String(oi)}
                        disabled={submitted}
                        onPick={() => set(k, String(oi))}
                        text={o}
                      />
                    ))}
                  </div>
                </fieldset>
              );
            })}

            {/* MATCHING */}
            {isMatching(p) && (
              <div className="mt-3">
                <p className="text-sm font-medium text-almi-ink">{p.instruction}</p>
                <div className="mt-2 space-y-2">
                  {p.prompts.map((pr, pi) => {
                    const atom = ATOM.matching(pi);
                    const k = localKey(it.id, atom);
                    const m = mark(atom);
                    const ok = !!m && m.correct;
                    const bad = !!m && !m.correct && answers[k] !== undefined;
                    return (
                      <div key={pi} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-almi-text">{pr}</span>
                        <select id={k} aria-label={pr} disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={`rounded-lg border px-2 py-1 ${ok ? "border-almi-teal bg-almi-teal/10" : bad ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`}>
                          <option value="">—</option>
                          {p.options.map((o, oi) => <option key={oi} value={String(oi)}>{o}</option>)}
                        </select>
                        {bad && m && <span className="text-xs text-almi-text-muted">→ {p.options[Number(m.correctValue)]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ORDERING */}
            {isOrdering(p) && (
              <div className="mt-3">
                <p className="text-sm font-medium text-almi-ink">{p.instruction}</p>
                <div className="mt-2 space-y-2">
                  {/* Slot count comes from `slots`, not from the length of the key — the key is
                      no longer here to be counted, which was the point. */}
                  {Array.from({ length: p.slots }, (_, slot) => {
                    const atom = ATOM.ordering(slot);
                    const k = localKey(it.id, atom);
                    const m = mark(atom);
                    const ok = !!m && m.correct;
                    const bad = !!m && !m.correct && answers[k] !== undefined;
                    return (
                      <div key={slot} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="w-6 text-almi-text-muted">{slot + 1}.</span>
                        <select id={k} aria-label={`Position ${slot + 1}`} disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={`flex-1 rounded-lg border px-2 py-1 ${ok ? "border-almi-teal bg-almi-teal/10" : bad ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`}>
                          <option value="">—</option>
                          {p.shuffled.map((frag, fi) => <option key={fi} value={String(fi)}>{frag}</option>)}
                        </select>
                        {bad && m && <span className="text-xs text-almi-text-muted">→ {p.shuffled[Number(m.correctValue)]}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CLOZE / ANALISI */}
            {isCloze(p) && (
              <div className="mt-3">
                <p className="whitespace-pre-line text-sm text-almi-text">{p.text}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {p.blanks.map((b, bi) => {
                    const atom = ATOM.cloze(bi);
                    const k = localKey(it.id, atom);
                    const m = mark(atom);
                    const ok = !!m && m.correct;
                    const bad = !!m && !m.correct && (answers[k] ?? "") !== "";
                    const cls = `rounded-lg border px-2 py-1 text-sm ${ok ? "border-almi-teal bg-almi-teal/10" : bad ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`;
                    return (
                      <div key={bi} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-almi-text-muted">{bi + 1}.</span>
                        {b.options ? (
                          <select id={k} aria-label={`Blank ${bi + 1}`} disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={cls}>
                            <option value="">—</option>
                            {b.options.map((o, oi) => <option key={oi} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input id={k} aria-label={`Blank ${bi + 1}`} disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={cls} placeholder="…" />
                        )}
                        {bad && m && <span className="text-xs text-almi-text-muted">→ {m.correctValue}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {submitted && it.guidanceNote && <p className="mt-3 text-xs text-almi-text-muted">Coach: {it.guidanceNote}</p>}
          </div>
        );
      })}

      {error && (
        <p role="alert" className="rounded-xl border border-almi-coral-deep bg-almi-coral/10 px-4 py-3 text-sm text-almi-ink">
          {error}
        </p>
      )}

      {!submitted ? (
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark disabled:opacity-60"
        >
          {busy ? "Marking…" : "Check my answers"}
        </button>
      ) : (
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-almi-ink">{trackLabel} · {sectionLabel}</p>
            <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs text-almi-text">practice estimate</span>
          </div>
          <p className="mt-3 text-almi-text">
            Raw: <strong className="text-almi-ink">{result.correct}/{result.total}</strong> correct ({result.percent}%).
          </p>
          {result.scaled ? (
            <p className="mt-2 text-almi-text">
              On this section&apos;s scale that is about <strong className="text-almi-ink">{result.scaled.score}/{result.scaled.max}</strong> — you need ≥{result.scaled.floor}/{result.scaled.max} to clear it.{" "}
              <span className={result.scaled.status === "CLEAR" ? "font-semibold text-almi-teal" : result.scaled.status === "BORDERLINE" ? "font-semibold text-almi-coral" : "font-semibold text-almi-coral-deep"}>{result.scaled.status}</span>
            </p>
          ) : (
            celiContext && <p className="mt-2 text-almi-text">{celiContext}</p>
          )}
          <p className="mt-3 text-xs text-almi-text-muted">{modelNote}</p>
          <p className="mt-2 text-xs text-almi-text-muted">{honesty}</p>
        </div>
      )}
    </div>
  );
}

function Choice({ name, chosen, isAnswer, wrong, disabled, onPick, text }: { name: string; chosen: boolean; isAnswer: boolean; wrong: boolean; disabled: boolean; onPick: () => void; text: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isAnswer ? "border-almi-teal bg-almi-teal/10" : wrong ? "border-almi-coral-deep bg-almi-coral/10" : chosen ? "border-almi-coral" : "border-almi-line"}`}>
      <input type="radio" name={name} checked={chosen} disabled={disabled} onChange={onPick} />
      <span className="text-almi-text">{text}</span>
    </label>
  );
}
