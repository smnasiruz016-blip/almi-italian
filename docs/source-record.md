# Source record — the awarding bodies' own documents

Every number this product pins about an exam comes from one of the documents below. This file
records **which document, from where, fetched when, and what it hashed to** — so "up to date" is
a date somebody can check rather than a belief.

`scripts/gates/source-freshness-gate.mts` reads the `fetched:` dates here and **warns** (never
fails) once one passes 120 days.

> ⚠️ This file records provenance. It does **not** change any pinned number. Where a document and
> the code disagree, or where a pinned number has no document behind it, that is written down
> below and left for a human — see "What the re-read found".

---

## CILS — Università per Stranieri di Siena

Re-read **2026-08-30**. Previous recorded read: 2026-07-05.

| document | url | fetched | http | bytes | sha256 |
|---|---|---|---|---|---|
| `Criteri di valutazione B1 cittadinanza_nuovi.pdf` | `https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza_nuovi.pdf` | 2026-08-30 | 200 | 98125 | `a40ca44cff8adfe13fe24b20d35226d9f5f1d0ceb482ed90eb67e654fa81fa67` |
| `Criteri di valutazione B1 cittadinanza.pdf` (older sibling) | `https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza.pdf` | 2026-08-30 | 200 | 77314 | `f542ad812c7d023f9907e9d8892e3afa612f721ba0885dfbd5a95e430879a98a` |
| `Linee_guida_cils_pdf.pdf` | `https://cils.unistrasi.it/public/articoli/52/Linee_guida_cils_pdf.pdf` | 2026-08-30 | 200 | 618086 | `40a4446a50acbc8d93f53f1c0bd6bdde2d26e06ee2b755e49541f7a9141e0224` |

### What the criteria PDF says, verbatim

```
TEST DI ASCOLTO
  Prova n. 1  Test a scelta multipla composto da 6 item     Punteggio massimo: punti 6
  Prova n. 2  Test vero/Falso composto da 12 item           Punteggio massimo: punti 6

TEST DI COMPRENSIONE DELLA LETTURA E RIFLESSIONE GRAMMATICALE
  Prova n. 1  Test vero/Falso composto da 12 item           Punteggio massimo: punti 6
  Prova n. 2  Test a completamento con scelta multipla … 6 item   Punteggio massimo: punti 6

TEST DI PRODUZIONE SCRITTA
  Prova a tema (80 - 120 parole)                            Punteggio massimo: punti 12
    a) efficacia comunicativa: fino a punti 3
    b) adeguatezza stilistica: fino a punti 1
    c) correttezza morfosintattica: fino a punti 4
    d) adeguatezza e ricchezza lessicale: fino a punti 3
    e) ortografia e punteggiatura: fino a punti 1

TEST DI PRODUZIONE ORALE
  Prova a tema (80 - 120 parole)                            Punteggio massimo: punti 12
    a) efficacia comunicativa: fino a punti 4
    b) correttezza morfosintattica: fino a punti 4
    c) adeguatezza e ricchezza lessicale: fino a punti 3
    d) pronuncia e intonazione: fino a punti 1
```

The two B1-cittadinanza PDFs differ in **exactly two lines**: the older one calls the 12-item
tests *"Test a individuazione di informazioni"*, the newer one *"Test vero/Falso"*. **No number
differs between them.**

### Pinned values, checked against that text

| pinned in the repo | value | the PDF says | match |
|---|---|---|---|
| `CILS_B1C_SECTION_MAX` | 12 | 6 + 6 per objective section; 12 per productive section | ✅ |
| `CILS_B1C_TOTAL_MAX` | 48 | 4 sections × 12 | ✅ |
| SCRITTA criteria (`official-rubrics.ts`) | 3 / 1 / 4 / 3 / 1 | a) 3 b) 1 c) 4 d) 3 e) 1 | ✅ |
| ORALE criteria | 4 / 4 / 3 / 1 | a) 4 b) 4 c) 3 d) 1 | ✅ |
| B1C writing word window (`gate:token:full`) | 80–120 | *"Prova a tema (80 - 120 parole)"* | ✅ |

---

## CELI — CVCL, Università per Stranieri di Perugia

**Not re-fetched on 2026-08-30.** The CVCL site answers (`cvcl.it` → 200, `unistrapg.it` → 200)
but the criteria PDFs are held locally from the previous read and were hashed from disk instead
of re-downloaded. Their `fetched:` date is therefore the original one.

