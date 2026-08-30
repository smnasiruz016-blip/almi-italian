# Seed / bundle drift — what differs, and which side ships

Measured 2026-08-30 against `origin/master` @ `7419376`.
Recomputed on every build by `scripts/gates/seed-bundle-gate.mts`.

## The situation, in one line

`scripts/seed/batch1/` is the authored source. `src/data/items-batch1.json` is the bundle the
product serves. **They disagree on 16 items, and the bundle is the correct one.**

## Why that is the wrong way round, and how it happened

`scripts/seed/_gen_bank_json.mjs` generates the bundle from the seed. It is not in the build
chain, and no gate compared the two — so when two fixes were applied to the bundle, nothing
required the seed to receive them, and nothing noticed that it had not.

Both fixes are documented, deliberate, and each has a gate standing over the bundle:

| fix | where it came from | what asserts it |
|---|---|---|
| CILS_B1C writing items target **80–120 words** | **PR #38** — *"Items showed 'target 40-80' and the estimate flagged an answer for passing 80. Unistrasi says 'Prova a tema (80 - 120 parole)'… a learner trained to 40-80"* is trained to fail | `gate:token:full` — *"all 15 CILS_B1C writing items carry 80-120 words"* |
| One ASCOLTO script carries **Italian dialogue dashes** | **PR #39** — the dashes mark speaker turns so the renderer gives each its own voice instead of reading four speakers as one narrator | `gate:ascolto-audio` — the voice plan must reproduce the manifest's segment count |

**Measured, not argued.** Put the regenerated bundle in place and run the chain:

```
gate:token:full     FAIL — 15/15 CILS_B1C writing item(s) do not carry 80-120 words
gate:ascolto-audio  FAIL — 0a9daba1a9d6374e: manifest records 4 segment(s) but the plan produces 1
validate:batch1     PASS
gate:bank           PASS
```

The last two stay green because they read the **seed**, not the bundle. That asymmetry is how
the drift survived: every content gate was pointed at one side or the other, and none at the gap.

## The 16 items

### 15 × CILS_B1C / B1C / SCRITTA — word window

The bundle ships 80–120 for all fifteen. The seed still carries the pre-#38 windows.

| id | item | field | seed (authored) | bundle (**SHIPPED**) |
|---|---|---|---|---|
| `e34e14048cbd6353` | Email all'ufficio anagrafe per un certificato | minWords / maxWords | 40 / 80 | **80 / 120** |
| `d8c0ab63aabdc9a9` | Messaggio al padrone di casa | minWords / maxWords | 40 / 80 | **80 / 120** |
| `51a49fd3ecdd0351` | Lettera per disdire un abbonamento | minWords / maxWords | 60 / 100 | **80 / 120** |
| `e19588c430b8645d` | Modulo di reclamo alle poste | minWords / maxWords | 60 / 100 | **80 / 120** |
| `65a226186e8920d3` | Richiesta di appuntamento al CAF | minWords / maxWords | 50 / 90 | **80 / 120** |
| `f911dfb5a92ad81a` | Lettera di presentazione per un lavoro | minWords | 70 | **80** |
| `d3ae6382cba425d6` | Messaggio alla maestra: assenza del figlio | minWords / maxWords | 40 / 80 | **80 / 120** |
| `6c6f3ffd1c213c19` | Biglietto ai vicini: lavori in casa | minWords / maxWords | 40 / 80 | **80 / 120** |
| `a11a0b8b13b12ac3` | Email alla scuola per la mensa | minWords / maxWords | 60 / 100 | **80 / 120** |
| `aceb87dde0b06705` | Email all'ASL per disdire una visita | minWords / maxWords | 60 / 100 | **80 / 120** |
| `ad21e7fa55e146e9` | Segnalazione al comune: lampione rotto | minWords / maxWords | 60 / 100 | **80 / 120** |
| `2c2f5f98e5356fbc` | Messaggio al datore di lavoro: cambio turno | minWords / maxWords | 60 / 100 | **80 / 120** |
| `774d42568571e917` | Risposta a un annuncio di affitto | minWords / maxWords | 60 / 100 | **80 / 120** |
| `d0b673c049ad8948` | Richiesta di permesso per un esame | minWords | 70 | **80** |
| `f14a2e78156acec7` | Racconto: il mio primo mese in Italia | minWords | 70 | **80** |

Three of the fifteen differ on `minWords` alone; their `maxWords` was already 120 in the seed.

### 1 × CILS_STANDARD / UNO / ASCOLTO — audio script

`b804f7e059375576` — *"Conversazione al bar: le ordinazioni"*, field `audioScript`.

```
seed    Allora, io prendo un cappuccino e un cornetto. Per me invece solo un caffè, grazie. Io ho
        fame, prendo un tramezzino e una spremuta d'arancia. E tu, Giulia? Io un tè caldo e una
        fetta di torta.

bundle  — Allora, io prendo un cappuccino e un cornetto. — Per me invece solo un caffè, grazie.
        — Io ho fame, prendo un tramezzino e una spremuta d'arancia. E tu, Giulia? — Io un tè
        caldo e una fetta di torta.
```

Same words; the bundle adds the Italian dialogue dash before each speaker's turn. The renderer
splits on those dashes to assign voices, so without them the item is four people read by one.

## What this document does NOT decide

**Which side is right for the future is a content decision, not a tooling one, and it is not
made here.** What is established is only which side *ships today* and what happens if the
generator runs: the shipped values are the gated ones, and regenerating loses them.

Two of the fifteen word windows are worth a second look by whoever does the sync — 70→80 is a
smaller move than 40→80, and whether every one of the fifteen genuinely belongs at the same
80–120 window is an authoring question this file deliberately leaves open.

## The way out

1. Bring `scripts/seed/batch1/` up to the bundle for these 16 items — or consciously reject a
   bundle value and change both sides together.
2. Delete the corresponding row from `KNOWN_DRIFT` in `scripts/gates/seed-bundle-gate.mts` and
   from the table above, in the same commit. The gate asserts the two lists agree, so neither
   can go stale on its own.
3. When the list reaches zero, the guard in `scripts/seed/_gen_bank_json.mjs` retires itself —
   it computes the drift live, so no drift means the generator runs with no flag.

Until then the generator refuses. That refusal is the point; it is not a bug to route around.
