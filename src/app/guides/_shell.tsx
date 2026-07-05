import Link from "next/link";
import type { ReactNode } from "react";
import { SHAMOOL_LINE } from "@/lib/seo/content";

// Shared chrome for every /guides page — eyebrow, H1, back-link, Shamool footer.
export function GuideShell({ eyebrow, title, children, footer }: { eyebrow: string; title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">{title}</h1>
      <div className="mt-6 space-y-4 text-almi-text [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-almi-ink [&_strong]:text-almi-ink [&_a]:text-almi-coral hover:[&_a]:underline">
        {children}
      </div>
      {footer}
      <p className="mt-8 rounded-xl bg-almi-bg-peach/40 p-4 text-sm text-almi-text">{SHAMOOL_LINE}</p>
      <p className="mt-4 text-sm"><Link href="/guides" className="text-almi-coral hover:underline">← All guides</Link></p>
    </main>
  );
}
