# Source record — the awarding bodies' own documents

Every number this product pins about an exam comes from one of the documents below. This file
records **which document, from where, fetched when, and what it hashed to** — so "up to date" is
a date somebody can check rather than a belief.

**The documents themselves are committed at `docs/sources/`**, under the filename in the first
column of each table. `scripts/gates/source-freshness-gate.mts` **re-hashes every one of them on
every build** and FAILS if a hash does not match, if a file is missing, or if a level is marked
`verified: true` with no document recorded against it. Age is the one soft signal: it **warns**
at 120 days and never fails, because Siena and CVCL publish when they publish.

> Evidence lives beside the check that asserts it. A hash in a file, with the bytes somewhere
> else, is a check that can never fail — which is how this record spent a month asserting a
> CELI 2 document that did not exist.

> ⚠️ This file records provenance. It does **not** change any pinned number. Where a document and
> the code disagree, or where a pinned number has no document behind it, that is written down
> below and left for a human — see "What the re-read found".

---

## CILS — Università per Stranieri di Siena

Re-read **2026-08-30**. Previous recorded read: 2026-07-05.

All three are committed at `docs/sources/` under the filename in the first column. The `url`
column records where the bytes came from; the committed copy is what the gate re-hashes.

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

**All seven are committed at `docs/sources/`.** Five were held from the previous read and hashed
from disk; two were downloaded on 2026-08-30. The five already on disk
were hashed from disk rather than re-downloaded, so they keep their original `fetched:` date.
`celi-2-valutazione.pdf` and `celi-2-a-valutazione.pdf` were downloaded on 2026-08-30 to close
Finding 1 below — they had never been fetched at all.

`celi-3-a-valutazione.pdf` was already on disk. It was re-downloaded and the bytes are
**identical** to the disk copy (`2baeb377…`), so the disk copy is genuine; it had simply never
been listed in `SOURCES.md`.

| document | held at | fetched | bytes | sha256 |
|---|---|---|---|---|
| `celi-i-a1-criteri-di-valutazione.pdf` | `docs/sources/` | 2026-07-05 | 615440 | `e46652dc9f3970a7cf56533026d8cbb0a3a1b4c7b166b36a7096afab65c782d3` |
| `celi-1-valutazione.pdf` | `docs/sources/` | 2026-07-05 | 204330 | `64d55c1d8111ff1801e2d4ab2f85cb37bc9f4d663c1d7630e40bdfff8cf25917` |
| `celi-2-valutazione.pdf` | `docs/sources/` | 2026-08-30 | 214375 | `0179afdd0b0e7bd62eca9bc2dbe443b8ed7500a4d1fe7a7e7d484d6a77143aa1` |
| `celi-2-a-valutazione.pdf` (sibling) | `docs/sources/` | 2026-08-30 | 214253 | `0a15bb57540afb22125c53dae3d59fd79f285b371ac53aaf8292e65a0840c31b` |
| `celi-3-a-valutazione.pdf` | `docs/sources/` | 2026-07-05 | 217173 | `2baeb377d182662b46b17251421bae8a71f9933d83e202064443116b97836f25` |
| `celi-4-valutazione.pdf` | `docs/sources/` | 2026-07-05 | 219648 | `3937fc88ae05290cd7d0b33b3903d4b8580ee13b420560991440ef0886624ce1` |
| `celi-5-valutazione.pdf` | `docs/sources/` | 2026-07-05 | 216527 | `b5b913253b295da6602c0203179b4cbbd1fe7d867847187552a8fbb7c007850a` |

**`almi-italian-data/` is no longer a dependency of anything here.** It was where these PDFs
used to live, and while they lived there no check could reach them — a second place to look, a
second thing to keep in sync, and a gate that could not read either. The copies under
`docs/sources/` are the ones that count.

Origin: `almi-italian-data/SOURCES.md` names
`www.unistrapg.it/sites/default/files/docs/certificazioni/` as the origin. The two new files
came from exactly that path:

