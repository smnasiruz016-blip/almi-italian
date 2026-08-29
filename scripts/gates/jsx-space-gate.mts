// JSX SPACE GATE — a space after an inline element must survive the bundler.
//
// Run: npm run gate:jsx-space   (wired into `build`, so it blocks)
//
// WHAT HAPPENED
// /account served this, in both progress sections, to every learner:
//
//     Ogni punteggio qui è una stimadel nostro strumento, non un risultato ufficiale…
//
// That sentence is the one telling a learner the number is an estimate and not an official
// result. The source was correct:
//
//     Ogni punteggio qui è una <strong className="font-semibold">stima</strong> del nostro
//     strumento, non un risultato ufficiale dell&apos;ente d&apos;esame.
//
// The space is right there. It was the BUNDLER that removed it. Next 16 builds with Turbopack,
// and Turbopack trims the leading space of a multi-line JSX text node that follows an element.
// Verified four ways rather than argued: the production DOM had innerHTML "</strong>del nostro"
// (so the space was already gone in the markup, not lost at paint); the local .next chunk
// reproduced it; the source map in that same chunk showed the source still had the space; and
// esbuild and standalone SWC both KEEP it, which is why compiling with either "proved" the
// source was fine and proved nothing about what ships.
//
// THE SHAPE, AND WHY THIS IS A SOURCE CHECK
// Only the multi-line form breaks. All on one line is safe; a text node that starts with a
// space and then wraps to the next line is not:
//
//     ...</strong> del nostro          <-- the line ENDS here and the sentence continues
//                 strumento, non...
//
// The rule is checked in the SOURCE rather than in .next, because gates run before `next build`
// and a check that needs the build output cannot block the build that produces it. It is also
// the more durable place: the shape is a dependency on transform behaviour, and it is wrong to
// rely on regardless of which bundler is current.
//
// The fix at both sites is an explicit {" "} — a space that is a child in its own right and
// that no transform is free to trim.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];

const INLINE = "strong|em|span|b|i|a|code|abbr|small|mark";
// A closing inline tag, then a space, then text that runs to the END of the line — meaning the
// text node continues on the next line. The line must not end in a tag or an expression, which
// is what makes it a continuing text node rather than a finished one.
const RISKY = new RegExp(`</(?:${INLINE})>[ \\t]+[^\\s<{][^\\n]*$`);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e === ".next") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith(".tsx")) out.push(p);
  }
  return out;
}

let filesScanned = 0;
for (const abs of walk(join(root, "src"))) {
  filesScanned++;
  const rel = relative(root, abs).split(String.fromCharCode(92)).join("/");
  const lines = readFileSync(abs, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, "");
    const trimmed = line.trimEnd();
    // A line ending in a tag or an expression has closed its text node; only a bare text tail
    // continues onto the next line.
    if (/[>}]$/.test(trimmed)) continue;
    if (!RISKY.test(trimmed)) continue;
    // NARROWED TO WHAT IS EVIDENCED, NOT TO WHAT IS SUSPECTED.
    // The shape alone is not enough: 13 other sites in this repo have it and every one of them
    // keeps its space in the build output, checked chunk by chunk. Both sites that DID lose it
    // carried an HTML entity in the same text node - dell&apos;ente and Stripe&rsquo;s - and the
    // 13 that survived carry none. So the entity is required here too.
    // WHY THAT IS A CORRELATION AND NOT A MECHANISM: three hand-verified points support it and
    // nothing explains it. A gate that fired on the bare shape would have raised 13 false
    // positives on its first run, and a gate people have to argue with gets switched off.
    // If a site without an entity is ever found broken, widen this and delete this paragraph.
    // The entity must be in the text node AFTER the closing tag, not merely somewhere on the
    // line. page.tsx:137 reads "You&apos;d bank <strong>…</strong> today" — the entity sits
    // BEFORE the element, in a different text node, and that space survives the build. Scoping
    // this to the tail is what tells the two apart.
    const tail = trimmed.slice(trimmed.lastIndexOf(">", trimmed.length) + 1);
    const node = tail + " " + (lines[i + 1] ?? "");
    if (!/&[a-z]+;|&#[0-9]+;/.test(node)) continue;
    failures.push(
      `${rel}:${i + 1} — a space after an inline element ends the line and the sentence continues ` +
      `on the next. Turbopack trims that space, so it will not reach the page. Use {" "} instead.` +
      `\n       ${trimmed.trim().slice(0, 100)}`,
    );
  }
}

// A walk that reaches nothing proves nothing. This product has well over thirty .tsx files; a
// scan reporting zero defects across three of them would be a scan that had quietly stopped
// working, which is how an earlier version of this check reported "0" while failing to compile
// a single file.
if (filesScanned < 20) {
  failures.push(`only ${filesScanned} .tsx files scanned — the walk is not reaching src/`);
}

if (failures.length) {
  console.error("\n❌ JSX SPACE GATE FAILED — " + failures.length + " site(s):");
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log(
  `✅ jsx-space gate: ${filesScanned} .tsx files scanned; no space after an inline element is ` +
  `left for the bundler to trim.`,
);
