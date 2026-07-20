// CILS DUE (B2 standard) — 53 items, 5 sections incl. Analisi.
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

  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Intervista a un traduttore", topicTag: "cultura",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      audioScript: "— Qual è la parte più difficile del suo lavoro? — Non le parole che non esistono nell'altra lingua: quelle si spiegano. È il ritmo. Una frase può essere corretta parola per parola e sbagliata come suono, e il lettore non sa perché il testo gli sembra finto. Io me ne accorgo solo leggendo ad alta voce.",
      questions: [
        { q: "Qual è, secondo lui, la difficoltà maggiore?", options: ["Le parole intraducibili", "Il ritmo della frase", "La grammatica", "La lunghezza dei testi"], answerIndex: 1 },
        { q: "Come se ne accorge?", options: ["Chiedendo a un collega", "Leggendo ad alta voce", "Rileggendo il giorno dopo", "Confrontando due dizionari"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Presentazione di un progetto di quartiere", topicTag: "attualità",
    prompt: "Ascolta la presentazione e rispondi.",
    payload: {
      audioScript: "Il progetto nasce da una richiesta dei residenti: trasformare il cortile chiuso in uno spazio aperto il pomeriggio. Non abbiamo fondi per una ristrutturazione, quindi partiamo con quello che c'è: due panchine, l'illuminazione e qualcuno che apra e chiuda. Se dopo sei mesi lo spazio è usato, chiederemo di più. Se non lo è, avremo speso poco per scoprirlo.",
      questions: [
        { q: "Da dove nasce il progetto?", options: ["Da una decisione del comune", "Da una richiesta dei residenti", "Da un finanziamento ricevuto", "Da uno studio urbanistico"], answerIndex: 1 },
        { q: "Perché si comincia in piccolo?", options: ["Perché mancano i fondi per una ristrutturazione", "Perché lo spazio è piccolo", "Perché i residenti non sono d'accordo", "Perché è un progetto temporaneo per legge"], answerIndex: 0 },
        { q: "Che cosa succede se lo spazio non viene usato?", options: ["Si chiederà comunque più denaro", "Si sarà speso poco per scoprirlo", "Si chiuderà il cortile per sempre", "Si cambierà quartiere"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a un'urbanista", topicTag: "attualità",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      audioScript: "— Lei sostiene che il rumore sia sottovalutato. — Sottovalutato non perché nessuno se ne lamenti: perché si affronta come una questione di educazione, e non come una questione di come è costruita una strada. Nel quartiere dove abbiamo lavorato, spostare la fermata di trenta metri ha cambiato più cose di anni di cartelli. Parlo di quel caso, non di una regola.",
      questions: [
        { q: "Come viene di solito affrontato il problema del rumore, secondo lei?", options: ["Come una questione di costruzione", "Come una questione di educazione", "Come una questione di orari", "Non viene affrontato"], answerIndex: 1 },
        { q: "Che cosa ha funzionato nel quartiere di cui parla?", options: ["Nuovi cartelli", "Spostare una fermata di trenta metri", "Una campagna informativa", "Chiudere la strada"], answerIndex: 1 },
        { q: "Come presenta questo risultato?", options: ["Come una regola generale", "Come un caso particolare", "Come una previsione", "Come un dato nazionale"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Tavola rotonda: valutare gli insegnanti", topicTag: "opinione",
    prompt: "Ascolta il dibattito e rispondi.",
    payload: {
      audioScript: "— Valutare gli insegnanti sui risultati degli studenti mi sembra ragionevole. — Il problema è che così si valuta la classe che ti è capitata. — Quindi non valutiamo niente? — Non ho detto questo. Dico che se misuriamo la cosa sbagliata otteniamo comunque un numero, e il numero poi decide. Preferisco una valutazione più lenta e meno pulita.",
      questions: [
        { q: "Qual è l'obiezione della seconda persona?", options: ["Che gli insegnanti non vanno valutati", "Che così si valuta la classe capitata, non l'insegnante", "Che la valutazione costa troppo", "Che gli studenti non sono affidabili"], answerIndex: 1 },
        { q: "Che cosa propone?", options: ["Nessuna valutazione", "Una valutazione più lenta e meno pulita", "Una valutazione solo degli studenti", "Un test nazionale"], answerIndex: 1 },
        { q: "Che cosa teme rispetto ai numeri?", options: ["Che siano falsi", "Che un numero ottenuto male decida comunque", "Che siano troppo pochi", "Che nessuno li legga"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Quattro interventi a un convegno", topicTag: "opinione",
    prompt: "Ascolta i quattro interventi e abbina ognuno alla posizione giusta.",
    payload: {
      audioScript: "Intervento 1: Il problema non è la mancanza di regole, è che nessuno le applica. Intervento 2: A me pare invece che le regole ci siano e siano scritte male: chi deve applicarle non capisce che cosa gli si chiede. Intervento 3: Vorrei riportare la discussione ai costi: qualunque soluzione scegliamo, qualcuno la deve pagare. Intervento 4: Prima di decidere, propongo di andare a vedere come funziona dove il problema non c'è.",
      instruction: "Abbina ogni intervento alla posizione giusta.",
      prompts: ["Intervento 1", "Intervento 2", "Intervento 3", "Intervento 4"],
      options: [
        "Sposta l'attenzione sul finanziamento",
        "Attribuisce il problema alla mancata applicazione",
        "Propone di osservare un caso riuscito prima di decidere",
        "Attribuisce il problema alla formulazione delle regole",
      ],
      answerMap: [1, 3, 0, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Podcast: perché si abbandona un corso", topicTag: "cultura",
    prompt: "Ascolta il podcast e rispondi.",
    payload: {
      audioScript: "Nella scuola dove insegno abbiamo provato a chiedere a chi lasciava perché lo faceva. Le risposte non parlavano di difficoltà: parlavano di orari, di figli, di turni cambiati. Mi ha colpito che quasi nessuno dicesse «non ce la facevo». Non so se altrove sia lo stesso; noi abbiamo chiesto qui.",
      questions: [
        { q: "Che cosa emerge dalle risposte raccolte?", options: ["La difficoltà della materia", "Ragioni pratiche come orari e turni", "Il costo del corso", "La qualità dell'insegnamento"], answerIndex: 1 },
        { q: "Che cosa ha colpito chi parla?", options: ["Che quasi nessuno parlasse di non farcela", "Che molti si lamentassero dei docenti", "Che nessuno rispondesse", "Che tutti tornassero l'anno dopo"], answerIndex: 0 },
        { q: "Che cosa dice sulla validità di questo risultato?", options: ["Che vale ovunque", "Che riguarda solo la sua scuola", "Che è confermato da altre ricerche", "Che è provvisorio ma nazionale"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a una restauratrice", topicTag: "cultura",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      audioScript: "— Qual è la decisione più difficile in un restauro? — Quanto togliere. Ogni intervento precedente è anche un pezzo di storia dell'oggetto: se lo elimini per tornare all'originale, cancelli il fatto che qualcuno, in un certo momento, ha deciso diversamente. A volte si sceglie di lasciare un rammendo brutto perché racconta più della superficie pulita.",
      questions: [
        { q: "Qual è la decisione più difficile, secondo lei?", options: ["Quali materiali usare", "Quanto togliere", "Quanto tempo dedicare", "Dove esporre l'oggetto"], answerIndex: 1 },
        { q: "Perché a volte si lascia un intervento imperfetto?", options: ["Per risparmiare", "Perché racconta qualcosa", "Perché è troppo difficile toglierlo", "Perché lo chiede il proprietario"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Dibattito: le recensioni online", topicTag: "opinione",
    prompt: "Ascolta il dibattito e rispondi.",
    payload: {
      audioScript: "— Le recensioni hanno dato voce ai clienti, e questo è un guadagno. — Non lo nego. Osservo però che chi scrive è chi è rimasto molto contento o molto scontento, e che il mezzo non è pensato per chi ha trovato tutto normale. Questo non le rende false: le rende parziali in un modo prevedibile, e la prevedibilità si può correggere.",
      questions: [
        { q: "Qual è l'osservazione della seconda persona?", options: ["Che le recensioni sono false", "Che vengono scritte soprattutto agli estremi", "Che nessuno le legge", "Che vanno eliminate"], answerIndex: 1 },
        { q: "Che conclusione trae?", options: ["Che sono inutili", "Che la loro parzialità è prevedibile e correggibile", "Che vanno rese obbligatorie", "Che il problema è chi le scrive"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Che cosa misura un indicatore", topicTag: "scienza",
    prompt: "Ascolta l'intervento e rispondi.",
    payload: {
      audioScript: "Un indicatore nasce per rispondere a una domanda precisa, e da quel momento viene usato per rispondere a tutte le altre. Non è colpa di chi lo ha costruito: è comodo avere un numero. Il punto è che, passando di mano, l'indicatore perde la domanda a cui rispondeva e conserva solo la cifra. Chiedere «che cosa misura, esattamente?» non è pedanteria: è l'unico modo per sapere se serve al caso vostro.",
      questions: [
        { q: "Qual è la tesi di chi parla?", options: ["Che gli indicatori sono inaffidabili", "Che un indicatore, passando di mano, perde la domanda a cui rispondeva", "Che servono più indicatori", "Che i numeri vanno evitati"], answerIndex: 1 },
        { q: "Come giudica la domanda «che cosa misura, esattamente?»", options: ["Pedanteria", "L'unico modo per sapere se serve al proprio caso", "Una domanda per specialisti", "Una perdita di tempo"], answerIndex: 1 },
        { q: "Di chi è la responsabilità, secondo chi parla?", options: ["Di chi ha costruito l'indicatore", "Di nessuno in particolare: è comodo avere un numero", "Dei giornalisti", "Di chi non sa la matematica"], answerIndex: 1 },
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

  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Il ritorno dei mercati rionali", topicTag: "attualità",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      passage: "In alcune zone della città i mercati rionali, dati per finiti, hanno ripreso a riempirsi. Chi ci lavora da vent'anni racconta che non sono cambiati i prodotti, ma gli orari: aprire anche il tardo pomeriggio ha portato una clientela che prima non poteva venire. È una spiegazione modesta, e forse per questo convincente: non chiama in causa nuove abitudini di consumo, ma il fatto che il mercato fosse aperto quando la gente lavorava.",
      questions: [
        { q: "Che cosa è cambiato, secondo chi ci lavora?", options: ["I prodotti", "Gli orari di apertura", "I prezzi", "La posizione del mercato"], answerIndex: 1 },
        { q: "Perché l'autore trova convincente questa spiegazione?", options: ["Perché viene da un esperto", "Perché è modesta e non chiama in causa grandi cambiamenti", "Perché è confermata da una ricerca", "Perché è la più diffusa"], answerIndex: 1 },
        { q: "Chi fornisce la spiegazione?", options: ["Un'indagine di mercato", "Chi lavora nei mercati da vent'anni", "Il comune", "Gli acquirenti"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Editoriale: la fretta di rispondere", topicTag: "opinione",
    prompt: "Leggi l'editoriale e rispondi.",
    payload: {
      passage: "Rispondere in fretta è diventato un segno di serietà: chi tarda sembra distratto. Vorrei difendere il ritardo, ma con un limite. Non tutte le domande meritano tempo, e trattarle tutte come se lo meritassero è un altro modo di non rispondere a nessuna. La distinzione utile non è fra veloce e lento: è fra domande a cui posso rispondere subito senza pensarci e domande in cui la risposta immediata è quasi certamente quella sbagliata.",
      questions: [
        { q: "Qual è la posizione dell'autore?", options: ["Bisogna sempre rispondere lentamente", "La distinzione utile è fra tipi di domanda", "Rispondere in fretta è sempre sbagliato", "Il ritardo è sempre un segno di serietà"], answerIndex: 1 },
        { q: "Che cosa critica dell'idea di dare tempo a tutto?", options: ["Che costa troppo", "Che equivale a non rispondere a niente", "Che è impossibile", "Che irrita gli altri"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Saggio breve: tradurre l'umorismo", topicTag: "cultura",
    prompt: "Leggi il saggio e rispondi.",
    payload: {
      passage: "Si dice spesso che l'umorismo non si traduce, e la formula è comoda quanto imprecisa. Ciò che non si trasporta non è la battuta: è il tempo che la precede, l'attesa costruita da chi ascolta. Un gioco di parole si può sostituire con un altro; il ritmo dell'attesa, no, perché dipende da quello che il pubblico si aspetta e non da quello che il testo dice. Da qui una conseguenza scomoda per il traduttore: per essere fedele deve smettere di essere letterale.",
      questions: [
        { q: "Che cosa, secondo l'autore, non si trasporta?", options: ["Il gioco di parole", "Il ritmo dell'attesa", "Il vocabolario", "Il tono di voce"], answerIndex: 1 },
        { q: "Qual è la conseguenza per il traduttore?", options: ["Deve essere più letterale", "Per essere fedele deve smettere di essere letterale", "Deve rinunciare a tradurre", "Deve spiegare la battuta"], answerIndex: 1 },
        { q: "Che giudizio dà l'autore della formula «l'umorismo non si traduce»?", options: ["Che è esatta", "Che è comoda ma imprecisa", "Che è offensiva", "Che è nuova"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MATCHING", difficulty: "CORE",
    title: "Quattro tesi e le loro obiezioni", topicTag: "comprensione",
    prompt: "Leggi le quattro tesi e abbina a ognuna l'obiezione che la colpisce davvero.",
    payload: {
      instruction: "Abbina ogni tesi all'obiezione pertinente. C'è un'obiezione in più.",
      prompts: [
        "TESI A: Se un servizio è gratuito, tutti vi accedono allo stesso modo.",
        "TESI B: Più informazione i cittadini ricevono, migliori sono le loro decisioni.",
        "TESI C: Un problema che riguarda pochi non è una priorità.",
        "TESI D: Se una regola non viene rispettata, va resa più severa.",
      ],
      options: [
        "Il costo non è solo il prezzo: c'è il tempo, la distanza, il sapere che esiste",
        "Oltre una certa soglia l'informazione in più rende la scelta più difficile, non migliore",
        "La severità non serve se il problema è che la regola non è chiara o non è controllata",
        "La dimensione di un problema non dice quanto pesa su chi lo subisce",
        "I servizi pubblici costano allo Stato più di quanto rendano",
      ],
      answerMap: [0, 1, 3, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Chi decide che cosa è arte", topicTag: "cultura",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "La domanda «ma questa è arte?» viene di solito posta come se esistesse un confine da scoprire. Più utile è chiedersi chi la pone e quando: quasi sempre davanti a un'opera che non richiede abilità visibile. Non intendo dire che l'abilità non conti, né che ogni oggetto valga uguale. Intendo dire che l'irritazione nasce dal sospetto di essere presi in giro, e che questo sospetto merita una risposta migliore del silenzio degli addetti ai lavori.",
      questions: [
        { q: "Che cosa suggerisce l'autore di chiedersi?", options: ["Dove sia il confine dell'arte", "Chi pone la domanda e in quali circostanze", "Quanto vale un'opera", "Chi ha ragione fra critici e pubblico"], answerIndex: 1 },
        { q: "Che cosa NON sostiene l'autore?", options: ["Che l'abilità non conti", "Che l'irritazione nasca da un sospetto", "Che il sospetto meriti una risposta", "Che la domanda venga posta spesso"], answerIndex: 0 },
        { q: "Che cosa critica del mondo dell'arte?", options: ["I prezzi", "Il silenzio degli addetti ai lavori davanti a quel sospetto", "La scelta delle opere", "L'organizzazione delle mostre"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Recensione critica di una mostra", topicTag: "cultura",
    prompt: "Leggi la recensione e rispondi.",
    payload: {
      passage: "La mostra è ricchissima e proprio per questo non funziona. Le opere ci sono, e sono importanti; manca una ragione per vederle insieme, oltre al fatto che appartengono allo stesso periodo. Il visitatore attraversa sei sale accumulando informazioni e ne esce senza una domanda. È un peccato, perché la sala finale — l'unica costruita intorno a un'idea e non a una data — dimostra che chi ha curato la mostra sapeva benissimo come si fa.",
      questions: [
        { q: "Qual è la critica principale?", options: ["Le opere non sono importanti", "Manca una ragione per vederle insieme", "La mostra è troppo piccola", "Le informazioni sono sbagliate"], answerIndex: 1 },
        { q: "Perché il critico parla della sala finale?", options: ["Perché è la peggiore", "Perché dimostra che i curatori sapevano fare meglio", "Perché contiene le opere più famose", "Perché è la più visitata"], answerIndex: 1 },
        { q: "Che cosa riconosce il critico alla mostra?", options: ["La coerenza", "La ricchezza e l'importanza delle opere", "La chiarezza del percorso", "Il prezzo giusto"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "L'esperto e il profano", topicTag: "opinione",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "Quando un esperto parla al pubblico gli si chiede di semplificare, e quando semplifica gli si rimprovera di aver detto qualcosa di falso. La contraddizione è reale e non si risolve chiedendogli di essere più chiaro. Si attenua se, insieme alla versione semplice, l'esperto dice dove quella versione smette di valere. È una richiesta modesta e quasi mai soddisfatta, perché segnalare il proprio limite somiglia, a chi ascolta, a un'ammissione di incertezza — mentre è il contrario.",
      questions: [
        { q: "Qual è la proposta dell'autore?", options: ["Che gli esperti evitino di semplificare", "Che indichino dove la versione semplice smette di valere", "Che il pubblico studi di più", "Che si eviti la divulgazione"], answerIndex: 1 },
        { q: "Perché la proposta è raramente seguita?", options: ["Perché richiede troppo tempo", "Perché segnalare il limite sembra ammettere incertezza", "Perché il pubblico non ascolta", "Perché è vietato"], answerIndex: 1 },
        { q: "Che cosa pensa l'autore di quell'apparenza?", options: ["Che sia corretta", "Che sia il contrario della realtà", "Che sia irrilevante", "Che sia inevitabile"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "La memoria dei luoghi", topicTag: "cultura",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "Si dice che certi luoghi conservino memoria di ciò che vi è accaduto. Preso alla lettera è falso: un cortile non ricorda nulla. Preso come descrizione di ciò che facciamo noi, è preciso: torniamo in un posto e vi ritroviamo qualcosa che avevamo lasciato lì, non perché il posto l'abbia custodito, ma perché il nostro ricordo ha bisogno di un appiglio esterno per riaffiorare. È la ragione per cui la demolizione di un edificio ordinario può addolorare più della perdita di un monumento.",
      questions: [
        { q: "Qual è la posizione dell'autore sulla «memoria dei luoghi»?", options: ["È vera alla lettera", "È falsa alla lettera ma precisa come descrizione del nostro ricordare", "È una superstizione senza interesse", "Riguarda solo i monumenti"], answerIndex: 1 },
        { q: "Perché la perdita di un edificio ordinario può addolorare tanto?", options: ["Perché era prezioso", "Perché serviva da appiglio a ricordi personali", "Perché era antico", "Perché era protetto"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Quando il dato non basta", topicTag: "scienza",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "Chiedere i dati prima di decidere è sano, e può diventare un modo elegante di non decidere. Ci sono questioni su cui i dati arriveranno dopo la decisione, perché sono i dati che la decisione produce: se non si prova, non si misura. In quei casi la domanda corretta non è «che cosa dicono i dati», ma «quanto costa provare, e che cosa impariamo se va male». Chi rimanda in attesa di certezze non sta raccogliendo prove: sta scegliendo di non averne.",
      questions: [
        { q: "Qual è la tesi centrale?", options: ["I dati non servono", "In alcuni casi i dati arrivano solo dopo la decisione", "Bisogna decidere sempre in fretta", "Le certezze sono raggiungibili"], answerIndex: 1 },
        { q: "Qual è, in quei casi, la domanda corretta?", options: ["Che cosa dicono i dati", "Quanto costa provare e che cosa si impara se va male", "Chi decide", "Quando arriveranno i dati"], answerIndex: 1 },
        { q: "Come giudica l'autore chi rimanda in attesa di certezze?", options: ["Prudente", "Sta scegliendo di non avere prove", "Rigoroso", "Realista"], answerIndex: 1 },
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

  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Il congiuntivo dopo le congiunzioni", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Benché ___ tardi, ho deciso di partire. Ti lascio le chiavi affinché tu ___ entrare. Prima che ___ , chiudi le finestre. Nonostante ___ stanchi, hanno continuato.",
      blanks: [
        { answer: "fosse", options: ["fosse", "era", "sarà", "sarebbe"] },
        { answer: "possa", options: ["possa", "puoi", "potevi", "potrai"] },
        { answer: "piova", options: ["piova", "piove", "pioveva", "pioverà"] },
        { answer: "fossero", options: ["fossero", "erano", "saranno", "sarebbero"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "I pronomi relativi", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Il collega ___ ti ho parlato arriva domani. La casa in ___ vivo è piccola. Le persone ___ hanno risposto sono poche. È una questione ___ importanza è chiara a tutti.",
      blanks: [
        { answer: "di cui", options: ["di cui", "che", "cui", "il quale"] },
        { answer: "cui", options: ["cui", "che", "quale", "dove che"] },
        { answer: "che", options: ["che", "cui", "di cui", "le quali"] },
        { answer: "la cui", options: ["la cui", "che", "di cui", "cui"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Il trapassato prossimo", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Quando sono arrivato, la riunione ___ già ___ . Mi hanno detto che ___ tutto la settimana prima. Non sapevo che ___ .",
      blanks: [
        { answer: "era", options: ["era", "è", "aveva", "sarà"] },
        { answer: "cominciata", options: ["cominciata", "cominciato", "cominciare", "comincia"] },
        { answer: "avevano deciso", options: ["avevano deciso", "hanno deciso", "decidevano", "decideranno"] },
        { answer: "fosse partito", options: ["fosse partito", "è partito", "partiva", "partirà"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Gerundio e infinito", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "___ in ufficio, ho incontrato Marta. Ho imparato l'italiano ___ con i colleghi. Dopo ___ il lavoro, siamo usciti. Sto ___ di finire.",
      blanks: [
        { answer: "Andando", options: ["Andando", "Andare", "Andato", "Vado"] },
        { answer: "parlando", options: ["parlando", "parlare", "di parlare", "parlato"] },
        { answer: "aver finito", options: ["aver finito", "finire", "finendo", "finito"] },
        { answer: "cercando", options: ["cercando", "cercare", "di cercare", "cercato"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "I pronomi combinati", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Se vuoi il libro, ___ presto io. Le chiavi? ___ ho date ieri. Non parlarmi di quel problema: ___ hanno già parlato troppo. Il conto? ___ porta subito il cameriere.",
      blanks: [
        { answer: "te lo", options: ["te lo", "ti lo", "te il", "lo ti"] },
        { answer: "Gliele", options: ["Gliele", "Gli le", "Le gli", "Glieli"] },
        { answer: "me ne", options: ["me ne", "mi ne", "ne mi", "me lo"] },
        { answer: "Ce lo", options: ["Ce lo", "Ci lo", "Lo ci", "Ce ne"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Le forme impersonali", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "In questo ufficio ___ molto. ___ le pratiche in ordine di arrivo. Quando ___ stanchi, ___ meglio fermarsi. Qui non ___ fumare.",
      blanks: [
        { answer: "si lavora", options: ["si lavora", "si lavorano", "si è lavorato", "lavora"] },
        { answer: "Si trattano", options: ["Si trattano", "Si tratta", "Si è trattato", "Trattano"] },
        { answer: "si è", options: ["si è", "si sono", "si era", "è"] },
        { answer: "è", options: ["è", "sono", "era", "sarà"] },
        { answer: "si può", options: ["si può", "si possono", "può", "si potrebbe"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Il futuro anteriore", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Quando ___ i dati, ti scriverò. Non risponde: ___ già uscito. ___ le otto quando è arrivato. Appena ___ , cominciamo.",
      blanks: [
        { answer: "avrò raccolto", options: ["avrò raccolto", "raccolgo", "raccoglierò", "ho raccolto"] },
        { answer: "sarà", options: ["sarà", "è", "era", "sarebbe"] },
        { answer: "Saranno state", options: ["Saranno state", "Sono state", "Erano", "Furono"] },
        { answer: "avranno finito", options: ["avranno finito", "finiscono", "finiranno", "hanno finito"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "STRETCH",
    title: "Il condizionale passato", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Mi aveva detto che ___ presto, invece è arrivato tardi. ___ volentieri, ma non me lo hanno chiesto. Pensavo che ___ già tutto. Al posto tuo non ___ così.",
      blanks: [
        { answer: "sarebbe arrivato", options: ["sarebbe arrivato", "arriverà", "arrivava", "sarebbe arrivare"] },
        { answer: "Sarei venuto", options: ["Sarei venuto", "Verrei", "Venivo", "Sarò venuto"] },
        { answer: "avessero deciso", options: ["avessero deciso", "hanno deciso", "decidevano", "decideranno"] },
        { answer: "avrei risposto", options: ["avrei risposto", "rispondevo", "risponderei", "avrò risposto"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "STRETCH",
    title: "Le subordinate implicite", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "___ di non poter venire, ha avvisato subito. ___ arrivato in ritardo, non ha trovato posto. ___ finito, chiudi la porta. ___ tutto questo, la decisione resta difficile.",
      blanks: [
        { answer: "Rendendosi conto", options: ["Rendendosi conto", "Si rende conto", "Che si rende conto", "Rendersi conto"] },
        { answer: "Essendo", options: ["Essendo", "Era", "È stato", "Essere"] },
        { answer: "Una volta", options: ["Una volta", "Dopo che", "Quando ha", "Appena è"] },
        { answer: "Pur considerando", options: ["Pur considerando", "Considera", "Che considera", "Pur considerato"] },
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
