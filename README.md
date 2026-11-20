# Diario PrEP

PWA in italiano ispirata alle schermate My PrEP fornite: configurazione, Riepilogo, Storico, Statistiche, Salute, Impostazioni. Il diario è conservato in IndexedDB sul dispositivo. Nessun dato sanitario viene incluso nel codice o nelle richieste al backend notifiche.

## Avvio e verifiche

`npm start` apre un server locale su http://127.0.0.1:4173. `npm test` verifica conteggi temporali, cicli continuativi, backup e promemoria. Non ci sono dipendenze frontend o richieste di telemetria.

Pubblicazione: GitHub Pages, ramo main, cartella root. Aggiungere alla schermata Home da Safari per abilitare Web Push su iPhone.

## Notifiche

Schema e funzione sono in `schema.sql`, `reminders.ts`, `config.toml` e `schedule.sql`. Il servizio riceve soltanto sottoscrizione push, token dispositivo hashato, preferenza testo discreto, orari e identificativi degli avvisi. Dati protetti da RLS senza policy pubbliche: accesso solo tramite Edge Function con autorizzazione per dispositivo. La registrazione senza codice prova il possesso del recapito mediante una push cifrata di attivazione. Applicare anche `notification-migration.sql`: RLS e RPC riservate al servizio, quote atomiche (3 richieste/IP salato/ora, 30 al giorno globali, 10 dispositivi attivi), prova monouso con scadenza 10 minuti. Gli hash tecnici di attivazione vengono eliminati dopo 24 ore. Nessuna chiave service-role o VAPID privata va nel frontend, nel repository o nei backup.

Configurare lato server VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET, ALLOWED_ORIGINS. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono forniti dal runtime. La funzione usa autenticazione personalizzata; il gateway JWT resta attivo con chiave anon pubblica e autorizzazione privata nel campo x-device-token. Creare `prep_cron_secret` in Vault con valore uguale a CRON_SECRET e `prep_anon_key` con la chiave anon pubblica e applicare schedule.sql una sola volta. Verificare invio e cancellazione su un dispositivo reale.

L'app accoda le modifiche offline e riprova all'apertura o al ritorno della connessione. Un aggiornamento offline non annulla avvisi già programmati sul server fino alla sincronizzazione. Sono previste quattro ripetizioni ogni 15 minuti; il mancato tocco non registra automaticamente una dose. Il cron controlla ogni minuto: non è una sveglia al secondo. Le push richiedono Internet e risentono delle impostazioni del sistema operativo.

## Conteggi clinici e limiti

Il diario registra le assunzioni reali di FTC/TDF 200/245 mg. Lo schema base configurato è on demand 2-1-1 per rapporti anali: dose iniziale doppia 2–24 ore prima, una dose ogni 24 ore fino a due dosi dopo l'ultimo rapporto. Fonte: https://www.hse.ie/conditions/hiv/how-to-take-prep/ .

I colori mostrano previsioni condizionate al completamento delle dosi, non garanzie di protezione. Ritardi, lacune, rapporti troppo precoci e registrazioni incoerenti richiedono verifica; non viene suggerito automaticamente un recupero o un raddoppio dopo 24 ore. La tolleranza tecnica ±2 ore segnala scostamenti e non certifica una finestra clinica. La ripartenza viene registrata come nuova dose iniziale solo su azione esplicita; non è un consiglio terapeutico. In presenza di esposizioni e dosi mancanti rivolgersi tempestivamente al centro PrEP per valutazione PEP.

Backup JSON non cifrato: contiene dati personali e va custodito. Il backup non include il token del servizio notifiche. L'importazione sostituisce gli eventi dopo validazione e conferma. Il reset prima annulla gli avvisi e richiede conferma scritta; se il server non risponde conserva il diario.

## Versione 1.2

Attesa iniziale celeste; lo Storico mostra un evento derivato con scudo a +2 ore e le sole dosi pianificate a seguito di rapporti registrati, in ordine cronologico e con linea tratteggiata blu. Questi elementi non vengono salvati come assunzioni e non entrano nei conteggi o nei backup. Senza rapporti registrati non si generano dosi post-rapporto né promemoria di assunzione; rimane l’avviso iniziale a +2 ore. L’app segnala esplicitamente che nessun rapporto registrato non equivale ad assenza di rapporti. Fonte per il caso senza rapporti e senza ulteriori rapporti previsti: UK guide to PrEP, novembre 2025, pagina 19, https://icash.nhs.uk/media/yo0a5oyq/prep-guide-uk-november-2025.pdf .

