// AlmiItalian — ops/health endpoint for AlmiMonitor (built from day one, network pattern).
// Counts only, no PII. Reports engine readiness + live item-bank count (null until Phase 2 seed).
import { NextResponse } from "next/server";
import { CELI_CONFIG } from "@/lib/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  // Which CELI levels have official CVCL numerics locked vs PENDING-FOUNDER-CHECK.
  const celiVerified = Object.entries(CELI_CONFIG).filter(([, c]) => c.verified).map(([k]) => k);
  const celiPending = Object.entries(CELI_CONFIG).filter(([, c]) => !c.verified).map(([k]) => k);

  // Live DB count is best-effort: import lazily so a missing DATABASE_URL never 500s the health check.
  let dbItemsActive: number | null = null;
  let dbError: string | null = null;
  try {
    const { prisma } = await import("@/lib/prisma");
    dbItemsActive = await prisma.italianItem.count();
  } catch (e) {
    dbError = e instanceof Error ? e.message : "db unreachable";
  }

  return NextResponse.json(
    {
      ok: true,
      product: "AlmiItalian",
      engines: ["cils-standard", "cils-b1c", "celi"], // three distinct paths, never blended
      celi: { verified: celiVerified, pending: celiPending }, // numerics locked vs PENDING
      dbItemsActive, // null until Phase 2 seed lands
      dbError,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
