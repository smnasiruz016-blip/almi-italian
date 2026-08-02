# AlmiItalian

Honest CILS and CELI practice. Real task formats, scored on each exam's **own** scale — never
mixed — with a read-out that says what it is: a practice estimate, not a result. Only Siena
(CILS) and Perugia (CELI) award a certificate, and every scored surface says so.

Live at **almiitalian.almiworld.com**.

## The one thing to understand first

**Three scoring engines, kept apart.** They do not share thresholds, and a change to one must
never leak into another. `src/lib/scoring/`:

| Engine | Model | Pass rule |
|---|---|---|
| `cils-b1c` | CILS B1 Cittadinanza (flagship) | 4 sections /12, floor 7 in **every** one, **and** ≥28/48 overall, one sitting. Nothing banks. |
| `cils-standard` | CILS A1–QUATTRO | 5 sections /20, floor 11 each. **Capitalization**: you bank each section you clear and retake only the rest. |
| `celi` | CELI Impatto–5 | Scored **by part**: Written and Oral must each clear their own minimum. A–E band is an estimate. |

CEFR mapping (CVCL/Perugia): Impatto A1 · CELI 1 A2 · **CELI 2 B1** · CELI 3 B2 · CELI 4 C1 ·
CELI 5 C2. `npm run selftest:engine` asserts all of it (81 assertions).

## Grading is server-authoritative

Practice is marked by `/api/it/submit`, never in the browser.

- Items carry a stable id — `sha256({exam, level, section, title})`, which is also
  `ItalianItem`'s `@@unique` key, so one string names the bundled item **and** resolves the Neon
  row. See `src/lib/item-id.ts`.
- The served payload has **no** answer key. `RunnerItem` (in `src/lib/runner-items.ts`) is the
  authored shape minus the key, `toRunnerItem()` is the only way to produce one, and
  `@/lib/runner-items` imports nothing — which is what keeps the bank out of the client bundle.
- The request says which item and which option. The key, the scale and the verdict are all facts
  about the item and come from the server. `AttemptBody` in `src/lib/it/grade.ts` is the whole of
  what a client may assert.

## The bank is de-gamed as it loads

`src/lib/degame.ts` permutes options and moves keys with them, so the answer is not findable
from position. Deterministic — no `Math.random`, same bank always yields the same arrangement.
Numeric option sets are sorted by value instead of shuffled, and the free atoms in their buckets
are balanced around them.

It runs at load, not in the seed files, so what the checker measures and what the learner
receives are the same array. `RAW_BANK` is the authored bank; `BANK` is what ships.

## Coverage: 4 routed, 9 declared out of scope

The engines know 13 exam levels. `TRACKS` routes four. The other nine have a verified engine and
no item bank, and are listed as `OUT_OF_SCOPE` in `COVERAGE` (`src/lib/practice.ts`) with a
reason. `gate:coverage` fails the build if a level is in neither list — a level can be added to
an engine and forgotten, but it cannot be added and hidden.

## Gates

Every one is wired into `build`, so they block. Each was shown failing before it was trusted.

```
gate:fork-hygiene   no ancestor product's nouns in src/scripts/prisma
gate:bank           ≥15 items per module; CELI part flags correct
gate:item-id        ids exist, collide nowhere, round-trip through the loader
gate:serve          no key in any served payload; a forged body is ignored
gate:degame         answer position, dead position, longest-option cue
gate:coverage       every engine level is routed or declared out of scope
gate:security       the rate limiter refuses; the log redactor redacts
gate:real-entity    no real company named in item content
gate:titles         no module repeats an item title
```

## Local setup

```bash
cp .env.example .env      # then fill it in — every variable is documented there
npm install
npx prisma migrate deploy
npm run seed:batch1       # idempotent
npm run dev
```

`npm run build` runs every gate first. If it fails, read the gate output — it names the file and
the line.

## Layout

```
src/lib/scoring/     the three engines. Thresholds live here and nowhere else.
src/lib/items.ts     the authored bank (HOLDS THE KEY — keep out of client components)
src/lib/runner-items.ts  what the browser is allowed to see (imports nothing)
src/lib/item-id.ts   stable ids + the one place the key is stripped
src/lib/degame.ts    the answer-position transform
src/lib/it/grade.ts  server-authoritative marking
src/lib/seo/         the ~1.16M-page pSEO surface + its build-time exclusion tests
scripts/items/       the gates
scripts/seed/batch1/ authored item content, by track
```

## Honesty rules this product holds itself to

- Never present a practice read-out as an official result.
- Never mix one engine's scale into another's copy.
- Writing and Speaking are labelled estimates and are never auto-scored.
- Never name an exam centre, decree or figure we have not verified — `null` beats a plausible
  guess, and the gates enforce it (`gate:real-entity`, the SEO exclusion selftests).