## Versione 1.3

Cinque sezioni, Salute con appuntamenti/esiti, quantità 1/2 selezionabile e note dei rapporti visibili solo in modifica. Storico dal più recente al più vecchio, giornate raggruppate, vista calendario mensile con simboli e dettaglio del giorno. Tema automatico locale chiaro 07:00–19:00, scuro negli altri orari; scelta manuale disponibile.

Il cambio schema è un evento con decorrenza immediata; conserva il passato e l’ancoraggio del ciclo. Quotidiano: doppia dose iniziale registrata, poi dose ogni 24 ore; rapporti senza effetto sulla programmazione. Proiezione grafica dei prossimi 7 giorni, notifica solo della prossima dose (le dosi successive vengono pianificate alla conferma, mai dedotte dal silenzio). In caso di anomalie il piano normale si sospende e il riquadro propone Inizia ciclo, senza prescrivere un recupero. Le osservazioni restano nello Storico anche dopo un nuovo ciclo. Una correzione non cancella l’osservazione storica.

Backup v2 compatibile in lettura con v1. IndexedDB e identità PWA invariati. Nessuna migrazione del diario verso Supabase. La modalità discreta usa titolo e testo generici e omette l’icona personalizzata dalla notifica; il nome/icona dell’app installata mostrati da iOS dipendono dal sistema.

Riferimento aggiuntivo: BASHH/BHIVA 2025 con chiarimenti settembre 2026, https://bhiva.org/clinical-guideline/PrEP-guidelines/. Le istruzioni personali del centro restano il riferimento per avvio, passaggi e dosi dimenticate.

## Versione 1.4

Compresse rappresentate da badge circolari rosa/rossi individuali (due badge per due compresse). Storico senza azioni di inserimento duplicate. Salute distingue Nuovi esiti analisi, Appuntamento analisi (siringa) e Appuntamento visita (medico). Gli esiti sono un evento locale distinto con stati espliciti non testato/negativo/positivo per ciascun esame e sede; nessun risultato viene dedotto o interpretato automaticamente. Esiti e note sono inclusi nel backup v2.

Le anomalie vengono riconciliate con le registrazioni originali al salvataggio e all’apertura: gli avvisi risolti da correzioni vengono eliminati anche dai calendari e dai cicli passati. Un nuovo ciclo o cambio schema non nasconde da solo un’anomalia ancora effettiva. Gli appuntamenti e gli esiti precedenti sono conservati.

## Versione 1.5

Promemoria facoltativo on demand: dopo una dose reale, se non esistono già dosi richieste e lo schema non presenta anomalie, viene programmato un solo avviso a +24 ore dall’assunzione. Anche il ciclo completato può avere questo avviso. Nessuna nuova registrazione significa nessun rinnovo per i giorni successivi; nessuna ripetizione automatica dell’avviso facoltativo. Le dosi post-rapporto e lo schema quotidiano mantengono i propri piani ancorati. Il promemoria facoltativo non entra nello Storico come dose necessaria. La scadenza a 24 ore è un criterio dell’interfaccia, non una prescrizione di riavvio o di dose doppia.

Home: accesso agli stessi moduli di esiti, appuntamento analisi e appuntamento visita presenti in Salute. Zoom applicativo disabilitato con viewport fisso, touch-action, prevenzione dei gesti multi-touch, doppio clic e scorciatoie zoom. I tocchi singoli ripetuti dei selettori restano attivi; scorrimento verticale consentito.

## Versione 1.6

Rifinitura visiva in stile Apple: barra inferiore flottante con vetro satinato, selettori a pillola, pulsanti arrotondati, superfici con riflessi e bordi sottili, finestre traslucide. Palette semantica, dati e logica dei promemoria invariati. Blur limitato a navigazione, finestre e toast, con ripiego opaco e rispetto delle preferenze di movimento/trasparenza ridotti. Layout verificato in chiaro e scuro.
