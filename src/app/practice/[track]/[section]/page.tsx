import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasPaidAccess, needsEmailVerification, isBillingEnabled } from "@/lib/access";
import { TRACKS, trackBySlug, sectionBySlug } from "@/lib/practice";
import { itemsFor } from "@/lib/items";
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

  const items = itemsFor(t.exam, t.level, s.code);
  const user = await getCurrentUser();
  const needsPaid = s.kind === "estimate"; // AI Writing/Speaking → paid; objective skills are free
  const paid = hasPaidAccess(user);

  // FOUNDER GATE (trio, screenshot-confirmed): any logged-in non-subscribed user gets no
  // practice of ANY kind pre-checkout — funnel to the trial checkout on /account. Logged-out
  // visitors keep the public sign-in surface below (SEO untouched). Owner/paid pass through.
  if (user && !paid) redirect("/account");

  const header = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-almi-coral">{t.label} · {s.label}</p>
      <h1 className="mt-3 text-3xl font-bold text-almi-ink">Practice set</h1>
      <p className="mt-3 text-almi-text">
        This is a practice read-out, not an official result — only Siena (CILS) / Perugia (CELI) award a certificate.
      </p>
    </>
  );

  // Gate (network standard): signed out → sign-in prompt; an AI Writing/Speaking skill without a
  // paid subscription → subscribe gate; objective skills are free to any signed-in user.
  let body: ReactNode;
  if (!user) {
    body = (
      <div className="mt-8 rounded-2xl border border-almi-line bg-almi-paper p-6">
        <h2 className="text-lg font-semibold text-almi-ink">Sign in to practise</h2>
        <p className="mt-2 text-sm text-almi-text">Create your account and start a 7-day free trial — card saved, not charged — to practise CILS and CELI, then $12/month.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/signup" className="inline-flex rounded-full bg-almi-coral px-6 py-2.5 font-semibold text-almi-ink hover:bg-almi-coral-deep hover:text-almi-on-dark">Create free account</Link>
          <Link href="/login" className="inline-flex rounded-full border border-almi-line px-6 py-2.5 font-medium text-almi-ink hover:border-almi-coral">Log in</Link>
        </div>
      </div>
    );
  } else if (needsPaid && !paid) {
    // Subscribed but unverified → prompt verification, not another subscribe.
    body = needsEmailVerification(user) ? (
      <div className="mt-8"><EmailVerifyBanner email={user.email} /></div>
    ) : (
      <PracticeGate billingLive={isBillingEnabled()} />
    );
  } else if (items.length === 0) {
    body = (
      <div className="mt-8 rounded-2xl border border-dashed border-almi-line bg-almi-paper p-6 text-almi-text">
        Items for this section arrive in the next batch. The scoring engine and format are already live.
      </div>
    );
  } else if (s.kind === "estimate") {
    body = <div className="mt-8"><PracticeComposer items={items} sectionLabel={s.label} trackLabel={t.label} honesty={t.honesty} /></div>;
  } else {
    const celiCfg = t.exam === "CELI" ? CELI_CONFIG[t.level as CeliLevel] : null;
    const celiContext = celiCfg
      ? `That raw score is one component of the CELI Written part — the whole Written part needs ≥${celiCfg.writtenMin}/${celiCfg.writtenMax}, and the certificate also needs the Oral part ≥${celiCfg.oralMin}/${celiCfg.oralMax} on the same sitting. The A–E grade is an estimate.`
      : null;
    body = (
      <div className="mt-8">
        <PracticeRunner items={items} scale={t.scale} honesty={t.honesty} modelNote={t.modelNote} celiContext={celiContext} sectionLabel={s.label} trackLabel={t.label} />
      </div>
    );
  }

  return <main className="mx-auto max-w-3xl px-6 py-12">{header}{body}</main>;
}
