# AlmiItalian — Data Groundwork SOURCES

Phase 0 (parse + lock real counts). Accessed **2026-07-05**. Working folder `C:\Projects\almi-italian-data\`.

---

## TASK 1 — USTAT universities + courses

Portal: **dati-ustat.mur.gov.it** — Open Data dell'istruzione superiore (MUR).

| File | Direct URL | Licence |
|---|---|---|
| Atenei | `.../resource/820aefe6-0662-4656-84ec-d8859a2a3b7e/download/atenei.csv` | see dual-note below |
| Classi di Laurea | `.../resource/6755c8e6-dfa0-4605-a401-674a7b431edb/download/classidilaurea.csv` | IODL 2.0 |
| Offerta formativa 2010–2024 | `.../resource/c0e63906-7190-4568-892b-0cf399f56071/download/corsidilaurea_2010-2024.csv` | IODL 2.0 |

(base = `https://dati-ustat.mur.gov.it/dataset/bed0c71e-9f86-4a0f-a266-963b6f7bbbd2`)

### ⚠️ LICENCE DUAL-NOTE (record on page-footer, MEXT/KCUE pattern)
- **Portal-wide:** the dataset portal declares **Italian Open Data Licence v2.0 (IODL 2.0)** — https://www.dati.gov.it/content/italian-open-data-license-v20 — requires **attribution** of the source (MUR – Ufficio di Statistica / USTAT).
- **Atenei resource specifically:** its own resource metadata declares **Public Domain** (`w3id.org/italia/controlled-vocabulary/licences/A1_PublicDomain`), no attribution mandated.
- **Footer obligation to carry:** *"Fonte: MUR – Ufficio di Statistica (USTAT), dati-ustat.mur.gov.it — Licenza IODL 2.0."* (Atenei table is Public Domain but attributing it too is harmless and consistent.)
- Atenei resource last updated **2025-02-14**. Offerta formativa spans validity years 2010→2024.

## Wikidata (CC0 enrichment merge)
- Endpoint: `https://query.wikidata.org/sparql` — SPARQL (universities in Italy: `P31/P279* Q3918`, `P17 Q38`). Query saved `wd.rq`.
- Licence: **CC0** (public domain). Result saved `wikidata/it-universities-wikidata.csv` (395 entities).

---

## TASK 2 — Art. 1-bis interministerial decree (Tier-1 corridor)

- **Decreto interministeriale 17 novembre 2025** — MAECI + Interno + Lavoro.
- **Gazzetta Ufficiale Serie Generale n. 273 del 24-11-2025**, codice redazionale **25A06275**.
- GU landing (metadata; full text is JS/PDF-gated to WebFetch): https://www.gazzettaufficiale.it/eli/id/2025/11/24/25A06275/SG
- Legal basis: DL 36/2025 (conv. **Legge 74/2025**) Art. 1-bis → Art. 27 co. 1-octies D.Lgs. 286/1998 (TU Immigrazione).
- Country list corroborated by two government sources:
  - lavoro.gov.it — https://www.lavoro.gov.it/notizie/pagine/discendenti-di-italiani-ingressi-lavoro-fuori-quota-da-alcuni-paesi
  - integrazionemigranti.gov.it — id/4513
- ⚠️ Verbatim Art. 1 text + full per-country AIRE figures require the **GU full decree body** (manual save `raw/decreto-25A06275.txt` — NOT yet present at time of this pass).

---

## TASK 3 — CILS + CELI exam-center footprint

- **CELI (CVCL, Univ. per Stranieri di Perugia):** centri convenzionati page — https://cvcl.unistrapg.it/pagine/centri-desame-convenzionati-celi-000
  - ITALIA list PDF (API stream, guid 79b01573-…): `Elenco centri ITALIA.pdf` → `centers/celi-centri-italia.pdf`
  - ESTERO list PDF (API stream, guid ee5382dd-…): `Elenco centri ESTERO.pdf` → `centers/celi-centri-estero.pdf`
  - Both **updated 19-03-2026**.
- **CILS (Univ. per Stranieri di Siena):** https://cils.unistrasi.it/1/84/16/Le_sedi_di_esami.htm — **BLOCKED**: interactive JS ITALIA/ESTERO → region/country selector, no static list, no downloadable file. → abba g browser-save (Korean TOPIK precedent).

---

## TASK 4 — CELI numerics (official CVCL criteri di valutazione PDFs)

All from `www.unistrapg.it/sites/default/files/docs/certificazioni/` → saved under `celi-pdfs/`:
- A1 CELI Impatto i — `celi-i-a1-criteri-di-valutazione.pdf`
- A2 CELI 1 — `celi-1-valutazione.pdf`
- C1 CELI 4 — `celi-4-valutazione.pdf`
- C2 CELI 5 — `celi-5-valutazione.pdf`

Publisher: **CVCL – Centro per la Valutazione e le Certificazioni Linguistiche, Università per Stranieri di Perugia** (official). Extracted numerics → `celi-numerics-verified.md`.
