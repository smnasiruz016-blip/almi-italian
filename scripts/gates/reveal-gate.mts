// REVEAL GATE — nothing that would answer the question for the learner is on the page while
// the attempt is still open.
//
//   npm run gate:reveal
//
// ── THE DEFECT THIS CLOSES ──────────────────────────────────────────────────
// PracticeRunner rendered the ASCOLTO "Show transcript" control with no `submitted` guard, while
// every answer input already had one. A learner could read the listening script and answer from
// it — a listening item silently became a reading item. That is a construct leak, and it is the
// same family as leaking the key: the learner's score stops measuring what it claims to.
//
// Fixing the one control is not enough, because the next component to render a transcript will
// be written by someone who never saw this. So there is now exactly ONE component that reveals
// attempt-hidden content, and this gate enforces both halves of that:
//
//   A  THE CHOKEPOINT BEHAVES  RevealAfterSubmit renders nothing before submission
//   B  NOBODY BYPASSES IT      no other component names a protected field in JSX
//   C  THE LIST IS HONEST      a field is protected only if hiding it is right
//
// ── WHAT IS **NOT** PROTECTED, AND WHY THAT MATTERS ─────────────────────────
// A LETTURA `passage` is the STIMULUS — the learner is meant to read it, and gating it would
// break the item. `prompt`, `title`, `options` likewise. Over-protecting is not the safe
// direction here; it silently removes the question.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

let failed = false;
const fail = (m: string) => { console.error(`  ✗ ${m}`); failed = true; };
const ok = (m: string) => console.log(`  ✓ ${m}`);

console.log("Reveal gate — no attempt-hidden content on the page during an attempt\n");

/** Fields that reveal what the learner is being asked to perceive or produce. */
const PROTECTED = ["audioScript", "guidanceNote"] as const;
/** The single component allowed to render them. */
const CHOKEPOINT = "src/components/RevealAfterSubmit.tsx";

const walk = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : /\.tsx$/.test(e.name) ? [join(dir, e.name)] : [],
      )
    : [];
const norm = (f: string) => f.split("\\").join("/");
/** Read CODE, not prose — this gate is documented in the very files it scans. */
const code = (f: string) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const all = walk("src").map(norm);
if (all.length === 0) fail("no .tsx files found — this gate is looking in the wrong place");

// ── A. THE CHOKEPOINT BEHAVES ───────────────────────────────────────────────
// Proven by CALLING it, not by reading it. A component that merely looks guarded is how the
// original leak survived review.
console.log("A. the chokepoint returns nothing before submission:");
{
  if (!existsSync(CHOKEPOINT)) fail(`${CHOKEPOINT} does not exist — has the chokepoint moved?`);
  else {
    const { RevealAfterSubmit } = await import("../../src/components/RevealAfterSubmit");
    const hidden = RevealAfterSubmit({ submitted: false, label: "x", children: "SEGRETO" });
    const shown = RevealAfterSubmit({ submitted: true, label: "x", children: "SEGRETO" });
    if (hidden !== null) fail("RevealAfterSubmit rendered something with submitted=false");
    else ok("submitted=false renders null — the content is not in the DOM at all");
    if (shown === null) fail("RevealAfterSubmit rendered NOTHING with submitted=true — it would hide review material forever");
    else ok("submitted=true does render");
    // The RED direction, stated: if it returned null in both cases the first check would pass
    // and mean nothing.
    if (hidden === null && shown === null) fail("RED PROOF FAILED — it renders null in both states, so 'hidden' proves nothing");
  }
}

// ── B. NOBODY BYPASSES IT ───────────────────────────────────────────────────
console.log("\nB. no component renders a protected field outside the chokepoint:");
{
  let bad = false;
  for (const f of all) {
    if (f === CHOKEPOINT) continue;
    const src = code(f);
    for (const field of PROTECTED) {
      // A JSX render of the field: `{p.audioScript}`, `{it.guidanceNote}`, `{x.audioScript}`.
      const rendered = new RegExp(`\\{\\s*[A-Za-z_$][\\w$]*\\.${field}\\s*\\}`, "g");
      const hits = src.match(rendered) ?? [];
      if (!hits.length) continue;
      // Allowed only when this file hands it to the chokepoint.
      if (!/<RevealAfterSubmit[\s>]/.test(src)) {
        bad = true;
        fail(`${f} renders ${field} (${hits[0]}) but never uses <RevealAfterSubmit> — the guard can be forgotten here`);
      } else {
        console.log(`       ok  ${f} renders ${field} via the chokepoint`);
      }
    }
  }
  if (!bad) ok(`${PROTECTED.length} protected field(s) reach the page only through ${CHOKEPOINT}`);
}

// ── C. THE LIST IS HONEST ───────────────────────────────────────────────────
// A protected list that grew to cover the stimulus itself would "pass" while removing the
// question. These must NEVER be protected.
console.log("\nC. the protected list does not swallow the stimulus:");
{
  const MUST_STAY_VISIBLE = ["passage", "prompt", "options", "task", "instruction", "parts", "criteria"];
  const overreach = MUST_STAY_VISIBLE.filter((f) => (PROTECTED as readonly string[]).includes(f));
  if (overreach.length) fail(`these are the QUESTION, not the answer, and must not be gated: ${overreach.join(", ")}`);
  else ok(`${MUST_STAY_VISIBLE.length} stimulus field(s) deliberately left visible`);
  if (PROTECTED.length === 0) fail("the protected list is empty — this gate is checking nothing");
}

console.log("");
if (failed) {
  console.error("Reveal gate FAILED");
  console.error("  Content the learner should not see during an attempt is reachable on the page.\n");
  process.exit(1);
}
console.log("Reveal gate passed\n");
