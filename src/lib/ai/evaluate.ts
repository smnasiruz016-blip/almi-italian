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
import { parseMessage } from "@anthropic-ai/sdk/lib/parser";
import { getAnthropicClient, recordCost } from "@/lib/ai/anthropic-client";
import { MODELS } from "@/lib/ai/models";
import { refuseUnlessEntitled } from "@/lib/ai/entitlement";
import { rubricFor, scoreFrom, type Rubric } from "@/lib/ai/rubric";
import { wordCount, contradictingWordCounts, contradictingDurations } from "@/lib/text/word-count";
import { contradictsFullMarks, allAssessableAtMax } from "@/lib/ai/summary-consistency";
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

function systemFor(input: EvaluateInput, rubric: Rubric, words: number): string {
  return input.skill === "SCRITTA"
    ? scrittaSystemPrompt(rubric, { words, minWords: input.minWords ?? 0, maxWords: input.maxWords })
    : oraleSystemPrompt(rubric, { words, speakSeconds: input.speakSeconds });
}

/** Every string the model wrote, so a fabricated number cannot hide in one of them. */
function allProse(a: { criteria: { comment: string }[]; strengths: string[]; improvements: string[]; summary: string }): string {
  return [...a.criteria.map((c) => c.comment), ...a.strengths, ...a.improvements, a.summary].join("\n");
}

