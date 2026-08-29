"use client";

// Learner-side recorder for Produzione orale.
//
// MediaRecorder only — no upload happens here. The clip is handed to the caller, which POSTs
// it to /api/it/evaluate/orale, where entitlement is checked BEFORE the file is stored.
//
// Permission is requested when the learner presses record, not on mount: a page that asks for
// the microphone before anyone has asked to speak trains people to click "block".

import { useRef, useState } from "react";

export type Recording = { blob: Blob; seconds: number; mimeType: string };

export function AudioRecorder({
  maxSeconds = 120,
  disabled,
  onRecorded,
}: {
  maxSeconds?: number;
  disabled?: boolean;
  onRecorded: (r: Recording) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "ready">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    stopTimer();
  };

  const start = async () => {
    setError(null);
    // No silent no-op: if the browser cannot record, say so. (The listening player used to
    // fail silently on a missing speech API — that is the pattern being avoided here.)
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record audio. Try Chrome, Edge or Safari.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("We could not access your microphone. Check the site's permissions and try again.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const rec = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const elapsed = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
      setPreviewUrl((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(blob); });
      setState("ready");
      onRecorded({ blob, seconds: elapsed, mimeType });
    };

    recorderRef.current = rec;
    startedRef.current = Date.now();
    setSeconds(0);
    setState("recording");
    rec.start();
    timerRef.current = setInterval(() => {
      const s = Math.round((Date.now() - startedRef.current) / 1000);
      setSeconds(s);
      if (s >= maxSeconds) stop(); // hard stop: we pay per minute of audio
    }, 250);
  };

  return (
    <div className="mt-3 rounded-lg border border-almi-line bg-white p-3">
      <div className="flex flex-wrap items-center gap-3">
        {state !== "recording" ? (
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className="rounded-full bg-almi-coral px-4 py-2 text-sm font-semibold text-almi-ink hover:bg-almi-coral-deep disabled:opacity-50"
          >
            {state === "ready" ? "● Record again" : "● Record"}
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="rounded-full bg-almi-ink px-4 py-2 text-sm font-semibold text-almi-on-dark"
          >
            ■ Stop ({seconds}s)
          </button>
        )}
        <span className="text-xs text-almi-text-muted">Max {maxSeconds}s</span>
      </div>
      {previewUrl && state === "ready" && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio className="mt-3 w-full" src={previewUrl} controls aria-label="Your recording" />
      )}
      {error && <p className="mt-2 text-xs text-almi-coral-text">{error}</p>}
    </div>
  );
}
