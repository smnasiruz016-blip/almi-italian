import {
  PRICING_USD_PER_MTOK,
  TRANSCRIPTION_USD_PER_MINUTE,
  type ModelId,
  type TranscriptionModelId,
} from "@/lib/ai/models";

export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

/**
 * Dollar cost of one Anthropic call, in 1/100 CENTS — an integer where 1 = $0.0001.
 *
 * The unit is AlmiPTE's, kept identical so the network's ledgers are comparable and so a tiny
 * cost stores exactly in Postgres without Decimal overhead. A float column would round a
 * fraction of a cent into nothing, and "nothing" is the one answer a cost ledger must never
 * invent.
 */
export function computeCostCents(model: ModelId, usage: Usage): number {
  const rates = PRICING_USD_PER_MTOK[model];
  if (!rates) throw new Error(`No pricing for model ${model}`);
  const dollars =
    (usage.inputTokens / 1_000_000) * rates.input +
    (usage.outputTokens / 1_000_000) * rates.output +
    ((usage.cacheReadTokens ?? 0) / 1_000_000) * rates.cacheRead +
    ((usage.cacheWriteTokens ?? 0) / 1_000_000) * rates.cacheWrite5m;
  return Math.round(dollars * 10_000);
}

/** Whisper cost in the same 1/100-cent unit. Billed per minute at per-second granularity. */
export function computeTranscriptionCostCents(
  model: TranscriptionModelId,
  durationSeconds: number,
): number {
  const ratePerMin = TRANSCRIPTION_USD_PER_MINUTE[model];
  if (ratePerMin === undefined) throw new Error(`No transcription pricing for model ${model}`);
  return Math.round(((Math.max(0, durationSeconds) / 60) * ratePerMin) * 10_000);
}

/** Human-readable, for an admin ledger view. */
export function formatCents(centHundredths: number): string {
  const cents = centHundredths / 100;
  return cents < 1 ? `${centHundredths / 100}¢` : `$${(cents / 100).toFixed(4)}`;
}
