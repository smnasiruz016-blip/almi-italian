// Centralized model registry. Mirrors AlmiPTE's src/lib/ai/models.ts so the family stays on
// one source of truth when models change — a model id or a price should be edited in exactly
// one file per product.
//
// Model chosen by the founder 2026-08-28: network parity with AlmiPTE.

export const MODELS = {
  /** Produzione scritta + orale evaluation. Network parity with AlmiPTE. */
  SONNET: "claude-sonnet-4-6",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// --- Transcription (OpenAI Whisper) ---
// Whisper bills per MINUTE of audio, not per token, so it is kept apart from the token
// pricing below. whisper-1 is $0.006/minute, billed per second rounded up.
export const TRANSCRIPTION_MODELS = {
  WHISPER: "whisper-1",
} as const;

export type TranscriptionModelId = (typeof TRANSCRIPTION_MODELS)[keyof typeof TRANSCRIPTION_MODELS];

export const TRANSCRIPTION_USD_PER_MINUTE: Record<TranscriptionModelId, number> = {
  "whisper-1": 0.006,
};

// Per-million-token pricing in dollars.
// Cache read = 10% of input. Cache write at the 5-minute TTL = 1.25x input.
export const PRICING_USD_PER_MTOK: Record<
  ModelId,
  { input: number; output: number; cacheRead: number; cacheWrite5m: number }
> = {
  "claude-sonnet-4-6": {
    input: 3.0,
    output: 15.0,
    cacheRead: 0.3,
    cacheWrite5m: 3.75,
  },
};
