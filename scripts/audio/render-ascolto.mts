// PRE-RENDER ASCOLTO AUDIO WITH edge-tts, ONCE, TO A STORED URL.
//
//   npx tsx scripts/audio/render-ascolto.mts --limit 2 --dry   # split + voice plan, no render
//   npx tsx scripts/audio/render-ascolto.mts --limit 2         # render 2 items
//   npx tsx scripts/audio/render-ascolto.mts                   # the whole ASCOLTO bank
//   npx tsx scripts/audio/render-ascolto.mts --force           # re-render items already done
//
// WHY THIS EXISTS
// PracticeRunner.tsx used to call window.speechSynthesis in the learner's browser. It cost
// nothing, and it was not audio: no Italian voice installed meant the Play button silently
// did nothing, and every learner who DID hear something heard a different voice, accent and
// quality. In a listening item the audio IS the item, so that item was not the same item
// twice. The standing network rule is render ONCE to a stored URL and never synthesise on a
// learner request — ported from AlmiCELPIP's scripts/render-listening-audio.ts.
//
// COST: edge-tts takes no API key and bills no account. Re-confirmed for this port by
// rendering with ANTHROPIC_API_KEY, OPENAI_API_KEY, AZURE_SPEECH_KEY and
// BLOB_READ_WRITE_TOKEN all explicitly unset — it still produced audio. $0.0000, measured.
//
// PARTIAL FAILURE IS THE NORMAL CASE
//   * The unit of work is ONE ITEM: rendered, written to disk, recorded in the manifest,
//     before the next begins. There is no batch to lose.
//   * The work list is "ASCOLTO items with no file on disk". A crash at item 31 leaves 30
//     done; re-running resumes. Nothing is redone unless --force.
//   * A failed item is COUNTED AND NAMED and gets no manifest entry, so the coverage gate
//     keeps failing until a human looks at it.
//   * Non-zero exit if ANY item failed.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { BANK, type BankItem } from "../../src/lib/items";
import { stableItemId } from "../../src/lib/item-id";
import { splitByLabels, type SpeakerRun } from "../../src/lib/audio/voices";

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const FORCE = argv.includes("--force");
const li = argv.indexOf("--limit");
const LIMIT = li >= 0 ? Number(argv[li + 1]) : Infinity;

const PUBLIC_DIR = join(process.cwd(), "public", "audio", "ascolto");
const TMP_DIR = join(process.cwd(), "scripts", "audio", "_tmp");
const MANIFEST = join(process.cwd(), "src", "data", "ascolto-audio.json");

/** Public URL for an item's clip. Derived from the stable id, so the URL and the filename
 *  cannot drift apart — there is only one string. */
export const audioUrlFor = (id: string) => `/audio/ascolto/${id}.mp3`;

export type ManifestEntry = {
  url: string;
  bytes: number;
  durationSec: number;
  segments: number;
  voices: string[];
  title: string;
};

/** One edge-tts invocation. Free: no key is read, no account is used, no meter exists.
 *
 *  Text goes through a UTF-8 FILE, never argv, and the shell is not involved. These scripts
 *  are full of apostrophes and accented characters; as a shell argument they get re-parsed
 *  as syntax. A file has no escaping surface and no argument-length limit. (Ported from
 *  AlmiCELPIP, where passing text through argv made edge-tts exit 2 on the first item.) */
function edgeTts(text: string, voice: string, outFile: string): Promise<Buffer> {
  const txtFile = `${outFile}.txt`;
  writeFileSync(txtFile, text, "utf8");
  return new Promise((resolve, reject) => {
    const p = spawn("python", ["-m", "edge_tts", "--voice", voice, "--file", txtFile, "--write-media", outFile], { shell: false });
    let err = "";
    p.stderr.on("data", (d) => (err += String(d)));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0) return reject(new Error(`edge-tts exit ${code}: ${err.slice(0, 200)}`));
      if (!existsSync(outFile)) return reject(new Error("edge-tts produced no file"));
      resolve(readFileSync(outFile));
    });
  });
}

/** edge-tts emits 24 kHz 48 kbps mono CBR mp3, so seconds = bytes / (48000/8). */
const seconds = (bytes: number) => Math.max(1, Math.round(bytes / 6000));

/** The ASCOLTO items that need audio, in a stable order. */
export function ascoltoItems(): BankItem[] {
  return BANK.filter((i) => i.section === "ASCOLTO").sort((a, b) =>
    stableItemId(a).localeCompare(stableItemId(b)),
  );
}

