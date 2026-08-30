// SEED / BUNDLE GATE — the shipped bank is the one nobody can quietly replace.
//
// Run: npm run gate:seed-bundle   (wired into `build`, so it blocks)
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// src/data/items-batch1.json is what the product serves. scripts/seed/batch1/ is what authors
// read. scripts/seed/_gen_bank_json.mjs turns the second into the first — and until this gate,
// nothing in the build compared them. So the two drifted: two fixes landed on the bundle
// (#38's 80-120 word windows, #39's dialogue dashes) and never reached the seed, and running
// the generator would have silently reverted both.
//
// Every content gate in this repo was pointed at ONE side. validate:batch1 and gate:bank read
// the seed; gate:token:full and gate:ascolto-audio read the bundle. All four were green while
// the two disagreed on sixteen items. A gap between two checked things is not checked by
// checking each of them harder.
//
// ── WHAT IT ASSERTS ─────────────────────────────────────────────────────────
//   A  the drift is EXACTLY the recorded set — no new item may start drifting, and a synced
//      item must be removed from the record in the same commit
//   B  docs/seed-bundle-drift.md names every recorded id, so the two records cannot separate
//   C  the generator still REFUSES to run without its override — proven by running it and
//      checking the bundle did not move, not by reading the file for a comment
//
// ── WHAT IT DOES NOT ASSERT ────────────────────────────────────────────────
// Which side is correct. That is a content decision. This gate freezes the disagreement so it
// cannot grow or be resolved by accident; docs/seed-bundle-drift.md records what it is.

import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BATCH1_ITEMS } from "../seed/batch1/index";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BUNDLE = join(ROOT, "src", "data", "items-batch1.json");
const GENERATOR = join("scripts", "seed", "_gen_bank_json.mjs");
const DOC = "docs/seed-bundle-drift.md";

const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

const idOf = (i: { exam: string; level: string; section: string; title: string }) =>
  createHash("sha256").update([i.exam, i.level, i.section, i.title].join("|")).digest("hex").slice(0, 16);

/** The disagreement as it stands today, recorded so it can neither grow nor vanish unnoticed.
 *  Remove a row here, from docs/seed-bundle-drift.md, and from the seed, in ONE commit. */
const KNOWN_DRIFT: Record<string, string[]> = {
  e34e14048cbd6353: ["minWords", "maxWords"], // Email all'ufficio anagrafe per un certificato
  d8c0ab63aabdc9a9: ["minWords", "maxWords"], // Messaggio al padrone di casa
  "51a49fd3ecdd0351": ["minWords", "maxWords"], // Lettera per disdire un abbonamento
  e19588c430b8645d: ["minWords", "maxWords"], // Modulo di reclamo alle poste
  "65a226186e8920d3": ["minWords", "maxWords"], // Richiesta di appuntamento al CAF
  f911dfb5a92ad81a: ["minWords"], //             Lettera di presentazione per un lavoro
  d3ae6382cba425d6: ["minWords", "maxWords"], // Messaggio alla maestra: assenza del figlio
  "6c6f3ffd1c213c19": ["minWords", "maxWords"], // Biglietto ai vicini: lavori in casa
  a11a0b8b13b12ac3: ["minWords", "maxWords"], // Email alla scuola per la mensa
  aceb87dde0b06705: ["minWords", "maxWords"], // Email all'ASL per disdire una visita
  ad21e7fa55e146e9: ["minWords", "maxWords"], // Segnalazione al comune: lampione rotto
  "2c2f5f98e5356fbc": ["minWords", "maxWords"], // Messaggio al datore di lavoro: cambio turno
  "774d42568571e917": ["minWords", "maxWords"], // Risposta a un annuncio di affitto
  d0b673c049ad8948: ["minWords"], //             Richiesta di permesso per un esame
  f14a2e78156acec7: ["minWords"], //             Racconto: il mio primo mese in Italia
  b804f7e059375576: ["audioScript"], //          Conversazione al bar: le ordinazioni
};

console.log("SEED / BUNDLE GATE — the shipped bank cannot be quietly replaced\n");

// ── THE POPULATION, COUNTED FIRST ──────────────────────────────────────────
const seed = BATCH1_ITEMS as unknown as Record<string, unknown>[];
const bundle = JSON.parse(readFileSync(BUNDLE, "utf8")) as Record<string, unknown>[];
const key = (i: Record<string, unknown>) => `${i.exam}|${i.level}|${i.section}|${i.title}`;

console.log("population");
console.log(`  authored seed items : ${seed.length}`);
console.log(`  shipped bundle items: ${bundle.length}`);
console.log(`  recorded drift      : ${Object.keys(KNOWN_DRIFT).length}`);
ok(seed.length > 200, `only ${seed.length} seed item(s) — the import is not reaching the bank`);
ok(bundle.length > 200, `only ${bundle.length} bundle item(s) — the bundle is not being read`);
ok(Object.keys(KNOWN_DRIFT).length > 0,
   `KNOWN_DRIFT is empty. If the seed really is synced, delete this gate's section A and the ` +
   `guard in ${GENERATOR} — but an empty record with a live disagreement is a vacuous gate.`);

