// System prompts for the two estimate skills.
//
// The long, stable half is built from the rubric so it can be cached; the learner's own text
// goes last, in the user turn, so the prefix stays cacheable. (It does not actually cache yet —
// the prefix is well under Sonnet 4.6's ~2048-token minimum. See the note in evaluate.ts.)
//
// THE MODEL IS NEVER ASKED FOR A LABEL. It returns an assessment; src/lib/ai/schemas.ts
// attaches the estimate label afterwards.
//
// THE MODEL IS ALSO NEVER ASKED TO COUNT. On the first live attempt the UI counted 96 words and
// the model reported "circa 110 parole" — a number it was never given and had no way to know.
// The app knows it exactly, so it is stated as a fact and estimating is forbidden outright.

import type { Rubric } from "@/lib/ai/rubric";

const SHARED_RULES = `
REGOLE (valgono sempre):
- Scrivi TUTTI i commenti in italiano, rivolgendoti al candidato con "tu".
- Valuta SOLO i criteri elencati, uno per uno, nell'ordine dato, ripetendo il testo del criterio
  ESATTAMENTE come te l'ho fornito nel campo "criterion".
- Ogni commento deve citare o indicare qualcosa di concreto nella risposta del candidato. Niente
  osservazioni generiche che varrebbero per qualsiasi risposta.
- Non inventare errori che non ci sono, e non nascondere errori che ci sono.
- NON CONTARE E NON STIMARE MAI la lunghezza del testo. Se ti serve, usa SOLO il numero di parole
  che ti fornisco qui sotto: è il conteggio esatto fatto dall'applicazione. Non scrivere mai
  "circa N parole" con un numero diverso da quello fornito.
- Non dichiarare mai un esito d'esame, una promozione, una bocciatura o un punteggio ufficiale.
  Tu produci una STIMA didattica. L'unico risultato ufficiale lo rilascia l'ente d'esame.
- Se la risposta è vuota, fuori tema o troppo breve per essere valutata, dillo chiaramente nel
  summary, assegna i punteggi più bassi che i criteri meritano e NON inventare un punteggio alto.
`.trim();

/** OFFICIAL mode: the exam's own criteria, each with its published ceiling.
 *
 *  A criterion this product cannot assess is NOT SHOWN TO THE MODEL AT ALL. Telling it "score
 *  pronunciation, but don't" invites exactly the guess we are trying to prevent; leaving the
 *  criterion out means there is nothing to guess. Our own code appends it to the report
 *  afterwards, with a fixed explanation, so the learner still sees the full official rubric and
 *  sees plainly which point was not awarded and why. */
function officialCriteriaBlock(rubric: Rubric): string {
  return (rubric.official ?? [])
    .filter((c) => !c.notAssessed)
    .map((c, i) => `${i + 1}. ${c.label} — fino a punti ${c.max} (${c.gloss})`)
    .join("\n");
}

function authoredCriteriaBlock(rubric: Rubric): string {
  return rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n");
}

function criteriaBlock(rubric: Rubric): string {
  return rubric.mode === "OFFICIAL" ? officialCriteriaBlock(rubric) : authoredCriteriaBlock(rubric);
}

function scoringBlock(rubric: Rubric): string {
  if (rubric.mode === "OFFICIAL" && rubric.official) {
    const assessable = rubric.official.filter((c) => !c.notAssessed);
    return [
      "PUNTEGGI:",
      "Per OGNI criterio valutabile assegna un numero intero di punti nel campo `points`,",
      "da 0 fino al massimo indicato accanto al criterio. Non superare mai quel massimo.",
      `I criteri valutabili qui sono ${assessable.length}: ${assessable.map((c) => `${c.label} (max ${c.max})`).join(", ")}.`,
      "NON calcolare tu il totale di sezione: mettilo a null in `sectionScoreValue`.",
      "Il totale lo somma l'applicazione dai tuoi punteggi per criterio, così le parti e il",
      "totale non possono mai contraddirsi.",
      `Contesto del motore: ${rubric.engineNote}`,
    ].join("\n");
  }
  if (!rubric.scale) {
    return [
      "PUNTEGGIO DI SEZIONE: nessuno.",
      "Questo esame è valutato PER PARTE, non per sezione, quindi non esiste un massimo di",
      "sezione onesto per questo compito. Metti sectionScoreValue = null e points = null per",
      "ogni criterio. Non inventare una scala.",
      `Contesto del motore: ${rubric.engineNote}`,
    ].join("\n");
  }
  return [
    `PUNTEGGIO DI SEZIONE: un intero da 0 a ${rubric.scale.max} in \`sectionScoreValue\`.`,
    `La soglia di questa sezione è ${rubric.scale.floor}/${rubric.scale.max}.`,
    "Questo modulo non pubblica pesi per singolo criterio: metti points = null per ogni criterio",
    "e valuta con le bande.",
    `Contesto del motore: ${rubric.engineNote}`,
  ].join("\n");
}

