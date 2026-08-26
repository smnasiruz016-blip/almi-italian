// What one attempt costs, computed from the REAL prompts this code builds.
//
//   npx tsx scripts/ai/estimate-cost.mts
//
// This is ARITHMETIC, not a measurement: no model is called and no tokens are counted by the
// provider. Token counts are approximated from characters at ~3.6 chars/token for Italian
// prose, which is a rough conversion — treat every figure here as an order of magnitude until
// a real call reports usage.

import { BANK } from "../../src/lib/items";
import { rubricFor } from "../../src/lib/ai/rubric";
import { scrittaSystemPrompt, oraleSystemPrompt } from "../../src/lib/ai/prompts";
import { computeCostCents, computeTranscriptionCostCents } from "../../src/lib/ai/cost";
import { MODELS, PRICING_USD_PER_MTOK } from "../../src/lib/ai/models";

const CHARS_PER_TOKEN = 3.6;
const tok = (s: string) => Math.round(s.length / CHARS_PER_TOKEN);
const usd = (centHundredths: number) => centHundredths / 10_000;

const rows: { label: string; sysTok: number; inTok: number; outTok: number }[] = [];

for (const section of ["SCRITTA", "ORALE"] as const) {
  const seen = new Set<string>();
  for (const item of BANK.filter((i) => i.section === section)) {
    const k = `${item.exam}::${item.level}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const p = item.payload as { task?: string; criteria?: string[]; minWords?: number; maxWords?: number; speakSeconds?: number };
    const rubric = rubricFor({ exam: item.exam, level: item.level, criteria: p.criteria ?? [] });
    const sys = section === "SCRITTA"
      ? scrittaSystemPrompt(rubric, p.minWords ?? 0, p.maxWords)
      : oraleSystemPrompt(rubric, p.speakSeconds);
    // A learner response: the task's own word target, ~6 chars a word, plus the task text.
    const words = p.minWords ?? 120;
    const userChars = (p.task ?? "").length + words * 6;
    rows.push({
      label: `${section} ${item.exam}/${item.level}`,
      sysTok: tok(sys),
      inTok: Math.round(userChars / CHARS_PER_TOKEN),
      // The schema caps the output shape; a full report lands near this.
      outTok: 700,
    });
  }
}

const model = MODELS.SONNET;
const rate = PRICING_USD_PER_MTOK[model];
console.log(`Cost per attempt — ${model}  ($${rate.input}/$${rate.output} per MTok, cacheRead $${rate.cacheRead})\n`);
console.log("TASK                          SYS   IN   OUT    FIRST CALL    CACHED");
console.log("-".repeat(74));

let firstTotal = 0, cachedTotal = 0;
for (const r of rows) {
  const first = computeCostCents(model, { inputTokens: r.inTok, outputTokens: r.outTok, cacheWriteTokens: r.sysTok });
  const cached = computeCostCents(model, { inputTokens: r.inTok, outputTokens: r.outTok, cacheReadTokens: r.sysTok });
  firstTotal += first; cachedTotal += cached;
  console.log(
    r.label.padEnd(30) +
    String(r.sysTok).padStart(4) + String(r.inTok).padStart(5) + String(r.outTok).padStart(6) +
    `    $${usd(first).toFixed(4)}`.padStart(14) +
    `   $${usd(cached).toFixed(4)}`.padStart(11),
  );
}
console.log("-".repeat(74));
console.log(`average${" ".repeat(23)}` +
  `    $${(usd(firstTotal / rows.length)).toFixed(4)}`.padStart(29) +
  `   $${(usd(cachedTotal / rows.length)).toFixed(4)}`.padStart(11));

// ORALE additionally pays Whisper, per minute of audio.
console.log("\nORALE also pays for transcription (whisper-1, $0.006/min):");
for (const secs of [30, 60, 120]) {
  console.log(`  ${String(secs).padStart(3)}s of audio  →  $${usd(computeTranscriptionCostCents("whisper-1", secs)).toFixed(4)}`);
}

console.log("\n⚠️ *THE 'IF CACHED' COLUMN DOES NOT APPLY TODAY. Sonnet 4.6 will not cache a");
console.log("   prefix below ~2048 tokens and these system prompts measure ~520-630, so the");
console.log("   cache_control marker is inert — correctly placed, but doing nothing until the");
console.log("   rubric grows. PER CALL is the number to plan with.");
console.log("\n⚠️ ARITHMETIC, NOT MEASUREMENT. Tokens are approximated from characters at");
console.log(`   ~${CHARS_PER_TOKEN} chars/token; no model was called and no provider reported usage.`);
console.log("   The first real attempt writes true token counts to AICostLedger — read them there.");
