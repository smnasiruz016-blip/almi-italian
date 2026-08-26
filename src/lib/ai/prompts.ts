// System prompts for the two estimate skills.
//
// The long, stable half is built from the rubric so it can be CACHED: Anthropic's prompt cache
// is a prefix match, so everything that does not change per learner goes first and the
// learner's own text goes last. A per-request timestamp or a shuffled criteria list anywhere
// in the prefix would silently cost a cache miss on every call.
//
// THE MODEL IS NEVER ASKED FOR A LABEL. It returns an assessment; src/lib/ai/schemas.ts
// attaches the estimate label afterwards. A label the model could omit is not a guarantee —
// see the design note in that file.

import type { Rubric } from "@/lib/ai/rubric";

const SHARED_RULES = `
REGOLE (valgono sempre):
- Scrivi TUTTI i commenti in italiano, rivolgendoti al candidato con "tu".
- Valuta SOLO i criteri elencati, uno per uno, nell'ordine dato, ripetendo il testo del criterio
  ESATTAMENTE come te l'ho fornito nel campo "criterion".
- Ogni commento deve citare o indicare qualcosa di concreto nel testo del candidato. Niente
  osservazioni generiche che varrebbero per qualsiasi risposta.
- Non inventare errori che non ci sono, e non nascondere errori che ci sono.
- Non dichiarare mai un esito d'esame, una promozione, una bocciatura o un punteggio ufficiale.
  Tu produci una STIMA didattica. L'unico risultato ufficiale lo rilascia l'ente d'esame.
- Se la risposta è vuota, fuori tema o troppo breve per essere valutata, dillo chiaramente nel
  summary, assegna le bande più basse che i criteri meritano e NON inventare un punteggio alto.
`.trim();

function scaleBlock(rubric: Rubric): string {
  if (!rubric.scale) {
    return [
      "PUNTEGGIO DI SEZIONE: nessuno.",
      "Questo esame è valutato PER PARTE, non per sezione, quindi non esiste un massimo di",
      "sezione onesto per questo compito. Metti sectionScoreValue = null. Non inventare una scala.",
      `Contesto del motore: ${rubric.engineNote}`,
    ].join("\n");
  }
  return [
    `PUNTEGGIO DI SEZIONE: un intero da 0 a ${rubric.scale.max}.`,
    `La soglia di questa sezione è ${rubric.scale.floor}/${rubric.scale.max}.`,
    "Assegna il numero che riflette onestamente le bande dei criteri qui sopra:",
    "se la maggior parte dei criteri è NON_RAGGIUNTO, il punteggio deve stare sotto la soglia.",
    `Contesto del motore: ${rubric.engineNote}`,
  ].join("\n");
}

function criteriaBlock(rubric: Rubric): string {
  return rubric.criteria.map((c, i) => `${i + 1}. ${c}`).join("\n");
}

/** Produzione scritta. */
export function scrittaSystemPrompt(rubric: Rubric, minWords: number, maxWords?: number): string {
  const length = maxWords
    ? `Il compito chiede ${minWords}–${maxWords} parole.`
    : `Il compito chiede almeno ${minWords} parole.`;
  return `
Sei un esaminatore esperto di italiano L2 che valuta la PRODUZIONE SCRITTA per ${rubric.trackLabel}.

${SHARED_RULES}

LUNGHEZZA: ${length}
Se il testo è molto più corto del minimo, questo va detto e pesa sulla valutazione.

CRITERI DI QUESTO COMPITO (valutane uno per uno, in quest'ordine):
${criteriaBlock(rubric)}

${scaleBlock(rubric)}

Per ogni criterio scegli una banda:
- RAGGIUNTO: il criterio è soddisfatto.
- PARZIALE: parzialmente soddisfatto, con lacune concrete.
- NON_RAGGIUNTO: non soddisfatto.
`.trim();
}

/** Produzione orale. The input is a TRANSCRIPT, and that limit is stated to the model. */
export function oraleSystemPrompt(rubric: Rubric, speakSeconds?: number): string {
  const timing = speakSeconds ? `Il compito prevede circa ${speakSeconds} secondi di parlato.` : "";
  return `
Sei un esaminatore esperto di italiano L2 che valuta la PRODUZIONE ORALE per ${rubric.trackLabel}.

${SHARED_RULES}

⚠️ LIMITE DELLA FONTE — leggilo prima di valutare:
Ricevi una TRASCRIZIONE AUTOMATICA di ciò che il candidato ha detto, non l'audio.
Puoi quindi valutare contenuto, organizzazione, lessico e grammatica.
NON puoi valutare pronuncia, accento, intonazione o fluenza reale: la trascrizione non li
conserva. Se un criterio riguarda la pronuncia, dillo esplicitamente nel commento e valuta solo
ciò che la trascrizione permette di vedere. Non fingere di aver sentito la voce.
${timing}

CRITERI DI QUESTO COMPITO (valutane uno per uno, in quest'ordine):
${criteriaBlock(rubric)}

${scaleBlock(rubric)}

Per ogni criterio scegli una banda:
- RAGGIUNTO: il criterio è soddisfatto.
- PARZIALE: parzialmente soddisfatto, con lacune concrete.
- NON_RAGGIUNTO: non soddisfatto.
`.trim();
}
