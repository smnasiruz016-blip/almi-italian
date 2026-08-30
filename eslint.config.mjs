// ESLint — flat config, because Next 16 removed `next lint`.
//
// ── WHAT THIS REPLACES ──────────────────────────────────────────────────────
// package.json carried `"lint": "next lint"`, and there was no ESLint config and no ESLint
// package anywhere in the tree. That script did not lint. In Next 16 the `lint` subcommand is
// gone, so `next lint` parses "lint" as a DIRECTORY and fails with:
//
//     Invalid project directory provided, no such directory: C:\Projects\almi-italian\lint
//
// which reads like a path problem rather than a missing linter. It is not in the build chain,
// so nobody ran it and nobody saw it. Every accessibility rule this repo appeared to have has
// therefore never executed once — the count of a11y problems was not zero, it was unknown.
//
// ── WHY THERE IS NO FlatCompat HERE ─────────────────────────────────────────
// The obvious first draft used FlatCompat to pull in the legacy "next/core-web-vitals" and
// "plugin:jsx-a11y/recommended" strings. Both crash ESLint 9 outright:
//
//     TypeError: Converting circular structure to JSON
//       property 'plugins' -> ... --- property 'react' closes the circle
//       at ConfigValidator.formatErrors (@eslint/eslintrc/lib/shared/config-validator.js:299)
//
// The compat layer stringifies the config to format a validation error, and the shared react
// plugin object closes a cycle. Both packages already ship FLAT configs — eslint-config-next
// v16 exports them from its subpaths, jsx-a11y since 6.10 — so the compat layer was never
// needed. It is not imported at all, which is why the crash cannot come back.
//
// ── SCOPE ───────────────────────────────────────────────────────────────────
// The accessibility rules are raised to ERROR: they are the reason the linter is here, and a
// warning inside a script nobody runs is the state this is fixing. Everything else keeps its
// default severity. This is a first run on a codebase that has never been linted, and turning
// on every stylistic rule at once produces a number so large it gets ignored — which is how a
// repo ends up with a lint script that does nothing.

import next from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "prisma/migrations/**",
      // Gates and seeds are Node scripts, not app code. They carry their own discipline — every
      // one of them is a check with controls — and none of them renders anything to a learner.
      "scripts/**",
    ],
  },
  ...next,
  {
    // The RULES only, not the plugin. eslint-config-next already registers jsx-a11y, and
    // spreading the plugin config on top of it fails with
    //     ConfigError: Config "jsx-a11y/recommended": Key "plugins": Cannot redefine plugin
    // so the recommended set is taken as rules and layered onto the registration Next made.
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // The rules this config exists for. A learner using a screen reader is either told the
      // answer was wrong or is not.
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
    },
  },
];

export default config;
