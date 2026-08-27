"use client";

// THE ONE WAY TO SHOW CONTENT THAT MUST NOT BE VISIBLE DURING AN ATTEMPT.
//
// ── WHAT THIS EXISTS TO PREVENT ─────────────────────────────────────────────
// PracticeRunner used to render the ASCOLTO "Show transcript" control with no `submitted`
// guard, while every answer input already had one. A learner could open the listening script
// and answer from it, which turns a listening item into a reading item — a construct leak, in
// the same family as leaking the key, and it was live.
//
// The instance was fixed by adding the guard. This component exists so the CLASS is fixed:
// there is now exactly one place that reveals attempt-hidden content, it returns null before
// submission, and scripts/gates/reveal-gate.mts fails the build if any component renders a
// protected field outside it.
//
// ── WHY A COMPONENT AND NOT A LINT RULE ─────────────────────────────────────
// A static check for "is this JSX inside a `submitted &&`" is guesswork over syntax and gets
// the answer wrong on the first refactor. A chokepoint can be checked two ways that are both
// exact: nothing else may name the protected field, and THIS returns null when it should.
//
// ⚠️ NOT everything on the page is protected. A LETTURA `passage` is the stimulus — the learner
// is supposed to read it — and gating it would break the item. Protection is for content that
// reveals what the learner is being asked to produce or perceive: the listening transcript, a
// coach note, an explanation.

import type { ReactNode } from "react";

export function RevealAfterSubmit({
  submitted,
  label,
  children,
}: {
  submitted: boolean;
  label: string;
  children: ReactNode;
}) {
  // The whole point, in one line. Not a CSS hide, not an aria-hidden: the content is not in the
  // DOM at all before submission, so it cannot be read out of the page source either.
  if (!submitted) return null;
  return (
    <details className="mt-2 rounded-lg bg-almi-bg-peach/30 p-3 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-almi-coral">{label}</summary>
      <div className="mt-2 whitespace-pre-line text-almi-text">{children}</div>
    </details>
  );
}
