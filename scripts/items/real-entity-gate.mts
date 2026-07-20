// Real-entity gate — no invented document may be signed by a real COMPANY.
//
// Run: npm run gate:real-entity   (wired into `build`)
//
// WHY
//
// Our items ARE fabrications: invented notices, invented phone calls, invented
// letters. That is legitimate — until one is signed with a real company's name. Then
// it stops being a practice task and becomes words put in that company's mouth.
// In this family it has happened twice and a person caught it both times: an
// invented insurance letter signed "Helvetia" (a real insurer — the figures in it
// were CORRECT, which is exactly why it survived), and an invented notice for a
// "Repair-Café", a real trademarked name.
//
// 🔴 REGRESSION GUARD, NOT A COMPLETENESS CHECK. Green means "none of the names we
// already got wrong, or already thought of, is in the bank". It does NOT mean no
// real company is named. The next unknown one is caught by READING the item.
//
// PUBLIC BODIES ARE NOT ON THIS LIST, ON PURPOSE. Comune, anagrafe, ASL, questura,
// prefettura, CAF, INPS, Agenzia delle Entrate, CILS, CELI, Università per
// Stranieri — these are named deliberately and correctly. Attributing a claim to the
// office that makes it IS the civic discipline. Only COMMERCIAL entities are blocked.
//
// ⚠️ THIS LIST IS ITALIAN, NOT INHERITED. A fork gate is blindest to the fork that
// just happened: copying the Swiss list would hunt Migros and Helvetia in a bank
// that will never contain them, and copying the Portuguese one would hunt Pingo
// Doce. Re-cut BOTH ways — ancestor names out, Italian names in.

import fs from "node:fs";
import path from "node:path";

// Tier 1 — unambiguous. The word IS the company.
const BRANDS = [
  // grocery / retail
  "Esselunga", "Carrefour", "Bennet", "Iper", "Pam Panorama", "MediaWorld",
  "Unieuro", "Decathlon", "Leroy Merlin", "Ikea", "Zara", "Lidl", "Eurospin",
  // banks / insurers
  "Intesa Sanpaolo", "UniCredit", "Monte dei Paschi", "Banco BPM", "Fineco",
  "Unipol", "Allianz", "Reale Mutua", "Cattolica Assicurazioni",
  // telecom / energy
  "Vodafone", "WindTre", "Iliad", "Fastweb", "Enel", "Eni", "A2A", "Hera",
  // transport / post
  "Trenitalia", "Italo", "Alitalia", "ITA Airways", "Ryanair", "Autostrade per l'Italia",
  "Poste Italiane", "Bartolini", "Flixbus", "Frecciarossa", "Frecciargento",
  // media / platforms
  "Mediaset", "Sky Italia", "Repubblica", "Corriere della Sera", "Il Sole 24 Ore",
  "Subito.it", "Immobiliare.it",
];

// Tier 2 — names that are ALSO ordinary Italian words, or bare acronyms. These fire
// ONLY next to a corporate marker AND only when capitalised. Without those two rules
// the gate produces noise and gets ignored — and an ignored gate is worse than none,
// because it reads as coverage.
//
//   * "Conad"      — fine alone, but "conad" never occurs; kept here for symmetry
//                    with Coop, which does.
//   * "Coop"       — "coop" is the ordinary abbreviation for cooperativa, and this
//                    bank is full of neighbourhood cooperatives.
//   * "TIM"        — is English "tim", and Italian ALL-CAPS notices ("APERTO TIM...")
//                    make a case-insensitive match hopeless.
//   * "Conto"/"Poste" — ordinary nouns: "conto corrente", "le poste" as the post
//                    office in general rather than the company.
//   * "Barilla", "Ferrero", "Campari" — also surnames. A character can be called
//                    Ferrero without a chocolate company being named.
//   * "Fiat"       — Latin, and "fiat" appears in fixed expressions.
//   * "Generali"   — CAUGHT BY THIS GATE ON ITS FIRST RUN, in our own criteria:
//                    "evita affermazioni generali" and "senza trarne regole
//                    generali". It is a real insurer AND the ordinary plural
//                    adjective for "general". Tier 1 would have made the gate red on
//                    a green bank, which is how a gate gets deleted.
//   * "Reale"      — likewise an ordinary adjective ("un caso reale"); the insurer is
//                    "Reale Mutua", kept as a two-word tier-1 entry instead.
const AMBIGUOUS = [
  "Generali", "Conad", "Coop", "TIM", "Poste", "Conto", "Barilla", "Ferrero", "Campari",
  "Fiat", "Lavazza", "Illy", "Benetton", "Luxottica", "Prada", "Armani",
];

