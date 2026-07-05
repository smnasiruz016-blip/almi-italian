import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical } from "@/lib/seo/content";
import { CILS_STANDARD_FLOOR, CILS_STANDARD_SECTION_MAX } from "@/lib/scoring";

export const metadata: Metadata = {
  title: "Capitalizzazione — banking CILS sections & CELI parts",
  description: "CILS standard lets you bank the sections you pass; CELI lets you bank a passed part for a year; CILS B1 Cittadinanza banks nothing. How to use banking across sittings without wasting a fee.",
  alternates: { canonical: canonical("/guides/capitalizzazione") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · strategy" title="Capitalizzazione — banking, used well">
      <p>&quot;Capitalizzazione&quot; is the rule that lets you keep what you passed and resit only what you missed. It works differently across the three engines — and in one case it doesn&apos;t exist at all.</p>

      <h2>CILS standard — bank passed sections</h2>
      <p>Reach <strong>{CILS_STANDARD_FLOOR}/{CILS_STANDARD_SECTION_MAX}</strong> in a section and it capitalises: at your next sitting you resit only the sections still under the floor. Strategy: if you&apos;re close everywhere, sit the whole exam; if one section is far behind, it can be worth banking the rest and focusing a resit.</p>

      <h2>CELI — bank a passed part for a year</h2>
      <p>CELI has two parts (Written and Oral). Clear one and miss the other, and the <strong>passed part banks for one year</strong> (two sessions) — you resit only the failed part. Plan the resit inside that window or the banked part expires.</p>

      <h2>CILS B1 Cittadinanza — banks nothing</h2>
      <p>The citizenship exam is the exception: <strong>no capitalizzazione</strong>. Every section floor and the overall total must be met on the <strong>same</strong> sitting, or the whole exam is retaken. Treat it as a single all-or-nothing attempt, not a collect-over-time exam. <Link href="/guides/cils-b1-cittadinanza">Full B1c guide →</Link></p>

      <p className="pt-2"><Link href="/practice">See your banked-today readout →</Link></p>
    </GuideShell>
  );
}
