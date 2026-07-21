// AlmiItalian — ops/health endpoint for AlmiMonitor (counts only, no PII).
// DB-optional — never 500s, so a deploy can be verified before Neon is wired.
//
// ⚠️ ITEM COUNT COMES FROM THE JSON BUNDLE, NOT THE DATABASE — because that is where
// this product's items actually live. The practice runner serves from
// src/data/items-batch1.json (imported as BANK in @/lib/items); NOTHING in the request
// path reads prisma.italianItem.
//
// This endpoint used to report prisma.italianItem.count() as `dbItemsActive`. That table
// is a Phase-2 seed target that can sit empty or lag the bundle, so it read 0/stale while
// 270 items shipped and served fine. Nothing threw — the number was simply false. And this
// is the endpoint AlmiMonitor attributes health from, so that false 0 read as "no content".
//
// Fix (same as almi-swedish/almi-danish): count at the source the runner actually reads,
// and drop the DB item count entirely — NOT "seed the DB to match", which is a second
// source of truth that lies the moment a bundle edit outruns the seeder. The DB still
// answers for what it owns (approved reviews).
//
// Breakdown key = EXAM.LEVEL.SECTION. Italian has no single "skill" axis; the three engines
// (CILS_STANDARD / CILS_B1C / CELI) are never blended, so exam leads the key. Grouping BANK
// directly guarantees itemsActive === the bundle total (no registry can undercount it).

import { NextResponse } from "next/server";
import { BANK } from "@/lib/items";
import { CELI_CONFIG } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  // Disk-sourced counts — the bank the runner actually serves from.
  const items: Record<string, number> = {};
  for (const it of BANK) {
    const key = `${it.exam}.${it.level}.${it.section}`;
    items[key] = (items[key] ?? 0) + 1;
  }
  const itemsActive = BANK.length;

  // Which CELI levels have official CVCL numerics locked vs PENDING-FOUNDER-CHECK.
  const celiVerified = Object.entries(CELI_CONFIG).filter(([, c]) => c.verified).map(([k]) => k);
  const celiPending = Object.entries(CELI_CONFIG).filter(([, c]) => !c.verified).map(([k]) => k);

  // The DB still answers for what the DB actually owns.
  let approvedReviews: number | null = null;
  let dbError: string | null = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    approvedReviews = await prisma.review.count({ where: { approved: true } });
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db unreachable";
  }

  return NextResponse.json(
    {
      ok: true,
      product: "AlmiItalian",
      engines: ["cils-standard", "cils-b1c", "celi"], // three distinct paths, never blended
      itemsActive,
      items,
      celi: { verified: celiVerified, pending: celiPending }, // numerics locked vs PENDING
      approvedReviews,
      dbError,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
