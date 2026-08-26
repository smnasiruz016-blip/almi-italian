// Vercel Blob — the store for learner speaking clips.
//
// Approved as a new metered dependency by the founder 2026-08-28 (Brief C round 2). The token
// is set in Vercel; nobody working on this repo holds it.
//
// Learner audio ONLY. The ASCOLTO listening clips are pre-rendered static files in
// public/audio/ascolto/ and deliberately do NOT live here: they are the same for everyone,
// they cost nothing per play from the CDN, and putting them in Blob would add a per-request
// dependency to something that has none (see scripts/audio/render-ascolto.mts).

import { put, del } from "@vercel/blob";

const TOKEN_ENV = "BLOB_READ_WRITE_TOKEN";

export function isBlobConfigured(): boolean {
  const t = process.env[TOKEN_ENV];
  return Boolean(t && t.length > 20);
}

/** Upload one clip. Throws if the store is not configured — fail closed, never silently drop
 *  a learner's recording and score them on nothing. */
export async function putAudio(key: string, body: Blob | Buffer, contentType: string): Promise<{ url: string }> {
  if (!isBlobConfigured()) {
    throw new Error(`${TOKEN_ENV} is not set — this project has no Blob store yet`);
  }
  const res = await put(key, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    // The key is the attempt id, so a re-submit MUST replace its clip. Without this the
    // second attempt at the same task fails with "This blob already exists".
    allowOverwrite: true,
  });
  return { url: res.url };
}

/** Used by the retention cron. Never throws on a missing blob — deleting twice is fine. */
export async function deleteAudio(url: string): Promise<void> {
  if (!isBlobConfigured()) return;
  try {
    await del(url);
  } catch (e) {
    console.warn("[blob] delete failed (continuing):", (e as Error).message);
  }
}
