// POST /api/it/evaluate/scritta — AI estimate for a Produzione scritta task.
//
// ORDER OF CHECKS — deliberate, do not reorder. Every step above the model call is free;
// the model call is the one that spends.
//   1. no session                → 401, nothing loaded
//   2. not entitled              → 402 / 403, nothing loaded, NO tokens
//   3. rate limit                → 429, still no tokens
//   4. load the item SERVER-SIDE by its stable id
//   5. evaluate (the evaluator guards itself again — see lib/ai/entitlement.ts)
//
// The client sends an item id and its own text. It never sends the task, the criteria, the
// exam, the level or the scale: those are facts about the ITEM and the server owns them, the
// same rule /api/it/submit already keeps. A client that could supply its own rubric could ask
// to be marked against an easier one.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkAiEntitlement } from "@/lib/ai/entitlement";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { getItemByStableId } from "@/lib/item-id";
import { evaluate } from "@/lib/ai/evaluate";
import { LabelledEstimateSchema } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Long enough for a real learner response, short enough that nobody can post a novel and
 *  bill us for reading it. */
const MAX_RESPONSE_CHARS = 6_000;

type Body = { itemId?: string; response?: string };

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // BEFORE anything is loaded and long before anything is spent.
  const refusal = await checkAiEntitlement(user.id);
  if (refusal) {
    return NextResponse.json(
      { ok: false, error: refusal.error, upgradeUrl: refusal.upgradeUrl },
      { status: refusal.status },
    );
  }

  const limited = limitByClient("aiScritta", req);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const text = typeof body.response === "string" ? body.response.trim() : "";
  if (!text) return NextResponse.json({ ok: false, error: "Nothing to evaluate." }, { status: 400 });
  if (text.length > MAX_RESPONSE_CHARS) {
    return NextResponse.json({ ok: false, error: "That response is too long to evaluate." }, { status: 413 });
  }

  const item = typeof body.itemId === "string" ? getItemByStableId(body.itemId) : undefined;
  if (!item) return NextResponse.json({ ok: false, error: "Unknown item" }, { status: 404 });
  if (item.section !== "SCRITTA") {
    return NextResponse.json({ ok: false, error: "That item is not a Produzione scritta task." }, { status: 400 });
  }

  const p = item.payload as { task?: string; criteria?: string[]; minWords?: number; maxWords?: number };
  const result = await evaluate({
    userId: user.id,
    skill: "SCRITTA",
    exam: item.exam,
    level: item.level,
    criteria: Array.isArray(p.criteria) ? p.criteria : [],
    task: String(p.task ?? ""),
    response: text,
    minWords: p.minWords,
    maxWords: p.maxWords,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 502 });
  }

  // Validated on the way IN as well as the way out: a row that does not carry its estimate
  // label must never exist, so it cannot be read back and rendered unlabelled later.
  const stored = LabelledEstimateSchema.parse(result.estimate);
  await prisma.aiEvaluation.create({
    data: {
      userId: user.id,
      skill: "SCRITTA",
      stableItemId: body.itemId!,
      exam: item.exam,
      level: item.level,
      section: item.section,
      response: text,
      evaluation: stored,
      labelKind: stored.labelKind,
      model: "claude-sonnet-4-6",
      costCents: result.costCents,
    },
  });

  return NextResponse.json({ ok: true, estimate: stored });
}
