// ASCOLTO AUDIO COVERAGE GATE — every listening item has a stored clip, and every stored
// clip belongs to an item.
//
//   npm run gate:ascolto-audio
//
// ── WHY COVERAGE IS THE SAFETY PROPERTY ─────────────────────────────────────
// PracticeRunner.tsx used to synthesise the transcript in the browser when nothing else was
// available. That fallback made a gap in coverage INVISIBLE: an item with no audio still
// "worked", so nothing could tell us it was missing. The fallback is gone, which means a
// missing clip is now silence — honest, and useless to a learner. Coverage is therefore no
// longer a nice-to-have; it is the thing that keeps a listening item answerable.
//
// FOUR CHECKS, failing for different reasons on purpose:
//   A  COVERAGE   every ASCOLTO item has a manifest entry AND a non-empty file on disk
//   B  ORPHANS    every file on disk and every manifest entry belongs to a live item
//   C  INTEGRITY  manifest url matches the item id, and no zero-byte or absurdly small clip
//   D  PLAN       the voice plan is pure and reproducible, and speakers never share a voice
//
// A gate that only checked A would stay green while dead files piled up in public/; one that
// only checked B would stay green with no audio at all.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { BANK } from "../../src/lib/items";
import { stableItemId } from "../../src/lib/item-id";
import { splitByLabels } from "../../src/lib/audio/voices";

const PUBLIC_DIR = join(process.cwd(), "public", "audio", "ascolto");
const MANIFEST = join(process.cwd(), "src", "data", "ascolto-audio.json");

/** Anything smaller than this is not speech — it is a truncated or failed render. edge-tts
 *  emits 48 kbps, so 6 KB is about one second. */
const MIN_BYTES = 6_000;

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("ASCOLTO audio gate — every listening item has a stored clip\n");

type Entry = { url: string; bytes: number; durationSec: number; segments: number; voices: string[]; title: string };

const manifest: Record<string, Entry> = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : {};

const ascolto = BANK.filter((i) => i.section === "ASCOLTO");
const ids = new Set(ascolto.map(stableItemId));

// A gate that finds nothing to check is not passing, it is looking in the wrong place.
if (ascolto.length === 0) fail("found no ASCOLTO items at all — this gate is looking in the wrong place");

// ── A. COVERAGE ─────────────────────────────────────────────────────────────
console.log("A. coverage (every ASCOLTO item has a clip):");
let covered = 0;
for (const item of ascolto) {
  const id = stableItemId(item);
  const entry = manifest[id];
  const file = join(PUBLIC_DIR, `${id}.mp3`);
  if (!entry) { fail(`${id} "${item.title.slice(0, 44)}" has no manifest entry`); continue; }
  if (!existsSync(file)) { fail(`${id} "${item.title.slice(0, 44)}" is in the manifest but the file is missing`); continue; }
  const size = statSync(file).size;
  if (size < MIN_BYTES) { fail(`${id} "${item.title.slice(0, 44)}" is only ${size} bytes — truncated render`); continue; }
  covered++;
}
if (covered === ascolto.length) ok(`${covered}/${ascolto.length} ASCOLTO items have a stored, non-empty clip`);
else fail(`only ${covered}/${ascolto.length} ASCOLTO items are covered`);

// ── B. ORPHANS, BOTH DIRECTIONS ─────────────────────────────────────────────
console.log("\nB. orphans (nothing stored that no item uses):");
const onDisk = existsSync(PUBLIC_DIR)
  ? readdirSync(PUBLIC_DIR).filter((f) => f.endsWith(".mp3")).map((f) => f.replace(/\.mp3$/, ""))
  : [];
const strayFiles = onDisk.filter((id) => !ids.has(id));
const strayEntries = Object.keys(manifest).filter((id) => !ids.has(id));
if (strayFiles.length) fail(`${strayFiles.length} file(s) in public/audio/ascolto belong to no item: ${strayFiles.slice(0, 5).join(", ")}`);
else ok(`${onDisk.length} file(s) on disk, all referenced by a live item`);
if (strayEntries.length) fail(`${strayEntries.length} manifest entr(ies) belong to no item: ${strayEntries.slice(0, 5).join(", ")}`);
else ok(`${Object.keys(manifest).length} manifest entr(ies), all referenced by a live item`);

