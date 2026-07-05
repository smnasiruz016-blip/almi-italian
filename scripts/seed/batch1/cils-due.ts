// CILS DUE (B2 standard) — 26 items, 5 sections incl. Analisi.
// Scored on the CILS standard engine (same shape as UNO, B2-banded difficulty).
// Academic/current-affairs register — distinct from B1c administrative world.
import { ESTIMATE_NOTE, type RawItem } from "./types";

const L = "DUE";
const est = (): string => ESTIMATE_NOTE;

export const CILS_DUE_ITEMS: RawItem[] = [
  // ---------------- ASCOLTO (6): 2 F, 3 C, 1 S ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Dibattito radiofonico sull'energia", topicTag: "attualità",
    prompt: "Ascolta il dibattito e rispondi.",
    payload: {
      audioScript: "Nel dibattito di oggi si parla di energia rinnovabile. Secondo l'esperta, l'Italia produce ormai quasi il quaranta per cento della sua elettricità da fonti pulite, come sole e vento. Tuttavia, avverte, serve investire di più nelle reti elettriche, altrimenti l'energia prodotta rischia di andare sprecata nei momenti di maggiore produzione.",
      questions: [
        { q: "Quanta elettricità pulita produce l'Italia secondo l'esperta?", options: ["Il 10%", "Circa il 40%", "Il 70%", "Il 90%"], answerIndex: 1 },
        { q: "Di cosa c'è bisogno secondo l'esperta?", options: ["Di meno pannelli solari", "Di investire nelle reti elettriche", "Di chiudere le centrali", "Di importare energia"], answerIndex: 1 },
        { q: "Qual è il rischio senza investimenti?", options: ["Sprecare l'energia prodotta", "Aumentare l'inquinamento", "Fermare il sole", "Perdere posti di lavoro"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Podcast sulla tecnologia", topicTag: "tecnologia",
    prompt: "Ascolta il podcast e rispondi.",
    payload: {
      audioScript: "Nella puntata di oggi parliamo di come la tecnologia cambia il modo di leggere. Sempre più persone usano ebook e audiolibri, comodi perché si portano ovunque. Ma molti lettori restano fedeli alla carta: dicono che il libro di carta si ricorda meglio e stanca meno gli occhi. La verità, forse, è che i due formati possono convivere.",
      questions: [
        { q: "Di cosa parla la puntata?", options: ["Di come cambia il modo di leggere", "Di come scrivere un libro", "Di quanto costano gli ebook", "Di come stampare libri"], answerIndex: 0 },
        { q: "Perché alcuni preferiscono la carta?", options: ["Costa meno", "Si ricorda meglio e stanca meno gli occhi", "È più moderna", "Si trova ovunque"], answerIndex: 1 },
        { q: "Qual è la conclusione del podcast?", options: ["La carta sparirà", "I due formati possono convivere", "Gli ebook sono inutili", "Nessuno legge più"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Lezione universitaria di storia", topicTag: "cultura",
    prompt: "Ascolta la lezione e rispondi.",
    payload: {
      audioScript: "Oggi analizziamo il Rinascimento. È un periodo, tra il Quattrocento e il Cinquecento, in cui l'arte e la scienza fanno enormi passi avanti. Le città italiane, ricche grazie al commercio, diventano centri di cultura. Artisti come Leonardo non erano solo pittori, ma anche scienziati e inventori: per loro arte e conoscenza erano la stessa cosa.",
      questions: [
        { q: "In quali secoli si colloca il Rinascimento?", options: ["Duecento e Trecento", "Quattrocento e Cinquecento", "Seicento e Settecento", "Ottocento e Novecento"], answerIndex: 1 },
        { q: "Perché le città italiane diventano centri di cultura?", options: ["Grazie alla guerra", "Grazie al commercio e alla ricchezza", "Grazie al clima", "Grazie alla popolazione"], answerIndex: 1 },
        { q: "Come vedevano arte e conoscenza artisti come Leonardo?", options: ["Come cose separate", "Come la stessa cosa", "Come un lavoro noioso", "Come un passatempo"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a una ricercatrice", topicTag: "scienza",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      audioScript: "Dottoressa, di cosa si occupa la sua ricerca? Studio come le api comunicano tra loro. Abbiamo scoperto che, con una specie di danza, un'ape può indicare alle altre dove trovare i fiori, e persino a che distanza. Purtroppo il numero di api sta diminuendo a causa dei pesticidi, e questo è un problema serio per l'agricoltura.",
      questions: [
        { q: "Cosa studia la ricercatrice?", options: ["Il volo degli uccelli", "Come comunicano le api", "Le malattie delle piante", "Il clima"], answerIndex: 1 },
        { q: "Cosa indica un'ape con la sua danza?", options: ["Il colore dei fiori", "Dove trovare i fiori e a che distanza", "L'ora del giorno", "Il pericolo"], answerIndex: 1 },
        { q: "Perché diminuiscono le api?", options: ["Per il freddo", "A causa dei pesticidi", "Per mancanza d'acqua", "Per troppi fiori"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Notiziario economico: abbina i settori", topicTag: "economia",
    prompt: "Ascolta il notiziario e abbina ogni settore alla notizia.",
    payload: {
      audioScript: "Ecco le notizie economiche. Il turismo cresce: quest'estate gli arrivi stranieri sono aumentati del dieci per cento. Nell'agricoltura, invece, la siccità ha ridotto il raccolto di grano. Il settore tecnologico assume: molte aziende cercano nuovi programmatori. Infine, l'edilizia rallenta a causa dell'aumento dei prezzi dei materiali.",
      instruction: "Abbina ogni settore alla notizia corretta.",
      prompts: ["Turismo", "Agricoltura", "Tecnologia", "Edilizia"],
      options: ["Raccolto ridotto per la siccità", "Aumento del dieci per cento degli arrivi", "Rallenta per i prezzi dei materiali", "Cerca nuovi programmatori"],
      answerMap: [1, 0, 3, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Conferenza scientifica sul sonno", topicTag: "scienza",
    prompt: "Ascolta la conferenza e rispondi.",
    payload: {
      audioScript: "Molti pensano che dormire sia tempo perso, ma è vero il contrario. Durante il sonno il cervello elabora le informazioni della giornata e fissa i ricordi. Chi dorme poco, nel lungo periodo, ha più difficoltà di concentrazione e memoria. Gli studi consigliano agli adulti tra le sette e le otto ore per notte, ma la qualità del sonno conta quanto la quantità.",
      questions: [
        { q: "Cosa fa il cervello durante il sonno?", options: ["Si spegne completamente", "Elabora le informazioni e fissa i ricordi", "Consuma più energia che di giorno", "Non fa nulla"], answerIndex: 1 },
        { q: "Cosa succede a chi dorme poco?", options: ["Diventa più creativo", "Ha difficoltà di concentrazione e memoria", "Vive più a lungo", "Non ha effetti"], answerIndex: 1 },
        { q: "Cosa conta oltre alla quantità di sonno?", options: ["Il buio della stanza", "La qualità del sonno", "L'orario della cena", "Il tipo di cuscino"], answerIndex: 1 },
      ],
    },
  },

  // ---------------- LETTURA (6): 2 F, 3 C, 1 S ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Articolo di attualità: le città e il verde", topicTag: "attualità",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      passage: "Negli ultimi anni molte città europee hanno deciso di aumentare gli spazi verdi. Piantare alberi non serve solo a rendere le città più belle: gli alberi abbassano la temperatura d'estate, puliscono l'aria e migliorano l'umore dei cittadini. Alcune città hanno persino trasformato vecchie strade in parchi, con ottimi risultati per la qualità della vita.",
      questions: [
        { q: "Qual è lo scopo principale dell'articolo?", options: ["Criticare le città", "Spiegare i vantaggi degli spazi verdi", "Descrivere un parco famoso", "Vendere alberi"], answerIndex: 1 },
        { q: "Quale beneficio NON è citato nel testo?", options: ["Abbassare la temperatura", "Pulire l'aria", "Ridurre le tasse", "Migliorare l'umore"], answerIndex: 2 },
        { q: "Cosa hanno fatto alcune città?", options: ["Tagliato gli alberi", "Trasformato strade in parchi", "Vietato le auto", "Costruito grattacieli"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Editoriale: il valore del tempo libero", topicTag: "opinione",
    prompt: "Leggi l'editoriale e rispondi.",
    payload: {
      passage: "Viviamo in una società che premia chi è sempre occupato. Eppure, il tempo libero non è un lusso, ma una necessità. È nei momenti di pausa che nascono le idee migliori e che ritroviamo le energie. Imparare a fermarsi non significa essere pigri: significa capire che anche il riposo fa parte del lavoro ben fatto.",
      questions: [
        { q: "Qual è l'opinione dell'autore sul tempo libero?", options: ["È una perdita di tempo", "È una necessità, non un lusso", "È solo per i ricchi", "È noioso"], answerIndex: 1 },
        { q: "Cosa nasce nei momenti di pausa, secondo l'autore?", options: ["La stanchezza", "Le idee migliori", "I problemi", "La noia"], answerIndex: 1 },
        { q: "Cosa significa 'imparare a fermarsi' per l'autore?", options: ["Essere pigri", "Capire che il riposo fa parte del lavoro", "Smettere di lavorare", "Dormire tutto il giorno"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Saggio breve: il cibo e l'identità", topicTag: "cultura",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "Il cibo non è solo nutrimento: è cultura, memoria e identità. Ogni piatto racconta la storia di un luogo e delle persone che lo abitano. Quando emigriamo, spesso portiamo con noi le ricette di casa, che diventano un ponte tra il passato e il presente. Cucinare i sapori dell'infanzia, in un Paese nuovo, è un modo per non perdere le proprie radici e, allo stesso tempo, per condividerle con gli altri.",
      questions: [
        { q: "Secondo il testo, cos'è il cibo oltre al nutrimento?", options: ["Solo un piacere", "Cultura, memoria e identità", "Un problema economico", "Una moda"], answerIndex: 1 },
        { q: "Cosa portano con sé spesso le persone che emigrano?", options: ["Le ricette di casa", "I mobili", "I vestiti tradizionali", "Le fotografie"], answerIndex: 0 },
        { q: "Cucinare i sapori dell'infanzia è descritto come un modo per...", options: ["Guadagnare soldi", "Non perdere le radici e condividerle", "Dimenticare il passato", "Diventare famosi"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MATCHING", difficulty: "CORE",
    title: "Testo argomentativo: abbina i titoli ai paragrafi", topicTag: "comprensione",
    prompt: "Leggi i paragrafi e abbina a ciascuno il titolo giusto.",
    payload: {
      instruction: "Abbina ogni paragrafo al titolo più adatto.",
      prompts: [
        "Fare volontariato permette di aiutare gli altri e, allo stesso tempo, di sentirsi utili e parte di una comunità.",
        "Chi fa volontariato impara nuove competenze e conosce persone diverse, arricchendo la propria esperienza.",
        "Tuttavia, il volontariato richiede tempo ed energie, e non tutti riescono a conciliarlo con lavoro e famiglia.",
      ],
      options: ["I limiti e le difficoltà", "I benefici per gli altri e la comunità", "La crescita personale"],
      answerMap: [1, 2, 0],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Recensione critica di un libro", topicTag: "cultura",
    prompt: "Leggi la recensione e rispondi.",
    payload: {
      passage: "L'ultimo romanzo dell'autrice affronta un tema difficile: il rapporto tra madri e figlie. La scrittura è elegante e i personaggi sono descritti con grande profondità. Il difetto principale, però, è il ritmo: la prima parte è troppo lenta e alcuni lettori potrebbero abbandonare il libro prima che la storia decolli. Chi ha pazienza, tuttavia, verrà ricompensato da un finale sorprendente.",
      questions: [
        { q: "Qual è il tema del romanzo?", options: ["Il rapporto tra madri e figlie", "Una storia d'amore", "Una guerra", "Un viaggio"], answerIndex: 0 },
        { q: "Qual è il difetto principale secondo il recensore?", options: ["I personaggi deboli", "La scrittura banale", "Il ritmo lento all'inizio", "Il finale prevedibile"], answerIndex: 2 },
        { q: "Cosa aspetta chi ha pazienza?", options: ["Un finale sorprendente", "Una delusione", "Un secondo libro", "Uno sconto"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Articolo di approfondimento: lo smart working", topicTag: "lavoro",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      passage: "Il lavoro da remoto, diffusosi durante la pandemia, ha cambiato profondamente il mondo del lavoro. I vantaggi sono evidenti: meno tempo perso negli spostamenti e maggiore libertà di organizzare la giornata. Non mancano però le criticità. Molti lavoratori lamentano la difficoltà di separare vita privata e professionale, mentre le aziende temono un calo del senso di appartenenza. La soluzione più diffusa oggi è il modello ibrido, che alterna giorni in ufficio e giorni a casa, cercando di unire i pregi di entrambi.",
      questions: [
        { q: "Quando si è diffuso soprattutto il lavoro da remoto?", options: ["Negli anni Ottanta", "Durante la pandemia", "Solo di recente", "Non si è mai diffuso"], answerIndex: 1 },
        { q: "Quale criticità lamentano i lavoratori?", options: ["Troppi spostamenti", "La difficoltà di separare vita privata e lavoro", "Stipendi troppo alti", "Troppe riunioni in ufficio"], answerIndex: 1 },
        { q: "Qual è la soluzione più diffusa oggi?", options: ["Tornare tutti in ufficio", "Il modello ibrido", "Lavorare solo di notte", "Eliminare gli uffici"], answerIndex: 1 },
        { q: "Cosa temono le aziende?", options: ["Un calo del senso di appartenenza", "Troppi dipendenti", "L'aumento delle vendite", "La chiusura dei bar"], answerIndex: 0 },
      ],
    },
  },

  // ---------------- ANALISI (6): 2 F, 3 C, 1 S ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Il congiuntivo imperfetto", topicTag: "grammatica",
    prompt: "Metti i verbi al congiuntivo imperfetto.",
    payload: {
      text: "Pensavo che tu (essere) ___ a casa. Vorrei che loro (venire) ___ prima. Se io (avere) ___ più tempo, viaggerei di più. Speravo che voi (potere) ___ aiutarmi.",
      blanks: [
        { answer: "fossi" },
        { answer: "venissero" },
        { answer: "avessi" },
        { answer: "poteste" },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Il periodo ipotetico", topicTag: "grammatica",
    prompt: "Completa le frasi con la forma corretta del verbo.",
    payload: {
      text: "Se piovesse, (restare) ___ a casa. Se avessi vinto, (comprare) ___ una casa. Se studi, (superare) ___ l'esame. Se fossi in te, (parlare) ___ con lui.",
      blanks: [
        { answer: "resterei", options: ["resterei", "resto", "resterò", "restassi"] },
        { answer: "avrei comprato", options: ["comprerei", "avrei comprato", "compro", "comprai"] },
        { answer: "supererai", options: ["supereresti", "superavi", "supererai", "superassi"] },
        { answer: "parlerei", options: ["parlerei", "parlo", "parlerò", "parlassi"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "I connettivi testuali", topicTag: "grammatica",
    prompt: "Completa con il connettivo più adatto.",
    payload: {
      text: "Non è venuto alla festa, ___ era malato. Ho studiato molto; ___, ho superato l'esame. Mi piace il mare; ___, preferisco la montagna. ___ fosse tardi, siamo usciti lo stesso.",
      blanks: [
        { answer: "poiché", options: ["poiché", "sebbene", "affinché", "purché"] },
        { answer: "perciò", options: ["perciò", "invece", "poiché", "benché"] },
        { answer: "tuttavia", options: ["tuttavia", "quindi", "perché", "così"] },
        { answer: "Sebbene", options: ["Sebbene", "Perché", "Poiché", "Quindi"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "La forma passiva", topicTag: "grammatica",
    prompt: "Trasforma le frasi alla forma passiva completando gli spazi.",
    payload: {
      text: "Il libro ___ (scrivere) da un autore famoso. La cena ___ (preparare) da mia madre ieri sera. Questi quadri ___ (dipingere) nel Seicento. La legge ___ (approvare) dal parlamento la settimana scorsa.",
      blanks: [
        { answer: "è stato scritto" },
        { answer: "è stata preparata" },
        { answer: "sono stati dipinti" },
        { answer: "è stata approvata" },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Il discorso indiretto", topicTag: "grammatica",
    prompt: "Trasforma al discorso indiretto completando la frase.",
    payload: {
      text: "Marco disse: «Sono stanco». → Marco disse che ___ stanco. Anna chiese: «Vieni domani?» → Anna mi chiese se ___ il giorno dopo. Lui disse: «Ho finito». → Lui disse che ___ finito.",
      blanks: [
        { answer: "era" },
        { answer: "venivo", options: ["venivo", "vengo", "verrò", "venga"] },
        { answer: "aveva", options: ["aveva", "ha", "avrà", "abbia"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "STRETCH",
    title: "La concordanza dei tempi", topicTag: "grammatica",
    prompt: "Completa rispettando la concordanza dei tempi al congiuntivo.",
    payload: {
      text: "Credevo che lui (partire, già) ___ . Era necessario che tu (arrivare) ___ in orario. Nonostante (fare) ___ freddo, uscimmo. Temevo che voi non (capire) ___ .",
      blanks: [
        { answer: "fosse già partito" },
        { answer: "arrivassi" },
        { answer: "facesse" },
        { answer: "aveste capito" },
      ],
    },
  },

  // ---------------- PRODUZIONE SCRITTA (4): 1 F, 2 C, 1 S — WRITING (estimate) ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Riassunto di un articolo", topicTag: "comprensione", guidanceNote: est(),
    prompt: "Scrivi un riassunto.",
    payload: {
      task: "Leggi mentalmente un articolo che hai trovato interessante di recente e scrivine un riassunto: presenta l'argomento, le idee principali e la conclusione, con parole tue.",
      context: "Testo espositivo, registro neutro.",
      minWords: 100, maxWords: 150,
      criteria: ["Selezione delle idee principali", "Riformulazione con parole proprie", "Ordine logico", "Correttezza grammaticale B2"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Saggio argomentativo: la tecnologia a scuola", topicTag: "opinione", guidanceNote: est(),
    prompt: "Scrivi un saggio argomentativo.",
    payload: {
      task: "Alcuni pensano che tablet e computer debbano sostituire i libri di carta a scuola, altri sono contrari. Scrivi un saggio in cui presenti entrambe le posizioni ed esprimi la tua opinione motivata.",
      context: "Testo argomentativo strutturato.",
      minWords: 150, maxWords: 200,
      criteria: ["Presentazione equilibrata delle due tesi", "Argomenti ed esempi", "Opinione personale motivata", "Coesione e registro B2"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Lettera formale di candidatura", topicTag: "lavoro", guidanceNote: est(),
    prompt: "Scrivi una lettera motivazionale.",
    payload: {
      task: "Rispondi a un annuncio per un tirocinio nel tuo settore. Scrivi una lettera formale: presentati, spiega le tue competenze e motivazioni e chiedi un colloquio.",
      context: "Registro formale, contesto professionale.",
      minWords: 130, maxWords: 180,
      criteria: ["Struttura della lettera formale", "Competenze e motivazioni chiare", "Registro professionale", "Correttezza e precisione lessicale"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "Testo argomentativo: ambiente e sviluppo", topicTag: "ambiente", guidanceNote: est(),
    prompt: "Scrivi un testo argomentativo complesso.",
    payload: {
      task: "«Proteggere l'ambiente e far crescere l'economia sono obiettivi in conflitto.» Sei d'accordo? Scrivi un testo argomentativo in cui sostieni la tua posizione con dati, esempi e possibili obiezioni.",
      context: "Testo argomentativo avanzato.",
      minWords: 180, maxWords: 250,
      criteria: ["Tesi chiara e ben sostenuta", "Argomenti articolati e controargomenti", "Ricchezza lessicale e connettivi complessi", "Correttezza avanzata"],
    },
  },

  // ---------------- PRODUZIONE ORALE (4): 1 F, 2 C, 1 S — SPEAKING (estimate) ----------------
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Presentare un tema di attualità", topicTag: "attualità", guidanceNote: est(),
    prompt: "Presenta un argomento di attualità.",
    payload: {
      task: "Scegli un tema di attualità che ti interessa (ambiente, tecnologia, società) e presentalo: spiega di cosa si tratta, perché è importante e cosa ne pensi.",
      parts: ["Presentazione del tema", "Perché è importante", "La tua opinione"],
      criteria: ["Chiarezza espositiva", "Organizzazione del discorso", "Lessico adeguato al tema", "Fluidità B2"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Sostenere un'opinione", topicTag: "opinione", guidanceNote: est(),
    prompt: "Difendi una posizione con argomenti.",
    payload: {
      task: "«I social network fanno più bene o più male alla società?» Prendi una posizione e difendila con almeno tre argomenti, considerando anche l'opinione contraria.",
      parts: ["La tua posizione", "Tre argomenti a sostegno", "Risposta a un'obiezione"],
      criteria: ["Capacità argomentativa", "Uso di connettivi logici", "Gestione dell'obiezione", "Precisione lessicale"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Confrontare due grafici", topicTag: "descrizione", guidanceNote: est(),
    prompt: "Descrivi e confronta dei dati.",
    payload: {
      task: "Immagina due grafici: uno mostra l'uso dei mezzi pubblici in città, l'altro nelle zone di campagna. Descrivi e confronta i dati, poi prova a spiegare le differenze.",
      parts: ["Descrizione del primo grafico", "Descrizione del secondo grafico", "Confronto e spiegazione delle differenze"],
      criteria: ["Lessico dei dati (aumentare, diminuire, rispetto a)", "Capacità di confronto", "Interpretazione delle cause", "Fluidità"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Dibattito: il turismo di massa", topicTag: "società", guidanceNote: est(),
    prompt: "Affronta un tema complesso con pro e contro.",
    payload: {
      task: "Il turismo di massa porta soldi alle città ma crea anche molti problemi. Discuti il tema: presenta i vantaggi e gli svantaggi, poi proponi alcune soluzioni per un turismo più sostenibile.",
      parts: ["Vantaggi del turismo di massa", "Problemi e svantaggi", "Proposte di soluzione"],
      criteria: ["Analisi articolata del tema", "Equilibrio tra pro e contro", "Proposte concrete", "Ricchezza lessicale e fluidità B2"],
      prepSeconds: 90, speakSeconds: 180,
    },
  },
];
