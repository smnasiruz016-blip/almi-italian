// Serve gate — the answer key does not reach the browser, and the server does the marking.
//
// Run: npm run gate:serve   (wired into `build`, so it blocks)
//
// Covers the three things that were all false before this branch:
//
//   A2  the served payload carries no key          → scan every served item, deeply
//   A1  the mark is computed from the server key   → forge a body and watch it be ignored
//   A3  the scale and verdict are server-derived   → they are not in the request at all
//
// ── HOW THE RED IS PROVED ───────────────────────────────────────────────────
// The leak scanner is run against the AUTHORED item first, where the key demonstrably is, and
// the gate FAILS if it comes back clean. Only then is it run against the served item. So a green
// verdict means "a scanner that finds keys found none", not "a scanner that finds nothing found
// nothing" — which is the same sentence to a reader and the opposite fact.

import { BANK, itemsFor, isMcq, isMatching, isOrdering, isCloze } from "../../src/lib/items";
import { stableItemId, toRunnerItem } from "../../src/lib/item-id";
import { gradeAttempt, markItem } from "../../src/lib/it/grade";
import { TRACKS } from "../../src/lib/practice";
import { ATOM } from "../../src/lib/runner-items";

let failed = false;
const fail = (msg: string) => { console.error(`  ✗ ${msg}`); failed = true; };
const pass = (msg: string) => console.log(`  ✓ ${msg}`);

console.log("Serve gate — no key in the payload, no marking in the client\n");

// ── the scanner ─────────────────────────────────────────────────────────────
// Walks any value and reports every path holding a field that IS a key. Deep, because a shallow
// check passes happily on `{ payload: { questions: [{ answerIndex: 2 }] } }`.
const KEY_FIELDS = new Set(["answerIndex", "answerMap", "correctOrder", "answer", "correctValue"]);
function findKeyFields(value: unknown, path = "$"): string[] {
  const out: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...findKeyFields(v, `${path}[${i}]`)));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (KEY_FIELDS.has(k) && v !== undefined) out.push(`${path}.${k}`);
      out.push(...findKeyFields(v, `${path}.${k}`));
    }
  }
  return out;
}

// ── RED PROOF ───────────────────────────────────────────────────────────────
console.log("RED proofs:");
{
  const authored = BANK.filter((it) => isMcq(it.payload) || isMatching(it.payload) || isOrdering(it.payload) || isCloze(it.payload));
  const leaks = authored.flatMap((it) => findKeyFields(it.payload));
  if (leaks.length === 0) {
    fail("RED PROOF FAILED — the scanner found no key field in the AUTHORED bank, where every objective item has one. It is blind; the clean result below would mean nothing.");
  } else {
    pass(`scanner finds ${leaks.length} key field(s) in the authored bank (it can see keys)`);
  }
}

// ── A2. NO KEY IN ANY SERVED ITEM ───────────────────────────────────────────
console.log("\nA2 — served payloads:");
{
  let leaked = 0;
  for (const it of BANK) {
    const served = toRunnerItem(it);
    const leaks = findKeyFields(served);
    if (leaks.length) {
      fail(`"${it.title}" (${it.exam}/${it.level}/${it.section}) serves ${leaks.join(", ")}`);
      leaked++;
    }
  }
  if (leaked === 0) pass(`${BANK.length} served item(s): no answerIndex, answerMap, correctOrder or answer anywhere in the payload`);

  // Belt and braces: the serialised form the browser actually receives. A getter or a prototype
  // field would slip past a key walk and still land in the JSON.
  const serialisedLeaks = BANK
    .map((it) => [it.title, JSON.stringify(toRunnerItem(it))] as const)
    .filter(([, json]) => /"(answerIndex|answerMap|correctOrder|answer)"\s*:/.test(json));
  if (serialisedLeaks.length) {
    for (const [title] of serialisedLeaks) fail(`"${title}" serialises a key field into the JSON the browser receives`);
  } else {
    pass("the serialised JSON of every served item is free of key fields");
  }
}

