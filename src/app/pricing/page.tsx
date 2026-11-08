import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing — AlmiItalian",
  description:
    "Simple, honest pricing: try free for 48 hours, no card. Then $12/month. Cancel anytime. CILS and CELI practice, each on its own real scale, and 100% original material.",
  alternates: { canonical: canonical("/pricing") },
};

const INCLUDED = [
  "CILS and CELI practice — each on its own real scale, never mixed",
  "CILS B1 Cittadinanza flagship: all-or-nothing readout against our ≥7/12 practice benchmark (Siena publishes no pass mark for this module)",
  "CILS standard capitalization: the sections you'd bank today vs retake",
  "CELI two-part readout with A–E grade-band estimate (labelled estimate)",
  "100% original material — flat monthly price, cancel in one click",
  "Every section: Ascolto, Lettura, Analisi, Produzione scritta and orale",
];

export default function Page() {
  return (
    <Article
      eyebrow="Pricing"
      title="Simple, honest pricing"
      lede="Try free for 48 hours, no card. Then $12/month. Cancel anytime."
    >
      <ul className="space-y-2">
        {INCLUDED.map((li) => (
          <li key={li} className="flex gap-2"><span className="text-almi-teal-text">✓</span>{li}</li>
        ))}
      </ul>
      <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep">
        Try free for 48 hours, no card
      </Link>
      <p className="text-sm text-almi-text-muted">
        No card for the free 48 hours. When you unlock, $12 is charged at checkout and then monthly; cancel anytime from
        your account. Already signed up?{" "}
        <Link href="/account" className="font-medium text-almi-link underline">Unlock for $12/month</Link>
      </p>
      <p className="text-sm text-almi-text-muted">
        Billing is handled securely at checkout. Prices shown in USD; your bank may convert to your local currency.
      </p>
    </Article>
  );
}
