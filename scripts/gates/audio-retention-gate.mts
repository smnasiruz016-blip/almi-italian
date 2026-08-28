// Audio retention gate — the promise on the privacy page is the number in the code, and the
// job that keeps it is actually scheduled.
//
//   npm run gate:audio-retention        (wired into `build`, so it blocks)
//
// Offline. Reads three files; makes no request and deletes nothing.
//
// ── WHY ─────────────────────────────────────────────────────────────────────
// Learner speaking clips are personal data. The product had a correct, owner-guarded cleanup
// route with a 30-day window — and nothing invoked it: `vercel.json` carried no `crons` key, so
// the schedule did not exist and every clip ever recorded was still in the blob store. The
// retention policy was real code that never ran.
//
// The second half is worse than the first: the privacy page listed accounts, attempts and
// Stripe identifiers, and said nothing about audio at all. A learner reading it would not learn
// that they are recorded, that the clip is uploaded, or that a transcript is produced by a third
// party. Code and policy are now checked against each other, because a retention promise is only
// worth the mechanism behind it — and a mechanism nobody promised is not a policy.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
let failed = false;
const fail = (m: string) => {
  console.error(`  ✗ ${m}`);
  failed = true;
};
const ok = (m: string) => console.log(`  ✓ ${m}`);
const check = (c: boolean, good: string, bad?: string) => (c ? ok(good) : fail(bad ?? good));

console.log("Audio retention gate — the promise, the code, and the schedule\n");

const CRON_PATH = "/api/cron/cleanup-audio";
const routeSrc = readFileSync(join(ROOT, "src", "app", "api", "cron", "cleanup-audio", "route.ts"), "utf8");
const privacySrc = readFileSync(join(ROOT, "src", "app", "privacy", "page.tsx"), "utf8");
const vercelJson = JSON.parse(readFileSync(join(ROOT, "vercel.json"), "utf8")) as {
  crons?: { path?: string; schedule?: string }[];
};

// ── A. THE JOB IS SCHEDULED ─────────────────────────────────────────────────
console.log("A. THE CLEANUP JOB IS ACTUALLY SCHEDULED");
{
  const crons = vercelJson.crons ?? [];
  const mine = crons.find((c) => c.path === CRON_PATH);
  check(crons.length > 0, `vercel.json declares ${crons.length} cron job(s)`,
    "vercel.json has no `crons` key — the cleanup route exists but nothing invokes it, so no clip is ever deleted");
  check(Boolean(mine), `${CRON_PATH} is scheduled${mine ? ` (${mine.schedule})` : ""}`,
    `${CRON_PATH} is not in vercel.json crons — the retention window is unenforced`);
  check(Boolean(mine?.schedule && /^[\d*/, -]+$/.test(mine.schedule)),
    "the schedule is a well-formed cron expression",
    `the schedule ${JSON.stringify(mine?.schedule)} does not look like a cron expression`);
}

// ── B. THE CODE ACTUALLY DELETES THE CLIP ───────────────────────────────────
// Nulling the column would leave the file in the blob store: the row would stop pointing at the
// learner's voice while the voice stayed exactly where it was.
console.log("\nB. THE JOB DELETES THE FILE, NOT JUST THE REFERENCE");
{
  check(/deleteAudio\(/.test(routeSrc), "the job calls deleteAudio() on the stored clip",
    "the job never calls deleteAudio — it would clear the database pointer and leave the audio in the blob store");
  check(/audioUrl: null/.test(routeSrc), "the job clears audioUrl once the file is gone",
    "the job does not clear audioUrl — a row would keep a URL that no longer resolves");
  const delAt = routeSrc.indexOf("deleteAudio(");
  const nullAt = routeSrc.indexOf("audioUrl: null");
  check(delAt !== -1 && nullAt !== -1 && delAt < nullAt,
    "the file is deleted before the pointer is cleared",
    "the pointer is cleared before the file is deleted — a crash between the two would orphan the clip with nothing left pointing at it");
}

// ── C. THE PROMISE MATCHES THE CODE ─────────────────────────────────────────
// The number a learner reads and the number the job enforces must be the same number.
console.log("\nC. THE PRIVACY PAGE STATES THE SAME WINDOW THE CODE ENFORCES");
{
  const m = routeSrc.match(/const RETENTION_DAYS = (\d+)/);
  check(Boolean(m), `the route defines RETENTION_DAYS${m ? ` = ${m[1]}` : ""}`,
    "RETENTION_DAYS is not defined in the cleanup route — this gate cannot compare anything");
  if (m) {
    const days = m[1];
    // Matched against the tag-stripped text, so no markup may appear in this pattern — an
    // earlier version required a literal "strong" here and failed on correct copy.
    const stated = new RegExp(`deleted after\\s*${days}\\s*days`, "i").test(
      privacySrc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
    );
    check(stated, `the privacy page tells the learner the clip is deleted after ${days} days`,
      `the privacy page does not state a ${days}-day deletion window — the code enforces ${days} days but the learner is told something else, or nothing`);
  }
}

// ── D. THE LEARNER IS TOLD WHAT HAPPENS AT ALL ──────────────────────────────
// Each of these was absent before. Named individually so removing any one goes red rather than
// quietly shrinking the disclosure.
console.log("\nD. THE DISCLOSURE COVERS WHAT ACTUALLY HAPPENS");
{
  const text = privacySrc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
  const required: [string, string][] = [
    ["the recording is mentioned at all", "record"],
    ["the clip is said to be uploaded/stored", "storage"],
    ["a transcript is disclosed", "transcript"],
    ["the third-party speech-to-text step is disclosed", "third-party speech-to-text"],
    ["the feedback is labelled an estimate, not a mark", "estimate"],
  ];
  let bad = 0;
  for (const [label, needle] of required) {
    if (!text.includes(needle)) {
      bad++;
      fail(`the privacy page no longer covers: ${label} (looked for "${needle}")`);
    }
  }
  if (!bad) ok(`the privacy page covers all ${required.length} disclosures`);
}

console.log("");
if (failed) {
  console.error("Audio retention gate FAILED\n");
  process.exit(1);
}
console.log("Audio retention gate passed\n");