// ── A1. THE MARK COMES FROM THE SERVER-HELD KEY ─────────────────────────────
console.log("\nA1 — marking:");
{
  // A real objective item to work with.
  const item = itemsFor("CILS_B1C", "B1C", "ASCOLTO").find((i) => isMcq(i.payload))!;
  const id = stableItemId(item);
  const p = item.payload;
  if (!isMcq(p)) throw new Error("fixture item is not MCQ");
  const key = p.questions[0].answerIndex;
  const wrong = (key + 1) % p.questions[0].options.length;

  // 1. The right answer marks correct; a different one does not. The baseline.
  const right = markItem(id, item, { [ATOM.mcq(0)]: String(key) })[0];
  const notRight = markItem(id, item, { [ATOM.mcq(0)]: String(wrong) })[0];
  if (!right.correct || notRight.correct) fail("marking does not distinguish the keyed option from another one");
  else pass("the keyed option marks correct and another option does not");

  // 2. A FORGED BODY. The client claims a score, a key, and that it was right. AttemptBody has
  //    no such fields, so this is what an attacker sends, not what the app sends — cast through
  //    unknown to say so out loud.
  const forged = {
    items: [{
      itemId: id,
      answers: { [ATOM.mcq(0)]: String(wrong) },
      // everything below is the forgery
      correct: 99, total: 99, percent: 100, answerIndex: wrong, correctValue: String(wrong),
      scaled: { score: 99, max: 99, floor: 0, status: "CLEAR" },
    }],
    correct: 99, total: 99, percent: 100, exam: "CELI", level: "DUE", section: "ORALE",
    scaled: { score: 99, max: 99, floor: 0, status: "CLEAR" },
  } as unknown as Parameters<typeof gradeAttempt>[0];

  const graded = gradeAttempt(forged);
  if (!graded.ok) {
    fail(`forged body was refused outright (${graded.error}) — expected it to be marked with the forgery ignored`);
  } else {
    const q0 = graded.marks.find((m) => m.atom === ATOM.mcq(0))!;
    if (q0.correct) fail("A1 FAILED — the forged `correct`/`answerIndex` made a wrong answer mark correct");
    else pass("forged correct/answerIndex/correctValue ignored: the wrong answer still marks wrong");
    if (graded.percent === 100) fail("A1 FAILED — the client's claimed percent was used");
    else pass(`forged percent ignored: server computed ${graded.percent}% from ${graded.correct}/${graded.total}`);
    if (graded.exam !== item.exam || graded.section !== item.section) {
      fail(`A1 FAILED — the client's claimed exam/section was used (got ${graded.exam}/${graded.section})`);
    } else {
      pass(`forged exam/level/section ignored: derived ${graded.exam}/${graded.level}/${graded.section} from the items`);
    }
    // A3: the scale is the engine's, not the body's.
    const track = TRACKS.find((t) => t.exam === item.exam && t.level === item.level)!;
    if (graded.scaled && (graded.scaled.max !== track.scale!.max || graded.scaled.floor !== track.scale!.floor)) {
      fail(`A3 FAILED — scaled max/floor ${graded.scaled.max}/${graded.scaled.floor} is not the engine's ${track.scale!.max}/${track.scale!.floor}`);
    } else {
      pass(`A3: scale ${graded.scaled?.max}/${graded.scaled?.floor} and verdict "${graded.scaled?.status}" came from the engine, not the request`);
    }
  }

  // 3. An id that names nothing must fail loudly, not score zero.
  const unknown = gradeAttempt({ items: [{ itemId: "0000000000000000", answers: {} }] });
  if (unknown.ok) fail("an unknown itemId was scored instead of refused — a typo would read as a failed section");
  else if (unknown.status !== 404) fail(`unknown itemId returned ${unknown.status}, expected 404`);
  else pass("an unknown itemId is refused with 404 rather than marked zero");

  // 4. Items from two different sections in one post must be refused, not scored against
  //    whichever the client would prefer.
  const other = itemsFor("CILS_B1C", "B1C", "LETTURA")[0];
  const mixed = gradeAttempt({ items: [{ itemId: id, answers: {} }, { itemId: stableItemId(other), answers: {} }] });
  if (mixed.ok) fail("a post spanning two sections was scored — the client chose what it was measured on");
  else pass("a post spanning two sections is refused");

  // 5. Writing / Speaking have no key; scoring them 0/0 would present an unmarked section as
  //    a marked one.
  const writing = itemsFor("CILS_B1C", "B1C", "SCRITTA")[0];
  const est = gradeAttempt({ items: [{ itemId: stableItemId(writing), answers: {} }] });
  if (est.ok) fail("a Produzione scritta post was 'marked' — it has no answer key");
  else pass("a Produzione scritta post is refused rather than scored");
}

console.log("");
if (failed) {
  console.error("Serve gate FAILED\n");
  process.exit(1);
}
console.log("Serve gate passed\n");
