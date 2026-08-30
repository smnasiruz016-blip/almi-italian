// POST /api/it/evaluate/orale — AI estimate for a Produzione orale task.
// multipart { itemId, audio, durationSeconds }
//
// ORDER OF CHECKS — deliberate, do not reorder:
//   1. no session          → 401
//   2. NOT ENTITLED        → 402 / 403, BEFORE THE UPLOAD
//   3. rate limit          → 429
//   4. size / type checks  → 400, still nothing stored
//   5. load the item server-side
//   6. store the clip (Blob)
//   7. transcribe (Whisper — metered)
//   8. evaluate (Anthropic — metered; guards itself again)
//
// STEP 2 IS BEFORE STEP 6 ON PURPOSE. An unpaid user must not be able to make us STORE a
// file, not just to make us score one: storage is a bill too, and an open upload endpoint is
// an open upload endpoint whatever it refuses to do afterwards.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkAiEntitlement } from "@/lib/ai/entitlement";
import { logRefusal } from "@/lib/observability";
import { limitByClient, tooManyRequests } from "@/lib/rate-limit";
import { getItemByStableId } from "@/lib/item-id";
import { putAudio, isBlobConfigured } from "@/lib/storage/blob";
import { transcribeAudio, CONFIDENCE_REVIEW_THRESHOLD } from "@/lib/ai/transcribe";
import { recordTranscriptionCost } from "@/lib/ai/anthropic-client";
import { evaluate } from "@/lib/ai/evaluate";
import { LabelledEstimateSchema } from "@/lib/ai/schemas";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ~2 minutes of webm/opus. A speaking task is under a minute; anything far past that is not
 *  an exam answer, and we pay per minute to find out. */
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const MAX_DURATION_SECONDS = 300;

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // BEFORE the upload. See the header. Includes the TRIAL CAP, so a trialing account that has
  // used its speaking allowance is refused before the clip is stored, before Whisper is
  // called, and before any Anthropic token is spent. 402, never 500.
  const refusal = await checkAiEntitlement(user.id, "ORALE");
  if (refusal) {
    logRefusal({ route: "/api/it/evaluate/orale", status: refusal.status, reason: refusal.reason, req, userId: user.id });
    return NextResponse.json(
      { ok: false, error: refusal.error, upgradeUrl: refusal.upgradeUrl },
      { status: refusal.status },
    );
  }

  const limited = limitByClient("aiOrale", req);
  if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ ok: false, error: "No recording received." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ ok: false, error: "That recording is too long." }, { status: 413 });
  }
  const durationSeconds = Math.min(MAX_DURATION_SECONDS, Number(form.get("durationSeconds") ?? 0) || 0);

  const itemId = String(form.get("itemId") ?? "");
  const item = itemId ? getItemByStableId(itemId) : undefined;
  if (!item) return NextResponse.json({ ok: false, error: "Unknown item" }, { status: 404 });
  if (item.section !== "ORALE") {
    return NextResponse.json({ ok: false, error: "That item is not a Produzione orale task." }, { status: 400 });
  }

  if (!isBlobConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Speaking feedback is temporarily unavailable. Nothing was charged." },
      { status: 503 },
    );
  }

  const contentType = audio.type || "audio/webm";
  const ext = contentType.includes("mp4") ? "mp4" : "webm";
  let audioUrl: string;
  try {
    const stored = await putAudio(`italian/orale/${user.id}/${itemId}.${ext}`, audio, contentType);
    audioUrl = stored.url;
  } catch (e) {
    console.error("[orale] blob upload failed:", (e as Error).message);
    return NextResponse.json(
      { ok: false, error: "We could not save your recording. Nothing was charged." },
      { status: 503 },
    );
  }

  const transcription = await transcribeAudio({ audio, contentType, filename: `clip.${ext}` });
  if (!transcription.ok) {
    // What OpenAI actually processed, NOT the browser's `durationSeconds`. Usually 0; a 200
    // with an empty transcript is the exception that costs real money.
    await recordTranscriptionCost({
      userId: user.id,
      feature: "orale.transcribe",
      model: "whisper-1",
      durationSeconds: transcription.billedSeconds,
      success: false,
      errorMessage: transcription.error,
    });
    return NextResponse.json(
      { ok: false, error: "We could not read your recording. Nothing was scored." },
      { status: 502 },
    );
  }
  await recordTranscriptionCost({
    userId: user.id,
    feature: "orale.transcribe",
    model: "whisper-1",
    durationSeconds: transcription.durationSeconds || durationSeconds,
    success: true,
  });

  const p = item.payload as { task?: string; criteria?: string[]; speakSeconds?: number };
  const result = await evaluate({
    userId: user.id,
    skill: "ORALE",
    exam: item.exam,
    level: item.level,
    criteria: Array.isArray(p.criteria) ? p.criteria : [],
    task: String(p.task ?? ""),
    response: transcription.text,
    speakSeconds: p.speakSeconds,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 502 });
  }

  // A shaky transcript is FLAGGED, not silently scored: confident feedback about words the
  // learner never said is worse than no feedback.
  // Flag ONLY on a measurement we actually have. An unmeasured transcript is not a bad one, and
  // warning on it would put the notice on every attempt -- which is how a warning stops being read.
  const needsReview = transcription.confidenceKnown && transcription.confidence < CONFIDENCE_REVIEW_THRESHOLD;

  const stored = LabelledEstimateSchema.parse(result.estimate);
  await prisma.aiEvaluation.create({
    data: {
      userId: user.id,
      skill: "ORALE",
      stableItemId: itemId,
      exam: item.exam,
      level: item.level,
      section: item.section,
      response: transcription.text,
      audioUrl,
      transcriptConfidence: transcription.confidence,
      needsReview,
      evaluation: stored,
      labelKind: stored.labelKind,
      model: "claude-sonnet-4-6",
      costCents: result.costCents,
    },
  });

  return NextResponse.json({
    ok: true,
    estimate: stored,
    transcript: transcription.text,
    needsReview,
  });
}
