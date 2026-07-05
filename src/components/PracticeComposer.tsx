"use client";

import { useState } from "react";
import type { BankItem, WritingPayload, SpeakingPayload } from "@/lib/items";
import { isWriting, isSpeaking } from "@/lib/items";

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Writing/Speaking are AI-criteria ESTIMATES — never auto-scored here. This composer gives the task,
// the official-style criteria, and a live counter; it never asserts a numeric result. Only Siena
// (CILS) / Perugia (CELI) award a real Writing/Speaking mark.
export function PracticeComposer({ items, sectionLabel, trackLabel, honesty }: { items: BankItem[]; sectionLabel: string; trackLabel: string; honesty: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-dashed border-almi-line bg-almi-bg-peach/30 p-4 text-sm text-almi-text">
        {trackLabel} · {sectionLabel} is a productive task. Practise it here against the official-style criteria — this is a
        self-guided estimate, not a mark. Only Siena/Perugia award a real Writing or Speaking result.
      </div>
      {items.map((it, i) => (
        <div key={i} className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">{it.title}</p>
          {isWriting(it.payload) && <WritingTask p={it.payload} />}
          {isSpeaking(it.payload) && <SpeakingTask p={it.payload} />}
        </div>
      ))}
      <p className="text-xs text-almi-text-muted">{honesty}</p>
    </div>
  );
}

function WritingTask({ p }: { p: WritingPayload }) {
  const [text, setText] = useState("");
  const n = wordCount(text);
  const under = n < p.minWords;
  const over = p.maxWords !== undefined && n > p.maxWords;
  return (
    <div className="mt-2">
      <p className="text-sm font-medium text-almi-ink">{p.task}</p>
      <p className="mt-1 text-sm text-almi-text">{p.context}</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="mt-3 w-full rounded-lg border border-almi-line bg-white p-3 text-sm text-almi-text" placeholder="Scrivi qui la tua risposta…" />
      <div className="mt-1 flex items-center justify-between text-xs">
        <span className={under || over ? "text-almi-coral-deep" : "text-almi-teal"}>
          {n} word{n === 1 ? "" : "s"} · target {p.minWords}{p.maxWords ? `–${p.maxWords}` : "+"}
        </span>
      </div>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-almi-text-muted">
        {p.criteria.map((c, ci) => <li key={ci}>{c}</li>)}
      </ul>
    </div>
  );
}

function SpeakingTask({ p }: { p: SpeakingPayload }) {
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
    </div>
  );
}