- `https://www.unistrapg.it/sites/default/files/docs/certificazioni/celi-2-valutazione.pdf` → **200**
- `https://www.unistrapg.it/sites/default/files/docs/certificazioni/celi-2-a-valutazione.pdf` → **200**

Three other spellings were tried and returned **404** (`celi-2-b-valutazione.pdf`,
`celi-ii-b1-criteri-di-valutazione.pdf`, `celi-2-criteri-di-valutazione.pdf`), and
`celi-4-valutazione.pdf` was re-requested as a control and returned 200 — so the 404s are real
404s and the 200s are real documents, not an error page served with the wrong status.

### CELI level → source document

`gate:source-freshness` reads THIS table. Every level that `src/lib/scoring/celi.ts` marks
`verified: true` must appear here, and the document it names must appear in the hashed table
above. A level marked verified with no document behind it is a false claim in our own data, and
the gate **fails** on it — it does not warn.

| level | cefr | document |
|---|---|---|
| IMPATTO | A1 | `celi-i-a1-criteri-di-valutazione.pdf` |
| UNO | A2 | `celi-1-valutazione.pdf` |
| DUE | B1 | `celi-2-valutazione.pdf` |
| TRE | B2 | `celi-3-a-valutazione.pdf` |
| QUATTRO | C1 | `celi-4-valutazione.pdf` |
| CINQUE | C2 | `celi-5-valutazione.pdf` |

---

## What the re-read found

Two things, both **reported and not changed**.

### 1. ✅ RESOLVED 2026-08-30 — the missing CELI documents were fetched

**What was reported on 2026-08-30, first pass:** `src/lib/scoring/celi.ts` marked all six CELI
levels `verified: true`, while the verification record covered only four (A1, A2, C1, C2).
`DUE` — the only level `TRACKS` routes — had no `celi-2` PDF at all, and `TRE`'s numbers were
byte-identical to `QUATTRO`'s with its PDF on disk but unlisted. Identical is possible; it is
also what a copy looks like.

**Both are now closed with documents, not with reasoning.**

#### CELI 2 (`DUE`, B1) — fetched, and every number matches

`celi-2-valutazione.pdf`, sha256 `0179afdd…`, 214 375 bytes. `pdftotext -layout` recovers the
totals page in full:

| `celi.ts` field | value | the PDF says, verbatim | |
|---|---|---|---|
| `writtenMax` | 120 | *Punteggio della Prova Scritta — 120 punti* | ✅ |
| `oralMax` | 40 | *Punteggio della Prova Orale — 40 punti* | ✅ |
| `totalMax` | 160 | *Punteggio complessivo — 160 punti* | ✅ |
| `writtenMin` | 72 | *72 punti nella Prova scritta* | ✅ |
| `oralMin` | 22 | *22 punti nella Prova orale* | ✅ |
| `bands` A | 138–160 | *Punteggio compreso tra 138 e 160 punti — A = ottimo* | ✅ |
| `bands` B | 115–137 | *Punteggio compreso tra 115 e 137 punti — B = buono* | ✅ |
| `bands` C / `passFloor` | 94 | *Punteggio compreso tra 94 e 114 punti — C = sufficiente* | ✅ |
| `bands` D | 60–93 | *Punteggio compreso tra 60 e 93 punti — D = insufficiente* | ✅ |

**The numbers were right; the SOURCING was missing.** `verified: true` was a true statement
with nothing behind it, which is indistinguishable from a false one until somebody looks. It
now has a hashed document behind it and stays `true` — nothing in the engine changed, and no
learner's result moves.

#### CELI 3 (`TRE`, B2) — identical to CELI 4 because CVCL publishes it that way

`celi-3-a-valutazione.pdf`, sha256 `2baeb377…`. Re-downloaded from the recorded origin and
**byte-identical to the copy already on disk**, so the disk copy was genuine all along.

Its totals page reads *140 punti* / *60 punti* / *200 punti*, minima *84* and *33*, bands
*173–200 A*, *144–172 B*, *117–143 C*, *69–116 D* — every one of them what `TRE` holds. The
match with `QUATTRO` is not a copied row: **CELI 3 and CELI 4 genuinely publish the same
scale**, and that is now established from two separate documents rather than assumed from one.

