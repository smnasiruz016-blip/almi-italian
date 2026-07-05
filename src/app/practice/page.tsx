import type { Metadata } from "next";
import Link from "next/link";
import { Article } from "@/components/Article";
import { canonical } from "@/lib/site";

export const metadata: Metadata = {
  title: "Practice — AlmiItalian",
  description: "Choose your Italian exam and level to practise. CILS and CELI, each on its own real scale.",
  alternates: { canonical: canonical("/practice") },
};

// Phase-1 placeholder: the exam pickers + section runners land in Phase 2 (item bank Batch 1).
const EXAMS = [
  { name: "CILS B1 Cittadinanza", note: "Citizenship module — all-or-nothing (≥7 each section AND ≥28/48). Flagship.", flag: true },
  { name: "CILS standard (A1–C2)", note: "Five sections /20, floor 11 each, capitalization banking.", flag: false },
  { name: "CELI (Impatto–5)", note: "Written + Oral parts, both must clear; A–E grade-band estimate.", flag: false },
];

export default function Page() {
  return (
    <Article
      eyebrow="Practice"
      title="Choose your Italian exam"
      lede="CILS and CELI are scored differently, so we keep them apart. Pick the exam you're actually sitting — the practice sets arrive with the item bank."
    >
      <div className="not-prose grid gap-4 sm:grid-cols-3">
        {EXAMS.map((e) => (
          <div key={e.name} className={`rounded-2xl border p-5 ${e.flag ? "border-2 border-almi-coral" : "border-almi-line"} bg-almi-paper`}>
            <h3 className="font-semibold text-almi-ink">{e.name}</h3>
            <p className="mt-2 text-sm text-almi-text">{e.note}</p>
            <p className="mt-3 text-xs font-medium text-almi-text-muted">Practice sets coming soon</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-almi-text-muted">
        Not sure which exam or level you need? Remember: the long-term permit is A2, citizenship is B1 —{" "}
        <Link href="/about" className="text-almi-coral hover:underline">read the honest guide</Link>.
      </p>
    </Article>
  );
}