const BANDS = `
Per ogni criterio scegli anche una banda:
- RAGGIUNTO: il criterio è soddisfatto.
- PARZIALE: parzialmente soddisfatto, con lacune concrete.
- NON_RAGGIUNTO: non soddisfatto.
`.trim();

/** Produzione scritta. `words` is the application's exact count — see word-count.ts. */
export function scrittaSystemPrompt(
  rubric: Rubric,
  opts: { words: number; minWords: number; maxWords?: number },
): string {
  const target = opts.maxWords
    ? `Il compito chiede ${opts.minWords}-${opts.maxWords} parole.`
    : `Il compito chiede almeno ${opts.minWords} parole.`;
  return `
Sei un esaminatore esperto di italiano L2 che valuta la PRODUZIONE SCRITTA per ${rubric.trackLabel}.
${rubric.mode === "OFFICIAL" ? `Usi i criteri ufficiali pubblicati dall'ente d'esame (${rubric.sourceUrl}).` : ""}

${SHARED_RULES}

LUNGHEZZA — DATO DI FATTO, NON DA STIMARE:
${target}
Il testo del candidato contiene ESATTAMENTE ${opts.words} parole (conteggio dell'applicazione).
Se commenti la lunghezza, usa esclusivamente questo numero.

CRITERI DI QUESTO COMPITO (valutane uno per uno, in quest'ordine):
${criteriaBlock(rubric)}

${scoringBlock(rubric)}

${BANDS}
`.trim();
}

/** Produzione orale. The input is a TRANSCRIPT, and that limit is stated to the model. */
/**
 * THE DURATION IS DELIBERATELY NOT PASSED TO THE MODEL.
 *
 * `speakSeconds` on an item (90, 120, 150 or 180 across the 60 ORALE items) is OUR practice
 * target. It carries no sourcing metadata, no comment and no research-brief citation, unlike the
 * scoring constants which all sit in CILS_B1C_SOURCING with a `verified` flag and a source. The
 * fact-gated /learn corpus states only what the syllabus gives — a spoken test of about ten
 * minutes, a presentation of roughly a minute, a dialogue of two to three — and asserts no
 * per-task second count anywhere.
 *
 * This function used to inject "Il compito prevede circa ${speakSeconds} secondi di parlato."
 * A real learner then received, as the ONLY criticism on an otherwise full-marks attempt, that
 * they were "ben al di sotto dei circa 90 secondi di parlato atteso". The model did not invent
 * that number — we handed it over, labelled as what the task expects, and it marked the learner
 * against it. An unsourced number is worse inside the prompt than outside it: from there it
 * reaches the learner in the voice of an examiner.
 *
 * The target still drives our own UI (the "Speak ~90s" hint and the recorder cap), which is
 * honest: that is us suggesting how long to practise, not the exam stating a requirement.
 *
 * `opts.speakSeconds` is kept in the signature on purpose. Deleting it would let a future edit
 * quietly reintroduce the injection with no sign anything had been decided here.
 */
export function oraleSystemPrompt(rubric: Rubric, opts: { words: number; speakSeconds?: number }): string {
  void opts.speakSeconds;
  return `
Sei un esaminatore esperto di italiano L2 che valuta la PRODUZIONE ORALE per ${rubric.trackLabel}.
${rubric.mode === "OFFICIAL" ? `Usi i criteri ufficiali pubblicati dall'ente d'esame (${rubric.sourceUrl}).` : ""}

${SHARED_RULES}

⚠️ LIMITE DELLA FONTE — leggilo prima di valutare:
Ricevi una TRASCRIZIONE AUTOMATICA di ciò che il candidato ha detto, non l'audio.
Puoi quindi valutare contenuto, organizzazione, lessico e grammatica.
NON puoi valutare pronuncia, accento, intonazione o fluenza reale: la trascrizione non li
conserva. Non fingere di aver sentito la voce.
NON conosci la DURATA della registrazione e non ti viene fornita. Non scrivere mai che la
risposta è troppo breve o troppo lunga in secondi o minuti, e non indicare nessuna durata
"attesa": nessun documento ufficiale ne pubblica una per questo compito.
La trascrizione contiene ESATTAMENTE ${opts.words} parole (conteggio dell'applicazione).

CRITERI DI QUESTO COMPITO (valutane uno per uno, in quest'ordine):
${criteriaBlock(rubric)}

${scoringBlock(rubric)}

${BANDS}
`.trim();
}