#### What stops this recurring

`gate:source-freshness` now **FAILS** — not warns — when a level marked `verified: true` has no
document recorded against it in the level→document table above. Age is still a warning, because
Siena and CVCL do not publish on our release schedule and a gate that is red for weeks through
nobody's fault gets scrolled past. A missing source is not that: it is wrong today, it is fixable
today, and it was invisible for as long as nothing checked it.

### 2. ✅ CLOSED 2026-08-30 — the 7/12 floor is ours, and now says why

**The question, as it stood:** `Linee_guida_cils_pdf.pdf` p.18 §1.4.4.5 contains the fragment
*"…comprensione della lettura e di produzione scritta occorre ottenere il punteggio minimo di 7
punti"*, and 7 of 12 is exactly `CILS_B1C_FLOOR`. `pdftotext` recovers only the tails of those
sentences, so which exam the minimum belonged to was not readable by the tool. If it were B1
Cittadinanza, the product would have been under-claiming — calling a published benchmark ours.

**Nasir opened the source and settled it.** The ruling, recorded because the tool could not
reach it:

> Unistrasi's own `Criteri di valutazione B1 cittadinanza` gives **4 abilità × 12 = 48** and
> publishes **no sufficienza threshold at all**. The 11/20 + 55/100 floor that appears in the
> Linee guida belongs to the **five-skill standard CILS**, a different exam. Our 7/12 is a
> proportional derivation from it.

| | |
|---|---|
| B1 Cittadinanza criteria PDF | `https://cils.unistrasi.it/public/articoli/382/Criteri%20di%20valutazione%20B1%20cittadinanza_nuovi.pdf` — sha256 `a40ca44c…`, fetched 2026-08-30 |
| Linee guida (standard CILS) | `https://cils.unistrasi.it/public/articoli/52/Linee_guida_cils_pdf.pdf` — sha256 `40a4446a…`, fetched 2026-08-30 |

**The derivation, so the number is not arbitrary:** standard CILS requires **11 of 20** per
ability — 55%. B1 Cittadinanza scores **12** per ability. 55% of 12 is 6.6, and the floor is set
at the next whole point: **7 of 12**. That is a proportional carry-over from a *different exam's*
published threshold, which is precisely why it is ours and not Siena's.

The code already carried this derivation — `cils-b1c.ts` records the floor as *"AlmiItalian
practice benchmark, derived from CILS UNO–B1 Linee guida (11/20 per skill)"*. What was missing
was not the reasoning but the CONFIRMATION that Siena publishes no threshold of its own for this
module. That is what Nasir's reading supplies, and it is why nothing in the code changes.

🔴 **The product's wording does not change.** `src/lib/scoring/cils-b1c.ts` continues to say the
floor is *our practice benchmark, not a Siena-published pass mark*, and that stays exactly as it
is. The derivation explains where the number came from; it does **not** upgrade it to official.
Siena publishes no threshold for this module, so there is nothing to be official about.

**Also recorded:** `https://cils.unistrasi.it/1/119/I_punteggi.htm` returned **HTTP 500** when
checked on 2026-08-30 (both capitalisations; a third path returned 404). The B1c criteria PDF
was requested as a control in the same run and returned **200**, so the site is up and that one
page is broken — not a network fault at our end. Nasir reported the same 500 on 31 Aug. If a
future reader needs Siena's own punteggi page, it is down, not moved.

---

## How to update this file

1. Re-fetch the document, **write it into `docs/sources/` under the same filename**, and record
   its URL, the date, and `sha256sum` of the bytes you fetched. The gate re-hashes the committed
   file, so a record updated without the bytes goes RED rather than quietly out of date.
2. If the hash is unchanged, only the date moves — the numbers were not restated.
3. If the hash changed, read it and compare every pinned value before touching the date.
4. Keep the `fetched:` lines in the format the gate parses (`| … | YYYY-MM-DD | …`), or the gate
   stops seeing them and goes quiet — which is the one failure mode a warning-only gate has.
