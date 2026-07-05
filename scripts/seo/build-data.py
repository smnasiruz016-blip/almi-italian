#!/usr/bin/env python3
# AlmiItalian Phase-3 data build. Reads the Phase-0 parsed CSVs (scripts/seo/raw/) and emits the
# indexable src/data/*.json splits. Exclusions are enforced BY CONSTRUCTION here (ceased atenei,
# no-current-offer atenei, ceased/inactive courses) so page-gen math cannot drift. Real data only.
import csv, json, re, unicodedata, sys
from pathlib import Path

RAW = Path(__file__).parent / "raw"
OUT = Path(__file__).parents[2] / "src" / "data"

def slugify(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return re.sub(r"-+", "-", s)

# The two CSVs encode the en-dash in a couple of ateneo names differently (\x96 vs the replacement
# char) — join on a NORMALIZED name so those rows (e.g. LUM "G. Degennaro") are not silently dropped.
def normname(s):
    s = re.sub(r"[\x96\x97–—�]", "-", s or "")
    return re.sub(r"\s+", " ", s).strip()

def clean(s):  # display: restore a proper en-dash for the mangled bytes
    return re.sub(r"\s*[\x96\x97�]\s*", " – ", s or "").strip()

# ---- Atenei ----
atenei_rows = list(csv.DictReader(open(RAW/"it-universities.csv", encoding="utf-8")))
# ---- Courses (current year only, per CSV) ----
course_rows = [r for r in csv.DictReader(open(RAW/"it-courses.csv", encoding="utf-8"))]

# Which atenei (normalized name) actually carry a current course?
offer_atenei = {normname(r["ateneo"]) for r in course_rows}

# Active (Status A) atenei.
active = [r for r in atenei_rows if r["status"].strip() == "A"]
ceased = [r for r in atenei_rows if r["status"].strip() == "M"]

# Family 1 base = ACTIVE and HAS-CURRENT-OFFER. (Excludes 11 ceased + the active-but-no-offer ones.)
fam1 = [r for r in active if normname(r["nome_operativo"]) in offer_atenei]
no_offer_active = [r for r in active if normname(r["nome_operativo"]) not in offer_atenei]

# Slug per ateneo (unique), keyed by NORMALIZED name for the course join. Disambiguate collisions with cod.
ateneo_slug = {}   # normname -> slug
seen_slugs = {}
for r in sorted(fam1, key=lambda x: normname(x["nome_operativo"])):
    base = slugify(r["nome_operativo"])
    slug = base
    if slug in seen_slugs:
        slug = f"{base}-{slugify(r['cod_ateneo'])}"
    seen_slugs[slug] = True
    ateneo_slug[normname(r["nome_operativo"])] = slug

def wcoord(s):
    m = re.match(r"Point\(([-\d.]+) ([-\d.]+)\)", s or "")
    return (float(m.group(2)), float(m.group(1))) if m else (None, None)

atenei_json = []
for r in sorted(fam1, key=lambda x: ateneo_slug[normname(x["nome_operativo"])]):
    lat, lng = wcoord(r.get("wikidata_coord", ""))
    atenei_json.append({
        "slug": ateneo_slug[normname(r["nome_operativo"])],
        "name": clean(r["nome_esteso"]),
        "nameShort": clean(r["nome_operativo"]),
        "type": r["type"].strip(),           # statale / non-statale / telematica
        "kind": r["kind_descrizione"].strip(),
        "region": r["regione"].strip().title(),
        "citta": r["citta"].strip().title(),
        "code": r["cod_ateneo"].strip(),
        "enLabel": (r.get("wikidata_enLabel") or "").strip() or None,
        "qid": (r.get("wikidata_qid") or "").strip() or None,
        "lat": lat, "lng": lng,
    })

# ---- Courses: one page per {ateneo, course}. Keep every current course row that belongs to a
# Family-1 ateneo (ceased/no-offer atenei contribute ZERO). Slug unique within ateneo. ----
courses_json = []
per_ateneo_slugs = {}
dropped_no_ateneo = 0
for r in course_rows:
    at = normname(r["ateneo"])
    if at not in ateneo_slug:      # ateneo not in Family-1 (ceased/inactive) -> zero pages
        dropped_no_ateneo += 1
        continue
    aslug = ateneo_slug[at]
    base = slugify(r["nome_corso"]) or "corso"
    # disambiguate within ateneo: append classe, then a counter, to keep EVERY distinct row.
    key = f"{aslug}/{base}"
    if key in per_ateneo_slugs:
        base2 = f"{base}-{slugify(r['classe_laurea'])}"
        key2 = f"{aslug}/{base2}"
        n = 1
        cand = base2
        while f"{aslug}/{cand}" in per_ateneo_slugs:
            n += 1
            cand = f"{base2}-{n}"
        base = cand
        key = f"{aslug}/{base}"
    per_ateneo_slugs[key] = True
    courses_json.append({
        "ateneoSlug": aslug,
        "slug": base,
        "nomeCorso": clean(r["nome_corso"]),
        "classe": r["classe_laurea"].strip(),
        "classeDes": r["classe_des"].strip(),
        "level": r["level"].strip(),          # triennale / magistrale / ciclo-unico
        "area": r["area"].strip(),
        "gruppo": r["gruppo"].strip(),
        "comune": r["comune"].strip().title(),
        "provincia": r["provincia"].strip().title(),
        "didattica": r["didattica"].strip(),  # in presenza / mista / a distanza
        "accesso": r["accesso"].strip(),
    })

# ---- Exam centers (CELI real; CILS pending). Skip the leading '#'/note comment rows. ----
centers = []
center_lines = (l for l in open(RAW/"it-exam-centers.csv", encoding="utf-8") if not l.lstrip().startswith(('#', '"#')))
for r in csv.DictReader(center_lines):
    if r.get("exam") == "CELI" and r.get("country"):
        centers.append({"exam": "CELI", "country": r["country"].strip(), "city": r["city"].strip(), "institution": r["institution"].strip()})
# country -> CELI center count
from collections import Counter
celi_by_country = Counter(c["country"] for c in centers)
centers_json = {"celi": centers, "celiByCountry": dict(celi_by_country), "cilsStatus": "pending-founder-save"}

# ---- Descent corridor (Tier-1 7 + proposed 4). AIRE verbatim ONLY where known; never fabricate. ----
AIRE = {"argentina": 989901, "uruguay": 115658}  # from GU decree body (only these two on record)
tier1 = [
    {"slug": "argentina", "country": "Argentina"}, {"slug": "brazil", "country": "Brazil"},
    {"slug": "united-states", "country": "United States"}, {"slug": "australia", "country": "Australia"},
    {"slug": "canada", "country": "Canada"}, {"slug": "venezuela", "country": "Venezuela"},
    {"slug": "uruguay", "country": "Uruguay"},
]
for t in tier1:
    t["aire"] = AIRE.get(t["slug"])          # int or None (None => "figure being confirmed" on page)
    t["celiCenters"] = celi_by_country.get({"argentina":"Argentina","brazil":"Brasile","united-states":"Stati Uniti d'America","australia":"Australia","canada":"Canada","venezuela":"Venezuela","uruguay":"Uruguay"}[t["slug"]], 0)
descent_json = {
    "tier1": tier1,
    "proposed": [  # CGIE-proposed, deferred, NOT in the decree — honest pages, never Tier-1 rights
        {"slug": "south-africa", "country": "South Africa"}, {"slug": "mexico", "country": "Mexico"},
        {"slug": "peru", "country": "Peru"}, {"slug": "chile", "country": "Chile"},
    ],
    "decree": "Decreto interministeriale 17 novembre 2025 — GU Serie Generale n. 273 del 24-11-2025 (25A06275)",
}

# ---- Write ----
OUT.mkdir(parents=True, exist_ok=True)
json.dump(atenei_json, open(OUT/"it-atenei.json","w",encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump(courses_json, open(OUT/"it-courses.json","w",encoding="utf-8"), ensure_ascii=False)
json.dump(centers_json, open(OUT/"it-exam-centers.json","w",encoding="utf-8"), ensure_ascii=False, indent=0)
json.dump(descent_json, open(OUT/"it-descent.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)

N = 196
print(f"atenei (Family-1 base, active+with-offer): {len(atenei_json)}   [expect 92]")
print(f"  ceased (M, zero pages): {len(ceased)}   active-but-no-offer (zero Family-1): {len(no_offer_active)}")
print(f"courses (Family-2 base): {len(courses_json)}   [expect 5833]   dropped rows w/ non-Family1 ateneo: {dropped_no_ateneo}")
print(f"  unique {{ateneo,slug}} keys: {len(per_ateneo_slugs)}   (== course count? {len(per_ateneo_slugs)==len(courses_json)})")
print(f"CELI centers: {len(centers)} across {len(celi_by_country)} countries")
print(f"--- locked-math check ---")
print(f"  Family1 {len(atenei_json)}x196 = {len(atenei_json)*N}   [expect 18032]")
print(f"  Family2 {len(courses_json)}x196 = {len(courses_json)*N}   [expect 1143268]")
