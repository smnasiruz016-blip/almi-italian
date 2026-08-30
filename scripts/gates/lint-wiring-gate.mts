// LINT WIRING GATE — the linter still lints, and the accessibility rules still fire.
//
// Run: npm run gate:lint-wiring   (wired into `build`, so it blocks)
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// This repo shipped `"lint": "next lint"` with no ESLint config and no ESLint package. In
// Next 16 the `lint` subcommand is gone, so that script parsed "lint" as a DIRECTORY:
//
//     Invalid project directory provided, no such directory: C:\...\almi-italian\lint
//
// It reads like a path problem, not a missing linter. Nothing in the build chain called it, so
// nobody saw it, and every accessibility rule the repo appeared to have had never run once.
// The count of a11y problems was not zero — it was UNKNOWN, which is a different thing that
// looks the same from a distance.
//
// The fix for that is a working linter. The fix for it happening AGAIN is this gate.
//
// ── WHY IT RUNS ESLINT INSTEAD OF READING THE CONFIG ────────────────────────
// Sabotage case E deleted the a11y rules from eslint.config.mjs and `npm run lint` stayed
// GREEN — correctly, because with the rules off there is nothing to report. A gate that greps
// the config for rule names would have caught that particular edit and nothing else: rules can
// be disabled by severity, by an overrides block, by an ignores pattern that swallows src/, or
// by a plugin that fails to register. Every one of those leaves the file looking right.
//
// So this gate feeds ESLint code it MUST reject and fails if it does not. That is the property
// worth having — not "the config mentions the rule" but "the rule fires".

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const failures: string[] = [];
const ok = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

console.log("LINT WIRING GATE — the linter lints, and the a11y rules fire\n");

// ── A. THE SCRIPT ACTUALLY INVOKES ESLINT ──────────────────────────────────
console.log("A. npm run lint reaches ESLint");
{
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>; devDependencies?: Record<string, string>; dependencies?: Record<string, string>;
  };
  const lint = pkg.scripts?.lint ?? "";
  ok(lint.length > 0, "package.json has no lint script at all");
  ok(/\beslint\b/.test(lint),
     `package.json scripts.lint is ${JSON.stringify(lint)}, which does not invoke eslint. This is the ` +
     `exact state this gate exists for: "next lint" looked like a linter for as long as anyone read ` +
     `it instead of running it.`);
  ok(!/\bnext\s+lint\b/.test(lint),
     `package.json scripts.lint calls "next lint". Next 16 removed that subcommand — it now parses ` +
     `"lint" as a directory name and fails with a message about a missing folder.`);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  ok("eslint" in deps, "eslint is not a dependency, so scripts.lint cannot run wherever the tree is installed clean");
  console.log(`  ✓ scripts.lint = ${JSON.stringify(lint)}, and eslint is a dependency`);
}

// ── B. THE RULES FIRE ON CODE THAT MUST BE REJECTED ────────────────────────
// Behavioural, not textual. Each probe is a file the a11y rules have to complain about.
console.log("\nB. the accessibility rules fire on code that must be rejected");
{
  const eslint = new ESLint({ cwd: ROOT });

  const probes: { name: string; rule: string; code: string }[] = [
    {
      name: "a div with a click handler and no keyboard path",
      rule: "jsx-a11y/click-events-have-key-events",
      code: `export default function P() { return <div onClick={() => {}}>x</div>; }`,
    },
    {
      name: "an invalid ARIA attribute",
      rule: "jsx-a11y/aria-props",
      code: `export default function P() { return <div aria-labelledbyy="x">y</div>; }`,
    },
    {
      name: "an <audio> element with no caption track",
      rule: "jsx-a11y/media-has-caption",
      code: `export default function P() { return <audio src="/a.mp3" />; }`,
    },
  ];

  for (const p of probes) {
    const res = await eslint.lintText(p.code, { filePath: join(ROOT, "src", "components", "__lint_probe__.tsx") });
    const hits = res.flatMap((r) => r.messages).filter((m) => m.ruleId === p.rule);
    ok(hits.length > 0,
       `${p.rule} did NOT fire on ${p.name}. The rule is off, shadowed by a later config block, or ` +
       `src/ has been swallowed by an ignores pattern. The linter can still exit 0 in every one of ` +
       `those cases, which is why this gate runs it rather than reading it.`);
    console.log(`  ${hits.length > 0 ? "✓" : "✗"} ${p.rule} — ${p.name}`);
  }

  // ── THE CONTROL. A rule that fires on everything is as useless as one that fires on nothing.
  const clean = `export default function P() { return <button type="button" onClick={() => {}}>x</button>; }`;
  const cleanRes = await eslint.lintText(clean, { filePath: join(ROOT, "src", "components", "__lint_probe__.tsx") });
  const cleanA11y = cleanRes.flatMap((r) => r.messages).filter((m) => (m.ruleId ?? "").startsWith("jsx-a11y/"));
  ok(cleanA11y.length === 0,
     `the a11y rules flagged a plain <button> with an onClick (${cleanA11y.map((m) => m.ruleId).join(", ")}). ` +
     `A check that fires on correct code teaches people to disable it.`);
  console.log(`  ✓ control: a correct <button onClick> is not flagged`);
}

if (failures.length) {
  console.error(`\n❌ LINT WIRING GATE FAILED — ${failures.length} violation(s):`);
  for (const f of failures) console.error("   • " + f);
  process.exit(1);
}
console.log("\n✅ lint-wiring gate: npm run lint reaches ESLint, and three accessibility rules were seen firing on code written to break them.");