/** The speaker plan for one item — pure, so --dry can print it without rendering. */
export function planFor(item: BankItem): { id: string; runs: SpeakerRun[] } {
  const id = stableItemId(item);
  const p = item.payload as { audioScript?: string; prompts?: string[] };
  const script = String(p.audioScript ?? "");
  if (!script.trim()) throw new Error("empty audioScript");
  // Labels come from the item's OWN prompts — never a generic regex. See lib/audio/voices.ts.
  const labels = Array.isArray(p.prompts) ? p.prompts : [];
  return { id, runs: splitByLabels(script, labels, id) };
}

async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  mkdirSync(TMP_DIR, { recursive: true });

  const items = ascoltoItems();
  const manifest: Record<string, ManifestEntry> = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : {};

  const todo = items.filter((i) => {
    const id = stableItemId(i);
    return FORCE || !existsSync(join(PUBLIC_DIR, `${id}.mp3`));
  });
  const batch = todo.slice(0, LIMIT);

  console.log(`ASCOLTO items in bank: ${items.length}`);
  console.log(`needing audio: ${todo.length}   rendering now: ${batch.length}`);
  console.log(DRY ? "MODE: --dry (plan only, nothing rendered, nothing written)\n" : "MODE: render + write manifest\n");

  let ok = 0, failed = 0, calls = 0, bytes = 0;
  const failures: string[] = [];
  let longest = { id: "", sec: 0, title: "" };

  for (const item of batch) {
    let id = "?";
    try {
      const plan = planFor(item);
      id = plan.id;
      const voices = plan.runs.map((r) => r.voice);

      if (DRY) {
        console.log(`  plan  ${id}  ${String(plan.runs.length).padStart(2)} seg  ${item.title.slice(0, 40)}`);
        for (const r of plan.runs) console.log(`          ${(r.label ?? "(narrator)").padEnd(14)} ${r.voice}  "${r.text.slice(0, 46)}…"`);
        ok++;
        continue;
      }

      const parts: Buffer[] = [];
      for (let i = 0; i < plan.runs.length; i++) {
        parts.push(await edgeTts(plan.runs[i].text, plan.runs[i].voice, join(TMP_DIR, `${id}-${i}.mp3`)));
      }
      // MP3 frames concatenate — the property CELPIP's renderer relies on for the same job.
      const mp3 = Buffer.concat(parts);
      writeFileSync(join(PUBLIC_DIR, `${id}.mp3`), mp3);

      const durationSec = seconds(mp3.length);
      manifest[id] = {
        url: audioUrlFor(id),
        bytes: mp3.length,
        durationSec,
        segments: plan.runs.length,
        voices,
        title: item.title,
      };
      calls += plan.runs.length;
      bytes += mp3.length;
      if (durationSec > longest.sec) longest = { id, sec: durationSec, title: item.title };
      ok++;
      console.log(`  ok    ${id}  ${String(plan.runs.length).padStart(2)} seg  ${String(durationSec).padStart(3)}s  ${(mp3.length / 1024).toFixed(0).padStart(4)}KB  ${item.title.slice(0, 40)}`);
    } catch (e) {
      failed++;
      const msg = String(e instanceof Error ? e.message : e).slice(0, 160);
      failures.push(`${id}  ${item.title.slice(0, 40)}  — ${msg}`);
      console.log(`  FAIL  ${id}  ${msg}`);
    }
  }

  if (!DRY) {
    // Sorted keys so the manifest diff is stable across runs.
    const sorted: Record<string, ManifestEntry> = {};
    for (const k of Object.keys(manifest).sort()) sorted[k] = manifest[k];
    writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n", "utf8");
    rmSync(TMP_DIR, { recursive: true, force: true });
  }

  const covered = items.filter((i) => existsSync(join(PUBLIC_DIR, `${stableItemId(i)}.mp3`))).length;
  console.log(`\nrendered ok: ${ok}   failed: ${failed}`);
  if (!DRY) {
    console.log(`edge-tts calls: ${calls}   audio produced this run: ${(bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`longest clip: ${longest.sec}s  (${longest.title.slice(0, 44)})`);
    console.log(`COST: $0.0000 — edge-tts takes no key and bills no account.`);
  }
  console.log(`\nCOVERAGE: ${covered}/${items.length} ASCOLTO items have a stored clip.`);
  if (failures.length) {
    console.log(`\nFAILURES (no manifest entry written, re-run to retry):`);
    for (const f of failures) console.log(`  ${f}`);
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("RENDER FAILED TO RUN:", e); process.exit(1); });
