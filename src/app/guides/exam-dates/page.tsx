import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "CILS & CELI sitting windows — how the calendars work",
  description: "When CILS and CELI are typically offered through the year, and how to read the official calendars. We describe the pattern honestly and never invent specific dates.",
  alternates: { canonical: canonical("/guides/exam-dates") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide · dates" title="CILS &amp; CELI sitting windows" footer={<p className="mt-6 text-xs text-almi-text-muted">Sessions and dates are set by each awarding university and can change year to year — always confirm the exact date and registration deadline with your exam centre and the official calendar. We do not print specific dates we have not verified.</p>}>
      <p>Both exams run on fixed sessions, not on demand — so the sitting window, not just your readiness, decides when you can certify.</p>

      <h2>The usual pattern</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>CILS (Siena):</strong> several sessions across the year, with the citizenship-level (B1 Cittadinanza) sittings on their own dedicated calendar.</li>
        <li><strong>CELI (Perugia):</strong> main general sessions typically clustered around <strong>June and November</strong>, with immigration-focused (CELI Impatto / CELI 1–2 immigrati) sittings on their own schedule.</li>
      </ul>
      <p>Treat these as the shape of the year, not a booking date. Registration usually closes weeks before a sitting, so read the deadline as well as the exam date.</p>

      <h2>Plan the whole timeline</h2>
      <p>Pick a session, then work backwards through the registration deadline — and, for CELI, forward through the result wait. See the <Link href="/guides/celi-results-timeline">CELI slow-clock guide</Link> so your certificate is valid when your application needs it.</p>

      <p className="pt-2"><Link href="/exams-in/argentina">Where to sit the exams by country →</Link></p>
    </GuideShell>
  );
}
