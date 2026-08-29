import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isBillingEnabled } from "@/lib/access";
import { refuseSection } from "@/lib/section-access";
import { TRACKS, trackBySlug, sectionBySlug } from "@/lib/practice";
import { itemsFor } from "@/lib/items";
import { runnerItemsFor } from "@/lib/item-id";
import { CELI_CONFIG, type CeliLevel } from "@/lib/scoring";
import { PracticeRunner } from "@/components/PracticeRunner";
import { PracticeComposer } from "@/components/PracticeComposer";
import { PracticeGate } from "@/components/PracticeGate";
import { EmailVerifyBanner } from "@/components/EmailVerifyBanner";
import { canonical } from "@/lib/site";

export function generateStaticParams() {
  return TRACKS.flatMap((t) => t.sections.map((s) => ({ track: t.slug, section: s.slug })));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ track: string; section: string }> }): Promise<Metadata> {
  const { track, section } = await params;
  const t = trackBySlug(track);
  const s = t && sectionBySlug(t, section);
  if (!t || !s) return {};
  return {
    title: `${t.label} — ${s.label} practice`,
    description: `Practise ${t.label} ${s.label} with real items and an honest, engine-scaled read-out. Only the official sitting awards a result.`,
    alternates: { canonical: canonical(`/practice/${track}/${section}`) },
  };
}

export default async function Page({ params }: { params: Promise<{ track: string; section: string }> }) {
  const { track, section } = await params;
  const t = trackBySlug(track);
  const s = t && sectionBySlug(t, section);
  if (!t || !s) notFound();

  // Authored items stay on the server. `served` is the same set with every answer key removed —
  // it is the only thing that crosses into a client component, and its TYPE has no key fields,
  // so handing the authored bank to the runner by mistake does not compile.
  const items = itemsFor(t.exam, t.level, s.code);
  const served = runnerItemsFor(items);
  const user = await getCurrentUser();

  // ENTITLEMENT (revised 2026-08-31) — the page and /api/it/submit MUST agree about who is
  // refused, so both call the same function in lib/section-access.ts and neither decides for
  // itself. It reads nothing and writes nothing, so a Server Component may call it on render.
  //
  // `s.kind` is no longer passed: the 3-day grant on objective sections was withdrawn, so
  // every section asks the same question. Owner and comp doors are unchanged — both are
  // inside hasPaidAccess(), which refuseSection() checks first.
  const refusal = refuseSection(user);

  const header = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral-text">{t.label} · {s.label}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Practice set</h1>
      <p className="mt-3 text-almi-text">
        This is a practice read-out, not an official result — only Siena (CILS) / Perugia (CELI) award a certificate.
      </p>
    </>
  );

  // One branch per refusal reason, in the same order lib/section-access.ts decides them.
  let body: ReactNode;
  if (refusal === "SIGN_IN") {
    body = (
      <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
        <h2 className="text-lg font-semibold text-almi-ink">Sign in to practise</h2>
        <p className="mt-2 text-sm text-almi-text">
          Practice is part of AlmiItalian Pro: a 7-day free trial — your card is saved, not charged — then $12/month,
          cancel anytime. Reading the free <Link href="/learn" className="underline">study guides</Link> needs no
          account at all.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep">Create an account</Link>
          <Link href="/login" className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral">Log in</Link>
        </div>
      </div>
    );
  } else if (refusal === "VERIFY_EMAIL") {
    body = <div className="mt-8"><EmailVerifyBanner email={user!.email} /></div>;
  } else if (refusal) {
    // PAYWALL — the only refusal left that a subscription fixes. A subscriber who simply has
    // not verified yet is caught by VERIFY_EMAIL above, so this is never "subscribe" shown to
    // someone who already has.
    body = <PracticeGate billingLive={isBillingEnabled()} />;
  } else if (items.length === 0) {
    body = (
      <div className="mt-8 rounded-2xl border border-dashed border-almi-line bg-almi-paper p-6 text-almi-text">
        Items for this section arrive in the next batch. The scoring engine and format are already live.
      </div>
    );
  } else if (s.kind === "estimate") {
    body = <div className="mt-8"><PracticeComposer items={served} sectionLabel={s.label} trackLabel={t.label} honesty={t.honesty} /></div>;
  } else {
    const celiCfg = t.exam === "CELI" ? CELI_CONFIG[t.level as CeliLevel] : null;
    const celiContext = celiCfg
      ? `That raw score is one component of the CELI Written part — the whole Written part needs ≥${celiCfg.writtenMin}/${celiCfg.writtenMax}, and the certificate also needs the Oral part ≥${celiCfg.oralMin}/${celiCfg.oralMax} on the same sitting. The A–E grade is an estimate.`
      : null;
    body = (
      <div className="mt-8">
        {/* No `scale` prop: the scaled read-out and its CLEAR/BORDERLINE/BELOW verdict are
            computed by /api/it/submit from the engine, server-side, and arrive with the marks. */}
        <PracticeRunner items={served} honesty={t.honesty} modelNote={t.modelNote} celiContext={celiContext} sectionLabel={s.label} trackLabel={t.label} />
      </div>
    );
  }

  return <main className="mx-auto max-w-3xl px-6 py-12">{header}{body}</main>;
}
