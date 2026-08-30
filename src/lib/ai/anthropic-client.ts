// Anthropic SDK wrapper. Ported from AlmiPTE's src/lib/ai/anthropic-client.ts.
//
// Every AI call goes through getAnthropicClient(). Cost is appended to AICostLedger by
// recordCost() in the CALLER rather than automatically here, so each call site can attach its
// own userId and feature label — and so a caller cannot spend without naming itself.
//
// The key is read from the environment and never from anywhere else. Nobody working on this
// repo holds it; the founder sets ANTHROPIC_API_KEY in Vercel.

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import {
  computeCostCents,
  computeTranscriptionCostCents,
  type Usage,
} from "@/lib/ai/cost";
import type { ModelId, TranscriptionModelId } from "@/lib/ai/models";

let cached: Anthropic | null = null;

/**
 * The client, or a throw.
 *
 * Throwing on a missing key is load-bearing beyond config hygiene: scripts/gates/ai-cost-gate.mts
 * runs with ANTHROPIC_API_KEY deliberately unset, so any path that REACHES this function comes
 * back as a throw rather than a refusal. That is what turns "the guard refused" into positive
 * evidence that the client was never constructed and no tokens were spent.
 */
export function getAnthropicClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 20 || apiKey === "TODO_FOUNDER_PROVIDES") {
    throw new Error("ANTHROPIC_API_KEY missing or invalid — set a real key in Vercel env");
  }
  cached = new Anthropic({ apiKey, maxRetries: 2 });
  return cached;
}

/** Is a real key configured? For fail-closed UI — never for deciding entitlement. */
export function isAiConfigured(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return Boolean(k && k.length >= 20 && k !== "TODO_FOUNDER_PROVIDES");
}

/**
 * Append one Anthropic call to the ledger and return its cost in 1/100 cents.
 *
 * FAILURES ARE RECORDED TOO — and, since 2026-08-30, at their REAL cost rather than at zero.
 *
 * ── WHY THE RULE CHANGED ────────────────────────────────────────────────────
 * The old rule was `input.success ? computeCostCents(...) : 0`, and its stated purpose was
 * "a call that spent nothing costs nothing". That purpose is right. The implementation was
 * only ever correct because "failed" and "spent nothing" had never been seen to come apart:
 * every failure anyone had looked at was a refusal or a missing key, where no request was
 * served and no tokens existed.
 *
 * Then one came apart. Production AICostLedger row 2026-08-28T02:11 — orale.evaluate, HTTP
 * 200 from Anthropic, then a schema parse failure on our side. Tokens were spent; the row
 * said costCents = 0. The learner got nothing and the founder paid for it, and the ledger
 * called it free.
 *
 * So the rule is now what it always meant: COST FOLLOWS THE TOKENS. A refusal, a missing key
 * and a network error before any response still cost zero — because their token counts are
 * zero, which is the honest reason rather than a flag that happened to agree. The `success`
 * column is still written, because "what did we get for it" is a different question from
 * "what did it cost" and the page needs both.
 */
export async function recordCost(input: {
  userId: string | null;
  feature: string;
  model: ModelId;
  usage: Usage;
  success: boolean;
  errorMessage?: string;
}): Promise<number> {
  // Unconditional. Zero tokens cost zero on their own; no flag is consulted.
  const costCents = computeCostCents(input.model, input.usage);
  try {
    await prisma.aICostLedger.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model: input.model,
        inputTokens: input.usage.inputTokens,
        outputTokens: input.usage.outputTokens,
        cacheReadTokens: input.usage.cacheReadTokens ?? 0,
        cacheWriteTokens: input.usage.cacheWriteTokens ?? 0,
        costCents,
        success: input.success,
        errorMessage: input.errorMessage,
      },
    });
  } catch (e) {
    // A ledger write failure must not fail the learner's request. Log and move on.
    console.error("[ai-cost-ledger] insert failed:", e);
  }
  return costCents;
}

/**
 * Whisper into the same ledger. Cost is per SECOND of audio, not per token, so the token
 * columns are 0 — the same shape AlmiPTE uses for its per-minute transcription rows.
 *
 * `durationSeconds` is the SECONDS OPENAI ACTUALLY PROCESSED, and the caller owes it that
 * rather than whatever the browser claimed the clip was. Whisper has its own served-then-
 * failed shape: an HTTP 200 whose transcript is empty ("The recording produced no speech")
 * is a request OpenAI ran and billed, and the old code recorded it at zero for the same
 * reason the Anthropic path did. See transcribeAudio's `billedSeconds`.
 */
export async function recordTranscriptionCost(input: {
  userId: string | null;
  feature: string;
  model: TranscriptionModelId;
  durationSeconds: number;
  success: boolean;
  errorMessage?: string;
}): Promise<number> {
  // Unconditional, like the token path above. Zero seconds processed costs zero.
  const costCents = computeTranscriptionCostCents(input.model, input.durationSeconds);
  try {
    await prisma.aICostLedger.create({
      data: {
        userId: input.userId,
        feature: input.feature,
        model: input.model,
        inputTokens: 0,
        outputTokens: 0,
        costCents,
        success: input.success,
        errorMessage: input.errorMessage,
      },
    });
  } catch (e) {
    console.error("[ai-cost-ledger] transcription insert failed:", e);
  }
  return costCents;
}