// ── A. THE DRIFT IS EXACTLY WHAT IS RECORDED ───────────────────────────────
const shipped = new Map(bundle.map((i) => [key(i), i]));
const live = new Map<string, string[]>();
for (const s of seed) {
  const b = shipped.get(key(s));
  if (!b) { live.set(idOf(s as never), ["MISSING FROM BUNDLE"]); continue; }
  if (JSON.stringify(s) === JSON.stringify(b)) continue;
  const sp = (s.payload ?? {}) as Record<string, unknown>;
  const bp = (b.payload ?? {}) as Record<string, unknown>;
  const fields = [...new Set([...Object.keys(sp), ...Object.keys(bp)])]
    .filter((f) => JSON.stringify(sp[f]) !== JSON.stringify(bp[f]));
  for (const f of new Set([...Object.keys(s), ...Object.keys(b)])) {
    if (f !== "payload" && JSON.stringify(s[f]) !== JSON.stringify(b[f])) fields.push(f);
  }
  live.set(idOf(s as never), fields.sort());
}
for (const b of bundle) if (!seed.some((s) => key(s) === key(b))) live.set(idOf(b as never), ["ONLY IN SEED-LESS BUNDLE"]);

console.log(`\nA. the drift is exactly the recorded set (${live.size} live, ${Object.keys(KNOWN_DRIFT).length} recorded)`);
const titleOf = new Map(bundle.map((i) => [idOf(i as never), i.title as string]));
for (const [id, fields] of live) {
  const known = KNOWN_DRIFT[id];
  if (!known) {
    failures.push(
      `NEW DRIFT: ${id} "${titleOf.get(id) ?? "?"}" now differs on [${fields.join(", ")}] and is not in ` +
      `KNOWN_DRIFT. Either the seed and the bundle were edited apart — fix that — or this is a ` +
      `deliberate new divergence, in which case record it here and in ${DOC} with a reason.`,
    );
    continue;
  }
  ok(JSON.stringify(known.slice().sort()) === JSON.stringify(fields),
     `${id} "${titleOf.get(id) ?? "?"}" drifts on [${fields.join(", ")}] but is recorded as ` +
     `[${known.join(", ")}] — the disagreement changed shape`);
}
for (const id of Object.keys(KNOWN_DRIFT)) {
  ok(live.has(id),
     `${id} no longer drifts — the seed was synced for it. Good: remove it from KNOWN_DRIFT here ` +
     `and from the table in ${DOC}, in this commit, so the record does not go stale.`);
}
console.log(`  ${failures.length === 0 ? "✓" : "✗"} every drifting item is recorded, and every recorded item still drifts`);

// ── B. THE DOC AND THE GATE CANNOT SEPARATE ────────────────────────────────
console.log("\nB. the written record names every recorded id");
{
  ok(existsSync(join(ROOT, "docs", "seed-bundle-drift.md")), `${DOC} is missing — the drift has no written record`);
  const doc = existsSync(join(ROOT, "docs", "seed-bundle-drift.md")) ? readFileSync(join(ROOT, "docs", "seed-bundle-drift.md"), "utf8") : "";
  const absent = Object.keys(KNOWN_DRIFT).filter((id) => !doc.includes(id));
  ok(absent.length === 0, `${DOC} does not name ${absent.length} recorded id(s): ${absent.join(", ")}`);
  console.log(`  ${absent.length === 0 ? "✓" : "✗"} ${Object.keys(KNOWN_DRIFT).length} recorded id(s) all appear in ${DOC}`);
}

// ── C. THE GENERATOR REFUSES — PROVEN BY RUNNING IT ────────────────────────
// Read for a comment and you prove a comment exists. Run it and you prove it refuses.
console.log("\nC. the generator refuses without its override");
{
  const before = createHash("sha256").update(readFileSync(BUNDLE)).digest("hex");
  const bak = join(ROOT, ".seed-bundle-gate.bak");
  copyFileSync(BUNDLE, bak);
  let code = 0, out = "";
  try {
    execSync(`npx tsx ${GENERATOR.split("\\").join("/")}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ALMI_REGENERATE_BANK: "" } });
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    code = err.status ?? 1;
    out = (err.stdout ?? "") + (err.stderr ?? "");
  }
  const after = createHash("sha256").update(readFileSync(BUNDLE)).digest("hex");
  // Restore first, whatever happened, so a failing assertion cannot leave a rewritten bundle.
  copyFileSync(bak, BUNDLE);
  try { writeFileSync(bak, ""); } catch { /* best effort */ }
  try { (await import("node:fs")).unlinkSync(bak); } catch { /* best effort */ }

  ok(code !== 0, `${GENERATOR} exited 0 with no override set — the guard is gone or bypassed`);
  ok(after === before, `${GENERATOR} REWROTE the bundle despite the guard — the shipped bank is not protected`);
  ok(/REFUSING TO REGENERATE/.test(out), `${GENERATOR} failed but not with its refusal message — it may be failing for an unrelated reason, which is not the same protection`);
  console.log(`  ✓ exits ${code}, leaves the bundle byte-identical, and says why`);
  // The control: a check that only asserted "exit != 0" would pass on a syntax error. The
  // message assertion above is what distinguishes refusing from merely breaking.
  ok(out.includes(String(Object.keys(KNOWN_DRIFT).length)),
     `the refusal message does not state the live drift count — it is a fixed string, not a measurement`);
  console.log(`  ✓ control: the refusal states the live count, so the message cannot go stale`);
}

if (failures.length) {
  console.error("\n❌ SEED / BUNDLE GATE FAILED — " + failures.length + " violation(s):");
  for (const f of failures.slice(0, 10)) console.error("   • " + f);
  if (failures.length > 10) console.error(`   … and ${failures.length - 10} more`);
  process.exit(1);
}
console.log(
  `\n✅ seed-bundle gate: ${seed.length} authored vs ${bundle.length} shipped items, ` +
  `${live.size} drifting and all ${Object.keys(KNOWN_DRIFT).length} of them recorded in ${DOC}; ` +
  `the generator refuses without its override and leaves the bundle untouched. Which side is ` +
  `correct is NOT decided here.`,
);
