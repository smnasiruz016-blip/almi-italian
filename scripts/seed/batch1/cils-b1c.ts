// CILS B1 Cittadinanza — flagship, 30 items. Everyday/administrative register
// (poste, comune, prefettura, questura, ASL, casa, scuola, lavoro).
// Scored on the B1c engine only: 4 sections /12, floor 7 each AND total 28/48, NO banking.
import { ESTIMATE_NOTE, type RawItem } from "./types";

const L = "B1C";
const est = (): string => ESTIMATE_NOTE;

export const CILS_B1C_ITEMS: RawItem[] = [
  // ---------------- ASCOLTO (9): 3 F, 4 C, 2 S ----------------
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "All'ufficio postale: ritiro di un pacco", topicTag: "poste",
    prompt: "Ascolta l'annuncio allo sportello e rispondi.",
    payload: {
      audioScript: "Buongiorno. Per ritirare un pacco deve presentare l'avviso di giacenza e un documento d'identità valido. Lo sportello pacchi è il numero 4 ed è aperto dalle 8:30 alle 13:30, dal lunedì al venerdì. Il sabato è chiuso.",
      questions: [
        { q: "Che cosa deve presentare la persona per ritirare il pacco?", options: ["Solo il documento", "L'avviso di giacenza e un documento", "Il codice fiscale", "Una fototessera"], answerIndex: 1 },
        { q: "A che ora chiude lo sportello?", options: ["Alle 8:30", "Alle 13:30", "Alle 18:00", "Al sabato"], answerIndex: 1 },
        { q: "Quando è chiuso lo sportello?", options: ["Il lunedì", "Il venerdì", "Il sabato", "Il mercoledì"], answerIndex: 2 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Annuncio alla stazione dei treni", topicTag: "trasporti",
    prompt: "Ascolta l'annuncio in stazione e rispondi.",
    payload: {
      audioScript: "Attenzione. Il treno regionale delle ore 15:10 per Bologna viaggia con un ritardo di venti minuti. Il treno partirà dal binario 6 e non dal binario 2. Ci scusiamo per il disagio.",
      questions: [
        { q: "Di quanto è il ritardo del treno?", options: ["Dieci minuti", "Quindici minuti", "Venti minuti", "Trenta minuti"], answerIndex: 2 },
        { q: "Da quale binario parte il treno?", options: ["Binario 2", "Binario 6", "Binario 10", "Binario 15"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Messaggio nella segreteria del comune", topicTag: "comune",
    prompt: "Ascolta il messaggio registrato e rispondi.",
    payload: {
      audioScript: "Ha chiamato l'ufficio anagrafe del Comune. La sua carta d'identità è pronta. Può venire a ritirarla allo sportello 3, il martedì e il giovedì mattina, dalle 9 alle 12. Deve portare la vecchia carta d'identità.",
      questions: [
        { q: "Che cosa è pronto da ritirare?", options: ["Il passaporto", "La carta d'identità", "La patente", "Il permesso di soggiorno"], answerIndex: 1 },
        { q: "Che cosa deve portare la persona?", options: ["Due fototessere", "La vecchia carta d'identità", "Il codice fiscale", "Una marca da bollo"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Appuntamento in questura per il permesso di soggiorno", topicTag: "questura",
    prompt: "Ascolta le istruzioni e rispondi.",
    payload: {
      audioScript: "Gentile signore, il suo appuntamento per il rinnovo del permesso di soggiorno è fissato per giovedì 12 alle ore 9:00. Deve presentarsi allo sportello immigrazione con il passaporto, la ricevuta della domanda e quattro fototessere. Se non può venire, chiami almeno due giorni prima per spostare l'appuntamento.",
      questions: [
        { q: "Per che cosa è l'appuntamento?", options: ["Per il rinnovo del permesso di soggiorno", "Per la cittadinanza", "Per la carta d'identità", "Per il passaporto"], answerIndex: 0 },
        { q: "Quante fototessere deve portare?", options: ["Due", "Tre", "Quattro", "Sei"], answerIndex: 2 },
        { q: "Cosa deve fare se non può venire?", options: ["Non presentarsi", "Chiamare almeno due giorni prima", "Mandare un'email il giorno stesso", "Andare un altro giorno senza avvisare"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Dal medico di base: prenotazione delle visite", topicTag: "asl",
    prompt: "Ascolta e abbina ogni persona al giorno della sua visita.",
    payload: {
      audioScript: "Allora, vediamo gli appuntamenti della settimana. La signora Rossi ha la visita lunedì. Il signor Bianchi viene mercoledì per il controllo. La signora Verdi ha l'appuntamento venerdì pomeriggio. Il signor Neri, invece, deve venire martedì mattina per le analisi.",
      instruction: "Abbina ogni paziente al giorno giusto.",
      prompts: ["Signora Rossi", "Signor Bianchi", "Signora Verdi", "Signor Neri"],
      options: ["Lunedì", "Martedì", "Mercoledì", "Venerdì"],
      answerMap: [0, 2, 3, 1],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Riunione dei genitori a scuola", topicTag: "scuola",
    prompt: "Ascolta la comunicazione dell'insegnante e rispondi.",
    payload: {
      audioScript: "Buonasera a tutti. Vi ricordo che la gita scolastica sarà il 20 maggio. Il costo è di quindici euro a bambino e comprende il pullman e il pranzo al sacco. Chi vuole partecipare deve consegnare il modulo firmato e i soldi entro il 10 maggio alla maestra.",
      questions: [
        { q: "Quanto costa la gita?", options: ["Dieci euro", "Quindici euro", "Venti euro", "Cinque euro"], answerIndex: 1 },
        { q: "Che cosa comprende il costo?", options: ["Solo il pullman", "Il pullman e il pranzo", "Il pranzo al ristorante", "L'ingresso al museo"], answerIndex: 1 },
        { q: "Entro quando bisogna consegnare il modulo?", options: ["Il 20 maggio", "Il 10 maggio", "Il 15 maggio", "Il primo giorno di scuola"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Telefonata dall'agenzia immobiliare", topicTag: "casa",
    prompt: "Ascolta la telefonata e rispondi.",
    payload: {
      audioScript: "Buongiorno, la chiamo dall'agenzia per l'appartamento in via Garibaldi. È un bilocale al secondo piano, con ascensore. L'affitto è di seicentocinquanta euro al mese, più le spese di condominio. Se è interessato, possiamo fissare una visita domani alle 17.",
      questions: [
        { q: "A che piano si trova l'appartamento?", options: ["Piano terra", "Primo piano", "Secondo piano", "Terzo piano"], answerIndex: 2 },
        { q: "Quant'è l'affitto al mese?", options: ["550 euro", "650 euro", "750 euro", "600 euro"], answerIndex: 1 },
        { q: "Quando si può fare la visita?", options: ["Oggi alle 17", "Domani alle 17", "Dopodomani", "La prossima settimana"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Comunicazione dell'ASL sulle vaccinazioni", topicTag: "asl",
    prompt: "Ascolta il messaggio dell'ASL e rispondi.",
    payload: {
      audioScript: "Gentile utente, la informiamo che la campagna di vaccinazione antinfluenzale è iniziata. Le persone sopra i sessantacinque anni e chi soffre di malattie croniche possono vaccinarsi gratuitamente. Non serve prenotazione: basta presentarsi al centro vaccinale con la tessera sanitaria, dal lunedì al sabato, la mattina.",
      questions: [
        { q: "Chi può vaccinarsi gratuitamente?", options: ["Tutti i cittadini", "Solo i bambini", "Gli over 65 e i malati cronici", "Solo chi prenota online"], answerIndex: 2 },
        { q: "Serve la prenotazione?", options: ["Sì, obbligatoria", "No, basta presentarsi", "Solo per telefono", "Solo online"], answerIndex: 1 },
        { q: "Che cosa bisogna portare?", options: ["La carta d'identità", "La tessera sanitaria", "Il codice fiscale su carta", "Una fototessera"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "STRETCH",
    title: "Assemblea di condominio", topicTag: "casa",
    prompt: "Ascolta e abbina ogni argomento alla decisione presa.",
    payload: {
      audioScript: "Nell'assemblea di ieri abbiamo deciso alcune cose. Per il giardino, si è deciso di assumere un giardiniere una volta al mese. Per l'ascensore, ci sarà una manutenzione a giugno. Le spese di pulizia delle scale aumenteranno di dieci euro. Infine, è vietato lasciare le biciclette nell'ingresso.",
      instruction: "Abbina ogni tema alla decisione dell'assemblea.",
      prompts: ["Il giardino", "L'ascensore", "Le spese di pulizia", "Le biciclette"],
      options: ["Manutenzione a giugno", "Giardiniere una volta al mese", "Vietato lasciarle nell'ingresso", "Aumento di dieci euro"],
      answerMap: [1, 0, 3, 2],
    },
  },

  // ---------------- LETTURA (9): 3 F, 4 C, 2 S ----------------
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Avviso del comune: orari dell'anagrafe", topicTag: "comune",
    prompt: "Leggi l'avviso e rispondi.",
    payload: {
      passage: "AVVISO — Ufficio Anagrafe\nL'ufficio è aperto: lunedì, mercoledì e venerdì dalle 8:30 alle 12:30; il martedì anche il pomeriggio dalle 15:00 alle 17:00. Il giovedì l'ufficio è chiuso al pubblico. Per i certificati si può usare anche il sito internet del Comune.",
      questions: [
        { q: "In quale giorno l'ufficio è chiuso?", options: ["Lunedì", "Martedì", "Giovedì", "Venerdì"], answerIndex: 2 },
        { q: "Quando è aperto anche il pomeriggio?", options: ["Il lunedì", "Il martedì", "Il venerdì", "Ogni giorno"], answerIndex: 1 },
        { q: "Come si possono ottenere i certificati?", options: ["Solo di persona", "Solo per telefono", "Anche dal sito del Comune", "Solo per posta"], answerIndex: 2 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Volantino del supermercato", topicTag: "vita quotidiana",
    prompt: "Leggi il volantino e rispondi.",
    payload: {
      passage: "OFFERTE DELLA SETTIMANA — dal 3 al 9 aprile\nLatte fresco: 1 euro al litro. Pane: sconto del 20%. Frutta e verdura di stagione: 30% di sconto il mercoledì. Il supermercato è aperto tutti i giorni dalle 8 alle 21, la domenica solo la mattina.",
      questions: [
        { q: "Quanto costa il latte?", options: ["Un euro al litro", "Due euro al litro", "50 centesimi", "Gratis"], answerIndex: 0 },
        { q: "Quando c'è lo sconto su frutta e verdura?", options: ["Il lunedì", "Il mercoledì", "La domenica", "Ogni giorno"], answerIndex: 1 },
        { q: "Come è aperto il supermercato la domenica?", options: ["Tutto il giorno", "Solo la mattina", "Solo il pomeriggio", "È chiuso"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Cartello alla fermata dell'autobus", topicTag: "trasporti",
    prompt: "Leggi il cartello e rispondi.",
    payload: {
      passage: "AVVISO AI VIAGGIATORI\nDa lunedì 5 la linea 12 cambia percorso per lavori in via Roma. La fermata di piazza Dante è sospesa. Usare la fermata di via Verdi, a cento metri. I biglietti si comprano in tabaccheria o con l'app. Non si vendono biglietti a bordo.",
      questions: [
        { q: "Perché la linea 12 cambia percorso?", options: ["Per uno sciopero", "Per lavori in via Roma", "Per una festa", "Per il maltempo"], answerIndex: 1 },
        { q: "Dove si può prendere l'autobus?", options: ["In piazza Dante", "Alla fermata di via Verdi", "Alla stazione", "In via Roma"], answerIndex: 1 },
        { q: "Dove NON si vendono i biglietti?", options: ["In tabaccheria", "Con l'app", "A bordo dell'autobus", "In edicola"], answerIndex: 2 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Lettera dell'INPS", topicTag: "uffici pubblici",
    prompt: "Leggi la lettera e rispondi.",
    payload: {
      passage: "Gentile Signora,\nLe comunichiamo che la Sua domanda di assegno familiare è stata accettata. L'importo sarà versato ogni mese sul Suo conto corrente, a partire dal mese prossimo. Per qualsiasi informazione può chiamare il numero verde gratuito o recarsi allo sportello con un appuntamento. Conservi questa lettera.",
      questions: [
        { q: "Qual è il risultato della domanda?", options: ["È stata rifiutata", "È stata accettata", "Manca un documento", "Deve essere rifatta"], answerIndex: 1 },
        { q: "Come sarà pagato l'assegno?", options: ["In contanti allo sportello", "Con un assegno cartaceo", "Sul conto corrente ogni mese", "Una volta all'anno"], answerIndex: 2 },
        { q: "Che cosa consiglia di fare la lettera?", options: ["Buttare la lettera", "Conservare la lettera", "Rispondere per iscritto", "Pagare una tassa"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "ORDERING", difficulty: "CORE",
    title: "Istruzioni per la raccolta differenziata", topicTag: "vita quotidiana",
    prompt: "Rimetti in ordine le istruzioni per fare la raccolta differenziata.",
    payload: {
      instruction: "Ordina le fasi dalla prima all'ultima.",
      shuffled: [
        "Metti il sacchetto giusto fuori dalla porta la sera prima della raccolta.",
        "Separa i rifiuti: carta, plastica, vetro e organico.",
        "Lava velocemente i contenitori sporchi di cibo.",
        "Controlla il calendario per sapere quale rifiuto esce quel giorno.",
      ],
      correctOrder: [1, 2, 3, 0],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Contratto di affitto: i punti principali", topicTag: "casa",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "Il contratto di affitto dura quattro anni. L'affitto è di 600 euro al mese e va pagato entro il giorno 5 di ogni mese. All'inizio l'inquilino versa un deposito di due mesi, che sarà restituito alla fine, se non ci sono danni. Gli animali domestici non sono ammessi.",
      questions: [
        { q: "Quanto dura il contratto?", options: ["Un anno", "Due anni", "Quattro anni", "Sei anni"], answerIndex: 2 },
        { q: "Entro quando si paga l'affitto?", options: ["Entro il giorno 5", "Entro il giorno 10", "Entro fine mese", "Il primo del mese"], answerIndex: 0 },
        { q: "Quando viene restituito il deposito?", options: ["Mai", "Alla fine, se non ci sono danni", "Dopo un anno", "Ogni mese"], answerIndex: 1 },
        { q: "Sono ammessi gli animali domestici?", options: ["Sì", "No", "Solo i gatti", "Solo con un permesso"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "La bolletta della luce", topicTag: "vita quotidiana",
    prompt: "Leggi la bolletta e rispondi.",
    payload: {
      passage: "BOLLETTA ENERGIA ELETTRICA\nPeriodo: gennaio–febbraio. Consumo: 210 kWh. Importo totale: 78,50 euro. Scadenza del pagamento: 15 marzo. Si può pagare in banca, alla posta, in tabaccheria o con addebito automatico sul conto. In caso di ritardo si pagano gli interessi.",
      questions: [
        { q: "Qual è l'importo da pagare?", options: ["21 euro", "78,50 euro", "150 euro", "15 euro"], answerIndex: 1 },
        { q: "Qual è la scadenza?", options: ["Il 15 gennaio", "Il 15 marzo", "Il 28 febbraio", "Il primo aprile"], answerIndex: 1 },
        { q: "Cosa succede se si paga in ritardo?", options: ["Niente", "Si pagano gli interessi", "Si stacca subito la luce", "Si perde il contratto"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Modulo di iscrizione a scuola", topicTag: "scuola",
    prompt: "Leggi le istruzioni del modulo e rispondi.",
    payload: {
      passage: "ISCRIZIONE ALLA SCUOLA PRIMARIA\nLe iscrizioni sono aperte dal 8 al 31 gennaio, solo online sul sito del Ministero. Serve lo SPID di un genitore. Bisogna indicare la scuola scelta e una seconda scuola come alternativa. Dopo l'invio si riceve una email di conferma. Le famiglie senza computer possono farsi aiutare in segreteria.",
      questions: [
        { q: "Come si fa l'iscrizione?", options: ["Di persona", "Per posta", "Solo online", "Per telefono"], answerIndex: 2 },
        { q: "Che cosa serve per iscriversi?", options: ["Solo la carta d'identità", "Lo SPID di un genitore", "Due fototessere", "Il passaporto del bambino"], answerIndex: 1 },
        { q: "Cosa ricevono le famiglie dopo l'invio?", options: ["Una telefonata", "Una email di conferma", "Una lettera a casa", "Un SMS a pagamento"], answerIndex: 1 },
        { q: "Chi non ha un computer cosa può fare?", options: ["Non può iscriversi", "Farsi aiutare in segreteria", "Aspettare l'anno dopo", "Pagare un servizio privato"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "LETTURA", taskType: "ORDERING", difficulty: "STRETCH",
    title: "Regolamento della biblioteca comunale", topicTag: "uffici pubblici",
    prompt: "Ordina i passaggi per prendere in prestito un libro.",
    payload: {
      instruction: "Metti in ordine le fasi del prestito.",
      shuffled: [
        "Riporta il libro entro trenta giorni per non pagare la multa.",
        "Fai la tessera gratuita presentando un documento d'identità.",
        "Porta il libro al banco e mostra la tessera per registrarlo.",
        "Cerca il libro sugli scaffali o nel catalogo online.",
      ],
      correctOrder: [1, 3, 2, 0],
    },
  },

  // ---------------- PRODUZIONE SCRITTA (6): 2 F, 3 C, 1 S — WRITING (estimate) ----------------
  {
    exam: "CILS_B1C", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Email all'ufficio anagrafe per un certificato", topicTag: "comune", guidanceNote: est(),
    prompt: "Scrivi una breve email formale all'ufficio anagrafe.",
    payload: {
      task: "Scrivi un'email all'ufficio anagrafe del tuo Comune per chiedere un certificato di residenza. Spiega perché ti serve e chiedi come puoi ritirarlo.",
      context: "Registro amministrativo, tono formale ma semplice.",
      minWords: 40, maxWords: 80,
      criteria: ["Formula di apertura e chiusura adeguate", "Richiesta chiara del certificato", "Motivo della richiesta", "Correttezza di base (verbi, ortografia)"],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Messaggio al padrone di casa", topicTag: "casa", guidanceNote: est(),
    prompt: "Scrivi un breve messaggio al proprietario dell'appartamento.",
    payload: {
      task: "Nel tuo appartamento in affitto il riscaldamento non funziona. Scrivi un messaggio al padrone di casa: spiega il problema e chiedi di ripararlo presto.",
      context: "Registro quotidiano, tono cortese.",
      minWords: 40, maxWords: 80,
      criteria: ["Descrizione chiara del problema", "Richiesta di intervento", "Cortesia", "Correttezza di base"],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Lettera per disdire un abbonamento", topicTag: "vita quotidiana", guidanceNote: est(),
    prompt: "Scrivi una lettera formale di disdetta.",
    payload: {
      task: "Vuoi disdire l'abbonamento alla palestra. Scrivi una lettera alla palestra: comunica la disdetta, indica da quando e chiedi conferma per iscritto.",
      context: "Registro formale.",
      minWords: 60, maxWords: 100,
      criteria: ["Intenzione chiara di disdetta", "Data di fine indicata", "Richiesta di conferma", "Struttura di una lettera formale"],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Modulo di reclamo alle poste", topicTag: "poste", guidanceNote: est(),
    prompt: "Scrivi un reclamo scritto all'ufficio postale.",
    payload: {
      task: "Hai spedito un pacco importante ma non è mai arrivato. Scrivi un reclamo alle poste: spiega cosa è successo, dai i dati della spedizione e chiedi una soluzione.",
      context: "Registro formale, amministrativo.",
      minWords: 60, maxWords: 100,
      criteria: ["Descrizione dei fatti", "Dati utili (data, destinatario)", "Richiesta di soluzione o rimborso", "Tono formale corretto"],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Richiesta di appuntamento al CAF", topicTag: "uffici pubblici", guidanceNote: est(),
    prompt: "Scrivi un'email per chiedere un appuntamento.",
    payload: {
      task: "Scrivi un'email a un CAF per chiedere un appuntamento e farti aiutare con la dichiarazione dei redditi. Indica la tua disponibilità e chiedi quali documenti portare.",
      context: "Registro formale, servizi al cittadino.",
      minWords: 50, maxWords: 90,
      criteria: ["Richiesta di appuntamento chiara", "Disponibilità indicata", "Domanda sui documenti", "Correttezza formale"],
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "Lettera di presentazione per un lavoro", topicTag: "lavoro", guidanceNote: est(),
    prompt: "Scrivi una breve lettera di presentazione.",
    payload: {
      task: "Hai visto un annuncio per un lavoro come commesso/a in un negozio. Scrivi una lettera di presentazione: parla della tua esperienza, spiega perché sei adatto/a e chiedi un colloquio.",
      context: "Registro formale, contesto lavorativo.",
      minWords: 70, maxWords: 120,
      criteria: ["Riferimento all'annuncio", "Esperienza e qualità personali", "Richiesta di colloquio", "Organizzazione del testo e correttezza"],
    },
  },

  // ---------------- PRODUZIONE ORALE (6): 2 F, 3 C, 1 S — SPEAKING (estimate) ----------------
  {
    exam: "CILS_B1C", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Presentarsi allo sportello", topicTag: "uffici pubblici", guidanceNote: est(),
    prompt: "Presentati come se fossi allo sportello di un ufficio.",
    payload: {
      task: "Immagina di essere a uno sportello pubblico. Presentati: di' il tuo nome, da dove vieni, da quanto tempo vivi in Italia e perché sei venuto/a all'ufficio.",
      parts: ["Nome e provenienza", "Da quanto vivi in Italia", "Motivo della visita all'ufficio"],
      criteria: ["Presentazione chiara", "Frasi complete", "Pronuncia comprensibile", "Uso corretto dei tempi verbali di base"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Descrivere la propria giornata", topicTag: "vita quotidiana", guidanceNote: est(),
    prompt: "Descrivi una tua giornata tipica.",
    payload: {
      task: "Racconta come passi una giornata normale: cosa fai la mattina, il pomeriggio e la sera. Usa il presente.",
      parts: ["La mattina", "Il pomeriggio", "La sera"],
      criteria: ["Uso del presente", "Vocabolario della quotidianità", "Frasi collegate (poi, dopo, infine)", "Fluidità di base"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Chiedere informazioni in comune", topicTag: "comune", guidanceNote: est(),
    prompt: "Simula un dialogo per chiedere informazioni.",
    payload: {
      task: "Sei al Comune e devi cambiare la tua residenza. Spiega all'impiegato cosa ti serve, fai due o tre domande (documenti, tempi, costi) e ringrazia.",
      parts: ["Spiegare la richiesta", "Fare domande su documenti e tempi", "Chiudere il dialogo con cortesia"],
      criteria: ["Domande formulate correttamente", "Registro adeguato all'ufficio", "Comprensione delle risposte", "Cortesia"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Raccontare un problema con una bolletta", topicTag: "vita quotidiana", guidanceNote: est(),
    prompt: "Racconta e spiega un problema.",
    payload: {
      task: "Hai ricevuto una bolletta troppo alta. Racconta il problema come se parlassi con un operatore: spiega cosa è successo, di' cosa ti aspetti e proponi una soluzione.",
      parts: ["Descrivere il problema", "Spiegare perché non è giusto", "Proporre o chiedere una soluzione"],
      criteria: ["Racconto ordinato", "Uso del passato prossimo", "Capacità di argomentare", "Vocabolario adeguato"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Dialogo dal medico", topicTag: "asl", guidanceNote: est(),
    prompt: "Simula una visita dal medico.",
    payload: {
      task: "Sei dal medico perché non ti senti bene. Descrivi i sintomi, rispondi alle domande e chiedi cosa devi fare.",
      parts: ["Descrivere i sintomi", "Rispondere alle domande del medico", "Chiedere la cura"],
      criteria: ["Vocabolario del corpo e della salute", "Frasi chiare", "Interazione con il medico", "Correttezza di base"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_B1C", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Spiegare perché si chiede la cittadinanza", topicTag: "cittadinanza", guidanceNote: est(),
    prompt: "Esprimi e motiva la tua scelta.",
    payload: {
      task: "Spiega perché vorresti diventare cittadino/a italiano/a. Parla della tua vita in Italia, del tuo legame con il Paese e dei tuoi progetti per il futuro.",
      parts: ["La tua vita in Italia", "Il tuo legame con il Paese", "I progetti per il futuro"],
      criteria: ["Capacità di esprimere opinioni e motivi", "Uso del futuro e del condizionale", "Coerenza del discorso", "Ricchezza del vocabolario"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
];
