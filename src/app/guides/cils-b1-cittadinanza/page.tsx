import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical } from "@/lib/seo/content";
import { CILS_B1C_SECTION_MAX, CILS_B1C_FLOOR, CILS_B1C_TOTAL_MAX, CILS_B1C_TOTAL_FLOOR } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "CILS B1 Cittadinanza — the all-or-nothing rules, explained",
  description: `The CILS B1 Cittadinanza exam has 4 sections out of ${CILS_B1C_SECTION_MAX}, ${CILS_B1C_TOTAL_MAX} points in total, with no banking. Siena does not publish a pass mark for this module — what that means, the benchmark we use, and the administrative-Italian register it tests.`,
  alternates: { canonical: canonical("/guides/cils-b1-cittadinanza") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · flagship" title="CILS B1 Cittadinanza — all-or-nothing">
      <p>Italy&apos;s citizenship language step is a specific exam, not the ordinary B1. It is built to be passed <strong>whole</strong>, on one sitting.</p>

      <h2>The two conditions — both, together</h2>
      <p>There are 4 sections, each scored out of <strong>{CILS_B1C_SECTION_MAX}</strong>. To pass you must:</p>
      <ul className="list-disc space-y-1 pl-5">
        <li>reach <strong>{CILS_B1C_FLOOR}/{CILS_B1C_SECTION_MAX}</strong> in <strong>every</strong> section (Ascolto, Lettura, Produzione scritta, Produzione orale), <em>and</em></li>
        <li>reach <strong>{CILS_B1C_TOTAL_FLOOR}/{CILS_B1C_TOTAL_MAX}</strong> in total.</li>
      </ul>
      <p className="rounded-lg border border-dashed border-almi-line bg-almi-bg-peach/30 p-3 text-sm"><strong>Whose numbers these are.</strong> Siena publishes the {CILS_B1C_TOTAL_MAX}-point total for this module (4 sections × {CILS_B1C_SECTION_MAX}) but <strong>does not publish a pass mark or a per-section minimum</strong> for it — not in the criteria document, the syllabus or the FAQ. The {CILS_B1C_FLOOR}/{CILS_B1C_SECTION_MAX} floor above is <strong>our practice benchmark</strong>, derived from the rule Siena does publish for standard CILS B1: 11/20 per skill, 55 to pass out of 100. Treat it as a target to train against, not as the exam&apos;s own threshold.</p>
      <p>Miss <strong>either</strong> condition and the whole exam is retaken. There is <strong>no capitalizzazione</strong> here — unlike CILS standard, a strong section cannot be banked and a weak one cannot be carried. That is the trap most people miss: you can be well over {CILS_B1C_TOTAL_FLOOR} in total and still fail because one section sat a point under {CILS_B1C_FLOOR}.</p>

      <h2>Why the register matters</h2>
      <p>B1 Cittadinanza lives in the world of Italian administration — the <em>poste</em>, the <em>comune</em>, the <em>prefettura</em>, tenancy and utility letters. Writing that is grammatically fine but slips out of that administrative register is exactly what pushes the Produzione scritta section under the floor. Practising general B1 is not the same as practising this.</p>

      <h2>How we show it</h2>
      <p>Our practice keeps this exam on its own engine: four sections out of {CILS_B1C_SECTION_MAX}, both conditions shown every time, and no banking offered. Writing and speaking are labelled estimates — writing from your text, speaking from an automatic transcript of your recording — and only the University for Foreigners of Siena awards the real result.</p>
      <p className="pt-2"><Link href="/practice">Practise CILS B1 Cittadinanza →</Link> · <Link href="/guides/a2-or-b1">Is it A2 or B1 you actually need?</Link></p>
    </GuideShell>
  );
}
