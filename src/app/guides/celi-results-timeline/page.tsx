import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "CELI's slow clock — plan your certificate in time",
  description: "CELI results can take around 3 months and the paper certificate around 4–5 — a real planning fact. How to time your sitting so the certificate is still valid when your application needs it.",
  alternates: { canonical: canonical("/guides/celi-results-timeline") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · planning" title="CELI's slow clock, planned around">
      <p>The exam is only half the timeline. For CELI, the wait afterwards is long enough that it changes when you should sit — a fact many prep sites skip.</p>

      <h2>The realistic wait</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>Results:</strong> commonly around <strong>3 months</strong> after the sitting.</li>
        <li><strong>Paper certificate:</strong> commonly around <strong>4–5 months</strong>.</li>
      </ul>
      <p>These are typical ranges, not a promise — the awarding body sets the actual dates. Treat them as planning buffers, not guarantees.</p>

      <h2>How to plan backwards</h2>
      <p>Work back from the date your application needs the certificate in hand, add the 4–5 month buffer, and that&apos;s the latest sensible sitting. If a deadline is close, a faster-turnaround alternative (or CILS, on its own timeline) may fit better — the point is to choose with the clock visible, not after it.</p>

      <p className="pt-2"><Link href="/guides/exam-dates">CILS &amp; CELI sitting windows →</Link> · <Link href="/practice">Practise while you wait for a seat →</Link></p>
    </GuideShell>
  );
}
