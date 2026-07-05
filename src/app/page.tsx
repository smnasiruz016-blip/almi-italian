import type { Metadata } from "next";
import Link from "next/link";
import { scoreCilsStandard, scoreCilsB1c, scoreCeli, CILS_B1C_FLOOR, CILS_B1C_SECTION_MAX, CILS_B1C_TOTAL_FLOOR } from "@/lib/scoring";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "AlmiItalian | Honest CILS & CELI Practice — for the RIGHT exam" },
  description:
    "Practise real CILS and CELI task formats on their own real scales — never mixed. Citizenship needs B1, the long-term permit needs A2: prepare for the exam you actually need. Writing & speaking are labelled estimates.",
  alternates: { canonical: canonical("/") },
};

// Live samples rendered from the THREE real engines — each on its own scale, never blended.
const CILS_STD = scoreCilsStandard("DUE", [
  { section: "ASCOLTO", score: 15 },
  { section: "LETTURA", score: 13 },
  { section: "ANALISI", score: 9 }, //  below 11 → retake only this + orale
  { section: "SCRITTA", score: 12 },
  { section: "ORALE", score: 10 },
]);
const B1C = scoreCilsB1c([
  { section: "ASCOLTO", score: 8 },
  { section: "LETTURA", score: 8 },
  { section: "SCRITTA", score: 6 }, // one section < 7 → whole exam retaken
  { section: "ORALE", score: 9 },
]);
const CELI_B1 = scoreCeli("DUE", { writtenScore: 88, oralScore: 18 }); // oral < 22 → written banks 1 yr

const SEC_LABEL_STD: Record<string, string> = { ASCOLTO: "Ascolto", LETTURA: "Lettura", ANALISI: "Analisi", SCRITTA: "Scritta", ORALE: "Orale" };
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
// The section holding the sample under the floor — derived, not hardcoded, so the verdict copy tracks the data.
const B1C_BELOW = B1C.sections.find((s) => s.score < s.floor);

