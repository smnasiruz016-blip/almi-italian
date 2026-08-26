// GET /api/cron/cleanup-audio — delete learner speaking clips past their retention window.
//
// Learner audio is personal data and it is also storage we pay for. It exists so a learner can
// hear their own attempt back; after that it is a liability with a bill attached. The
// transcript and the estimate stay — those are the useful part — and the clip goes.
//
// Owner-guarded the same way /api/admin/stats is: ADMIN_API_SECRET via x-admin-secret, or
// Vercel's own cron header. Fail-closed — an unset secret authorises nobody.
//
// Only ORALE rows have an audioUrl, and the ASCOLTO listening clips are NOT touched: those are
// static files in public/audio/ascolto/, shared by everyone, and nothing here can reach them.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteAudio, isBlobConfigured } from "@/lib/storage/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How long a learner keeps their own recording. */
const RETENTION_DAYS = 30;
/** Bounded per run so one invocation cannot run long or delete unboundedly. */
const MAX_PER_RUN = 200;

export async function GET(req: Request): Promise<NextResponse> {
  const secret = process.env.ADMIN_API_SECRET;
  const bySecret = Boolean(secret) && req.headers.get("x-admin-secret") === secret;
  // Vercel signs its own cron invocations; accept those too so the schedule needs no secret.
  const byCron = Boolean(process.env.CRON_SECRET) && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!bySecret && !byCron) {
    console.warn(JSON.stringify({ evt: "refusal", route: "/api/cron/cleanup-audio", status: 401, reason: secret ? "bad-secret" : "secret-unset" }));
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json({ ok: true, skipped: "no blob store configured", deleted: 0 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const stale = await prisma.aiEvaluation.findMany({
    where: { skill: "ORALE", audioUrl: { not: null }, createdAt: { lt: cutoff } },
    select: { id: true, audioUrl: true },
    take: MAX_PER_RUN,
  });

  let deleted = 0;
  for (const row of stale) {
    await deleteAudio(row.audioUrl!);
    // Cleared per row, immediately: a crash on the next one cannot undo this one, and a URL
    // that no longer resolves must not stay on the row pretending to.
    await prisma.aiEvaluation.update({ where: { id: row.id }, data: { audioUrl: null } });
    deleted++;
  }

  return NextResponse.json({ ok: true, deleted, retentionDays: RETENTION_DAYS, remaining: stale.length === MAX_PER_RUN ? "more" : "none" });
}
