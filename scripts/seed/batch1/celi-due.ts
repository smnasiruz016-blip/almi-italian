// CELI 2 (B1) — 18 items. CELI level code = DUE (distinct from CILS DUE=B2 because exam=CELI).
// Scored on the CELI engine: Written part + Oral part, both must clear; A–E grade-band estimate.
// payload.part marks WRITTEN vs ORAL — CELI is scored by PART, not by section.
// (No Linguistic Competence sub-skill: that appears from CELI 3/B2 upward — out of scope for a CELI 2 batch.)
import { ESTIMATE_NOTE, type RawItem } from "./types";

const L = "DUE"; // CELI 2 = B1
const est = (): string => ESTIMATE_NOTE;

export const CELI_DUE_ITEMS: RawItem[] = [
  // ---------------- ASCOLTO (5) — WRITTEN part: 2 F, 2 C, 1 S ----------------
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Annuncio in aeroporto", topicTag: "viaggi",
    prompt: "Ascolta l'annuncio e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Ultima chiamata per i passeggeri del volo AZ 320 per Napoli. L'imbarco è in chiusura all'uscita numero 12. I passeggeri sono pregati di presentarsi immediatamente con la carta d'imbarco e il documento. Il gate chiuderà tra cinque minuti.",
      questions: [
        { q: "Qual è la destinazione del volo?", options: ["Milano", "Napoli", "Roma", "Palermo"], answerIndex: 1 },
        { q: "A quale uscita è l'imbarco?", options: ["Uscita 2", "Uscita 12", "Uscita 20", "Uscita 5"], answerIndex: 1 },
        { q: "Tra quanto chiude il gate?", options: ["Tra cinque minuti", "Tra dieci minuti", "Tra un'ora", "È già chiuso"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Messaggio telefonico di un negozio", topicTag: "servizi",
    prompt: "Ascolta il messaggio e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Salve, la chiamo dal negozio di elettronica. Il computer che ha ordinato è arrivato. Può passare a ritirarlo quando vuole, siamo aperti dalle 9 alle 19, dal lunedì al sabato. Ricordi di portare la ricevuta dell'ordine. Grazie e a presto.",
      questions: [
        { q: "Cosa è arrivato al negozio?", options: ["Un telefono", "Un computer", "Una stampante", "Una televisione"], answerIndex: 1 },
        { q: "Quando è aperto il negozio?", options: ["Solo la domenica", "Dalle 9 alle 19, lunedì-sabato", "Solo di sera", "24 ore su 24"], answerIndex: 1 },
        { q: "Cosa deve portare il cliente?", options: ["La carta d'identità", "La ricevuta dell'ordine", "Due fototessere", "Il vecchio computer"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista in radio a una libraia", topicTag: "cultura",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "La sua libreria organizza molte attività, vero? Sì, ogni sabato pomeriggio facciamo letture per i bambini, e una volta al mese invitiamo uno scrittore. Vogliamo che la libreria non sia solo un negozio, ma un luogo di incontro. Da quando abbiamo iniziato, sono arrivati molti nuovi clienti, soprattutto famiglie.",
      questions: [
        { q: "Cosa si fa ogni sabato pomeriggio?", options: ["Sconti sui libri", "Letture per bambini", "Concerti", "Corsi di cucina"], answerIndex: 1 },
        { q: "Cosa vuole essere la libreria oltre a un negozio?", options: ["Un bar", "Un luogo di incontro", "Una scuola", "Una biblioteca gratuita"], answerIndex: 1 },
        { q: "Chi sono soprattutto i nuovi clienti?", options: ["Turisti", "Famiglie", "Studenti universitari", "Anziani"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Conversazione tra colleghi: i compiti", topicTag: "lavoro",
    prompt: "Ascolta e abbina ogni collega al suo compito.",
    payload: {
      part: "WRITTEN",
      audioScript: "Allora, dividiamoci il lavoro per la riunione. Giulia, tu prepari le slide. Marco, tu chiami i clienti per confermare. Io scrivo il verbale. E Sara, puoi prenotare la sala e ordinare i caffè? Perfetto, così siamo a posto.",
      instruction: "Abbina ogni persona al suo compito.",
      prompts: ["Giulia", "Marco", "Chi parla (io)", "Sara"],
      options: ["Chiamare i clienti", "Preparare le slide", "Prenotare la sala", "Scrivere il verbale"],
      answerMap: [1, 0, 3, 2],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Servizio del telegiornale sulla mobilità", topicTag: "attualità",
    prompt: "Ascolta il servizio e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Da lunedì la nostra città lancia un nuovo servizio di biciclette in condivisione. Ci saranno cinquanta stazioni in tutto il centro. Per usare le bici basta scaricare un'app e registrarsi. La prima mezz'ora sarà gratuita, poi si pagherà un euro ogni trenta minuti. Il Comune spera così di ridurre il traffico e l'inquinamento.",
      questions: [
        { q: "Quale servizio parte lunedì?", options: ["Nuovi autobus", "Biciclette in condivisione", "Un parcheggio gratuito", "Un treno veloce"], answerIndex: 1 },
        { q: "Com'è la prima mezz'ora?", options: ["Gratuita", "Costa un euro", "Costa due euro", "Non è disponibile"], answerIndex: 0 },
        { q: "Cosa spera di ottenere il Comune?", options: ["Più turisti", "Ridurre traffico e inquinamento", "Più soldi dalle multe", "Aprire nuovi negozi"], answerIndex: 1 },
      ],
    },
  },

  // ---------------- LETTURA (5) — WRITTEN part: 2 F, 2 C, 1 S ----------------
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Articolo di cronaca: la sagra del paese", topicTag: "attualità",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Torna anche quest'anno la sagra della castagna, in programma il primo weekend di ottobre. Nella piazza del paese ci saranno stand di prodotti tipici, musica dal vivo e giochi per i bambini. L'ingresso è libero. Gli organizzatori consigliano di arrivare presto, perché lo scorso anno la piazza era piena già a mezzogiorno.",
      questions: [
        { q: "Quando si svolge la sagra?", options: ["Il primo weekend di ottobre", "A Natale", "In estate", "A Pasqua"], answerIndex: 0 },
        { q: "Quanto costa l'ingresso?", options: ["Cinque euro", "È libero", "Dieci euro", "Solo per i bambini"], answerIndex: 1 },
        { q: "Perché conviene arrivare presto?", options: ["Per il parcheggio", "Perché la piazza si riempie subito", "Per lo sconto", "Per il sole"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Email di lavoro", topicTag: "lavoro",
    prompt: "Leggi l'email e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Ciao a tutti,\nvi ricordo che la riunione di lunedì è stata spostata dalle 10 alle 15, nella sala grande. Per favore, portate i dati delle vendite del mese. Chi non può partecipare, avvisi entro venerdì. Grazie, buona giornata.\nLaura",
      questions: [
        { q: "A che ora è stata spostata la riunione?", options: ["Alle 10", "Alle 15", "Alle 12", "Alle 9"], answerIndex: 1 },
        { q: "Cosa devono portare i colleghi?", options: ["Il computer", "I dati delle vendite del mese", "Il pranzo", "I documenti personali"], answerIndex: 1 },
        { q: "Cosa deve fare chi non può partecipare?", options: ["Niente", "Avvisare entro venerdì", "Chiamare Laura di lunedì", "Mandare un sostituto"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Depliant turistico di una città", topicTag: "viaggi",
    prompt: "Leggi il depliant e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Benvenuti a Orvieto! Questa piccola città sorge su una collina di roccia e offre una vista spettacolare sulla campagna. Da non perdere: il Duomo, con la sua facciata dorata, e i pozzi antichi scavati nella roccia. Vi consigliamo di visitare la città a piedi, perché le strade del centro sono strette e in salita. Un trenino turistico collega il parcheggio al centro storico.",
      questions: [
        { q: "Dove sorge Orvieto?", options: ["Sul mare", "Su una collina di roccia", "In una valle", "Vicino a un lago"], answerIndex: 1 },
        { q: "Cosa si consiglia di non perdere?", options: ["Il porto", "Il Duomo e i pozzi antichi", "La stazione", "Il centro commerciale"], answerIndex: 1 },
        { q: "Perché si consiglia di visitare a piedi?", options: ["Perché non ci sono auto", "Perché le strade sono strette e in salita", "Perché è vietato guidare", "Perché è più economico"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "ORDERING", difficulty: "CORE",
    title: "Lettera al giornale: rimetti in ordine", topicTag: "opinione",
    prompt: "Rimetti in ordine le parti di una breve lettera al giornale.",
    payload: {
      part: "WRITTEN",
      instruction: "Ordina le frasi per formare una lettera coerente.",
      shuffled: [
        "Per questo chiedo al Comune di aggiungere più cestini e panchine.",
        "Gentile Direttore, le scrivo per parlare del parco vicino a casa mia.",
        "È un bel posto, ma purtroppo mancano i cestini per i rifiuti.",
        "Sono sicuro che con piccoli interventi il parco potrebbe migliorare molto.",
      ],
      correctOrder: [1, 2, 0, 3],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Articolo di approfondimento: mangiare di stagione", topicTag: "cultura",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Comprare frutta e verdura di stagione ha molti vantaggi. Prima di tutto, questi prodotti costano meno, perché ce n'è in abbondanza. Inoltre, hanno più sapore e più sostanze utili, dato che vengono raccolti al momento giusto. Infine, scegliere prodotti locali e di stagione aiuta l'ambiente: si evita di trasportare il cibo da lontano, riducendo l'inquinamento. Basta un po' di attenzione al momento della spesa per fare bene a sé e al pianeta.",
      questions: [
        { q: "Perché i prodotti di stagione costano meno?", options: ["Sono di bassa qualità", "Ce n'è in abbondanza", "Sono importati", "Nessuno li compra"], answerIndex: 1 },
        { q: "Perché hanno più sapore?", options: ["Sono più costosi", "Vengono raccolti al momento giusto", "Sono più grandi", "Sono conservati a lungo"], answerIndex: 1 },
        { q: "Come aiutano l'ambiente i prodotti locali?", options: ["Si evita di trasportarli da lontano", "Costano di più", "Sono più colorati", "Si buttano meno"], answerIndex: 0 },
      ],
    },
  },

  // ---------------- SCRITTURA (4) — WRITTEN part: 1 F, 2 C, 1 S — WRITING (estimate) ----------------
  {
    exam: "CELI", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Cartolina dalle vacanze", topicTag: "vita sociale", guidanceNote: est(),
    prompt: "Scrivi una breve cartolina.",
    payload: {
      part: "WRITTEN",
      task: "Sei in vacanza in una città italiana. Scrivi una cartolina a un amico: di' dove sei, com'è il posto, cosa hai fatto e quando torni.",
      context: "Registro informale, testo breve.",
      minWords: 40, maxWords: 70,
      criteria: ["Contenuti richiesti presenti", "Registro informale", "Uso del passato prossimo", "Correttezza di base"],
    },
  },
  {
    exam: "CELI", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Email di lamentela per un prodotto", topicTag: "servizi", guidanceNote: est(),
    prompt: "Scrivi un'email semi-formale.",
    payload: {
      part: "WRITTEN",
      task: "Hai comprato online un prodotto arrivato rotto. Scrivi un'email al negozio: spiega il problema, allega (a parole) la prova d'acquisto e chiedi la sostituzione o il rimborso.",
      context: "Registro semi-formale.",
      minWords: 70, maxWords: 110,
      criteria: ["Descrizione chiara del problema", "Richiesta precisa (sostituzione/rimborso)", "Registro adeguato", "Correttezza B1"],
    },
  },
  {
    exam: "CELI", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Racconto di un'esperienza", topicTag: "vita sociale", guidanceNote: est(),
    prompt: "Scrivi un breve racconto personale.",
    payload: {
      part: "WRITTEN",
      task: "Racconta una giornata particolare che ricordi bene (una festa, un incontro, un imprevisto): cosa è successo, dove, con chi e come ti sei sentito/a.",
      context: "Testo narrativo, registro informale.",
      minWords: 80, maxWords: 120,
      criteria: ["Racconto ordinato nel tempo", "Uso di passato prossimo e imperfetto", "Descrizione delle emozioni", "Coesione e correttezza"],
    },
  },
  {
    exam: "CELI", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "Lettera di opinione al giornale", topicTag: "opinione", guidanceNote: est(),
    prompt: "Scrivi una lettera di opinione.",
    payload: {
      part: "WRITTEN",
      task: "Scrivi una lettera al giornale locale su un tema che ti sta a cuore nella tua città (traffico, spazi verdi, pulizia). Descrivi il problema, spiega perché è importante e proponi una soluzione.",
      context: "Registro formale, testo argomentativo.",
      minWords: 100, maxWords: 150,
      criteria: ["Problema ben descritto", "Argomentazione chiara", "Proposta concreta", "Registro formale e correttezza"],
    },
  },

  // ---------------- ORALE (4) — ORAL part: 1 F, 2 C, 1 S — SPEAKING (estimate) ----------------
  {
    exam: "CELI", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Presentazione personale", topicTag: "descrizione", guidanceNote: est(),
    prompt: "Presentati all'esaminatore.",
    payload: {
      part: "ORAL",
      task: "Presentati: di' come ti chiami, da dove vieni, cosa fai (studio o lavoro), i tuoi interessi e perché studi l'italiano.",
      parts: ["Nome e provenienza", "Studio o lavoro", "Interessi e motivo per studiare italiano"],
      criteria: ["Presentazione completa", "Frasi complete e collegate", "Pronuncia comprensibile", "Correttezza di base"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CELI", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Descrivere un'immagine", topicTag: "descrizione", guidanceNote: est(),
    prompt: "Descrivi la scena e commenta.",
    payload: {
      part: "ORAL",
      task: "Immagina la foto di una famiglia che fa un picnic al parco. Descrivi le persone, cosa fanno e l'ambiente. Poi di' se ti piace passare il tempo così e perché.",
      parts: ["Descrizione delle persone e dell'ambiente", "Cosa stanno facendo", "La tua opinione personale"],
      criteria: ["Ricchezza descrittiva", "Uso del presente e del gerundio", "Espressione dell'opinione", "Fluidità B1"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CELI", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Simulazione: prenotare un albergo", topicTag: "viaggi", guidanceNote: est(),
    prompt: "Simula un dialogo di prenotazione.",
    payload: {
      part: "ORAL",
      task: "Telefoni a un albergo per prenotare una camera. Spiega quante persone siete, per quante notti, chiedi il prezzo e se la colazione è inclusa. Concludi confermando la prenotazione.",
      parts: ["Richiesta della camera (persone e notti)", "Domande su prezzo e colazione", "Conferma della prenotazione"],
      criteria: ["Interazione realistica", "Domande formulate correttamente", "Comprensione delle risposte", "Cortesia e registro"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CELI", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Esprimere opinioni su un tema", topicTag: "opinione", guidanceNote: est(),
    prompt: "Esponi e motiva la tua opinione.",
    payload: {
      part: "ORAL",
      task: "Oggi molte persone fanno la spesa online invece di andare al negozio. Secondo te è una cosa positiva o negativa? Esprimi la tua opinione con vantaggi, svantaggi ed esempi dalla tua esperienza.",
      parts: ["La tua opinione", "Vantaggi e svantaggi", "Un esempio dalla tua esperienza"],
      criteria: ["Opinione chiara e motivata", "Confronto di pro e contro", "Uso di esempi", "Ricchezza lessicale e fluidità"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
];
