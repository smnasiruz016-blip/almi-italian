// CELI 2 (B1) — 38 items. CELI level code = DUE (distinct from CILS DUE=B2 because exam=CELI).
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

  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Annuncio al supermercato", topicTag: "servizi",
    prompt: "Ascolta l'annuncio e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Gentili clienti, vi ricordiamo che il supermercato chiude tra quindici minuti. Le casse restano aperte fino alle venti e trenta. Da domani il negozio apre alle otto invece che alle nove. Grazie e buona serata.",
      questions: [
        { q: "Quando chiude il supermercato?", options: ["Tra quindici minuti", "Alle venti", "Domani", "Tra un'ora"], answerIndex: 0 },
        { q: "Che cosa cambia da domani?", options: ["Il negozio chiude prima", "Il negozio apre un'ora prima", "Le casse chiudono alle venti", "Il negozio resta chiuso"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Segreteria telefonica dello studio dentistico", topicTag: "servizi",
    prompt: "Ascolta il messaggio e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Buongiorno, la chiamiamo dallo studio dentistico per confermare l'appuntamento di mercoledì alle sedici. Se non può venire, ci avvisi almeno un giorno prima. La ricordiamo di portare la documentazione della visita precedente.",
      questions: [
        { q: "Perché chiamano?", options: ["Per spostare l'appuntamento", "Per confermarlo", "Per annullarlo", "Per chiedere un pagamento"], answerIndex: 1 },
        { q: "Entro quando bisogna avvisare se non si può andare?", options: ["Almeno un giorno prima", "La mattina stessa", "Un'ora prima", "Non serve avvisare"], answerIndex: 0 },
        { q: "Che cosa bisogna portare?", options: ["Una fototessera", "La documentazione della visita precedente", "Il pagamento in contanti", "Niente"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Comunicazione in palestra", topicTag: "vita quotidiana",
    prompt: "Ascolta la comunicazione e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Attenzione: giovedì la piscina resta chiusa per manutenzione. I corsi di nuoto di quel giorno saranno recuperati sabato mattina. La sala pesi e i corsi di ginnastica funzionano normalmente.",
      questions: [
        { q: "Che cosa succede giovedì?", options: ["Chiude tutta la palestra", "Chiude solo la piscina", "Chiude la sala pesi", "Non c'è nessun corso"], answerIndex: 1 },
        { q: "Quando si recuperano i corsi di nuoto?", options: ["Venerdì sera", "Sabato mattina", "La settimana dopo", "Non si recuperano"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a un cuoco", topicTag: "cultura",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Molti pensano che per cucinare bene servano ingredienti costosi. Nella mia esperienza è il contrario: i piatti che funzionano meglio nel mio ristorante sono quelli poveri, fatti con tre o quattro cose. La difficoltà non è trovare l'ingrediente raro, è avere pazienza: certe cotture non si possono accorciare.",
      questions: [
        { q: "Che cosa pensa il cuoco degli ingredienti costosi?", options: ["Che sono indispensabili", "Che i piatti semplici funzionano meglio", "Che sono difficili da trovare", "Che vanno usati solo la domenica"], answerIndex: 1 },
        { q: "Qual è, secondo lui, la vera difficoltà?", options: ["Trovare ingredienti rari", "Avere pazienza nelle cotture", "Il costo del ristorante", "Trovare personale"], answerIndex: 1 },
        { q: "Di che cosa parla il cuoco?", options: ["Della sua esperienza nel suo ristorante", "Della cucina italiana in generale", "Di una ricerca scientifica", "Dei ristoranti del suo paese"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Quattro amici e i loro gusti", topicTag: "cultura",
    prompt: "Ascolta le quattro persone e abbina ognuna al genere che preferisce.",
    payload: {
      part: "WRITTEN",
      audioScript: "Anna: A me piacciono le storie che fanno ridere, esco dal cinema di buon umore. Bruno: Io guardo solo cose vere, documentari soprattutto. Carla: A me interessano i film che fanno paura, più sono spaventosi meglio è. Dario: Io preferisco le storie d'amore, anche se finiscono male.",
      instruction: "Abbina ogni persona al genere preferito.",
      prompts: ["Anna", "Bruno", "Carla", "Dario"],
      options: ["Documentari", "Commedie", "Film romantici", "Film dell'orrore"],
      answerMap: [1, 0, 3, 2],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Organizzare un viaggio", topicTag: "viaggi",
    prompt: "Ascolta la conversazione e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "— Allora, partiamo venerdì sera o sabato mattina? — Venerdì sera arriviamo tardi e paghiamo una notte in più. — Però sabato mattina troviamo traffico. — Se partiamo alle sei, no. — Va bene, sabato alle sei. Prenoto io il treno.",
      questions: [
        { q: "Quando partono?", options: ["Venerdì sera", "Sabato alle sei", "Sabato pomeriggio", "Domenica"], answerIndex: 1 },
        { q: "Perché non partono venerdì sera?", options: ["C'è traffico", "Costerebbe una notte in più", "Non ci sono treni", "Uno dei due lavora"], answerIndex: 1 },
        { q: "Come viaggiano?", options: ["In macchina", "In treno", "In autobus", "In aereo"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Notiziario locale: riapre il teatro", topicTag: "attualità",
    prompt: "Ascolta il notiziario e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "Dopo tre anni di lavori riapre il teatro comunale. La prima serata sarà a ingresso gratuito, ma con prenotazione obbligatoria. Gli organizzatori dicono che la sala ha ora meno posti di prima, perché lo spazio è stato riorganizzato per renderlo accessibile.",
      questions: [
        { q: "Come si entra alla prima serata?", options: ["Pagando il biglietto", "Gratis, ma prenotando", "Solo su invito", "Non si può entrare"], answerIndex: 1 },
        { q: "Che cosa è cambiato nella sala?", options: ["Ha più posti", "Ha meno posti, ma è accessibile", "È più piccola perché costava troppo", "Non è cambiato niente"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Telefonata all'agenzia di viaggi", topicTag: "viaggi",
    prompt: "Ascolta la telefonata e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "— Vorrei spostare la partenza dal 10 al 17. — Vediamo… sì, c'è posto, ma la tariffa è diversa: ci sono quaranta euro di differenza. — E se partissi il 15? — Il 15 costa come il 10, però l'orario è alle sei del mattino. — Allora prendo il 15.",
      questions: [
        { q: "Quale data sceglie il cliente?", options: ["Il 10", "Il 15", "Il 17", "Nessuna"], answerIndex: 1 },
        { q: "Perché non sceglie il 17?", options: ["Non c'è posto", "Costa di più", "Parte troppo presto", "L'agenzia è chiusa"], answerIndex: 1 },
        { q: "Che cosa accetta il cliente scegliendo il 15?", options: ["Di pagare di più", "Di partire molto presto", "Di cambiare destinazione", "Di viaggiare in treno"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "STRETCH",
    title: "Quattro opinioni sul lavoro da casa", topicTag: "opinione",
    prompt: "Ascolta le quattro persone e abbina ognuna alla sua posizione.",
    payload: {
      part: "WRITTEN",
      audioScript: "Persona 1: Per me è comodissimo: risparmio due ore di viaggio e le uso per la famiglia. Persona 2: Io lavoro meglio in ufficio, a casa mi distraggo e finisco per lavorare fino a tardi. Persona 3: Non è il posto il problema, è che nessuno ha spiegato quando si può staccare. Persona 4: A me va bene qualche giorno a casa e qualche giorno in ufficio, non tutto o niente.",
      instruction: "Abbina ogni persona alla posizione giusta.",
      prompts: ["Persona 1", "Persona 2", "Persona 3", "Persona 4"],
      options: [
        "Preferisce una soluzione mista",
        "Apprezza soprattutto il tempo risparmiato",
        "Lavora meglio in ufficio",
        "Pensa che il problema non sia il luogo ma le regole",
      ],
      answerMap: [1, 2, 3, 0],
    },
  },
  {
    exam: "CELI", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Intervista a una volontaria della biblioteca", topicTag: "cultura",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      part: "WRITTEN",
      audioScript: "— Voi tenete aperta la biblioteca anche il sabato. Chi viene? — All'inizio pensavamo studenti. In realtà vengono soprattutto persone che stanno da sole: prendono un libro, ma restano seduti due ore. — Quindi non è solo una questione di libri. — No. Se fosse solo per i libri basterebbe un armadio.",
      questions: [
        { q: "Chi frequenta la biblioteca il sabato, secondo la volontaria?", options: ["Soprattutto studenti", "Soprattutto persone sole", "Soprattutto famiglie", "Quasi nessuno"], answerIndex: 1 },
        { q: "Che cosa vuole dire con «basterebbe un armadio»?", options: ["Che servono più scaffali", "Che il valore del posto non sta solo nei libri", "Che la biblioteca è troppo piccola", "Che i libri non servono"], answerIndex: 1 },
        { q: "Che cosa si aspettavano all'inizio?", options: ["Che venissero gli studenti", "Che non venisse nessuno", "Che venissero i bambini", "Che si dovesse chiudere"], answerIndex: 0 },
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

  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Cartello in albergo", topicTag: "viaggi",
    prompt: "Leggi il cartello e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "INFORMAZIONI PER GLI OSPITI — La colazione è servita dalle 7:00 alle 10:00 nella sala al piano terra. Il check-out è entro le 11:00; chi parte più tardi può lasciare i bagagli alla reception. La piscina è aperta dalle 9:00 alle 19:00. Il parcheggio è gratuito per chi soggiorna almeno due notti.",
      questions: [
        { q: "Fino a che ora si può fare colazione?", options: ["Fino alle 7:00", "Fino alle 10:00", "Fino alle 11:00", "Fino alle 19:00"], answerIndex: 1 },
        { q: "Che cosa può fare chi parte dopo le 11:00?", options: ["Restare in camera", "Lasciare i bagagli alla reception", "Pagare una notte in più", "Usare la piscina"], answerIndex: 1 },
        { q: "Quando il parcheggio è gratuito?", options: ["Sempre", "Con almeno due notti di soggiorno", "Solo di giorno", "Mai"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Messaggi tra amici: organizzare una cena", topicTag: "vita quotidiana",
    prompt: "Leggi i messaggi e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "GIULIA: Ragazzi, cena da me sabato? — LUCA: Per me sì, ma arrivo dopo le nove, esco tardi dal lavoro. — SARA: Io ci sono. Porto il dolce. — GIULIA: Perfetto, allora facciamo alle nove e mezza così ci siamo tutti. Luca, tu porta il pane. — LUCA: Ok!",
      questions: [
        { q: "A che ora si vedono?", options: ["Alle nove", "Alle nove e mezza", "Alle dieci", "Non è deciso"], answerIndex: 1 },
        { q: "Perché hanno spostato l'orario?", options: ["Perché Sara porta il dolce", "Perché Luca finisce tardi di lavorare", "Perché il ristorante apre tardi", "Perché Giulia non è pronta"], answerIndex: 1 },
        { q: "Che cosa porta Luca?", options: ["Il dolce", "Il pane", "Il vino", "Niente"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Programma di un festival", topicTag: "cultura",
    prompt: "Leggi il programma e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "FESTIVAL DI PRIMAVERA — venerdì: concerto in piazza, ore 21. Sabato: mercatino dell'artigianato tutto il giorno e spettacolo per bambini alle 17. Domenica: passeggiata guidata nel bosco, partenza alle 9 dal parcheggio del municipio; in caso di pioggia la passeggiata è rimandata alla domenica successiva. Tutti gli eventi sono gratuiti.",
      questions: [
        { q: "Quando è lo spettacolo per bambini?", options: ["Venerdì alle 21", "Sabato alle 17", "Domenica alle 9", "Tutti i giorni"], answerIndex: 1 },
        { q: "Che cosa succede se piove domenica?", options: ["La passeggiata si annulla", "Si rimanda alla domenica dopo", "Si fa lo stesso", "Si fa il mercatino"], answerIndex: 1 },
        { q: "Quanto costano gli eventi?", options: ["Sono gratuiti", "Solo il concerto è a pagamento", "Costano poco", "Non è indicato"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Recensione di un ristorante", topicTag: "opinione",
    prompt: "Leggi la recensione e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Ci siamo andati di sabato sera, senza prenotare, e abbiamo aspettato venti minuti: colpa nostra. Il servizio è gentile ma lento, e questo non è colpa dei clienti. La cucina però merita: il primo era ottimo e il pesce fresco davvero. Prezzi giusti per quello che offrono. Torneremo, ma prenotando e in una sera meno affollata.",
      questions: [
        { q: "Che cosa pensa la persona della cucina?", options: ["È deludente", "È buona", "È troppo cara", "Non ne parla"], answerIndex: 1 },
        { q: "Di che cosa la persona non dà la colpa al ristorante?", options: ["Della lentezza del servizio", "Dell'attesa iniziale", "Dei prezzi", "Del pesce"], answerIndex: 1 },
        { q: "Che cosa farà la prossima volta?", options: ["Non tornerà", "Prenoterà e andrà in una sera meno affollata", "Andrà a pranzo", "Ordinerà solo il primo"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Articolo: tornano le sale piccole", topicTag: "attualità",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "In città alcune sale cinematografiche piccole hanno riaperto, dopo anni in cui sembravano destinate a sparire. I gestori raccontano che il pubblico non è tornato per i film nuovi, che si trovano ovunque, ma per le serate con l'incontro dopo la proiezione. «Se offriamo solo il film», dice uno di loro, «non abbiamo niente che una casa non abbia già».",
      questions: [
        { q: "Perché, secondo i gestori, il pubblico è tornato?", options: ["Per i film nuovi", "Per gli incontri dopo la proiezione", "Perché i biglietti costano meno", "Perché le sale sono più comode"], answerIndex: 1 },
        { q: "Che cosa significa la frase finale?", options: ["Che il cinema deve offrire qualcosa in più della visione", "Che le case sono più comode", "Che i film nuovi non piacciono", "Che le sale devono chiudere"], answerIndex: 0 },
        { q: "Qual è la fonte di questa spiegazione?", options: ["Uno studio nazionale", "I gestori delle sale", "Il comune", "Gli spettatori intervistati"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "ORDERING", difficulty: "CORE",
    title: "Ricetta: rimetti in ordine i passaggi", topicTag: "cultura",
    prompt: "Rimetti in ordine i passaggi della ricetta.",
    payload: {
      part: "WRITTEN",
      instruction: "Ordina i passaggi dal primo all'ultimo.",
      shuffled: [
        "Scola la pasta e mettila nella padella con il condimento.",
        "Metti l'acqua sul fuoco e aspetta che bolla.",
        "Mentre la pasta cuoce, prepara il condimento in padella.",
        "Aggiungi il sale e butta la pasta.",
      ],
      correctOrder: [1, 3, 2, 0],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Annuncio di lavoro stagionale", topicTag: "lavoro",
    prompt: "Leggi l'annuncio e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Hotel in zona lago cerca personale per la stagione estiva, da giugno a settembre. Si richiede conoscenza dell'italiano e di una seconda lingua; non è necessaria esperienza precedente, perché è prevista una formazione iniziale di due settimane. È disponibile un alloggio per chi viene da fuori. Inviare la candidatura entro il 30 aprile.",
      questions: [
        { q: "Serve avere esperienza?", options: ["Sì, almeno un anno", "No, c'è una formazione iniziale", "Sì, ma solo per la reception", "Non è indicato"], answerIndex: 1 },
        { q: "Che cosa è richiesto?", options: ["Solo l'italiano", "L'italiano e una seconda lingua", "Tre lingue", "Nessuna lingua in particolare"], answerIndex: 1 },
        { q: "Che cosa offre l'hotel a chi viene da lontano?", options: ["Il viaggio pagato", "Un alloggio", "Un contratto annuale", "Un corso di lingua"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MATCHING", difficulty: "CORE",
    title: "Quattro testi brevi, quattro titoli", topicTag: "attualità",
    prompt: "Leggi i quattro testi e abbina a ognuno il titolo giusto.",
    payload: {
      part: "WRITTEN",
      instruction: "Abbina ogni testo al titolo giusto. C'è un titolo in più.",
      prompts: [
        "TESTO A: Da lunedì la linea 5 passa ogni dieci minuti invece che ogni venti, ma non ferma più davanti alla scuola.",
        "TESTO B: Il negozio all'angolo chiude dopo quarant'anni: la proprietaria va in pensione e nessuno ha voluto rilevarlo.",
        "TESTO C: Sabato mattina i volontari ripuliranno il parco. Chi vuole partecipare porti guanti e sacchi.",
        "TESTO D: La scuola apre la palestra il pomeriggio ai ragazzi del quartiere, con due educatori presenti.",
      ],
      options: [
        "Più corse, ma una fermata in meno",
        "Chiude una bottega storica",
        "Un pomeriggio in palestra per il quartiere",
        "Volontari al lavoro nel parco",
        "Nuovo parcheggio davanti alla scuola",
      ],
      answerMap: [0, 1, 3, 2],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Articolo di opinione: il tempo libero", topicTag: "opinione",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Diciamo di non avere tempo libero, e in parte è vero. Ma vale la pena distinguere il tempo che non abbiamo da quello che abbiamo e non riconosciamo: mezz'ora in attesa, venti minuti sul tram. Non sostengo che questi ritagli valgano una serata intera — sarebbe consolatorio e falso. Sostengo che chiamarli «niente» ci fa credere di essere più occupati di quanto siamo.",
      questions: [
        { q: "Qual è la tesi dell'autore?", options: ["Che abbiamo molto tempo libero", "Che confondiamo il tempo che manca con quello che non riconosciamo", "Che i ritagli di tempo valgono quanto una serata", "Che bisogna lavorare di meno"], answerIndex: 1 },
        { q: "Che cosa NON sostiene l'autore?", options: ["Che i ritagli sostituiscono una serata intera", "Che esistono ritagli di tempo", "Che ci crediamo più occupati di quanto siamo", "Che in parte è vero che manca il tempo"], answerIndex: 0 },
        { q: "Come definisce l'autore l'idea che i ritagli bastino?", options: ["Realistica", "Consolatoria e falsa", "Interessante", "Diffusa"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CELI", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Lettera al giornale: il traffico in centro", topicTag: "opinione",
    prompt: "Leggi la lettera e rispondi.",
    payload: {
      part: "WRITTEN",
      passage: "Leggo che si vuole chiudere il centro alle auto. Non sono contrario per principio: ci vivo e il rumore lo sento anch'io. Chiedo però che si dica come ci arriverà chi oggi usa la macchina perché gli autobus, la sera, semplicemente non ci sono. Chiudere il centro senza toccare gli orari dei mezzi non riduce il traffico: lo sposta, e sposta anche le persone.",
      questions: [
        { q: "Qual è la posizione di chi scrive?", options: ["È contrario alla chiusura", "Non è contrario, ma chiede che si migliorino i trasporti", "Vuole più parcheggi", "Non esprime un'opinione"], answerIndex: 1 },
        { q: "Qual è la sua obiezione principale?", options: ["Il costo dei lavori", "La sera gli autobus non ci sono", "Il rumore delle auto", "La mancanza di negozi"], answerIndex: 1 },
        { q: "Che cosa significa «lo sposta, e sposta anche le persone»?", options: ["Che il traffico sparisce", "Che il problema si trasferisce altrove e allontana chi non ha alternative", "Che le persone cambiano casa per scelta", "Che gli autobus cambiano percorso"], answerIndex: 1 },
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