// ── C. INTEGRITY ────────────────────────────────────────────────────────────
console.log("\nC. integrity (the url is the item's own, sizes agree):");
let bad = 0;
for (const [id, e] of Object.entries(manifest)) {
  if (e.url !== `/audio/ascolto/${id}.mp3`) { fail(`${id}: manifest url "${e.url}" does not match its id`); bad++; }
  const file = join(PUBLIC_DIR, `${id}.mp3`);
  if (existsSync(file) && statSync(file).size !== e.bytes) {
    fail(`${id}: manifest says ${e.bytes} bytes, file is ${statSync(file).size} — re-render or re-record`);
    bad++;
  }
}
if (!bad) ok(`${Object.keys(manifest).length} entr(ies) point at their own id and match the file on disk`);

// ── D. THE VOICE PLAN ───────────────────────────────────────────────────────
// Pure, so it is checked without rendering anything. Two properties: the plan is stable
// across calls (same input, same voices), and no two speakers in an item share a voice —
// which would collapse two characters onto one sound, a content defect no byte count sees.
console.log("\nD. voice plan (pure, reproducible, no collapsed speakers):");
let planBad = 0, multi = 0;
for (const item of ascolto) {
  const id = stableItemId(item);
  const p = item.payload as { audioScript?: string; prompts?: string[] };
  const script = String(p.audioScript ?? "");
  const labels = Array.isArray(p.prompts) ? p.prompts : [];
  try {
    const a = splitByLabels(script, labels, id);
    const b = splitByLabels(script, labels, id);
    if (JSON.stringify(a) !== JSON.stringify(b)) { fail(`${id}: voice plan is not reproducible across calls`); planBad++; continue; }
    if (a.length > 1) {
      multi++;
      const labelled = a.filter((r) => r.label);
      const byLabel = new Map<string, string>();
      for (const r of labelled) {
        const k = r.label!.trim().toLowerCase();
        const prev = byLabel.get(k);
        if (prev && prev !== r.voice) { fail(`${id}: speaker "${r.label}" is read by two different voices`); planBad++; }
        byLabel.set(k, r.voice);
      }
      const distinctSpeakers = new Set(labelled.map((r) => r.label!.trim().toLowerCase())).size;
      const distinctVoices = new Set(labelled.map((r) => r.voice)).size;
      if (distinctSpeakers > 0 && distinctVoices < distinctSpeakers) {
        fail(`${id}: ${distinctSpeakers} speakers share ${distinctVoices} voice(s)`);
        planBad++;
      }
    }
    const entry = manifest[id];
    if (entry && entry.segments !== a.length) {
      fail(`${id}: manifest records ${entry.segments} segment(s) but the plan produces ${a.length} — the stored clip is stale`);
      planBad++;
    }
  } catch (e) {
    fail(`${id}: voice plan threw — ${(e as Error).message.slice(0, 100)}`);
    planBad++;
  }
}
if (!planBad) ok(`${ascolto.length} plans reproducible; ${multi} multi-voice item(s), no speaker shares a voice`);

const totalBytes = Object.values(manifest).reduce((n, e) => n + e.bytes, 0);
console.log(`\n  stored: ${(totalBytes / 1024 / 1024).toFixed(2)} MB across ${Object.keys(manifest).length} clip(s)`);

console.log("");
if (failed) {
  console.error("ASCOLTO audio gate FAILED");
  console.error("  There is no runtime synthesiser any more: an item with no clip is SILENT.");
  console.error("  Render the missing items before shipping — npx tsx scripts/audio/render-ascolto.mts\n");
  process.exit(1);
}
console.log("ASCOLTO audio gate passed\n");