const CORPORATE_MARKERS = [
  "S\\.?p\\.?A\\.?", "S\\.?r\\.?l\\.?", "S\\.?n\\.?c\\.?", "gruppo", "società",
  "supermercato", "ipermercato", "negozio", "punto vendita", "catena",
  "banca", "assicurazione", "assicurazioni", "compagnia", "operatore",
  "azienda", "ditta", "marchio", "filiale", "sportello di",
];

const ITEMS_DIR = path.join(process.cwd(), "src", "data");
const BUNDLE = path.join(ITEMS_DIR, "items-batch1.json");

if (!fs.existsSync(BUNDLE)) {
  console.error("real-entity-gate: items-batch1.json not found — refusing to pass vacuously.");
  process.exit(1);
}

/** Every human-readable string in an item, with a path so a hit is findable.
 *  Walks the PARSED object — never the raw JSON text. Scanning raw JSON matches
 *  escape sequences rather than content, and a gate that scans the wrong thing is a
 *  gate that has never been red. */
function* strings(node: unknown, trail: string): Generator<[string, string]> {
  if (typeof node === "string") {
    yield [trail, node];
  } else if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* strings(node[i], `${trail}[${i}]`);
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) yield* strings(v, trail ? `${trail}.${k}` : k);
  }
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MARKERS = CORPORATE_MARKERS.join("|");

type Violation = { i: number; title: string; trail: string; name: string; tier: number };
const violations: Violation[] = [];

let items: { title?: string }[];
try {
  items = JSON.parse(fs.readFileSync(BUNDLE, "utf8"));
} catch (e) {
  console.error(`real-entity-gate: items-batch1.json is not valid JSON — ${(e as Error).message}`);
  process.exit(1);
}

if (items.length === 0) {
  console.error("real-entity-gate: bank is empty — refusing to pass vacuously.");
  process.exit(1);
}

let scanned = 0;
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  for (const [trail, text] of strings(item, "")) {
    scanned++;
    for (const brand of BRANDS) {
      const re = new RegExp(`(^|[^\\p{L}])${esc(brand)}([^\\p{L}]|$)`, "iu");
      if (re.test(text)) {
        violations.push({ i, title: item.title ?? "(untitled)", trail, name: brand, tier: 1 });
      }
    }
    for (const name of AMBIGUOUS) {
      // Same LINE only, and CASE-SENSITIVE: a brand is capitalised, "coop" and
      // "conto" are not. A marker three sentences away is not evidence, and
      // cross-sentence matching is how a gate starts crying wolf.
      const re = new RegExp(
        `(^|[^\\p{L}])(${esc(name)})([^\\p{L}]|$)[^\\n]{0,40}(${MARKERS})` +
          `|(${MARKERS})[^\\n]{0,40}(^|[^\\p{L}])(${esc(name)})([^\\p{L}]|$)`,
        "u",
      );
      if (re.test(text)) {
        violations.push({ i, title: item.title ?? "(untitled)", trail, name, tier: 2 });
      }
    }
  }
}

if (violations.length > 0) {
  console.error("\n❌ real-entity-gate: an invented document names a real company.\n");
  for (const v of violations) {
    console.error(`  [${v.i}] "${v.title}"`);
    console.error(`      field: ${v.trail}`);
    console.error(`      name:  ${v.name} (tier ${v.tier})\n`);
  }
  console.error(
    '  Use a generic description instead — "il supermercato", "l\'operatore",\n' +
      '  "la banca". Naming a real company in a document we invented puts words in its\n' +
      "  mouth. Public bodies (comune, anagrafe, ASL, questura, CAF, INPS) are allowed\n" +
      "  and are NOT what this gate hunts.\n",
  );
  process.exit(1);
}

console.log(
  `✅ real-entity-gate: ${scanned} strings across ${items.length} items — no real company named.`,
);
