// OpenAI Whisper transcription. Kept apart from the Anthropic client on purpose — different
// provider, different key (OPENAI_API_KEY), and per-MINUTE billing rather than per-token.
//
// Approved as a new metered dependency by the founder 2026-08-28 (Brief C round 2).
//
// Called via the REST endpoint with fetch rather than pulling in the `openai` SDK: the request
// is a single multipart POST and Node has global FormData/Blob/fetch. `verbose_json` gives
// per-segment avg_logprob, from which a 0–1 confidence is derived — below the threshold the
// attempt is FLAGGED rather than silently scored, because scoring a bad transcript produces
// confident feedback about words the learner never said.
//
// language is pinned to "it": these are Italian exam tasks, and letting Whisper guess invites
// it to transcribe hesitant Italian as some other language entirely.

import { TRANSCRIPTION_MODELS } from "@/lib/ai/models";

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";
const MODEL = TRANSCRIPTION_MODELS.WHISPER;

/**
 * Below this, the attempt is flagged for review rather than trusted.
 *
 * ── WHY IT IS 0.38 AND NOT 0.7 ──────────────────────────────────────────────
 * deriveConfidence returns exp(avg_logprob), and avg_logprob is Whisper's MEAN LOG-PROBABILITY
 * PER TOKEN. It is not a calibrated 0–1 confidence, and reading it as one is what made this
 * warning fire on good audio.
 *
 * The old 0.7 implies avg_logprob >= ln(0.7) = -0.357. Whisper's own reference decoder treats a
 * segment as low quality at avg_logprob < -1.0, i.e. exp = 0.368. The threshold was therefore
 * about three times stricter than the model's own bar for "this went badly", and ordinary
 * Italian speech — short clips, non-English, a learner speaking carefully — sits comfortably
 * between the two. A real attempt that scored 11/11 was told its transcription was unreliable.
 *
 * 0.38 aligns us with the model's own heuristic (just above exp(-1.0)) so the flag means what it
 * says. This is a warning a learner must be able to believe: one that fires on good audio is
 * noise, and noise teaches people to ignore it before the day it is true.
 */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.38;

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.length < 20 || key === "TODO_FOUNDER_PROVIDES") {
    throw new Error("OPENAI_API_KEY missing or invalid — set a real key in Vercel env");
  }
  return key;
}

export function isTranscriptionConfigured(): boolean {
  const k = process.env.OPENAI_API_KEY;
  return Boolean(k && k.length >= 20 && k !== "TODO_FOUNDER_PROVIDES");
}

export type TranscriptionResult =
  | { ok: true; text: string; confidence: number; confidenceKnown: boolean; model: string; durationSeconds: number }
  /** `billedSeconds` is what OpenAI processed before the failure — usually 0, but NOT always.
   *  A 200 with an empty transcript is a request OpenAI ran and charged for, and it is the
   *  one failure shape here that costs money. The caller records THIS, never the duration
   *  the browser claimed, because the browser's number is not a measure of our spend. */
  | { ok: false; error: string; billedSeconds: number };

type WhisperSegment = { avg_logprob?: number; no_speech_prob?: number };
type WhisperVerbose = { text?: string; duration?: number; segments?: WhisperSegment[] };

/**
 * Derive a 0–1 confidence from Whisper's segment log-probs. avg_logprob is a natural-log
 * probability (≤ 0), so exp() maps it back to a likelihood. Segments the model thought were
 * probably silence are weighted down.
 */
export function deriveConfidence(segments: WhisperSegment[] | undefined): number {
  if (!segments || segments.length === 0) return 0.5; // unknown — neutral, not confident
  let weighted = 0;
  let weight = 0;
  for (const s of segments) {
    const p = Math.exp(s.avg_logprob ?? -1);
    const w = 1 - Math.min(1, Math.max(0, s.no_speech_prob ?? 0));
    weighted += p * w;
    weight += w;
  }
  if (weight === 0) return 0;
  return Math.max(0, Math.min(1, weighted / weight));
}

export async function transcribeAudio(input: {
  audio: Blob;
  contentType: string;
  filename?: string;
}): Promise<TranscriptionResult> {
  let key: string;
  try {
    key = getOpenAIKey();
  } catch (e) {
    return { ok: false, error: (e as Error).message, billedSeconds: 0 }; // never left the process
  }

  const form = new FormData();
  form.append("file", input.audio, input.filename ?? "clip.webm");
  form.append("model", MODEL);
  form.append("response_format", "verbose_json");
  form.append("language", "it");

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      // A non-2xx is a rejected request: OpenAI does not bill for one.
      return { ok: false, error: `transcription failed (${res.status}): ${body.slice(0, 160)}`, billedSeconds: 0 };
    }
    const data = (await res.json()) as WhisperVerbose;
    const text = (data.text ?? "").trim();
    // 🔴 THE ONE THAT COSTS. HTTP 200 with nothing in it: OpenAI ran the audio and billed
    // for it. `data.duration` is the length it processed.
    if (!text) return { ok: false, error: "The recording produced no speech.", billedSeconds: Math.max(0, Math.round(data.duration ?? 0)) };
    return {
      ok: true,
      text,
      confidence: deriveConfidence(data.segments),
      // Whether we MEASURED the confidence or fell back to a neutral value. Without this the
      // "unknown" case is only safe by arithmetic accident -- 0.5 happens to sit above the
      // threshold today, and would silently start flagging every attempt if the threshold moved.
      confidenceKnown: Boolean(data.segments && data.segments.length > 0),
      model: MODEL,
      durationSeconds: Math.max(0, Math.round(data.duration ?? 0)),
    };
  } catch (e) {
    // Network error mid-flight: no response, so nothing measurable was served to us.
    return { ok: false, error: `transcription failed: ${(e as Error).message.slice(0, 160)}`, billedSeconds: 0 };
  }
}
