// CILS UNO (B1 standard) — 26 items, 5 sections incl. Analisi (grammar).
// Scored on the CILS standard engine: 5 sections /20, floor 11 each, capitalization banking.
// General/everyday register (NOT the B1c administrative-only world) — kept separate by design.
import { ESTIMATE_NOTE, type RawItem } from "./types";

const L = "UNO";
const est = (): string => ESTIMATE_NOTE;

export const CILS_UNO_ITEMS: RawItem[] = [
  // ---------------- ASCOLTO (6): 2 F, 3 C, 1 S ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Programma della radio del mattino", topicTag: "media",
    prompt: "Ascolta il programma radio e rispondi.",
    payload: {
      audioScript: "Buongiorno e benvenuti a Radio Mattina. Oggi il tempo sarà instabile: nuvole al mattino e qualche pioggia nel pomeriggio, con temperature intorno ai diciotto gradi. Alle nove parleremo di cucina con lo chef Marco, e alle dieci ci sarà la musica dei vostri anni Ottanta.",
      questions: [
        { q: "Com'è il tempo nel pomeriggio?", options: ["Sole", "Qualche pioggia", "Neve", "Vento forte"], answerIndex: 1 },
        { q: "Di che cosa si parla alle nove?", options: ["Di sport", "Di cucina", "Di politica", "Di viaggi"], answerIndex: 1 },
        { q: "Che musica c'è alle dieci?", options: ["Musica classica", "Musica degli anni Ottanta", "Jazz", "Rap"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Messaggio vocale di un amico", topicTag: "vita sociale",
    prompt: "Ascolta il messaggio e rispondi.",
    payload: {
      audioScript: "Ciao Luca, sono Anna. Senti, sabato sera organizzo una cena a casa mia per il mio compleanno. Inizia verso le otto. Puoi portare qualcosa da bere? Fammi sapere se vieni. A presto, ciao!",
      questions: [
        { q: "Perché Anna organizza la cena?", options: ["Per il suo compleanno", "Per una promozione", "Per un addio", "Per Natale"], answerIndex: 0 },
        { q: "A che ora inizia la cena?", options: ["Alle sette", "Verso le otto", "Alle nove", "A mezzanotte"], answerIndex: 1 },
        { q: "Cosa chiede Anna a Luca?", options: ["Di portare un dolce", "Di portare qualcosa da bere", "Di arrivare presto", "Di invitare altri amici"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a uno chef", topicTag: "cucina",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      audioScript: "Chef, da dove nasce la sua passione per la cucina? Da mia nonna: da bambino la guardavo preparare la pasta fatta in casa. Oggi il mio ristorante usa solo prodotti locali e di stagione. Il piatto più amato dai clienti sono i ravioli di zucca, un ricordo dell'autunno della mia infanzia.",
      questions: [
        { q: "Da chi è nata la passione dello chef?", options: ["Da un famoso cuoco", "Da sua nonna", "Da un libro", "Da un viaggio"], answerIndex: 1 },
        { q: "Che prodotti usa il ristorante?", options: ["Prodotti importati", "Prodotti locali e di stagione", "Prodotti surgelati", "Solo prodotti biologici stranieri"], answerIndex: 1 },
        { q: "Qual è il piatto più amato?", options: ["La pizza", "I ravioli di zucca", "Il risotto", "Le lasagne"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Notiziario locale", topicTag: "attualità",
    prompt: "Ascolta la notizia e rispondi.",
    payload: {
      audioScript: "Da domani riapre il parco cittadino dopo tre mesi di lavori. Sono stati piantati duecento nuovi alberi ed è stata costruita un'area giochi per i bambini. L'ingresso resta gratuito. Il sindaco invita i cittadini alla festa di apertura, prevista per domenica alle undici.",
      questions: [
        { q: "Che cosa riapre domani?", options: ["Una scuola", "Il parco cittadino", "Un ospedale", "Un museo"], answerIndex: 1 },
        { q: "Quanti alberi sono stati piantati?", options: ["Cento", "Duecento", "Cinquanta", "Mille"], answerIndex: 1 },
        { q: "Quando è la festa di apertura?", options: ["Domani sera", "Sabato", "Domenica alle undici", "La prossima settimana"], answerIndex: 2 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Conversazione al bar: le ordinazioni", topicTag: "vita sociale",
    prompt: "Ascolta e abbina ogni persona a ciò che ordina.",
    payload: {
      audioScript: "Allora, io prendo un cappuccino e un cornetto. Per me invece solo un caffè, grazie. Io ho fame, prendo un tramezzino e una spremuta d'arancia. E tu, Giulia? Io un tè caldo e una fetta di torta.",
      instruction: "Abbina ogni persona all'ordinazione giusta.",
      prompts: ["Prima persona", "Seconda persona", "Terza persona", "Giulia"],
      options: ["Solo un caffè", "Cappuccino e cornetto", "Tè e torta", "Tramezzino e spremuta"],
      answerMap: [1, 0, 3, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Conferenza su un museo cittadino", topicTag: "cultura",
    prompt: "Ascolta la presentazione e rispondi.",
    payload: {
      audioScript: "Il nuovo museo di arte moderna aprirà il mese prossimo nel centro storico. Occupa un vecchio palazzo restaurato e ospita opere di artisti del Novecento. Oltre alle sale espositive, ci saranno un caffè letterario e uno spazio per i laboratori dei bambini. Nei primi giorni l'ingresso sarà gratuito per tutti.",
      questions: [
        { q: "Dove si trova il nuovo museo?", options: ["In periferia", "Nel centro storico", "Vicino alla stazione", "In campagna"], answerIndex: 1 },
        { q: "Che tipo di opere ospita?", options: ["Sculture antiche", "Opere del Novecento", "Reperti archeologici", "Fotografie di moda"], answerIndex: 1 },
        { q: "Cosa succede nei primi giorni?", options: ["Il museo è chiuso", "L'ingresso è gratuito", "C'è solo una sala aperta", "Serve la prenotazione"], answerIndex: 1 },
      ],
    },
  },

  // ---------------- LETTURA (6): 2 F, 3 C, 1 S ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Articolo di giornale: eventi in città", topicTag: "attualità",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      passage: "Questo fine settimana la città si riempie di eventi. Sabato, in piazza Maggiore, ci sarà un mercato di prodotti tipici dalle 9 alle 20. Domenica, invece, si terrà una corsa podistica di dieci chilometri: le iscrizioni sono ancora aperte. In caso di pioggia, la corsa sarà rimandata alla domenica successiva.",
      questions: [
        { q: "Cosa c'è sabato in piazza Maggiore?", options: ["Un concerto", "Un mercato di prodotti tipici", "Una partita", "Una mostra"], answerIndex: 1 },
        { q: "Quanti chilometri è la corsa?", options: ["Cinque", "Dieci", "Venti", "Due"], answerIndex: 1 },
        { q: "Cosa succede se piove?", options: ["La corsa è annullata", "La corsa è rimandata", "Si corre lo stesso", "Si corre al chiuso"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Recensione di un film", topicTag: "cultura",
    prompt: "Leggi la recensione e rispondi.",
    payload: {
      passage: "Il nuovo film del regista italiano racconta la storia di una famiglia che si trasferisce dalla città alla campagna. È un film lento ma pieno di emozioni, con paesaggi bellissimi. Gli attori sono bravi, soprattutto la protagonista. Non è un film per chi cerca l'azione, ma è perfetto per una serata tranquilla.",
      questions: [
        { q: "Di cosa parla il film?", options: ["Di una guerra", "Di una famiglia che si trasferisce in campagna", "Di un viaggio all'estero", "Di uno sport"], answerIndex: 1 },
        { q: "Com'è il ritmo del film?", options: ["Veloce", "Lento", "Confuso", "Noioso"], answerIndex: 1 },
        { q: "Per chi è adatto il film?", options: ["Per chi ama l'azione", "Per una serata tranquilla", "Per i bambini piccoli", "Per chi non ama il cinema"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Blog di viaggio: un weekend in Toscana", topicTag: "viaggi",
    prompt: "Leggi il testo del blog e rispondi.",
    payload: {
      passage: "Abbiamo passato due giorni meravigliosi in Toscana. Il primo giorno abbiamo visitato una piccola città medievale con le sue torri antiche. Il secondo giorno siamo andati in una fattoria dove abbiamo assaggiato olio e vino locali. Consiglio di viaggiare in primavera, quando fa ancora fresco e ci sono meno turisti.",
      questions: [
        { q: "Cosa hanno visitato il primo giorno?", options: ["Una spiaggia", "Una città medievale", "Un museo moderno", "Una montagna"], answerIndex: 1 },
        { q: "Cosa hanno fatto in fattoria?", options: ["Hanno dormito", "Hanno assaggiato olio e vino", "Hanno lavorato", "Hanno comprato animali"], answerIndex: 1 },
        { q: "Quando consiglia di viaggiare l'autore?", options: ["In estate", "In inverno", "In primavera", "A Natale"], answerIndex: 2 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MATCHING", difficulty: "CORE",
    title: "Annunci di lavoro: abbina il candidato", topicTag: "lavoro",
    prompt: "Leggi gli annunci e abbina ogni persona all'annuncio giusto.",
    payload: {
      instruction: "Abbina ogni candidato all'annuncio più adatto.",
      prompts: [
        "Maria parla tre lingue e ama viaggiare.",
        "Paolo è bravo con i numeri e ha studiato economia.",
        "Sara adora i bambini e ha esperienza come baby-sitter.",
        "Ahmed cucina bene e ha lavorato in un ristorante.",
      ],
      options: [
        "Cercasi contabile per ufficio",
        "Cercasi guida turistica per agenzia",
        "Cercasi cuoco per trattoria",
        "Cercasi educatrice per asilo",
      ],
      answerMap: [1, 0, 3, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Lettera formale di un hotel", topicTag: "servizi",
    prompt: "Leggi la lettera e rispondi.",
    payload: {
      passage: "Gentile Cliente,\nla ringraziamo per aver scelto il nostro hotel. Le confermiamo la prenotazione di una camera doppia dal 10 al 13 luglio. La colazione è inclusa nel prezzo. Il check-in è possibile dalle 14:00. Se prevede di arrivare dopo le 22:00, la preghiamo di avvisarci. Cordiali saluti.",
      questions: [
        { q: "Che tipo di camera è prenotata?", options: ["Singola", "Doppia", "Tripla", "Suite"], answerIndex: 1 },
        { q: "La colazione è inclusa?", options: ["Sì", "No", "Solo il primo giorno", "A pagamento"], answerIndex: 0 },
        { q: "Cosa deve fare il cliente se arriva tardi?", options: ["Pagare di più", "Avvisare l'hotel", "Cambiare hotel", "Aspettare fuori"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Articolo sull'ambiente", topicTag: "ambiente",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      passage: "Sempre più città italiane scelgono di ridurre il traffico nei centri storici. In alcune zone le auto private non possono più entrare e sono state create piste ciclabili e aree pedonali. I negozianti all'inizio erano preoccupati, ma molti hanno notato che, senza auto, la gente cammina di più e si ferma più volentieri nei negozi.",
      questions: [
        { q: "Cosa fanno molte città italiane?", options: ["Costruiscono più parcheggi", "Riducono il traffico nei centri", "Vietano le biciclette", "Chiudono i negozi"], answerIndex: 1 },
        { q: "Cosa è stato creato al posto delle auto?", options: ["Nuove strade", "Piste ciclabili e aree pedonali", "Grandi centri commerciali", "Stazioni di benzina"], answerIndex: 1 },
        { q: "Cosa hanno notato molti negozianti?", options: ["Meno clienti", "Che la gente si ferma più volentieri", "Più rumore", "Più traffico"], answerIndex: 1 },
      ],
    },
  },

  // ---------------- ANALISI (6): 2 F, 3 C, 1 S — grammar/structures ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Le preposizioni semplici", topicTag: "grammatica",
    prompt: "Completa il testo con la preposizione corretta.",
    payload: {
      text: "Domani vado ___ Roma ___ treno. Parto ___ le otto e arrivo ___ mezzogiorno. Poi vado ___ casa di mia zia.",
      blanks: [
        { answer: "a", options: ["a", "in", "da", "con"] },
        { answer: "in", options: ["a", "in", "di", "su"] },
        { answer: "alle", options: ["alle", "in", "da", "per"] },
        { answer: "a", options: ["a", "in", "di", "da"] },
        { answer: "a", options: ["a", "in", "da", "con"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Il presente indicativo", topicTag: "grammatica",
    prompt: "Metti i verbi tra parentesi al presente indicativo.",
    payload: {
      text: "Ogni mattina io (fare) ___ colazione e poi (andare) ___ al lavoro. Mia sorella (studiare) ___ all'università. La sera noi (guardare) ___ un film insieme.",
      blanks: [
        { answer: "faccio" },
        { answer: "vado" },
        { answer: "studia" },
        { answer: "guardiamo" },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Il passato prossimo e gli ausiliari", topicTag: "grammatica",
    prompt: "Completa con l'ausiliare corretto (essere o avere) e concorda il participio se serve.",
    payload: {
      text: "Ieri Maria ___ andata al cinema con le amiche. Loro ___ visto un bel film. Poi ___ tornate a casa tardi. Io invece ___ rimasto a casa a leggere.",
      blanks: [
        { answer: "è", options: ["è", "ha", "sono", "hanno"] },
        { answer: "hanno", options: ["sono", "hanno", "è", "ha"] },
        { answer: "sono", options: ["sono", "hanno", "è", "ha"] },
        { answer: "sono", options: ["sono", "ho", "è", "ha"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "I pronomi diretti", topicTag: "grammatica",
    prompt: "Sostituisci la parte sottolineata con il pronome diretto giusto.",
    payload: {
      text: "— Compri tu il pane? — Sì, ___ compro io. — Chiami Marco e Luca? — Certo, ___ chiamo subito. — Vedi spesso Anna? — Sì, ___ vedo ogni giorno.",
      blanks: [
        { answer: "lo", options: ["lo", "la", "li", "le"] },
        { answer: "li", options: ["lo", "la", "li", "le"] },
        { answer: "la", options: ["lo", "la", "li", "le"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Le congiunzioni", topicTag: "grammatica",
    prompt: "Completa con la congiunzione più adatta.",
    payload: {
      text: "Non esco ___ piove. Vorrei venire ___ sono troppo stanco. Studio l'italiano ___ voglio vivere in Italia. Prendo l'ombrello ___ non mi bagno.",
      blanks: [
        { answer: "perché", options: ["perché", "ma", "quindi", "se"] },
        { answer: "ma", options: ["e", "ma", "perché", "così"] },
        { answer: "perché", options: ["perché", "ma", "però", "oppure"] },
        { answer: "così", options: ["così", "ma", "perché", "invece"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "STRETCH",
    title: "Il congiuntivo presente", topicTag: "grammatica",
    prompt: "Metti i verbi al congiuntivo presente.",
    payload: {
      text: "Penso che tu (avere) ___ ragione. È importante che voi (studiare) ___ ogni giorno. Spero che loro (venire) ___ alla festa. Voglio che tu (essere) ___ felice.",
      blanks: [
        { answer: "abbia" },
        { answer: "studiate" },
        { answer: "vengano" },
        { answer: "sia" },
      ],
    },
  },

  // ---------------- PRODUZIONE SCRITTA (4): 1 F, 2 C, 1 S — WRITING (estimate) ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Email a un amico sulle vacanze", topicTag: "vita sociale", guidanceNote: est(),
    prompt: "Scrivi un'email informale a un amico.",
    payload: {
      task: "Scrivi un'email a un amico per raccontare le tue ultime vacanze: dove sei andato/a, con chi, cosa hai fatto e se ti sei divertito/a.",
      context: "Registro informale.",
      minWords: 60, maxWords: 100,
      criteria: ["Uso del passato prossimo", "Registro informale coerente", "Contenuti richiesti presenti", "Correttezza di base"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Descrivere la tua città", topicTag: "descrizione", guidanceNote: est(),
    prompt: "Scrivi un testo descrittivo.",
    payload: {
      task: "Descrivi la città o il paese dove vivi: com'è, cosa c'è da vedere, cosa ti piace e cosa cambieresti.",
      context: "Testo descrittivo, registro neutro.",
      minWords: 80, maxWords: 120,
      criteria: ["Descrizione ricca e ordinata", "Uso di aggettivi", "Opinione personale motivata", "Coesione del testo"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Lettera di reclamo a un hotel", topicTag: "servizi", guidanceNote: est(),
    prompt: "Scrivi una lettera formale di reclamo.",
    payload: {
      task: "Durante una vacanza in hotel hai avuto dei problemi (camera non pulita, servizio lento). Scrivi una lettera formale all'hotel: spiega i problemi e chiedi una soluzione.",
      context: "Registro formale.",
      minWords: 80, maxWords: 120,
      criteria: ["Struttura formale", "Descrizione chiara dei problemi", "Richiesta di soluzione", "Tono adeguato e correttezza"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "La tua opinione sull'uso dello smartphone", topicTag: "opinione", guidanceNote: est(),
    prompt: "Scrivi un testo di opinione.",
    payload: {
      task: "Alcune persone pensano che passiamo troppo tempo con lo smartphone. Sei d'accordo? Scrivi un testo in cui esprimi la tua opinione con esempi e motivi.",
      context: "Testo argomentativo semplice.",
      minWords: 100, maxWords: 150,
      criteria: ["Opinione chiara", "Argomenti ed esempi", "Connettivi logici", "Ricchezza lessicale e correttezza"],
    },
  },

  // ---------------- PRODUZIONE ORALE (4): 1 F, 2 C, 1 S — SPEAKING (estimate) ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Parlare della tua famiglia", topicTag: "descrizione", guidanceNote: est(),
    prompt: "Descrivi la tua famiglia.",
    payload: {
      task: "Parla della tua famiglia: chi sono i suoi membri, come sono di carattere e cosa fanno nella vita.",
      parts: ["Chi compone la famiglia", "Carattere e aspetto", "Lavoro o studio dei membri"],
      criteria: ["Vocabolario della famiglia", "Uso degli aggettivi", "Frasi complete", "Fluidità di base"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Descrivere una foto", topicTag: "descrizione", guidanceNote: est(),
    prompt: "Descrivi la scena e immagina la storia.",
    payload: {
      task: "Immagina una fotografia con delle persone in un parco. Descrivi cosa vedi, cosa fanno le persone e immagina perché sono lì.",
      parts: ["Descrizione della scena", "Cosa fanno le persone", "Ipotesi sulla situazione"],
      criteria: ["Uso del presente e del gerundio", "Ricchezza descrittiva", "Capacità di fare ipotesi (forse, probabilmente)", "Fluidità"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Raccontare un viaggio", topicTag: "viaggi", guidanceNote: est(),
    prompt: "Racconta un'esperienza di viaggio.",
    payload: {
      task: "Racconta un viaggio che ricordi con piacere: dove sei andato/a, con chi, cosa hai fatto e perché è stato speciale.",
      parts: ["Dove e con chi", "Cosa hai fatto", "Perché è stato speciale"],
      criteria: ["Uso del passato", "Racconto ordinato nel tempo", "Vocabolario del viaggio", "Coinvolgimento e fluidità"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Esprimere un'opinione sul lavoro da casa", topicTag: "opinione", guidanceNote: est(),
    prompt: "Esprimi e difendi la tua opinione.",
    payload: {
      task: "Molte persone oggi lavorano da casa. Secondo te, è meglio lavorare da casa o in ufficio? Esponi la tua opinione con vantaggi e svantaggi.",
      parts: ["La tua opinione", "I vantaggi", "Gli svantaggi"],
      criteria: ["Opinione chiara e motivata", "Capacità di confrontare pro e contro", "Connettivi (invece, però, inoltre)", "Ricchezza lessicale"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
];
