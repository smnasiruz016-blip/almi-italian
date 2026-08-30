# Gate red proofs — every gate seen failing on its own property

Run: `node scripts/proofs/gate-red-sweep.mjs` — never wired into `build`, because it edits source.

Measured 2026-08-31 against `origin/master` @ `e379d36`.

## Why this file exists

The standing rule is: **a gate that has never been seen red has not been tested.** Until it has
refused something, its green is a claim about the world made by a program nobody has watched
say no.

The population was counted before any of this was written — from the gates' own output, not
from a grep over their prose:

| | |
|---|---|
| gate steps in the build chain | **40** |
| steps that print a control of their own | **8** — `gate:item-id`, `gate:serve`, `gate:degame`, `gate:coverage`, `gate:security`, `gate:paywall`, `gate:trial-cap`, `gate:ai-ledger` |
| steps already driven red in earlier work | **3** — `gate:ai-cost` (#66), `gate:entitlement` (#65), `gate:served-copy` (#65) |
| **steps trusted on their own prose, never observed failing** | **29** |

Those 29 are the subject of this file.

## Result

**29 of 29 went red. Zero hollow gates. All 29 files restored byte-exact, and every gate went
green again on the restored file.**

Restore is a byte copy taken before the edit and verified by sha256 — deliberately **not**
`git checkout --`, which discards uncommitted work in the same path silently.

## Recount, 2026-08-30 — the chain has grown from 40 steps to 51

| | |
|---|---|
| chain steps | **51** |
| of them checks (`prisma generate` and `next build` are not) | **49** |
| **PROVEN RED on their own real property** | **43** |
| never seen red | **6** |

Counted from evidence rather than memory: the 29 rows below, the three driven in #64/#65/#66,
and the eleven proved since — `gate:numeric` (#68), `gate:admin-counting` (#71),
`gate:seed-bundle` (#73), `gate:option-category` and `gate:title-key` (#74),
`gate:lint-wiring` and `lint` (#76), `gate:source-freshness` (#77), and
`gate:trial-cap`, `gate:ai-ledger`, `gate:celi-pass-rule` (#80).

**None of the 29 files below has been edited since `7419376`**, so none of those proofs
is stale — checked with `git log 7419376..HEAD -- <file>` on every one, after validating
that the probe reports non-zero for files that DID change.

## 🔴 FINDING — six checks have never been seen red

**Not hollow.** Both hollowness modes were tested and neither is present:

- **no empty population** — the three most exposed guard against it explicitly. `gate:coverage`
  takes its denominator from the ENGINE (13 levels), not from its own list, and an OUT_OF_SCOPE
  entry must have no track, no items and a written reason. `gate:paywall` asserts
  `routeFiles.length > 20`, `population.length >= 4` and `excluded.length > 0`.
  `uniqueness-gate.mjs` pins `EXPECTED_ARTICLES` as a literal.
- **no unfalsifiable assertion** — `ok(true)`, `if (false)`, self-comparison: zero
  across all six. Assertion counts run 9 to 42.

They are also **not resting on prose**: five of the six run a control or a red proof *inside
themselves*. That is weaker than an external sabotage and much stronger than a claim.

| check | what it already does for itself |
|---|---|
| `gate:degame` | five RED proofs against a known-bad fixture, including *deGame() does NOT silence it* |
| `gate:serve` | RED proof — *scanner finds 433 key field(s), it can see keys* — plus driven marking |
| `gate:security` | drives the real rate limiter: limit 3, requests 4 and 5 refused, window expiry, bucket independence |
| `gate:paywall` | control — *the pin check fires on a sabotaged copy of src/lib/stripe.ts* |
| `gate:coverage` | prints its population: 4 routed, 9 out of scope, 13 engine levels |
| 🔴 `scripts/seo/uniqueness-gate.mjs` | **the weakest — no control, no recorded red, pinned counts only** |

**`uniqueness-gate.mjs` is the one to do next.** An empty corpus fails it, because the
expected counts are literals — but nothing has ever watched it refuse anything and it prints no
control at all.

**Left as a recorded finding on purpose.** A check that has not been seen red is a fact worth
writing down before anyone edits it; fixing it in the same pass would destroy the measurement.

## 🔴 What an external proof is worth — `gate:trial-cap`, #80

It was **GREEN** with `CONSECUTIVE_FAILURE_LIMIT` set to **999999** — a circuit breaker
that never trips, on the path that decides how much a failing provider can bill us.

The gate imported that constant and measured everything *relative* to it, so it tested at 999999
and was satisfied. A verifier that reads its expectation from the thing it is checking proves the
key, not the world.

The hole sat behind **41 assertions and 7 controls** for ten days, and only a sabotage of the
PRODUCT — never of the gate — found it. Both decided numbers (`CAP = 2`,
`CONSECUTIVE_FAILURE_LIMIT = 3`) are now pinned in the gate with the decision behind them.

## The third question — where does a check's EXPECTED value come from?

Nasir's, banked after `gate:trial-cap`. A check that imports its threshold from the
code it checks proves that code is **self-consistent**, never that it is **right** — and no
hollowness audit can see it, because the population is real and every assertion can fail.

Applied read-only to the six never seen red. **Importing the SUBJECT is not the same as importing
the EXPECTATION**: a gate must load the bank to examine it. The question is whether the number it
compares against comes from a literal or from the thing under test.

| check | imports | verdict |
|---|---|---|
| 🔴 `gate:security` | `LIMITS` from `src/lib/rate-limit` | **the shape that caught trial-cap** |
| ⚠️ `gate:coverage` | `COVERAGE`, `TRACKS` from `src/lib/practice` | its own list — but every claim is cross-checked |
| ✅ `gate:serve` | `BANK`, `TRACKS`, `ATOM` | the POPULATION, not an expectation |
| ✅ `gate:degame` | `BANK`, `RAW_BANK` | the POPULATION, not an expectation |
| ✅ `gate:paywall` | nothing from src | walks the filesystem; pins its own literals |
| ✅ `scripts/seo/uniqueness-gate.mjs` | nothing | `EXPECTED_ARTICLES` is a literal |

### 🔴 `gate:security` — named, not fixed

It imports the rate limits and checks only that each is in a RANGE:

```
if (!(l.limit > 0 && l.limit < 1000 && l.windowMs > 0)) fail(...)
ok(`${Object.keys(LIMITS).length} configured limit(s), all finite and positive`)
```

The DECIDED numbers are not pinned. `login: { limit: 8, windowMs: 60_000 }` — eight
attempts a minute, chosen because *"a human mis-types a password once or twice, not ten times a
minute"* — could become `limit: 900` and the gate stays GREEN: 900 is above 0 and below
1000, and the count of configured limits is unchanged. A login limit of 900 a minute is not a
limit.

This is exactly the `gate:trial-cap` shape and it is left **unfixed on purpose**, as
briefed. The remedy is the same one applied there: pin the decided values with their reasons, and
keep the range check as a floor rather than as the whole test.

### ⚠️ `gate:coverage` — imports its own list, and survives the question

It loads `COVERAGE`, the very list it validates. That would be circular except that
every claim is settled against something else: the denominator is the ENGINE's level set (13),
not the list; a ROUTED entry must be backed by a real bank; and an OUT_OF_SCOPE entry must have
**no track, no items and a written reason**. The list cannot exempt a live level by asserting
that it is not one.

## The table

| # | gate | sabotage (its own property) | RED? | why it said no | restored |
|---|---|---|---|---|---|
| 1 | `gate:fork-hygiene` | a banned ancestor noun in a string literal | **RED** | FORK HYGIENE GATE FAILED — ancestor content found | bytes-ok + GREEN |
| 2 | `seo:test` | one tier-1 descent country removed | **RED** | 7 Tier-1 decree countries (got 6) | bytes-ok + GREEN |
| 3 | `selftest:engine` | CILS standard floor moved 11/20 → 12/20 | **RED** | 20 FAILED, 130 passed | bytes-ok + GREEN |
| 4 | `gate:status-band` | default BORDERLINE width widened 1 → 3 | **RED** | an unknown scale falls back to the narrow band — got 3, expected 1 | bytes-ok + GREEN |
| 5 | `gate:exam-verdict` | CELI 2 written-part minimum lowered 72 → 70 | **RED** | CELI DUE: written 71 (one under) fails — got true, expected false | bytes-ok + GREEN |
| 6 | `gate:contrast` | a foreground token lightened below its WCAG threshold | **RED** | #f0c8c0 on #fffaf3 is 1.47:1 — needs 4.5:1 | bytes-ok + GREEN |
| 7 | `gate:jsx-space` | a trailing space after `</strong>` in an entity-bearing tail that continues next line | **RED** | ProgressSection.tsx:3 — Turbopack trims that space, so it will not reach the page | bytes-ok + GREEN |
| 8 | `gate:criterion-band` | 1 point reads as NON_RAGGIUNTO instead of PARZIALE | **RED** | 1/1 — got "NON_RAGGIUNTO", expected "RAGGIUNTO" | bytes-ok + GREEN |
| 9 | `gate:derived-verdict` | per-criterion accumulation no longer clamps to the official ceiling | **RED** | rubric.ts: a criterion could exceed its own ceiling | bytes-ok + GREEN |
| 10 | `validate:batch1` | a WRITING item's authored criteria emptied **in the seed source** | **RED** | 1 FAILED, 790 passed | bytes-ok + GREEN |
| 11 | `gate:bank` | one item deleted so a bucket falls to 14 | **RED** | Rule #7: module(s) below the minimum | bytes-ok + GREEN |
| 12 | `gate:item-id` | two items in one module given the same {exam,level,section,title} | **RED** | both hash to the same stable id | bytes-ok + GREEN |
| 13 | `gate:real-entity` | a tier-1 real brand name placed in an item title | **RED** | an invented document names a real company | bytes-ok + GREEN |
| 14 | `gate:titles` | a title repeated inside one module | **RED** | one module has two items with the same title | bytes-ok + GREEN |
| 15 | `gate:ascolto-audio` | a manifest entry pointed at a clip that is not on disk | **RED** | manifest url does not match its id | bytes-ok + GREEN |
| 16 | `gate:honesty` | the renderer stops referencing the estimate disclaimer | **RED** | EstimateReport.tsx renders estimates but never references ESTIMATE_DISCLAIMER | bytes-ok + GREEN |
| 17 | `gate:ai-e2e` | the band enum loosened so an invented band parses | **RED** | an unknown band is REJECTED (failed) | bytes-ok + GREEN |
| 18 | `gate:marking` | the NFD accent fold removed | **RED** | did NOT accept "e stato scritto" for key "è stato scritto" | bytes-ok + GREEN |
| 19 | `gate:reveal` | a protected field rendered in a component that never uses the chokepoint | **RED** | PracticeComposer.tsx renders audioScript but never uses `<RevealAfterSubmit>` | bytes-ok + GREEN |
| 20 | `gate:content:full` | a /guides redirect pointed at a page that does not exist | **RED** | an indexed URL 301ing to a 404 | bytes-ok + GREEN |
| 21 | `gate:static-shell` | unknown slugs allowed to render on demand | **RED** | does not set dynamicParams = false | bytes-ok + GREEN |
| 22 | `gate:token:full` | a numeric token made to resolve to prose | **RED** | `{{CILS_B1C_SECTION_MAX}}` renders "twelve", expected "12" | bytes-ok + GREEN |
| 23 | `gate:webhook-idempotency` | a failed handler no longer releases its claim | **RED** | the route never calls releaseClaim — a failed handler would block every retry | bytes-ok + GREEN |
| 24 | `gate:billing-health` | the rate limit removed from a route that makes three live Stripe calls | **RED** | the route does NOT rate-limit | bytes-ok + GREEN |
| 25 | `gate:spend-limits` | the per-hour spend limit removed from a metered AI route | **RED** | configured but never used: aiScritta | bytes-ok + GREEN |
| 26 | `gate:audio-retention` | the 30-day deletion disclosure removed from the privacy page | **RED** | the code enforces 30 days but the learner is told something else | bytes-ok + GREEN |
| 27 | `gate:speaking-claims` | the confidence threshold put back to 0.7 | **RED** | good Italian speech trips it and the warning becomes noise | bytes-ok + GREEN |
| 28 | `gate:summary-consistency` | the summary-contradiction retry branch removed at BOTH sites | **RED** | nothing branches on `bad === "summary-contradiction"` | bytes-ok + GREEN |
| 29 | `gate:sidebar` | a sidebar item pointed at a route that does not render | **RED** | "Choose a Test" points at /nowhere | bytes-ok + GREEN |

## Four sabotages that missed first, and why that matters

Three gates and one more looked hollow until the sabotage was read properly. **A sabotage that
misses is not evidence of a hollow gate until you have read why it missed** — and each of these
turned out to be the gate behaving correctly:

| gate | the miss | what it actually showed |
|---|---|---|
| `gate:fork-hygiene` | banned noun put in a **comment** | the gate strips comments before scanning — "read CODE, not prose". Correct, and documented. |
| `gate:jsx-space` | trailing space at **end of line** with nothing after it | the check is deliberately scoped to tails carrying an HTML entity, because 13 other sites have the bare shape and keep their space in the build. The shape alone is not the bug. |
| `validate:batch1` | the **JSON bundle** edited | this selftest reads the TS seed under `scripts/seed/batch1/`, not the served bundle. |
| `gate:real-entity` | brand "Microsoft" used | the gate knows 48 brands and says so in its own output. It cannot see one that is not on its list. |

One miss was a genuine weakness in the sabotage design rather than the gate: renaming
`ESTIMATE_LABEL` did not red `gate:honesty`, because the gate **imports that same constant** and
was comparing it to itself. The label's real protection — that the renderer must reference the
disclaimer — does red, and that is what row 16 breaks.

## 🔴 The planted-item run: three bad items, caught by nothing

Bank sha256 before and after: `bf22adc474ad3cff9e072ce0544b6d12bac6e8f26e15c80c918636959f037227` —
**byte-identical**.

All three plants went into one real item, `CILS_B1C / B1C / LETTURA`, *"Avviso del comune: orari
dell'anagrafe"*, whose passage states **"Il giovedì l'ufficio è chiuso."**

| plant | what was changed | caught by |
|---|---|---|
| **(a) wrong answer key** | `answerIndex` 2 → 0: the key now says "Lunedì", a day the passage says the office is **open** | 🔴 **nothing — all 39 gates passed** |
| **(b) two options, one meaning** | option 3 "Venerdì" → "Di giovedì": options 2 and 3 both name Thursday, so the item has two correct answers | 🔴 **nothing — all 39 gates passed** |
| **(c) the stem gives the answer away** | stem → *"Il giovedì l'ufficio è chiuso. In quale giorno l'ufficio è chiuso?"* — answerable without reading the passage | 🔴 **nothing — all 39 gates passed** |

### What that means, stated plainly

AlmiPrep closed this criterion at **"0 wrong items in 2,254 active over 9 rules, and a planted
item produced 3 findings."** Italian's planted items produce **0 findings**. The bar is not met.

The 40 gates are real and all of them can fail — that is what the table above proves. But every
one of them checks **structure**: counts, ids, shapes, wiring, copy, scoring arithmetic,
retention, redirects, palettes. **Not one of them reads the Italian and asks whether it is true.**

Named, not softened — this product's quality blind spots are:

1. **No gate verifies an answer key against its own stimulus.** A key can point at any option.
2. **No gate detects semantically equivalent distractors.** Options are compared as strings, so
   "Giovedì" and "Di giovedì" are two different options as far as every check is concerned.
3. **No gate detects an answer disclosed by its own stem.** `gate:reveal` protects `audioScript`
   and `guidanceNote` from reaching the DOM early; it says nothing about a stem that contains
   its own answer.
4. **No gate checks that the Italian is correct Italian** — grammar, agreement, or register.
5. **`gate:real-entity` is bounded by a list and says so**: "A brand absent from those lists is
   NOT detected." That honesty is good; the coverage is still a list.

A sixth, found while running this and not previously recorded: **nothing in the build compares
the served bundle `src/data/items-batch1.json` against the TS seed it is generated from.**
`scripts/seed/_gen_bank_json.mjs` produces it, but the generator is not in the build chain and
no gate asserts the two agree — so a hand-edit to the bundle, or a stale bundle after a seed
edit, ships unnoticed. Row 10 above is the same fact from the other side: emptying a WRITING
item's criteria in the **seed** reds `validate:batch1`, while doing it in the **bundle** does
not.

## What this file does NOT claim

- It does not claim the bank is correct. It claims the opposite is currently undetectable.
- It does not claim these 29 sabotages are the only way each gate can fail — one property each,
  chosen as the one the gate exists for.
- `gate:served-copy` is excluded from the planted-item run: it reads `.next`, and a bank plant
  cannot change build output produced before the plant existed.
