import type { Metadata } from "next";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "About AlmiItalian",
  description:
    "AlmiItalian is honest CILS and CELI practice: two exam families kept strictly apart on their own real scales, writing and speaking labelled as estimates, 100% original material, and 25% of income pledged to the Shamool Foundation.",
  alternates: { canonical: canonical("/about") },
};

export default function Page() {
  return (
    <Article
      eyebrow="About"
      title="Honest Italian-exam practice, by AlmiWorld"
      lede="One rule across every AlmiWorld product: we tell you the truth. For Italian, that starts with keeping CILS and CELI strictly apart — two different exams, two different scoring systems — and helping you prepare for the one you actually need."
    >
      <p>
        AlmiItalian prepares you for the two ministry-recognised certifiers: <strong>CILS</strong> (Università per Stranieri di
        Siena) and <strong>CELI</strong> (Università per Stranieri di Perugia). They are not interchangeable, and their scoring is
        genuinely different — so we run them on separate engines that never share a scale. CILS standard uses per-section floors
        with capitalization (you bank the sections you pass and retake the rest). CILS B1 Cittadinanza — the citizenship module and
        our flagship — is all-or-nothing: clear every section and the total, or resit the whole exam. CELI is two parts, Written and
        Oral, that must each clear their own minimum, reported as an A–E grade band.
      </p>
      <p>
        Listening, reading and grammar are auto-marked. Writing and speaking are graded by trained raters at the real exam, so we
        mirror the official criteria and label our number an <strong>estimate</strong>, never an official result — only Siena and
        Perugia award those. Every study item is written from scratch; both universities publish past papers, and we never copy
        them.
      </p>
      <p>
        The confusion we exist to fix: the long-term residence permit asks for <strong>A2</strong>, while Italian citizenship asks
        for <strong>B1</strong>. A language requirement is never a guarantee of the outcome — but preparing for the wrong level
        costs a sitting. We keep the levels, the rules and the slow result timelines honest so your certificate is valid when your
        application needs it.
      </p>
      <p>
        <strong>25% of AlmiWorld&apos;s income supports the Shamool Foundation</strong>, a completely free school for children in
        Lahore, Pakistan. Your practice funds real classrooms.
      </p>
    </Article>
  );
}