export default function HomePage() {
  return (
    <main>
      {/* Hero — two columns: message left, sample readiness report right (stacks on mobile) */}
      <section className="px-6 pt-16 pb-14">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          {/* LEFT */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">ALMIITALIAN · CILS + CELI PRACTICE</p>
            <h1 className="mt-4 text-4xl font-bold text-almi-ink sm:text-5xl">
              Prepare for the Italian exam you <span className="text-almi-coral">actually need</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-almi-text">
              CILS (Siena) and CELI (Perugia) are two different exams with two different scoring systems — and we keep them{" "}
              <strong className="text-almi-ink">strictly apart</strong>, each on its own real scale. The confusion we exist to fix:
              the long-term residence permit needs <strong className="text-almi-ink">A2</strong>, Italian citizenship needs{" "}
              <strong className="text-almi-ink">B1</strong>. Prepare for the right one.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
                Practise free
              </Link>
              <Link href="/practice" className="rounded-full border border-almi-line px-7 py-3 font-semibold text-almi-text hover:border-almi-coral">
                Practice
              </Link>
              <Link href="/login" className="text-sm text-almi-text-muted hover:text-almi-coral">Already have an account? Log in →</Link>
            </div>
            <p className="mt-4 text-xs text-almi-text-muted">
              Free to practise · <strong className="text-almi-ink">$12/month</strong> for full access · in-person exams only · certificates don&apos;t expire · writing &amp; speaking are clearly-labelled estimates
            </p>
          </div>

          {/* RIGHT — sample readiness report (rendered from the B1c engine; numbers from its constants) */}
          <div className="rounded-3xl border border-almi-line bg-almi-paper p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-text-muted">Sample readiness report · {B1C.examLabel}</p>
              <span className="rounded-full bg-almi-bg-peach px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-almi-coral-deep">Sample</span>
            </div>

            {/* Four section bars, each out of the section max, with a floor tick at the pass floor */}
            <div className="mt-5 space-y-3">
              {B1C.sections.map((s) => {
                const clears = s.score >= s.floor;
                return (
                  <div key={s.section}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-almi-text">{cap(s.section)}{s.isEstimate ? " *" : ""}</span>
                      <span className={clears ? "font-semibold text-almi-teal" : "font-semibold text-almi-coral-deep"}>{s.score}/{s.max}{clears ? " ✓" : ""}</span>
                    </div>
                    <div className="relative mt-1 h-2.5 rounded-full bg-almi-bg-peach/60">
                      <div className={`absolute inset-y-0 left-0 rounded-full ${clears ? "bg-almi-teal" : "bg-almi-coral-deep"}`} style={{ width: `${(s.score / s.max) * 100}%` }} />
                      {/* floor tick */}
                      <div className="absolute inset-y-[-2px] w-0.5 bg-almi-ink/50" style={{ left: `${(s.floor / s.max) * 100}%` }} title={`Floor ${s.floor}/${s.max}`} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-almi-text-muted">Tick = the {CILS_B1C_FLOOR}/{CILS_B1C_SECTION_MAX} floor every section must clear.</p>
            </div>

            {/* Totals strip — pass tint */}
            <div className="mt-4 rounded-xl bg-almi-teal/10 px-4 py-2.5 text-sm font-medium text-almi-ink">
              Total {B1C.total}/{B1C.totalMax} — ≥{CILS_B1C_TOTAL_FLOOR} {B1C.conditions.totalThresholdMet ? "✓" : "✗"}
            </div>

            {/* Verdict strip — the punchline */}
            <div className="mt-2 rounded-xl border border-almi-coral-deep/30 bg-almi-coral-deep/10 px-4 py-3 text-sm text-almi-ink">
              <strong className="text-almi-coral-deep">Certificate: {B1C.passed ? "on track" : "not yet"}</strong> — {B1C_BELOW ? cap(B1C_BELOW.section) : "a section"} is under the {CILS_B1C_FLOOR}-point floor.
              CILS B1 Cittadinanza has <strong>NO banking</strong>: the whole exam is retaken.
            </div>

            {/* Honest feedback on the writing section (an estimate) */}
            <div className="mt-3 rounded-xl border border-almi-line bg-almi-bg-peach/30 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-almi-text-muted">Honest feedback · Scritta *</p>
              <p className="mt-1 text-sm text-almi-text">Task addressed, but register slips out of the administrative context — that&apos;s what&apos;s holding Scritta under the floor.</p>
            </div>

            <p className="mt-4 text-[10px] text-almi-text-muted">* AI criteria estimate. Illustrative example — not a real CILS result. Only Siena awards official results.</p>
          </div>
        </div>
      </section>

      {/* The three scoring philosophies — each from its own engine */}
      <section className="bg-almi-bg-peach/30 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-almi-ink">Three exams, three honest scoring systems — never mixed.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {/* CILS standard — capitalization banking */}
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">CILS standard · {CILS_STD.examLabel}</p>
              <h3 className="mt-1 font-semibold text-almi-ink">Floors + banking</h3>
              <p className="mt-2 text-sm text-almi-text">≥11/20 in every section. Capitalization: you bank the sections you pass and retake only the rest.</p>
              <ul className="mt-3 space-y-1 text-sm">
                {CILS_STD.sections.map((s) => (
                  <li key={s.section} className="flex justify-between">
                    <span className="text-almi-text">{SEC_LABEL_STD[s.section]}{s.isEstimate ? " *" : ""}</span>
                    <span className={s.status === "CLEAR" ? "font-semibold text-almi-teal" : "text-almi-text-muted"}>{s.score}/20</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-almi-bg-peach/50 p-2 text-xs text-almi-text">
                You&apos;d bank <strong className="text-almi-ink">{CILS_STD.bankedToday.length} of 5</strong> today · retake {CILS_STD.toRetake.length}.
              </p>
            </div>

            {/* CILS B1 Cittadinanza — all-or-nothing */}
            <div className="rounded-2xl border-2 border-almi-coral bg-almi-paper p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">Flagship · {B1C.examLabel}</p>
              <h3 className="mt-1 font-semibold text-almi-ink">All-or-nothing (citizenship)</h3>
              <p className="mt-2 text-sm text-almi-text">≥7/12 in every section AND ≥28/48 total. NO banking — miss either and the whole exam is retaken.</p>
              <ul className="mt-3 space-y-1 text-sm">
                {B1C.sections.map((s) => (
                  <li key={s.section} className="flex justify-between">
                    <span className="text-almi-text">{s.section.charAt(0) + s.section.slice(1).toLowerCase()}{s.isEstimate ? " *" : ""}</span>
                    <span className={s.status === "CLEAR" ? "font-semibold text-almi-teal" : "font-semibold text-almi-coral-deep"}>{s.score}/12</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 rounded-lg bg-almi-bg-peach/50 p-2 text-xs text-almi-text">
                Sections ≥7: {B1C.conditions.perSectionFloorMet ? "yes" : "no"} · total ≥28: {B1C.conditions.totalThresholdMet ? "yes" : "no"} →{" "}
                <strong className="text-almi-ink">{B1C.passed ? "pass" : "not yet"}</strong>
              </p>
            </div>

            {/* CELI — parts + band estimate */}
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-almi-coral">CELI · {CELI_B1.examLabel} ({CELI_B1.cefr})</p>
              <h3 className="mt-1 font-semibold text-almi-ink">Two parts, both must clear</h3>
              <p className="mt-2 text-sm text-almi-text">Written and Oral each need their own minimum. Clear one, miss the other → the passed part banks for a year.</p>
              {CELI_B1.verified && (
                <>
                  <ul className="mt-3 space-y-1 text-sm">
                    <li className="flex justify-between"><span className="text-almi-text">Written</span><span className={CELI_B1.written.pass ? "font-semibold text-almi-teal" : "font-semibold text-almi-coral-deep"}>{CELI_B1.written.score}/{CELI_B1.written.max}</span></li>
                    <li className="flex justify-between"><span className="text-almi-text">Oral</span><span className={CELI_B1.oral.pass ? "font-semibold text-almi-teal" : "font-semibold text-almi-coral-deep"}>{CELI_B1.oral.score}/{CELI_B1.oral.max}</span></li>
                  </ul>
                  <p className="mt-3 rounded-lg bg-almi-bg-peach/50 p-2 text-xs text-almi-text">
                    Grade band <strong className="text-almi-ink">{CELI_B1.gradeBand}</strong> (estimate)
                    {CELI_B1.banking ? ` · ${CELI_B1.banking.bankablePart.toLowerCase()} banks 1 year` : ""}
                  </p>
                </>
              )}
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-almi-text-muted">* Writing &amp; speaking are AI criteria estimates — only Siena / Perugia award real results.</p>
        </div>
      </section>

      {/* Honesty differentiators */}
      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-almi-ink">Built to stop you preparing for the wrong exam.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">A2 for the permit, B1 for citizenship</h3>
              <p className="mt-2 text-sm text-almi-text">The single most common mistake. The long-term (EC) residence permit asks for A2; citizenship asks for B1 (Law 132/2018). A requirement is never a guarantee — but preparing for the wrong level wastes a sitting.</p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">CILS ≠ CELI — never blended</h3>
              <p className="mt-2 text-sm text-almi-text">Different universities, sections, and scoring. We keep them on separate engines so a CELI band never leaks into a CILS readout, and B1 Cittadinanza never inherits standard-B1 rules.</p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">The slow clock, stated plainly</h3>
              <p className="mt-2 text-sm text-almi-text">CELI results can take up to ~3 months and the certificate up to ~4–5 — a real planning fact competitors hide. We tell you, so your certificate is valid when your application needs it.</p>
            </div>
            <div className="rounded-2xl border border-almi-line bg-almi-paper p-6">
              <h3 className="font-semibold text-almi-ink">100% original items</h3>
              <p className="mt-2 text-sm text-almi-text">Both universities publish past papers — copying them is easy, which is exactly why we never do. B1 Cittadinanza practice lives in the exam&apos;s own world: poste, comune, prefettura.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
