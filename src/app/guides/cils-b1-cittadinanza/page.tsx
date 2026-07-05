import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical } from "@/lib/seo/content";
import { CILS_B1C_SECTION_MAX, CILS_B1C_FLOOR, CILS_B1C_TOTAL_MAX, CILS_B1C_TOTAL_FLOOR } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "CILS B1 Cittadinanza — the all-or-nothing rules, explained",
  description: `The CILS B1 Cittadinanza exam has 4 sections out of ${CILS_B1C_SECTION_MAX}; you need ${CILS_B1C_FLOOR} in every one AND ${CILS_B1C_TOTAL_FLOOR}/${CILS_B1C_TOTAL_MAX} overall — with no banking. What that really means, and the administrative-Italian register it tests.`,
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
      <p>Miss <strong>either</strong> condition and the whole exam is retaken. There is <strong>no capitalizzazione</strong> here — unlike CILS standard, a strong section cannot be banked and a weak one cannot be carried. That is the trap most people miss: you can be well over {CILS_B1C_TOTAL_FLOOR} in total and still fail because one section sat a point under {CILS_B1C_FLOOR}.</p>

      <h2>Why the register matters</h2>
      <p>B1 Cittadinanza lives in the world of Italian administration — the <em>poste</em>, the <em>comune</em>, the <em>prefettura</em>, tenancy and utility letters. Writing that is grammatically fine but slips out of that administrative register is exactly what pushes the Produzione scritta section under the floor. Practising general B1 is not the same as practising this.</p>

      <h2>How we show it</h2>
      <p>Our practice keeps this exam on its own engine: four sections out of {CILS_B1C_SECTION_MAX}, both conditions shown every time, and no banking offered. Writing and speaking are labelled AI estimates — only the University for Foreigners of Siena awards the real result.</p>
      <p className="pt-2"><Link href="/practice">Practise CILS B1 Cittadinanza →</Link> · <Link href="/guides/a2-or-b1">Is it A2 or B1 you actually need?</Link></p>
    </GuideShell>
  );
}
