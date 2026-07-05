import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical, TWO_EXAMS_LINE } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "CILS vs CELI vs PLIDA vs CertIt — honest comparison",
  description: "Italy has four CEFR-accredited language certifications. What each is, who awards it, and where it's used — stated honestly. We build practice only for CILS and CELI, and we tell you why the others exist.",
  alternates: { canonical: canonical("/guides/cils-vs-celi") },
};

const ROWS = [
  { name: "CILS", body: "Università per Stranieri di Siena", note: "Two scoring worlds: CILS standard (5 sections, floors + banking) and the all-or-nothing CILS B1 Cittadinanza. We build practice for CILS.", ours: true },
  { name: "CELI", body: "Università per Stranieri di Perugia (CVCL)", note: "Two parts (Written + Oral), each with its own minimum, mapped to an A–E band; a passed part banks for a year. We build practice for CELI.", ours: true },
  { name: "PLIDA", body: "Società Dante Alighieri", note: "A CEFR-accredited certification widely available through Dante Alighieri committees abroad. Accepted for many of the same purposes; we do not build practice for it.", ours: false },
  { name: "CertIt (CERT.IT)", body: "Università Roma Tre", note: "A CEFR-accredited certification from Roma Tre. Less common in the citizenship/residence context; we do not build practice for it.", ours: false },
];

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · comparison" title="CILS vs CELI vs PLIDA vs CertIt">
      <p>Four Italian certifications are recognised against the CEFR. They are genuinely different products — here is the honest map. {TWO_EXAMS_LINE}</p>

      <div className="space-y-3">
        {ROWS.map((r) => (
          <div key={r.name} className={`rounded-2xl border bg-almi-paper p-5 ${r.ours ? "border-2 border-almi-coral" : "border-almi-line"}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-almi-ink">{r.name}</p>
              {r.ours && <span className="rounded-full bg-almi-bg-peach px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-almi-coral-deep">Practice here</span>}
            </div>
            <p className="text-xs text-almi-text-muted">{r.body}</p>
            <p className="mt-2 text-sm text-almi-text">{r.note}</p>
          </div>
        ))}
      </div>

      <h2>Which to pick</h2>
      <p>For citizenship and residence, CILS and CELI are the most commonly sat, which is why we build honest practice for those two — and keep them on separate engines so their scales never blur. Whichever you choose, the accepting authority decides what it accepts; confirm before you book.</p>

      <p className="pt-2"><Link href="/guides/how-italian-exams-score">How each one is scored →</Link></p>
    </GuideShell>
  );
}
