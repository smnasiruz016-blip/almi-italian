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

/** Below this, the attempt is flagged for review rather than trusted. */
export const CONFIDENCE_REVIEW_THRESHOLD = 0.7;

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
  | { ok: true; text: string; confidence: number; model: string; durationSeconds: number }
  | { ok: false; error: string };

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
    return { ok: false, error: (e as Error).message };
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
      return { ok: false, error: `transcription failed (${res.status}): ${body.slice(0, 160)}` };
    }
    const data = (await res.json()) as WhisperVerbose;
    const text = (data.text ?? "").trim();
    if (!text) return { ok: false, error: "The recording produced no speech." };
    return {
      ok: true,
      text,
      confidence: deriveConfidence(data.segments),
      model: MODEL,
      durationSeconds: Math.max(0, Math.round(data.duration ?? 0)),
    };
  } catch (e) {
    return { ok: false, error: `transcription failed: ${(e as Error).message.slice(0, 160)}` };
  }
}
