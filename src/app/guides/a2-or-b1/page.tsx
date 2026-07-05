import type { Metadata } from "next";
import Link from "next/link";
import { GuideShell } from "../_shell";
import { canonical, REQ_NOT_GUARANTEE } from "@/lib/seo/content";

export const metadata: Metadata = {
  title: "A2 or B1? The permit vs citizenship mistake",
  description: "The most common Italian-exam mistake: the EU long-term residence permit asks for A2, Italian citizenship asks for B1. Which exam, which level, and why preparing for the wrong one wastes a sitting.",
  alternates: { canonical: canonical("/guides/a2-or-b1") },
};

export default function Page() {
  return (
    <GuideShell eyebrow="Guide" title="A2 or B1 — which do you actually need?">
      <p>People lose a whole sitting to this one confusion, so here it is plainly.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-almi-line bg-almi-paper p-5">
          <p className="text-sm font-semibold text-almi-coral">Long-term residence permit</p>
          <p className="mt-1 text-2xl font-bold text-almi-ink">A2</p>
          <p className="mt-2 text-sm text-almi-text">The EU long-term residence permit (<em>permesso UE per soggiornanti di lungo periodo</em>) asks for Italian at A2. Meet it with <Link href="/exam/cils-a2/from/argentina">CILS A2</Link> or <Link href="/exam/celi-1-a2/from/argentina">CELI 1 (A2)</Link>.</p>
        </div>
        <div className="rounded-2xl border-2 border-almi-coral bg-almi-paper p-5">
          <p className="text-sm font-semibold text-almi-coral">Citizenship (naturalisation)</p>
          <p className="mt-1 text-2xl font-bold text-almi-ink">B1</p>
          <p className="mt-2 text-sm text-almi-text">Citizenship asks for Italian at B1 — via the all-or-nothing <Link href="/guides/cils-b1-cittadinanza">CILS B1 Cittadinanza</Link> or <Link href="/exam/celi-2-b1/from/argentina">CELI 2 (B1)</Link>.</p>
        </div>
      </div>

      <h2>Why it&apos;s worth getting right</h2>
      <p>A2 and B1 are different exams with different content and different pass rules. Sitting A2 when your file needs B1 (or the reverse) means a wasted fee and a lost month or two. {REQ_NOT_GUARANTEE}</p>

      <p className="pt-2"><Link href="/residence-permit/argentina">Residence-permit route by country →</Link> · <Link href="/citizenship/argentina">Citizenship route by country →</Link></p>
    </GuideShell>
  );
}
