// CILS UNO (B1 standard) — 75 items, 5 sections incl. Analisi (grammar).
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

  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Le previsioni del tempo", topicTag: "media",
    prompt: "Ascolta le previsioni e rispondi.",
    payload: {
      audioScript: "Domani cielo coperto al mattino, con qualche pioggia sulla costa. Nel pomeriggio le nuvole si aprono e torna il sole. Temperature in leggero aumento, massime intorno ai diciotto gradi. Vento debole.",
      questions: [
        { q: "Com'è il tempo domani mattina?", options: ["Sole", "Coperto con qualche pioggia", "Neve", "Nebbia"], answerIndex: 1 },
        { q: "Che cosa cambia nel pomeriggio?", options: ["Torna il sole", "Comincia a piovere", "Arriva il vento forte", "Non cambia niente"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Annuncio in biblioteca", topicTag: "cultura",
    prompt: "Ascolta l'annuncio e rispondi.",
    payload: {
      audioScript: "Avvisiamo i lettori che la sala studio chiude oggi alle diciotto, un'ora prima del solito, per una riunione. Il prestito resta attivo fino alle diciannove. Da lunedì torniamo agli orari normali.",
      questions: [
        { q: "A che ora chiude oggi la sala studio?", options: ["Alle diciotto", "Alle diciannove", "Alle venti", "Non chiude"], answerIndex: 0 },
        { q: "Che cosa resta attivo fino alle diciannove?", options: ["La sala studio", "Il prestito", "Il bar", "Il parcheggio"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Scegliere un regalo", topicTag: "vita sociale",
    prompt: "Ascolta la conversazione e rispondi.",
    payload: {
      audioScript: "— Che le prendiamo? — Un libro? — Ne ha già tanti e non sappiamo quali ha letto. — Allora una pianta. — Viaggia sempre, chi la annaffia? — Hai ragione. Facciamo un buono per il teatro: sceglie lei lo spettacolo.",
      questions: [
        { q: "Che cosa decidono di regalare?", options: ["Un libro", "Una pianta", "Un buono per il teatro", "Niente"], answerIndex: 2 },
        { q: "Perché scartano la pianta?", options: ["Costa troppo", "La persona viaggia spesso", "Non le piacciono le piante", "È difficile da trasportare"], answerIndex: 1 },
        { q: "Qual è il vantaggio della scelta finale?", options: ["Costa poco", "Sceglie lei che cosa vedere", "Si può usare subito", "Non serve incartarlo"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a un'artigiana", topicTag: "cultura",
    prompt: "Ascolta l'intervista e rispondi.",
    payload: {
      audioScript: "— Lei ripara scarpe da trent'anni. È un mestiere che sta finendo? — Me lo chiedono spesso. Il lavoro non manca: manca chi lo impari. Ho avuto due ragazzi in bottega l'anno scorso, bravi, ma dopo sei mesi hanno lasciato. Non per i soldi: per la pazienza che serve all'inizio, quando non ti riesce niente.",
      questions: [
        { q: "Secondo l'artigiana, che cosa manca davvero?", options: ["Il lavoro", "Chi impari il mestiere", "I materiali", "I clienti"], answerIndex: 1 },
        { q: "Perché i due ragazzi hanno lasciato?", options: ["Per il guadagno basso", "Per la pazienza che serve all'inizio", "Perché non erano bravi", "Perché la bottega ha chiuso"], answerIndex: 1 },
        { q: "Di che cosa parla l'artigiana?", options: ["Della sua bottega e della sua esperienza", "Dell'artigianato italiano in generale", "Di una ricerca sul lavoro", "Della scuola professionale"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MATCHING", difficulty: "CORE",
    title: "Quattro persone e il loro tempo libero", topicTag: "vita sociale",
    prompt: "Ascolta le quattro persone e abbina ognuna alla sua attività.",
    payload: {
      audioScript: "Elena: Il sabato mattina vado sempre in piscina, mi sveglia meglio del caffè. Paolo: Io mi chiudo in cucina e provo ricette nuove, anche se poi non vengono. Rita: A me piace camminare in montagna, anche da sola. Sandro: Io suono la chitarra, ma solo in casa, non davanti a nessuno.",
      instruction: "Abbina ogni persona alla sua attività.",
      prompts: ["Elena", "Paolo", "Rita", "Sandro"],
      options: ["Cucinare", "Nuotare", "Suonare uno strumento", "Camminare in montagna"],
      answerMap: [1, 0, 3, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Telefonata: disdire una prenotazione", topicTag: "servizi",
    prompt: "Ascolta la telefonata e rispondi.",
    payload: {
      audioScript: "— Buongiorno, avevo un tavolo per otto persone stasera. Purtroppo devo disdire. — Mi dispiace. Le ricordo che entro le cinque non c'è nessun costo. — Sono le quattro e mezza. — Allora siamo in tempo. Vuole spostare a un'altra sera? — Le faccio sapere domani.",
      questions: [
        { q: "Che cosa vuole fare il cliente?", options: ["Prenotare un tavolo", "Disdire la prenotazione", "Cambiare il numero di persone", "Chiedere il menù"], answerIndex: 1 },
        { q: "Perché non paga niente?", options: ["Perché è un cliente abituale", "Perché disdice prima delle cinque", "Perché il ristorante è chiuso", "Perché ha già pagato"], answerIndex: 1 },
        { q: "Che cosa risponde alla proposta di spostare?", options: ["Accetta subito", "Rifiuta", "Farà sapere domani", "Chiede di parlare con il direttore"], answerIndex: 2 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "CORE",
    title: "Concerto rimandato", topicTag: "attualità",
    prompt: "Ascolta l'annuncio e rispondi.",
    payload: {
      audioScript: "Comunichiamo che il concerto di venerdì è rimandato al mese prossimo per un problema di salute di uno dei musicisti. I biglietti già acquistati restano validi per la nuova data. Chi non potrà venire può chiedere il rimborso entro trenta giorni.",
      questions: [
        { q: "Perché il concerto è rimandato?", options: ["Per il maltempo", "Per un problema di salute di un musicista", "Per pochi biglietti venduti", "Per lavori nella sala"], answerIndex: 1 },
        { q: "Che cosa succede ai biglietti già comprati?", options: ["Non valgono più", "Valgono per la nuova data", "Vanno cambiati alla cassa", "Valgono metà prezzo"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Discussione: i musei aperti la sera", topicTag: "opinione",
    prompt: "Ascolta la discussione e rispondi.",
    payload: {
      audioScript: "— Aprire i musei la sera porterebbe gente che di giorno lavora. — Sono d'accordo sull'obiettivo, non sul modo: aprire di sera senza assumere nessuno significa chiedere al personale di fare più ore con lo stesso stipendio. — Quindi sei contrario? — No. Dico che la proposta è metà: manca la parte su chi ci lavora.",
      questions: [
        { q: "Qual è la posizione della seconda persona?", options: ["È contraria all'apertura serale", "Condivide l'obiettivo ma vuole risolvere la questione del personale", "Pensa che i musei debbano chiudere prima", "Non ha un'opinione"], answerIndex: 1 },
        { q: "Che cosa significa «la proposta è metà»?", options: ["Che costa troppo", "Che manca la parte su chi ci lavora", "Che riguarda solo alcuni musei", "Che è già stata provata"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ASCOLTO", taskType: "MCQ", difficulty: "STRETCH",
    title: "Un'esperienza di volontariato", topicTag: "vita sociale",
    prompt: "Ascolta il racconto e rispondi.",
    payload: {
      audioScript: "Ho cominciato per riempire i sabati, dopo la pensione. Pensavo di andare a dare una mano e basta. La cosa che non mi aspettavo è che dopo un po' fossero loro a chiedere di me quando non andavo. Non me l'aspettavo e, sinceramente, non ero sicuro di volerlo.",
      questions: [
        { q: "Perché ha cominciato?", options: ["Per un'esperienza di lavoro", "Per riempire i sabati dopo la pensione", "Perché glielo ha chiesto un amico", "Per motivi di studio"], answerIndex: 1 },
        { q: "Che cosa non si aspettava?", options: ["Di dover lavorare molto", "Che le persone chiedessero di lui quando mancava", "Di dover imparare cose nuove", "Di smettere presto"], answerIndex: 1 },
        { q: "Come si sente rispetto a questo?", options: ["Del tutto contento", "Non era sicuro di volerlo", "Infastidito", "Indifferente"], answerIndex: 1 },
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

  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Orari e regole di un museo", topicTag: "cultura",
    prompt: "Leggi le informazioni e rispondi.",
    payload: {
      passage: "MUSEO CIVICO — Aperto da martedì a domenica, dalle 10 alle 18. Chiuso il lunedì. L'ultimo ingresso è alle 17:15. La prima domenica del mese l'ingresso è gratuito. Non si possono fare foto con il flash. Gli zaini vanno lasciati all'ingresso.",
      questions: [
        { q: "Quando è chiuso il museo?", options: ["La domenica", "Il lunedì", "Il sabato", "Mai"], answerIndex: 1 },
        { q: "Fino a che ora si può entrare?", options: ["Fino alle 17:15", "Fino alle 18", "Fino alle 10", "Non è indicato"], answerIndex: 0 },
        { q: "Che cosa non è permesso?", options: ["Entrare con lo zaino in sala", "Visitare la domenica", "Entrare gratis", "Fare foto senza flash"], answerIndex: 0 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "FOUNDATION",
    title: "Informazioni per gli ospiti di un ostello", topicTag: "viaggi",
    prompt: "Leggi il foglio e rispondi.",
    payload: {
      passage: "BENVENUTI — La cucina è a disposizione di tutti fino alle 22:00: chi la usa la lascia pulita. Le camere si rifanno il mattino, tra le 10 e le 12: vi chiediamo di non restare dentro in quelle ore. Il wi-fi funziona meglio nella sala comune. Dopo le 23:00 si parla a voce bassa nei corridoi.",
      questions: [
        { q: "Fino a che ora si può usare la cucina?", options: ["Fino alle 22:00", "Fino alle 23:00", "Fino a mezzanotte", "Sempre"], answerIndex: 0 },
        { q: "Che cosa si chiede agli ospiti tra le 10 e le 12?", options: ["Di restare in camera", "Di non stare in camera", "Di pulire la cucina", "Di stare in silenzio"], answerIndex: 1 },
        { q: "Dove funziona meglio il wi-fi?", options: ["In camera", "Nella sala comune", "In cucina", "Nei corridoi"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Una biblioteca che presta oggetti", topicTag: "attualità",
    prompt: "Leggi l'articolo e rispondi.",
    payload: {
      passage: "In un quartiere della città una biblioteca ha cominciato a prestare anche oggetti: trapani, macchine da cucire, tende da campeggio. L'idea è semplice — ci sono cose che si usano due volte l'anno e che quasi nessuno userebbe abbastanza da giustificarne l'acquisto. Secondo le volontarie che gestiscono il servizio, la difficoltà non è stata trovare gli oggetti, che sono arrivati dalle case del quartiere, ma spiegare che si trattava di un prestito e non di un regalo.",
      questions: [
        { q: "Che cosa presta questa biblioteca oltre ai libri?", options: ["Soldi", "Oggetti come trapani e tende", "Spazi per riunioni", "Corsi"], answerIndex: 1 },
        { q: "Qual è stata la difficoltà, secondo le volontarie?", options: ["Trovare gli oggetti", "Far capire che era un prestito", "Trovare lo spazio", "Pagare le riparazioni"], answerIndex: 1 },
        { q: "Chi racconta questa difficoltà?", options: ["Il comune", "Le volontarie del servizio", "Un'indagine nazionale", "Gli utenti"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Programma di una gita", topicTag: "viaggi",
    prompt: "Leggi il programma e rispondi.",
    payload: {
      passage: "GITA DI FINE ANNO — Partenza alle 7:30 dal piazzale della scuola; chi arriva dopo le 7:40 non potrà partire, perché il pullman deve rispettare l'orario della visita. Pranzo al sacco. Nel pomeriggio, passeggiata di circa due ore su un sentiero facile: servono scarpe chiuse. Rientro previsto per le 19:00; in caso di ritardo avviseremo le famiglie con un messaggio.",
      questions: [
        { q: "Che cosa succede a chi arriva alle 7:45?", options: ["Aspetta il pullman dopo", "Non potrà partire", "Parte lo stesso", "Paga una penale"], answerIndex: 1 },
        { q: "Che cosa serve per il pomeriggio?", options: ["Scarpe chiuse", "Un ombrello", "Soldi per il pranzo", "Il costume"], answerIndex: 0 },
        { q: "Come avvisano in caso di ritardo?", options: ["Con una telefonata alla scuola", "Con un messaggio alle famiglie", "Con un avviso sul sito", "Non avvisano"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "ORDERING", difficulty: "CORE",
    title: "Come usare la lavatrice a gettoni", topicTag: "servizi",
    prompt: "Rimetti in ordine le istruzioni.",
    payload: {
      instruction: "Ordina le fasi dalla prima all'ultima.",
      shuffled: [
        "Inserisci il gettone e premi il pulsante di avvio.",
        "Scegli il programma in base al tipo di tessuto.",
        "Metti i panni nel cestello senza riempirlo troppo.",
        "Aspetta la fine del ciclo e ritira subito il bucato.",
      ],
      correctOrder: [2, 1, 0, 3],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "CORE",
    title: "Intervista a una fotografa", topicTag: "cultura",
    prompt: "Leggi l'intervista e rispondi.",
    payload: {
      passage: "«Fotografo la stessa piazza da dodici anni», racconta. «All'inizio volevo la foto perfetta: la luce giusta, nessuno che passa. Poi ho capito che stavo aspettando che la piazza fosse vuota per fotografarla, cioè che smettesse di essere quello che è. Adesso scatto quando c'è confusione, e le foto sono peggiori tecnicamente e migliori in tutto il resto.»",
      questions: [
        { q: "Che cosa cercava all'inizio?", options: ["La foto perfetta, senza persone", "Il ritratto degli abitanti", "Le fotografie notturne", "Un premio"], answerIndex: 0 },
        { q: "Che cosa ha capito?", options: ["Che la piazza vuota non è la piazza", "Che la luce non conta", "Che serve una macchina migliore", "Che dodici anni sono troppi"], answerIndex: 0 },
        { q: "Come giudica le sue foto di adesso?", options: ["Migliori sotto ogni aspetto", "Tecnicamente peggiori ma migliori nel resto", "Uguali a prima", "Peggiori in tutto"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MATCHING", difficulty: "CORE",
    title: "Quattro recensioni brevi", topicTag: "opinione",
    prompt: "Leggi le recensioni e abbina a ognuna il giudizio giusto.",
    payload: {
      instruction: "Abbina ogni recensione al giudizio corrispondente. C'è un giudizio in più.",
      prompts: [
        "RECENSIONE A: Bello il posto, buono il cibo, ma tre quarti d'ora per un piatto sono troppi.",
        "RECENSIONE B: Niente di speciale, però costa poco e si mangia in fretta: per la pausa pranzo va benissimo.",
        "RECENSIONE C: Ci torno da anni e non mi ha mai deluso una volta.",
        "RECENSIONE D: Il menù promette molto e il piatto arriva senza sapore. Peccato.",
      ],
      options: [
        "Apprezza tutto tranne l'attesa",
        "Lo consiglia per un uso preciso, senza entusiasmo",
        "Delusione rispetto alle aspettative",
        "Soddisfazione costante nel tempo",
        "Lo sconsiglia per il prezzo alto",
      ],
      answerMap: [0, 1, 3, 2],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Perché torniamo negli stessi posti", topicTag: "opinione",
    prompt: "Leggi il testo e rispondi.",
    payload: {
      passage: "C'è chi passa mesi a cercare una meta nuova e chi torna ogni anno nello stesso paese, allo stesso albergo, quasi alla stessa camera. Il secondo gruppo viene spesso guardato con un po' di compatimento, come se rinunciasse a qualcosa. Non credo sia così semplice. Chi torna non cerca sorprese: cerca il tempo che si guadagna quando non devi decidere niente. È una vacanza diversa, non una vacanza minore.",
      questions: [
        { q: "Qual è la tesi dell'autore?", options: ["Che tornare negli stessi posti è una rinuncia", "Che è una vacanza diversa, non inferiore", "Che bisogna cercare sempre mete nuove", "Che gli alberghi sono tutti uguali"], answerIndex: 1 },
        { q: "Che cosa cerca, secondo l'autore, chi torna sempre nello stesso posto?", options: ["Il risparmio", "Il tempo che si guadagna non dovendo decidere", "Le sorprese", "La compagnia"], answerIndex: 1 },
        { q: "Come descrive l'autore lo sguardo degli altri su questo gruppo?", options: ["Di ammirazione", "Di compatimento", "Di invidia", "Di indifferenza"], answerIndex: 1 },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "LETTURA", taskType: "MCQ", difficulty: "STRETCH",
    title: "Lettera: la palestra della scuola", topicTag: "opinione",
    prompt: "Leggi la lettera e rispondi.",
    payload: {
      passage: "Scrivo come genitore. La palestra della scuola resta chiusa il pomeriggio, mentre nel quartiere non c'è un altro spazio coperto. So che aprirla significa qualcuno che apre, chiude e risponde di quello che succede, e che questo qualcuno va pagato: non chiedo un miracolo a costo zero. Chiedo che il costo venga detto, perché finora la risposta è stata che «non si può», e «non si può» non è una cifra.",
      questions: [
        { q: "Che cosa chiede chi scrive?", options: ["L'apertura immediata e gratuita", "Che venga dichiarato quanto costerebbe", "La costruzione di una palestra nuova", "Che la scuola chiuda prima"], answerIndex: 1 },
        { q: "Che cosa riconosce chi scrive?", options: ["Che aprire comporta un costo e una responsabilità", "Che la palestra è in cattive condizioni", "Che pochi la userebbero", "Che il quartiere ha altri spazi"], answerIndex: 0 },
        { q: "Che cosa critica della risposta ricevuta finora?", options: ["Che è arrivata tardi", "Che «non si può» non è una cifra", "Che era scritta male", "Che veniva da un ufficio sbagliato"], answerIndex: 1 },
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

  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Gli articoli", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Ieri ho comprato ___ libro e ___ rivista. ___ libro è di un autore italiano. Metto tutto ___ borsa e leggo ___ treno.",
      blanks: [
        { answer: "un", options: ["un", "una", "il", "lo"] },
        { answer: "una", options: ["un", "una", "il", "la"] },
        { answer: "Il", options: ["Il", "Un", "Lo", "La"] },
        { answer: "in", options: ["in", "a", "su", "da"] },
        { answer: "sul", options: ["sul", "nel", "al", "col"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "FOUNDATION",
    title: "Il plurale di nomi e aggettivi", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "In cucina ci sono due ___ rossi e tre ___ bianche. Le ___ sono nuove e i ___ sono vecchi.",
      blanks: [
        { answer: "bicchieri", options: ["bicchieri", "bicchiero", "bicchiera", "bicchiere"] },
        { answer: "tazze", options: ["tazze", "tazzi", "tazza", "tazzo"] },
        { answer: "sedie", options: ["sedie", "sedia", "sedi", "sedii"] },
        { answer: "tavoli", options: ["tavoli", "tavole", "tavola", "tavolo"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "L'imperfetto", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Da bambino ___ in campagna. Ogni estate ___ dai nonni e ___ tutto il giorno fuori. Non ci ___ la televisione, ma non ci ___ mai.",
      blanks: [
        { answer: "vivevo", options: ["vivevo", "ho vissuto", "vivrò", "vivessi"] },
        { answer: "andavo", options: ["andavo", "sono andato", "andrò", "andassi"] },
        { answer: "stavo", options: ["stavo", "sono stato", "starò", "stessi"] },
        { answer: "era", options: ["era", "è stata", "sarà", "fosse"] },
        { answer: "annoiavamo", options: ["annoiavamo", "siamo annoiati", "annoieremo", "annoiassimo"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "I pronomi indiretti", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Ho visto Marta e ___ ho detto tutto. A Luca invece non ___ ho ancora parlato. Se ___ telefoni tu, ___ fai un favore.",
      blanks: [
        { answer: "le", options: ["le", "la", "gli", "lo"] },
        { answer: "gli", options: ["gli", "lo", "le", "la"] },
        { answer: "gli", options: ["gli", "lo", "le", "ci"] },
        { answer: "mi", options: ["mi", "me", "a me", "ti"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Il futuro semplice", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "L'anno prossimo ___ in un'altra città. ___ una casa piccola e ___ a lavorare in centro. Ti ___ appena arrivo.",
      blanks: [
        { answer: "andrò", options: ["andrò", "vado", "andavo", "andrei"] },
        { answer: "Cercherò", options: ["Cercherò", "Cerco", "Cercavo", "Cercherei"] },
        { answer: "comincerò", options: ["comincerò", "comincio", "cominciavo", "comincerei"] },
        { answer: "scriverò", options: ["scriverò", "scrivo", "scrivevo", "scriverei"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "I possessivi", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Questa è ___ macchina, non la tua. ___ fratello lavora con me. ___ genitori abitano ancora qui. Dove hai messo ___ chiavi?",
      blanks: [
        { answer: "la mia", options: ["la mia", "mia", "il mio", "mio"] },
        { answer: "Mio", options: ["Mio", "Il mio", "Mia", "La mia"] },
        { answer: "I miei", options: ["I miei", "Miei", "Le mie", "Mie"] },
        { answer: "le tue", options: ["le tue", "tue", "i tuoi", "tuoi"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "CORE",
    title: "Il condizionale presente", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "___ un caffè, per favore. Se avessi tempo, ___ volentieri con voi. ___ dirmi dov'è la stazione? Noi ___ partire presto.",
      blanks: [
        { answer: "Vorrei", options: ["Vorrei", "Voglio", "Volevo", "Vorrò"] },
        { answer: "verrei", options: ["verrei", "vengo", "venivo", "verrò"] },
        { answer: "Potrebbe", options: ["Potrebbe", "Può", "Poteva", "Potrà"] },
        { answer: "preferiremmo", options: ["preferiremmo", "preferiamo", "preferivamo", "preferiremo"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "STRETCH",
    title: "Passato prossimo o imperfetto", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "Mentre ___ , ___ il telefono. ___ ma non ___ nessuno. Quella sera ___ molto stanco, così ___ presto.",
      blanks: [
        { answer: "cucinavo", options: ["cucinavo", "ho cucinato", "cucinerò", "cucinassi"] },
        { answer: "è suonato", options: ["è suonato", "suonava", "suonerà", "suonasse"] },
        { answer: "Ho risposto", options: ["Ho risposto", "Rispondevo", "Risponderò", "Rispondessi"] },
        { answer: "c'era", options: ["c'era", "c'è stato", "ci sarà", "ci fosse"] },
        { answer: "ero", options: ["ero", "sono stato", "sarò", "fossi"] },
        { answer: "sono andato", options: ["sono andato", "andavo", "andrò", "andassi"] },
      ],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ANALISI", taskType: "ANALISI", difficulty: "STRETCH",
    title: "Ci e ne", topicTag: "grammatica",
    prompt: "Completa il testo con la forma corretta.",
    payload: {
      text: "— Sei mai stato a Bologna? — Sì, ___ sono stato l'anno scorso. — Quanti giorni ___ sei rimasto? — ___ sono rimasto tre. Del lavoro non ___ parliamo adesso.",
      blanks: [
        { answer: "ci", options: ["ci", "ne", "vi", "lo"] },
        { answer: "ci", options: ["ci", "ne", "li", "gli"] },
        { answer: "Ne", options: ["Ne", "Ci", "Li", "Le"] },
        { answer: "ne", options: ["ne", "ci", "lo", "li"] },
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

  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Biglietto di ringraziamento", topicTag: "vita sociale",
    prompt: "Scrivi il biglietto.", guidanceNote: est(),
    payload: {
      task: "Un vicino ti ha aiutato in un momento difficile. Scrivi un biglietto per ringraziarlo: di' che cosa ha fatto, perché è stato importante per te e proponi qualcosa in cambio.",
      context: "Registro informale ma sentito, testo breve.",
      minWords: 60, maxWords: 100,
      criteria: ["Dice concretamente che cosa ha fatto la persona", "Spiega perché è stato importante", "Propone qualcosa in cambio", "Registro coerente dall'inizio alla fine"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "FOUNDATION",
    title: "Presentarsi in un gruppo nuovo", topicTag: "vita sociale",
    prompt: "Scrivi il messaggio.", guidanceNote: est(),
    payload: {
      task: "Ti sei iscritto a un gruppo di persone che si trovano per camminare la domenica. Scrivi un messaggio di presentazione: chi sei, che esperienza hai, che cosa cerchi e una domanda pratica.",
      context: "Messaggio in un gruppo, tono cordiale.",
      minWords: 60, maxWords: 100,
      criteria: ["Presentazione essenziale, senza eccessi", "Esperienza descritta con onestà", "Aspettativa dichiarata", "Almeno una domanda pratica"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Raccontare una giornata storta", topicTag: "vita sociale",
    prompt: "Scrivi il racconto.", guidanceNote: est(),
    payload: {
      task: "Racconta una giornata in cui è andato storto tutto quello che poteva andare storto. Di' che cosa è successo, in che ordine, e come è finita.",
      context: "Testo narrativo per un gruppo di scrittura.",
      minWords: 80, maxWords: 120,
      criteria: ["Sequenza chiara degli avvenimenti", "Uso di passato prossimo e imperfetto", "Almeno un dettaglio che rende viva la scena", "Chiusura che non resti sospesa"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Email per proporre uno scambio di lingua", topicTag: "servizi",
    prompt: "Scrivi l'email.", guidanceNote: est(),
    payload: {
      task: "Hai visto l'annuncio di una persona che cerca uno scambio di conversazione. Scrivi: presentati, di' quali lingue parli e a che livello, proponi come organizzarvi e chiedi la sua disponibilità.",
      context: "Primo contatto, registro cortese e concreto.",
      minWords: 80, maxWords: 120,
      criteria: ["Livello linguistico dichiarato con realismo", "Proposta organizzativa concreta (dove, quando, quanto)", "Domanda sulla disponibilità dell'altra persona", "Testo ordinato in paragrafi"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Descrivere il lavoro di una persona che conosci", topicTag: "descrizione",
    prompt: "Scrivi il testo.", guidanceNote: est(),
    payload: {
      task: "Descrivi il lavoro di una persona che conosci bene: che cosa fa in una giornata, che cosa è difficile e che cosa le piace. Scrivi solo quello che sai da lei.",
      context: "Testo descrittivo per una raccolta di ritratti.",
      minWords: 80, maxWords: 120,
      criteria: ["Descrizione concreta di una giornata", "Una difficoltà e un aspetto positivo", "Distingue ciò che la persona ha detto da ciò che tu supponi", "Vocabolario del lavoro appropriato"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Recensione di un posto in cui sei stato", topicTag: "viaggi",
    prompt: "Scrivi la recensione.", guidanceNote: est(),
    payload: {
      task: "Scrivi una recensione di un posto in cui sei stato davvero — un locale, un museo, una spiaggia. Di' che cosa ti è piaciuto, che cosa no, e a chi lo consiglieresti.",
      context: "Recensione per un sito di viaggi.",
      minWords: 80, maxWords: 120,
      criteria: ["Giudizio positivo e negativo, entrambi motivati", "Dettagli verificabili invece di aggettivi generici", "Indica a chi è adatto e a chi no", "Distingue l'esperienza personale da un giudizio assoluto"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Email per rimandare una consegna", topicTag: "lavoro",
    prompt: "Scrivi l'email.", guidanceNote: est(),
    payload: {
      task: "Non riuscirai a consegnare un lavoro nella data prevista. Scrivi a chi lo aspetta: di' quanto ti serve ancora, spiega la ragione senza scusarti troppo e proponi che cosa puoi consegnare subito.",
      context: "Email di lavoro, registro professionale.",
      minWords: 80, maxWords: 120,
      criteria: ["Comunica il ritardo all'inizio, non alla fine", "Indica una nuova data precisa", "Ragione breve e sufficiente", "Propone una consegna parziale o un'alternativa"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "CORE",
    title: "Lettera a chi arriverà dopo di te", topicTag: "vita sociale",
    prompt: "Scrivi la lettera.", guidanceNote: est(),
    payload: {
      task: "Scrivi una lettera a una persona che si trasferirà nella città dove vivi adesso. Dalle consigli pratici basati su quello che hai imparato tu, e avvisala di una cosa che all'inizio ti ha sorpreso.",
      context: "Lettera personale e pratica.",
      minWords: 80, maxWords: 120,
      criteria: ["Almeno tre consigli concreti", "Consigli basati sulla propria esperienza", "Una sorpresa iniziale raccontata con un esempio", "Evita di parlare a nome di tutti gli abitanti"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "Opinione: le cose che si comprano usate", topicTag: "opinione",
    prompt: "Scrivi il testo.", guidanceNote: est(),
    payload: {
      task: "Scrivi la tua opinione sull'abitudine di comprare oggetti usati. Presenta un vantaggio e un limite reali, e poi di' che cosa ne pensi tu.",
      context: "Testo di opinione per un blog.",
      minWords: 100, maxWords: 150,
      criteria: ["Un vantaggio e un limite, entrambi concreti", "Non trasforma il limite in una scusa per ignorarlo", "Posizione personale esplicita", "Evita numeri o percentuali inventate", "Connettivi di contrasto e conclusione"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "Rispondere a un'opinione che non condividi", topicTag: "opinione",
    prompt: "Scrivi la risposta.", guidanceNote: est(),
    payload: {
      task: "Hai letto un testo secondo cui «i giovani di oggi non leggono più». Rispondi: di' che cosa c'è di vero, che cosa secondo te è sbagliato in quell'affermazione, e come la riformuleresti.",
      context: "Lettera di risposta a un giornale locale.",
      minWords: 100, maxWords: 150,
      criteria: ["Riconosce ciò che l'affermazione coglie", "Spiega dove la formulazione è troppo larga", "Propone una versione più precisa", "Non risponde a una generalizzazione con un'altra", "Argomentazione ordinata"],
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "SCRITTA", taskType: "WRITING", difficulty: "STRETCH",
    title: "Un cambiamento che hai visto nel tuo quartiere", topicTag: "opinione",
    prompt: "Scrivi il testo.", guidanceNote: est(),
    payload: {
      task: "Descrivi un cambiamento avvenuto nel quartiere dove vivi: com'era prima, che cosa è cambiato e chi ci ha guadagnato o perso. Scrivi di quello che hai visto tu.",
      context: "Testo per una raccolta di racconti di quartiere.",
      minWords: 100, maxWords: 150,
      criteria: ["Contrasto chiaro fra prima e adesso", "Almeno un esempio osservato direttamente", "Dice chi ci ha guadagnato e chi no", "Resta su ciò che ha visto, senza dati inventati", "Uso sicuro dell'imperfetto e del passato prossimo"],
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
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Parlare di una cosa che sai fare", topicTag: "descrizione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Parla di una cosa che sai fare bene: come l'hai imparata, quanto tempo ci hai messo e a chi la insegneresti.",
      parts: ["Che cosa sai fare", "Come l'hai imparata", "A chi la insegneresti e perché"],
      criteria: ["Descrizione concreta dell'attività", "Racconto dell'apprendimento al passato", "Frasi collegate", "Pronuncia comprensibile"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Descrivere la casa dove vorresti vivere", topicTag: "descrizione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Descrivi la casa in cui ti piacerebbe vivere: dove sarebbe, com'è fatta e che cosa avrebbe che ora non hai.",
      parts: ["Dove sarebbe", "Com'è fatta", "Che cosa avrebbe che ora ti manca"],
      criteria: ["Vocabolario della casa", "Uso del condizionale", "Confronto con la situazione attuale", "Discorso ordinato"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "FOUNDATION",
    title: "Simulazione: alla biglietteria", topicTag: "viaggi",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Sei alla biglietteria della stazione. Chiedi il biglietto, informati su orari e cambi, e chiedi che cosa succede se perdi la coincidenza.",
      parts: ["Chiedere il biglietto", "Orari e cambi", "Che cosa succede se perdi la coincidenza"],
      criteria: ["Richiesta chiara con destinazione e orario", "Domande pertinenti", "Comprensione delle risposte", "Formule di cortesia"],
      prepSeconds: 30, speakSeconds: 90,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Raccontare un errore utile", topicTag: "vita sociale",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Racconta un errore che hai fatto e da cui hai imparato qualcosa: che cosa è successo, come l'hai risolto e che cosa fai diversamente adesso.",
      parts: ["Che cosa è successo", "Come l'hai risolto", "Che cosa fai diversamente adesso"],
      criteria: ["Racconto ordinato nel tempo", "Assume la propria parte senza dare la colpa ad altri", "Cambiamento concreto, non generico", "Tempi del passato usati con sicurezza"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Simulazione: rimandare un appuntamento di lavoro", topicTag: "lavoro",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Devi rimandare un appuntamento di lavoro importante. Telefona: spiega la situazione, proponi due alternative e reagisci se l'altra persona non è contenta.",
      parts: ["Spiegare la situazione", "Proporre due alternative", "Reagire a una risposta scontenta"],
      criteria: ["Comunica il problema subito", "Alternative concrete e realistiche", "Gestisce il malcontento senza cedere né irrigidirsi", "Chiude con un accordo"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Confrontare due modi di studiare", topicTag: "opinione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Confronta lo studiare da soli e lo studiare in gruppo. Di' vantaggi e svantaggi di ciascuno e in quali casi preferisci l'uno o l'altro.",
      parts: ["Da soli: vantaggi e svantaggi", "In gruppo: vantaggi e svantaggi", "Quando preferisci l'uno o l'altro"],
      criteria: ["Strutture di confronto", "Almeno due elementi per parte", "Preferenza legata a casi concreti, non assoluta", "Discorso organizzato"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Spiegare una ricetta o un procedimento", topicTag: "cucina",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Spiega come si prepara un piatto che sai fare: che cosa serve, i passaggi in ordine e un errore che fanno quasi tutti.",
      parts: ["Che cosa serve", "I passaggi, in ordine", "L'errore più comune"],
      criteria: ["Elenco completo degli ingredienti", "Connettivi di sequenza", "Avvertimento concreto e utile", "Verifica finale che l'altro abbia capito"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "CORE",
    title: "Descrivere un'immagine di una stazione", topicTag: "descrizione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Guarda l'immagine di una stazione ferroviaria all'ora di punta. Descrivi che cosa vedi, immagina dove stanno andando due persone e di' come ti sentiresti tu lì.",
      parts: ["Che cosa vedi", "Dove immagini che vadano due persone", "Come ti sentiresti tu"],
      criteria: ["Descrizione ordinata dello spazio", "Uso di 'stare + gerundio'", "Distingue ciò che vede da ciò che immagina", "Reazione personale motivata"],
      prepSeconds: 45, speakSeconds: 120,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Convincere qualcuno a cambiare idea", topicTag: "opinione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Una persona a te vicina ha deciso una cosa che secondo te le farà male. Parlale: di' che cosa pensi, ascolta la sua ragione e trova un modo di dirle la tua senza rompere il rapporto.",
      parts: ["Che cosa pensi e perché", "La sua ragione, detta con onestà", "Come chiudi la conversazione"],
      criteria: ["Espone la preoccupazione senza accusare", "Riformula la ragione dell'altro con correttezza", "Riconosce che la decisione non è sua", "Chiude senza aut aut"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Che cosa cambieresti nella tua città", topicTag: "opinione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Di' una cosa che cambieresti nella città in cui vivi: qual è il problema, come lo risolveresti e chi potrebbe non essere d'accordo con te.",
      parts: ["Il problema, con un esempio visto da te", "La tua soluzione", "Chi potrebbe non essere d'accordo e perché"],
      criteria: ["Problema descritto con un esempio concreto", "Soluzione realistica", "Riconosce un interesse legittimo contrario", "Parla della propria esperienza senza citare dati inventati"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
  {
    exam: "CILS_STANDARD", level: L, section: "ORALE", taskType: "SPEAKING", difficulty: "STRETCH",
    title: "Presentare una persona che ammiri", topicTag: "descrizione",
    prompt: "Parla seguendo i punti.", guidanceNote: est(),
    payload: {
      task: "Presenta una persona che ammiri — che conosci di persona o no. Di' chi è, che cosa ha fatto e perché la ammiri, distinguendo quello che sai da quello che immagini.",
      parts: ["Chi è e che cosa ha fatto", "Perché la ammiri", "Che cosa non sai di lei"],
      criteria: ["Presentazione ordinata", "Motivi dell'ammirazione concreti", "Distingue ciò che sa da ciò che suppone", "Evita l'elogio senza contenuto"],
      prepSeconds: 60, speakSeconds: 150,
    },
  },
];
