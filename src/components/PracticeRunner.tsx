"use client";

import { useMemo, useState } from "react";
import type { BankItem } from "@/lib/items";
import { isMcq, isMatching, isOrdering, isCloze } from "@/lib/items";

type Scale = { max: number; floor: number } | null;

// Normalize free-text cloze answers: case-insensitive, trimmed, inner spaces collapsed.
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// One gradable atom (an MCQ question, one matching prompt, one ordering slot, one cloze blank).
type Atom = { key: string; correct: () => boolean };

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

export function PracticeRunner({
  items, scale, honesty, modelNote, celiContext, sectionLabel, trackLabel,
}: {
  items: BankItem[];
  scale: Scale;
  honesty: string;
  modelNote: string;
  celiContext: string | null; // set for CELI (part-scored) — shown instead of a scaled score
  sectionLabel: string;
  trackLabel: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));

  // Collect every gradable atom so the score reflects real auto-marking, not item count.
  const atoms = useMemo<Atom[]>(() => {
    const out: Atom[] = [];
    items.forEach((it, i) => {
      const p = it.payload;
      if (isMcq(p)) p.questions.forEach((q, qi) => { const k = `${i}:mcq:${qi}`; out.push({ key: k, correct: () => answers[k] === String(q.answerIndex) }); });
      else if (isMatching(p)) p.answerMap.forEach((ans, pi) => { const k = `${i}:mat:${pi}`; out.push({ key: k, correct: () => answers[k] === String(ans) }); });
      else if (isOrdering(p)) p.correctOrder.forEach((ans, slot) => { const k = `${i}:ord:${slot}`; out.push({ key: k, correct: () => answers[k] === String(ans) }); });
      else if (isCloze(p)) p.blanks.forEach((b, bi) => { const k = `${i}:clz:${bi}`; out.push({ key: k, correct: () => (b.options ? answers[k] === b.answer : norm(answers[k] ?? "") === norm(b.answer)) }); });
    });
    return out;
  }, [items, answers]);

  const total = atoms.length;
  const correct = atoms.filter((a) => a.correct()).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const scaled = scale ? Math.round((total > 0 ? correct / total : 0) * scale.max) : null;
  const status = scale && scaled !== null ? (scaled >= scale.floor ? "CLEAR" : scaled === scale.floor - 1 ? "BORDERLINE" : "BELOW") : null;

  return (
    <div className="space-y-6">
      {items.map((it, i) => {
        const p = it.payload;
        return (
          <div key={i} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">{it.title}</p>
            {it.prompt && <p className="mt-1 text-sm text-almi-text">{it.prompt}</p>}

            {"audioScript" in p && p.audioScript && <div className="mt-3"><AudioPlay script={p.audioScript} /></div>}
            {"passage" in p && p.passage && <p className="mt-3 whitespace-pre-line rounded-lg bg-almi-bg-peach/30 p-3 text-sm text-almi-text">{p.passage}</p>}

            {/* MCQ */}
            {isMcq(p) && p.questions.map((q, qi) => {
              const k = `${i}:mcq:${qi}`;
              return (
                <fieldset key={qi} className="mt-3">
                  <legend className="text-sm font-medium text-almi-ink">{q.q}</legend>
                  <div className="mt-2 grid gap-1.5">
                    {q.options.map((o, oi) => (
                      <Choice key={oi} name={k} chosen={answers[k] === String(oi)} isAnswer={submitted && oi === q.answerIndex} wrong={submitted && answers[k] === String(oi) && oi !== q.answerIndex} disabled={submitted} onPick={() => set(k, String(oi))} text={o} />
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
                    const k = `${i}:mat:${pi}`;
                    const ok = submitted && answers[k] === String(p.answerMap[pi]);
                    const bad = submitted && answers[k] !== undefined && answers[k] !== String(p.answerMap[pi]);
                    return (
                      <div key={pi} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-almi-text">{pr}</span>
                        <select disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={`rounded-lg border px-2 py-1 ${ok ? "border-almi-teal bg-almi-teal/10" : bad ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`}>
                          <option value="">—</option>
                          {p.options.map((o, oi) => <option key={oi} value={String(oi)}>{o}</option>)}
                        </select>
                        {submitted && bad && <span className="text-xs text-almi-text-muted">→ {p.options[p.answerMap[pi]]}</span>}
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
                  {p.correctOrder.map((ans, slot) => {
                    const k = `${i}:ord:${slot}`;
                    const ok = submitted && answers[k] === String(ans);
                    const bad = submitted && answers[k] !== undefined && answers[k] !== String(ans);
                    return (
                      <div key={slot} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="w-6 text-almi-text-muted">{slot + 1}.</span>
                        <select disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={`flex-1 rounded-lg border px-2 py-1 ${ok ? "border-almi-teal bg-almi-teal/10" : bad ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`}>
                          <option value="">—</option>
                          {p.shuffled.map((frag, fi) => <option key={fi} value={String(fi)}>{frag}</option>)}
                        </select>
                        {submitted && bad && <span className="text-xs text-almi-text-muted">→ {p.shuffled[ans]}</span>}
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
                    const k = `${i}:clz:${bi}`;
                    const good = b.options ? answers[k] === b.answer : norm(answers[k] ?? "") === norm(b.answer);
                    const ok = submitted && good;
                    const bad = submitted && (answers[k] ?? "") !== "" && !good;
                    const cls = `rounded-lg border px-2 py-1 text-sm ${ok ? "border-almi-teal bg-almi-teal/10" : bad ? "border-almi-coral-deep bg-almi-coral/10" : "border-almi-line"}`;
                    return (
                      <div key={bi} className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-almi-text-muted">{bi + 1}.</span>
                        {b.options ? (
                          <select disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={cls}>
                            <option value="">—</option>
                            {b.options.map((o, oi) => <option key={oi} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input disabled={submitted} value={answers[k] ?? ""} onChange={(e) => set(k, e.target.value)} className={cls} placeholder="…" />
                        )}
                        {submitted && bad && <span className="text-xs text-almi-text-muted">→ {b.answer}</span>}
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

      {!submitted ? (
        <button onClick={() => setSubmitted(true)} className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
          Check my answers
        </button>
      ) : (
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold text-almi-ink">{trackLabel} · {sectionLabel}</p>
            <span className="rounded-full bg-almi-bg-peach px-3 py-1 text-xs text-almi-text">practice estimate</span>
          </div>
          <p className="mt-3 text-almi-text">
            Raw: <strong className="text-almi-ink">{correct}/{total}</strong> correct ({pct}%).
          </p>
          {scale && scaled !== null ? (
            <p className="mt-2 text-almi-text">
              On this section&apos;s scale that is about <strong className="text-almi-ink">{scaled}/{scale.max}</strong> — you need ≥{scale.floor}/{scale.max} to clear it.{" "}
              <span className={status === "CLEAR" ? "font-semibold text-almi-teal" : status === "BORDERLINE" ? "font-semibold text-almi-coral" : "font-semibold text-almi-coral-deep"}>{status}</span>
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