| document | held at | fetched | bytes | sha256 |
|---|---|---|---|---|
| `celi-i-a1-criteri-di-valutazione.pdf` | `almi-italian-data/celi-pdfs/` | 2026-07-05 | 615440 | `e46652dc9f3970a7cf56533026d8cbb0a3a1b4c7b166b36a7096afab65c782d3` |
| `celi-1-valutazione.pdf` | `almi-italian-data/celi-pdfs/` | 2026-07-05 | 204330 | `64d55c1d8111ff1801e2d4ab2f85cb37bc9f4d663c1d7630e40bdfff8cf25917` |
| `celi-3-a-valutazione.pdf` | `almi-italian-data/celi-pdfs/` | 2026-07-05 | 217173 | `2baeb377d182662b46b17251421bae8a71f9933d83e202064443116b97836f25` |
| `celi-4-valutazione.pdf` | `almi-italian-data/celi-pdfs/` | 2026-07-05 | 219648 | `3937fc88ae05290cd7d0b33b3903d4b8580ee13b420560991440ef0886624ce1` |
| `celi-5-valutazione.pdf` | `almi-italian-data/celi-pdfs/` | 2026-07-05 | 216527 | `b5b913253b295da6602c0203179b4cbbd1fe7d867847187552a8fbb7c007850a` |

Source: `almi-italian-data/SOURCES.md` names
`www.unistrapg.it/sites/default/files/docs/certificazioni/` as the origin.

---

## What the re-read found

Two things, both **reported and not changed**.

### 1. 🔴 The one CELI level the product routes has no document behind it

`src/lib/scoring/celi.ts` marks **all six** CELI levels `verified: true`. The verification record
`almi-italian-data/celi-numerics-verified.md` covers **four**: A1 Impatto, A2 CELI 1, C1 CELI 4,
C2 CELI 5. Its own summary table lists exactly those four.

**CELI 2 (B1 = `DUE`) is not in that table, and there is no `celi-2` PDF in `celi-pdfs/`.** The
record accounts for it in one clause — *"Consistent with already-locked DUE (B1=CELI 2) and TRE
(B2=CELI 3)"* — which asserts a previous verification without naming a document or a date.

`DUE` is the **only** CELI level `TRACKS` routes. So the level a learner can actually sit is the
one whose numbers (written 120, oral 40, total 160, minima 72 / 22, pass 94, bands 138/115/94/60)
rest on a sentence rather than on a hashed file.

`TRE` is in the same position with a twist: `celi-3-a-valutazione.pdf` **is** on disk, but it is
not listed under Task 4 in `SOURCES.md` and `TRE`'s numbers are byte-identical to `QUATTRO`'s
(140 / 60 / 200, 84 / 33, 117, identical bands). Identical is possible. It is also what a copy
looks like. Neither is established here.

**Nothing was changed.** Fixing this means someone fetching the CELI 2 and CELI 3 criteria PDFs
and either confirming the six numbers or correcting them — content work, with a real document.

### 2. 🟡 The B1-cittadinanza floor may be published after all

`src/lib/scoring/cils-b1c.ts` states, as a written rationale:

> *"NOT OFFICIAL — OURS, DERIVED. Unistrasi publishes the 48-point total and the per-criterion
> weights for this module, but NO pass mark and NO per-section floor: not in the criteria PDF…"*

That claim holds for the **criteria** PDF — it carries no floor, confirmed above.

But the **Linee guida** PDF, page 18 §1.4.4.5 *"L'attribuzione dei punteggi"*, contains this
sentence fragment, extracted verbatim:

```
comprensione della lettura e di produzione scritta occorre ottenere il punteggio minimo di 7 punti.
```

immediately beside a fragment describing the four-ability, twelve-points-per-ability structure —
which is the B1 Cittadinanza shape:

```
lettura, produzione scritta, produzione orale), viene attribuito un punteggio massimo di 12 punti per ciascuna
```

**7 out of 12 is exactly `CILS_B1C_FLOOR`.**

I could not settle it. `pdftotext` recovers only the tails of these sentences on that page —
each subject clause is in a layer the extractor drops — so **which level the 7-point minimum
belongs to is not readable by the tool**. It may be the standard CILS levels, not B1
Cittadinanza.

If it *is* B1 Cittadinanza, the product is currently **under-claiming**: telling learners a
benchmark is ours when Siena publishes it. That is the safe direction to be wrong in, which is
why nothing was changed on a guess.

**What settles it:** a human opening page 18 of `Linee_guida_cils_pdf.pdf`
(sha256 `40a4446a…`) and reading §1.4.4.5 with their eyes.

---

## How to update this file

1. Re-fetch the document. Record its URL, the date, and `sha256sum` of the bytes you fetched.
2. If the hash is unchanged, only the date moves — the numbers were not restated.
3. If the hash changed, read it and compare every pinned value before touching the date.
4. Keep the `fetched:` lines in the format the gate parses (`| … | YYYY-MM-DD | …`), or the gate
   stops seeing them and goes quiet — which is the one failure mode a warning-only gate has.
