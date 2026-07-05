import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing — AlmiItalian",
  description:
    "Simple, honest pricing: $12/month with a 7-day free trial, cancel anytime. CILS and CELI practice, each on its own real scale, and 100% original material.",
  alternates: { canonical: canonical("/pricing") },
};

const INCLUDED = [
  "CILS and CELI practice — each on its own real scale, never mixed",
  "CILS B1 Cittadinanza flagship: all-or-nothing readout (≥7 each section AND ≥28/48)",
  "CILS standard capitalization: the sections you'd bank today vs retake",
  "CELI two-part readout with A–E grade-band estimate (labelled estimate)",
  "100% original material — flat monthly price, cancel in one click",
];

export default function Page() {
  return (
    <Article
      eyebrow="Pricing"
      title="Simple, honest pricing"
      lede="$12/month — 7-day free trial, cancel anytime."
    >
      <ul className="space-y-2">
        {INCLUDED.map((li) => (
          <li key={li} className="flex gap-2"><span className="text-almi-teal">✓</span>{li}</li>
        ))}
      </ul>
      <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-7 py-3 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">
        Practise free
      </Link>
      <p className="text-sm text-almi-text-muted">
        Billing is handled securely at checkout. Prices shown in USD; your bank may convert to your local currency.
      </p>
    </Article>
  );
}
