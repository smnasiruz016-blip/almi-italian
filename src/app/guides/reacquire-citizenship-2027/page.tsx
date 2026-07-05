import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical, DECREE_CITATION } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "Reacquiring Italian citizenship — the 2027 window",
  description: "A declaration window runs to 31 December 2027 for certain former Italian citizens and their descendants to reacquire citizenship. The honest facts, the deadline, and where the language step fits.",
  alternates: { canonical: canonical("/guides/reacquire-citizenship-2027") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · law" title="Reacquisition — the 31 December 2027 window" footer={<p className="mt-6 text-xs text-almi-text-muted">{DECREE_CITATION} This page summarises a deadline; confirm eligibility and procedure with the competent Italian authority or consulate.</p>}>
      <p>Alongside the 2025 reform, a time-limited <strong>declaration window</strong> was opened for certain people who lost or never formalised Italian citizenship to reacquire it.</p>

      <h2>The deadline</h2>
      <p>The window runs to <strong>31 December 2027</strong>. It is a declaration route with specific eligibility (tied to a parent/grandparent-Italian line and other conditions) — it is not automatic, and it is not open to everyone. Because it is a hard cut-off, the practical advice is simple: if you may qualify, check eligibility early rather than near the end.</p>

      <h2>Where the language step fits</h2>
      <p>Reacquisition routes are about status, not a language exam — but if your wider plan also involves naturalisation or long-term residence, the language levels still apply (B1 for citizenship, A2 for the long-term permit). See <Link href="/guides/a2-or-b1">A2 or B1?</Link> so you prepare for the right one.</p>

      <p className="pt-2"><Link href="/guides/2025-citizenship-reform">The full 2025 reform explainer →</Link></p>
    </GuideShell>
  );
}
