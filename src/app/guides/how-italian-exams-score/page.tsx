import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical, TWO_EXAMS_LINE } from "@/lib/seo/content";
import { CILS_STANDARD_FLOOR, CILS_STANDARD_SECTION_MAX, CILS_B1C_FLOOR, CILS_B1C_TOTAL_FLOOR, CILS_B1C_TOTAL_MAX } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "How Italian exams are scored — four philosophies compared",
  description: "Four ways a language exam can decide a pass: JLPT's sectional floors, TOPIK's total-only, CILS's floors-plus-banking, and CELI's two-parts-plus-band. Understand the scale before you sit — no surprises.",
  alternates: { canonical: canonical("/guides/how-italian-exams-score") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · scoring" title="Four scoring philosophies, side by side">
      <p>Two exams can test the same level and still decide a pass completely differently. Knowing which philosophy you&apos;re under changes how you prepare. {TWO_EXAMS_LINE}</p>

      <div className="space-y-3">
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          <p className="font-semibold text-almi-ink">CILS standard — floors + banking</p>
          <p className="mt-1 text-sm text-almi-text">5 sections; you need <strong className="text-almi-ink">{CILS_STANDARD_FLOOR}/{CILS_STANDARD_SECTION_MAX}</strong> in each. Sections you clear <strong className="text-almi-ink">capitalise</strong> (bank) for a later sitting — you resit only what you missed.</p>
        </div>
        <div className="rounded-2xl border-2 border-almi-coral bg-almi-paper p-5">
          <p className="font-semibold text-almi-ink">CILS B1 Cittadinanza — all-or-nothing</p>
          <p className="mt-1 text-sm text-almi-text">4 sections, <strong className="text-almi-ink">{CILS_B1C_FLOOR}</strong> in every one <em>and</em> <strong className="text-almi-ink">{CILS_B1C_TOTAL_FLOOR}/{CILS_B1C_TOTAL_MAX}</strong> overall, on one sitting. <strong className="text-almi-ink">No banking.</strong> <Link href="/guides/cils-b1-cittadinanza" className="text-almi-coral hover:underline">Full guide →</Link></p>
        </div>
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          <p className="font-semibold text-almi-ink">CELI — two parts + band</p>
          <p className="mt-1 text-sm text-almi-text">Written and Oral each need their own minimum (a strong one can&apos;t rescue a weak one); the aggregate maps to an A–E band. Clear one part, miss the other → the passed part <strong className="text-almi-ink">banks for a year</strong>.</p>
        </div>
      </div>

      <h2>For contrast — two other systems</h2>
      <p>Japan&apos;s <a href="https://almijapanese.almiworld.com" className="text-almi-coral hover:underline">JLPT</a> uses <strong>sectional floors</strong> — a minimum in each section as well as a total. Korea&apos;s <a href="https://almikorean.almiworld.com" className="text-almi-coral hover:underline">TOPIK</a> is <strong>total-only</strong> — no section minimums, your total alone sets your level. Seeing all four makes the Italian rules concrete: CILS and CELI are their own animals, and B1 Cittadinanza is the strictest of the lot.</p>

      <p className="pt-2"><Link href="/practice">Practise on the real rules →</Link> · <Link href="/guides/capitalizzazione">How banking works →</Link></p>
    </GuideShell>
  );
}
