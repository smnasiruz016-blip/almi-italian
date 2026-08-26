// The metered call for Produzione scritta and orale.
//
// ── THE ORDER IS THE POINT ──────────────────────────────────────────────────
// refuseUnlessEntitled() runs BEFORE getAnthropicClient(). Not beside it, not after it — an
// unentitled caller must never reach the client, because reaching the client is what costs
// money. The guard is here at the lib layer rather than only in the route so a future route
// that forgets its own check still cannot spend (see src/lib/ai/entitlement.ts).
//
// scripts/gates/ai-cost-gate.mts asserts that ordering statically AND behaviourally, and the
// behavioural proof works precisely because getAnthropicClient() throws without a key: a
// clean refusal is then positive evidence the client was never constructed.
//
// ── FAIL CLOSED, ALWAYS ─────────────────────────────────────────────────────
// A missing key, a malformed response, a network error: the learner gets an honest
// "unavailable" and NO score. There is no fallback estimate, no partial score, no cached
// guess. A fabricated number on a page that says "estimate" is still a fabricated number.

import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropicClient, recordCost } from "@/lib/ai/anthropic-client";
import { MODELS } from "@/lib/ai/models";
import { refuseUnlessEntitled } from "@/lib/ai/entitlement";
import { rubricFor, scoreFrom, type Rubric } from "@/lib/ai/rubric";
import { scrittaSystemPrompt, oraleSystemPrompt } from "@/lib/ai/prompts";
import {
  ModelAssessmentSchema,
  labelEstimate,
  type LabelledEstimate,
  type ModelAssessment,
} from "@/lib/ai/schemas";

const MODEL = MODELS.SONNET;
const MAX_OUTPUT_TOKENS = 2000;

export type EvaluateResult =
  | { ok: true; estimate: LabelledEstimate; costCents: number; latencyMs: number }
  | { ok: false; error: string; status?: number; latencyMs: number };

export type EvaluateInput = {
  userId: string | null;
  skill: "SCRITTA" | "ORALE";
  exam: string;
  level: string;
  /** The item's authored criteria, verbatim. */
  criteria: string[];
  /** The task as the learner saw it. */
  task: string;
  /** The learner's writing, or the Whisper transcript. */
  response: string;
  minWords?: number;
  maxWords?: number;
  speakSeconds?: number;
};

function systemFor(input: EvaluateInput, rubric: Rubric): string {
  return input.skill === "SCRITTA"
    ? scrittaSystemPrompt(rubric, input.minWords ?? 0, input.maxWords)
    : oraleSystemPrompt(rubric, input.speakSeconds);
}

export async function evaluate(input: EvaluateInput): Promise<EvaluateResult> {
  const startedAt = Date.now();

  // GUARD FIRST. Nothing above this line touches a client, a key, or a network.
  const denied = await refuseUnlessEntitled(input.userId);
  if (denied) return { ...denied, latencyMs: 0 };

  // Scale and criteria from the engine and the item. Throws rather than guessing a scale.
  let rubric: Rubric;
  try {
    rubric = rubricFor({ exam: input.exam, level: input.level, criteria: input.criteria });
  } catch (e) {
    return { ok: false, error: (e as Error).message, status: 400, latencyMs: Date.now() - startedAt };
  }

  let client: Anthropic;
  try {
    client = getAnthropicClient();
  } catch {
    // No key configured. Honest unavailability — never a fabricated score.
    return {
      ok: false,
      error: "Feedback is temporarily unavailable. Nothing was charged and nothing was scored.",
      status: 503,
      latencyMs: Date.now() - startedAt,
    };
  }

  const system = systemFor(input, rubric);
  const userTurn = [
    `COMPITO ASSEGNATO:\n${input.task}`,
    input.skill === "ORALE"
      ? `TRASCRIZIONE AUTOMATICA DELLA RISPOSTA DEL CANDIDATO:\n${input.response}`
      : `TESTO DEL CANDIDATO:\n${input.response}`,
  ].join("\n\n");

  async function callOnce(extra: string | null) {
    return client.messages.parse({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      // The rubric half is stable per task and carries the cache breakpoint; the learner's
      // text goes in the user turn, AFTER it, so the prefix is cacheable in principle.
      //
      // ⚠️ IT DOES NOT CACHE TODAY, AND THE MARKER IS NOT A CLAIM THAT IT DOES. These prompts
      // measure ~520–630 tokens (npx tsx scripts/ai/estimate-cost.mts) and Sonnet 4.6 will not
      // cache a prefix below ~2048 — it does not error, it simply does nothing. The marker is
      // kept because the placement is right and becomes free money the day the rubric grows;
      // it is documented because a silent no-op that looks like an optimisation is how a cost
      // assumption survives unexamined. Verify with usage.cache_read_input_tokens on a real
      // call: if it stays 0, caching is not engaging.
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: extra ? `${userTurn}\n\n${extra}` : userTurn }],
      output_config: { format: zodOutputFormat(ModelAssessmentSchema) },
    });
  }

  try {
    let response = await callOnce(null);
    let parsed: ModelAssessment | null = response.parsed_output ?? null;

    if (!parsed) {
      // One retry, with a stricter instruction. Two failures is a real failure.
      response = await callOnce(
        "IMPORTANTE: la risposta precedente non era conforme allo schema richiesto. Restituisci SOLO l'oggetto JSON previsto, senza prosa e senza blocchi di codice.",
      );
      parsed = response.parsed_output ?? null;
    }

    const usage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      cacheReadTokens: response.usage?.cache_read_input_tokens ?? 0,
      cacheWriteTokens: response.usage?.cache_creation_input_tokens ?? 0,
    };
    const feature = input.skill === "SCRITTA" ? "scritta.evaluate" : "orale.evaluate";
    const latencyMs = Date.now() - startedAt;

    if (!parsed) {
      await recordCost({ userId: input.userId, feature, model: MODEL, usage, success: false, errorMessage: "schema mismatch after retry" });
      return {
        ok: false,
        error: "The evaluator returned something unusable. Nothing was scored — please try again in a moment.",
        status: 502,
        latencyMs,
      };
    }

    const costCents = await recordCost({ userId: input.userId, feature, model: MODEL, usage, success: true });

    // THE ONLY PLACE AN AI RESULT BECOMES SOMETHING A LEARNER CAN SEE.
    const estimate = labelEstimate(parsed, scoreFrom(rubric, parsed.sectionScoreValue), rubric.engineNote);
    return { ok: true, estimate, costCents, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai.evaluate] call failed:", msg);
    await recordCost({
      userId: input.userId,
      feature: input.skill === "SCRITTA" ? "scritta.evaluate" : "orale.evaluate",
      model: MODEL,
      usage: { inputTokens: 0, outputTokens: 0 },
      success: false,
      errorMessage: msg,
    });
    return {
      ok: false,
      error: "The evaluator is temporarily unavailable. Nothing was scored — please try again in a moment.",
      status: 503,
      latencyMs,
    };
  }
}