export async function evaluate(input: EvaluateInput): Promise<EvaluateResult> {
  const startedAt = Date.now();

  // GUARD FIRST. Nothing above this line touches a client, a key, or a network.
  const denied = await refuseUnlessEntitled(input.userId);
  if (denied) return { ...denied, latencyMs: 0 };

  // Scale and criteria from the engine and the item. Throws rather than guessing a scale.
  let rubric: Rubric;
  try {
    rubric = rubricFor({ exam: input.exam, level: input.level, section: input.skill, criteria: input.criteria });
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

  // The app counts ONCE and tells the model. It is never asked to estimate — see word-count.ts.
  const words = wordCount(input.response);
  const system = systemFor(input, rubric, words);
  const userTurn = [
    `COMPITO ASSEGNATO:\n${input.task}`,
    input.skill === "ORALE"
      ? `TRASCRIZIONE AUTOMATICA DELLA RISPOSTA DEL CANDIDATO:\n${input.response}`
      : `TESTO DEL CANDIDATO:\n${input.response}`,
  ].join("\n\n");

  // EVERY provider call this evaluate() makes, summed — not the last one.
  //
  // ── WHY AN ACCUMULATOR AND NOT `response.usage` ─────────────────────────────
  // callOnce() runs TWICE whenever a guard below trips (word-count, duration,
  // summary-contradiction, schema). The ledger used to read usage off the FINAL response, so a
  // retried evaluation billed two calls and recorded one; and the catch below hardcoded zeros,
  // so a response that arrived HTTP 200 and then failed to parse was billed by the provider and
  // written down as costing nothing. Production row 2026-08-28T02:11 (orale.evaluate,
  // in=0 out=0 cost=0, "Failed to parse structured output") is that second shape, live.
  //
  // A ledger that under-reports does not make /admin/costs look broken. It makes it QUIETLY
  // LOW, which is worse, because a number that is merely too small still reads as an answer.
  const spent = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };

  async function callOnce(extra: string | null) {
    const params = {
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
      // `as const` on the whole object would make these arrays readonly, which the SDK's
      // param types reject; the literal types are pinned per-field instead.
      system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
      messages: [{ role: "user" as const, content: extra ? `${userTurn}\n\n${extra}` : userTurn }],
      output_config: { format: zodOutputFormat(ModelAssessmentSchema) },
    };

    // create() + parseMessage() IS parse(). The SDK's own definition is
    // `parse(params, options) { return this.create(params, options).then(m => parseMessage(m, params, ...)) }`
    // (node_modules/@anthropic-ai/sdk/resources/messages/messages.js), and parseMessage only
    // attaches `parsed_output` to a copy of the message — it never touches `usage`. Same
    // request, same response object, same thrown AnthropicError on a bad payload.
    //
    // Splitting them is the whole fix: the tokens are banked BEFORE anything can throw past
    // this line. Do not "tidy" this back to client.messages.parse().
    const raw = await client.messages.create(params);
    spent.inputTokens += raw.usage?.input_tokens ?? 0;
    spent.outputTokens += raw.usage?.output_tokens ?? 0;
    spent.cacheReadTokens += raw.usage?.cache_read_input_tokens ?? 0;
    spent.cacheWriteTokens += raw.usage?.cache_creation_input_tokens ?? 0;
    return parseMessage(raw, params, { logger: console });
  }

  try {
    let response = await callOnce(null);
    let parsed: ModelAssessment | null = response.parsed_output ?? null;

    /** A response is unusable if it does not parse OR if it invented a word count. The task's
     *  own bounds are allowed — the model may properly say "il compito chiede 80-120 parole". */
    const inventedCounts = (a: ModelAssessment | null) =>
      a ? contradictingWordCounts(allProse(a), words, [input.minWords ?? 0, input.maxWords ?? 0].filter(Boolean)) : [];

    /** Durations are checked against an EMPTY allow-list: the model is given no duration, and no
     *  official document publishes one for the spoken task, so any number it states in seconds or
     *  minutes is unsourced by construction. See contradictingDurations. */
    const inventedDurations = (a: ModelAssessment | null) =>
      a && input.skill === "ORALE" ? contradictingDurations(allProse(a)) : [];
    /** The summary may not deny a level the scores just awarded in full. Ceilings come from the
     *  rubric, never from the model, so it cannot widen its own denominator to escape this. */
    const ceilingFor = (label: string) =>
      (rubric.official ?? []).find((c) => c.label.toLowerCase() === label.toLowerCase())?.max ?? null;
    const contradictsScores = (a: ModelAssessment | null) =>
      a
        ? contradictsFullMarks(
            a.summary,
            allAssessableAtMax(a.criteria.map((c) => ({ points: c.points, pointsMax: ceilingFor(c.criterion) }))),
          )
        : [];

    let bad = !parsed
      ? "schema"
      : inventedCounts(parsed).length
        ? "word-count"
        : inventedDurations(parsed).length
          ? "duration"
          : contradictsScores(parsed).length
            ? "summary-contradiction"
            : null;

    if (bad) {
      // One retry, with a stricter instruction. Two failures is a real failure.
      response = await callOnce(
        bad === "schema"
          ? "IMPORTANTE: la risposta precedente non era conforme allo schema richiesto. Restituisci SOLO l'oggetto JSON previsto, senza prosa e senza blocchi di codice."
          : bad === "duration"
          ? "IMPORTANTE: nella risposta precedente hai indicato una DURATA (secondi o minuti) che non ti è stata fornita e che nessun documento ufficiale pubblica per questo compito. Non scrivere nessuna durata e non dire che la risposta è troppo breve o troppo lunga nel tempo. Valuta soltanto ciò che la trascrizione contiene."
          : bad === "summary-contradiction"
          ? "IMPORTANTE: nella risposta precedente hai assegnato il MASSIMO a ogni criterio valutabile e poi hai scritto nel summary che il livello non è pienamente raggiunto. Le due cose non possono essere entrambe vere. Se i punteggi restano al massimo, il summary NON deve dire che il livello non è raggiunto. Puoi però dire che questa stima non valuta la pronuncia e l'intonazione, perché è vero."
          : `IMPORTANTE: nella risposta precedente hai indicato un numero di parole che non ti è stato fornito. Il testo contiene ESATTAMENTE ${words} parole. Non scrivere nessun altro numero seguito da "parole" tranne questo o i limiti del compito.`,
      );
      parsed = response.parsed_output ?? null;
      bad = !parsed
        ? "schema"
        : inventedCounts(parsed).length
          ? "word-count"
          : inventedDurations(parsed).length
            ? "duration"
            : contradictsScores(parsed).length
              ? "summary-contradiction"
              : null;
    }

    // The SUM of every call made above — one when nothing tripped, two after a retry.
    const usage = spent;
    const feature = input.skill === "SCRITTA" ? "scritta.evaluate" : "orale.evaluate";
    const latencyMs = Date.now() - startedAt;

    if (bad || !parsed) {
      // FAIL CLOSED, including for the invented count. Showing the learner a second, wrong
      // number about their own text is exactly the defect this check exists to stop, and
      // editing the model's prose to remove it would be us fabricating instead.
      const why = bad === "word-count"
        ? `model asserted word count(s) ${inventedCounts(parsed).join(", ")} against an actual ${words}`
        : bad === "duration"
          ? `model asserted duration(s) ${inventedDurations(parsed).join(", ")}, which it was never given and which no official source publishes`
        : bad === "summary-contradiction"
          ? `summary denies a level scored in full: ${JSON.stringify(contradictsScores(parsed).slice(0, 2))}`
          : "schema mismatch after retry";
      await recordCost({ userId: input.userId, feature, model: MODEL, usage, success: false, errorMessage: why });
      return {
        ok: false,
        error: "The evaluator returned something unusable. Nothing was scored — please try again in a moment.",
        status: 502,
        latencyMs,
      };
    }

    const costCents = await recordCost({ userId: input.userId, feature, model: MODEL, usage, success: true });

    // Append any criterion this product cannot assess. The model was never shown it, so this
    // is the only way it reaches the report — with OUR fixed wording, no points, and no band.
    // The learner still sees the whole official rubric and sees exactly which point was
    // withheld and why.
    const ceiling = (label: string) =>
      (rubric.official ?? []).find((c) => c.label.toLowerCase() === label.toLowerCase())?.max ?? null;

    const withNotAssessed: ModelAssessment = {
      ...parsed,
      criteria: [
        // Stamp each criterion with its OFFICIAL ceiling. The model is never asked for it, so
        // it cannot inflate its own denominator.
        ...parsed.criteria.map((c) => ({ ...c, pointsMax: ceiling(c.criterion) })),
        ...(rubric.official ?? [])
          .filter((c) => c.notAssessed)
          .map((c) => ({
            criterion: c.label,
            band: null,
            points: null,
            pointsMax: c.max,
            comment: c.notAssessedReason ?? "Non valutabile con questa fonte.",
          })),
      ],
    };

    // THE ONLY PLACE AN AI RESULT BECOMES SOMETHING A LEARNER CAN SEE.
    const estimate = labelEstimate(withNotAssessed, scoreFrom(rubric, withNotAssessed), rubric.engineNote);
    return { ok: true, estimate, costCents, latencyMs };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai.evaluate] call failed:", msg);
    await recordCost({
      userId: input.userId,
      feature: input.skill === "SCRITTA" ? "scritta.evaluate" : "orale.evaluate",
      model: MODEL,
      // NOT hardcoded zeros. Whatever calls got as far as a response are already banked in
      // `spent`; this is zero only when the throw happened before any call was served — a
      // network error on the first attempt, or a client the guard above never let us build.
      usage: spent,
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
