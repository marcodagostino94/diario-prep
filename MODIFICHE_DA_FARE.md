# Modifiche da realizzare successivamente

Richieste raccolte il 20 novembre 2026. Questo documento è una lista di lavoro: non modifica l'app né attiva nuovi comportamenti.

## Registrazione assunzioni

- Unificare la registrazione di una o due compresse nello stesso flusso.
- Mostrare due pulsanti selezionabili: **1 compressa** e **2 compresse**.
- Eliminare il riquadro attuale con il numero di compresse; nessun inserimento manuale della quantità.
- Conservare l'inserimento e la modifica di giorno e ora.
- Distinguere in fase di implementazione la quantità registrata dall'avvio del ciclo: registrare due compresse non deve cancellare o nascondere anomalie precedenti.

## Stato, anomalie e riavvio

- Se lo schema non è stato seguito o risultano dosi dimenticate, mostrare lo stato **Schema da verificare**, senza lasciare indefinitamente **È il momento**.
- Registrare l'anomalia nello Storico e mantenerla visibile anche dopo un nuovo ciclo o una modifica dello schema.
- In questa situazione sostituire il riquadro Prossima compressa con l'azione **Inizia ciclo**.
- Dopo un ciclo completato, se sono trascorse più di 24 ore dall'ultima compressa, sostituire **Continua quando serve** con **Ricomincia PrEP**.
- Il pulsante di riavvio è una richiesta di interfaccia: non dovrà cancellare l'anomalia, attestare una copertura o suggerire automaticamente un recupero terapeutico. Definire i casi clinici prima dell'implementazione.

## Storico: grafica e ordine

- Mostrare **due icone di compressa** per un'assunzione da due e **una sola icona** per un'assunzione da una.
- Rendere più chiara la divisione tra giornate.
- Riferimento proposto: una linea o parentesi verticale sul lato sinistro raggruppa gli eventi dello stesso giorno; icone accanto alla linea e piccoli collegamenti orizzontali verso gli eventi.
- Invertire l'ordine attuale, come richiesto: **«dal basso verso l'alto e non dall'alto verso il basso»**. Definire nel prossimo intervento la posizione degli eventi futuri e il punto iniziale di scorrimento, conservando questa richiesta come riferimento.
- Continuare a distinguere eventi registrati, inizio copertura previsto, dosi pianificate e anomalie.
- Includere gli appuntamenti sanitari pianificati.

## Home e testi

- Togliere **Ultime registrazioni** dalla Home.
- Togliere il riquadro **Solo sul dispositivo** dalla Home.
- Eliminare le didascalie che spiegano le funzionalità dell'app o il suo utilizzo.
- Conservare i messaggi necessari per capire errori, anomalie, dosi mancanti o situazioni da verificare.

## Rapporti e note

- Aggiungere un campo **Note** quando si inserisce o modifica un rapporto.
- Le note restano private sul dispositivo, come gli altri dati del diario.
- Non mostrare le note nell'elenco dello Storico; mostrarle aprendo la modifica del rapporto.
- Includerle nel backup e ripristinarle nell'importazione, preservando la compatibilità con i backup precedenti.

## Salute

- Aggiungere **Salute** alla navigazione in basso.
- Registrare le prossime analisi e le prossime visite, con data e ora.
- Mostrare questi appuntamenti anche nello Storico.
- Permettere l'inserimento degli esiti delle analisi.
- Definire in seguito i campi degli esiti e l'eventuale gestione dei documenti allegati: gli allegati non sono ancora stati richiesti.
- Conservare i dati sanitari sul dispositivo e includerli nel backup; non inviare gli esiti al servizio notifiche.

## Cambio schema

- Permettere di cambiare schema nelle impostazioni.
- Il cambio non elimina registrazioni, note, esiti o appuntamenti.
- Conservare quale schema era attivo nei diversi periodi, per evitare che il cambio riscriva retroattivamente il significato dello Storico.
- Ricalcolare solo il piano applicabile al nuovo schema e aggiornare i promemoria.
- Definire il momento di decorrenza e le regole di passaggio prima di attivare il cambio.

## Schema quotidiano

Comportamento richiesto dall'utente, da implementare coerentemente con il suo schema prescritto:

- Due compresse iniziali registrate.
- In seguito, una compressa ogni giorno allo stesso orario, con notifica e conferma dell'assunzione.
- Registrare ogni assunzione nello Storico.
- Se una dose non viene assunta/registrata, lo Stato diventa **giallo**; definire il criterio temporale prima dell'implementazione.
- I rapporti possono essere registrati, con eventuali note, ma non prolungano né modificano il calendario delle dosi quotidiane.
- Nel quotidiano, non applicare la chiusura automatica dopo due dosi successive a un rapporto.

## Punto già segnalato e rinviato

- **Notifiche discrete:** l'utente ha confermato che le notifiche arrivano, ma il risultato non è discreto nonostante l'interruttore attivo. Verificare testo, titolo, icona e nome dell'app mostrati da iPhone. Nessuna correzione è stata ancora richiesta per questo intervento di sola raccolta.

## Ottimizzazione iPhone e larghezza delle schermate

- Ottimizzare l'app per iPhone in tutte le schermate, comprese finestre di inserimento/modifica, impostazioni e viste dello Storico.
- Eliminare ogni scorrimento orizzontale: contenuti, testi, pulsanti e griglie devono rientrare nella larghezza disponibile senza tagli.
- Verificare anche le schermate che attualmente presentano questo problema, con testi lunghi, note, controlli data/ora e tastiera aperta.
- La soluzione deve correggere le cause dell'overflow, senza limitarsi a nascondere contenuti fuori schermo.

## Storico: scelta tra elenco e calendario

- Aggiungere nello Storico un pulsante o selettore per cambiare visualizzazione tra **Elenco** e **Calendario**.
- Conservare la visualizzazione a elenco già prevista, con gli altri miglioramenti richiesti.
- Aggiungere una visualizzazione a calendario, con griglia di riquadri per le giornate.
- In ogni riquadro mostrare il numero del giorno e **soltanto i simboli degli eventi**, senza descrizioni testuali degli eventi nella cella.
- Mantenere riconoscibili i simboli di una/due compresse, rapporti, copertura prevista, dosi pianificate e appuntamenti sanitari, quando presenti.
- Progettare la griglia per la larghezza dell'iPhone, senza scorrimento orizzontale; definire i dettagli di navigazione e apertura del giorno durante l'implementazione.
- Le due viste rappresentano gli stessi dati; cambiare visualizzazione non modifica né elimina registrazioni.
