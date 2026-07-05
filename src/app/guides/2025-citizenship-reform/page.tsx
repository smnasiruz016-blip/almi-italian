import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical, DECREE_CITATION, TEST_NOT_CITIZENSHIP } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "The 2025 Italian citizenship reform, honestly",
  description: "What DL 36/2025 (converted by L. 74/2025) changed: a roughly two-generation limit on citizenship by descent, the 27 March 2025 filing cutoff, and a new out-of-quota work door for descendants — with the pending Constitutional Court review we do not predict.",
  alternates: { canonical: canonical("/guides/2025-citizenship-reform") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · law" title="The 2025 citizenship reform, honestly" footer={<p className="mt-6 text-xs text-almi-text-muted">{DECREE_CITATION}</p>}>
      <p>Italy changed its citizenship rules in 2025. Here is what is settled, what is new, and what is still open — stated, never predicted.</p>

      <h2>A roughly two-generation limit</h2>
      <p>DL 36/2025 (converted by <strong>Law 74/2025</strong>) tightened citizenship by descent (<em>jure sanguinis</em>) toward those with a parent or grandparent born in Italy. Applications filed <strong>before 27 March 2025</strong> are generally assessed under the earlier rules; filings after that date fall under the new ones.</p>

      <h2>A new work door for descendants</h2>
      <p>A November 2025 interministerial decree names seven countries of historic Italian emigration whose Italian-descendant citizens can enter Italy for work <strong>outside the flow-decree quotas</strong>. See the <Link href="/italian-descent">descent corridor</Link> for the country list and the honest note on the four countries that were proposed but left out.</p>

      <h2>What&apos;s still open</h2>
      <p>A review of the reform is pending before the <strong>Constitutional Court</strong>. We state that it is pending and do not guess its outcome — any page that claims to know how it will land is guessing.</p>

      <p className="rounded-xl bg-almi-bg-peach/40 p-4 text-sm">{TEST_NOT_CITIZENSHIP}</p>
      <p className="pt-2"><Link href="/guides/reacquire-citizenship-2027">The 2027 reacquisition window →</Link></p>
    </GuideShell>
  );
}
