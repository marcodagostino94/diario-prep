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

## Versione 1.7

Riepilogo iPhone contenuto nell’altezza della schermata, con griglia compatta a due colonne per le registrazioni, spazi e riquadri adattati all’altezza disponibile. Le altre sezioni mantengono lo scorrimento. Avvisi di schema visibili in forma sintetica con dettaglio completo apribile; nessun avviso clinico eliminato. Verificati stati inattivo, ciclo attivo e schema da verificare, con altezze da 568 a 844 px.

## Versione 1.8

Continuazione facoltativa consentita nell’interfaccia fino a un’ora dopo le 24 ore dall’ultima dose; poi Ricomincia PrEP. Non è una prescrizione di recupero: l’avvio resta una registrazione esplicita secondo le indicazioni del centro. Stato e prossima dose gialli quando è il momento, verde dopo la conferma di uno schema regolare. Sei azioni in colonna con colori distinti riutilizzati nello Storico. Reset annulla i piani, rimuove l’attivazione push, azzera il diario e riapre la configurazione.

Esami del sangue ordinati: HIV, sifilide con dettagli TPHA/RPR/IgG/IgM/note, epatite C, epatite B con HBsAg/anti-HBs/HBc Totale, creatinina. Il confronto cromatico 0,70–1,20 mg/dL segue l’intervallo richiesto dall’utente e non interpreta la funzionalità renale. Altri test chiusi in More; aprire/chiudere non altera esiti già registrati. Dettagli strutturati inclusi nel backup.

Scatole locali: apertura e dismissione nello Storico; 30 compresse meno le quantità effettivamente registrate dall’apertura. Aprire una nuova scatola sostituisce la precedente ai fini del conteggio e annulla i suoi avvisi futuri. Le soglie a 10 e 5 includono il salto di soglia causato da una dose doppia e sono idempotenti per scatola.

Server: applicare nell’ordine schema.sql, notification-migration.sql e stock-notifications.sql, quindi pubblicare reminders.ts. La nuova funzione mantiene il piano e i token precedenti. Solo chiavi opache e orari sono trasmessi: nessun esito o nota. expiry a +90 giorni, ricorrenza giornaliera gestita dal cron anche senza aprire l’app, fino a nuova scatola, dismissione, fine scorta o reset sincronizzati. La preferenza discreta resta rispettata. Il test transazionale stock-notification-check.sql verifica ricorrenza e cancellazione su righe sintetiche, annullando le modifiche alla fine. Gli esiti di invio dipendono da Internet e permessi del dispositivo.

Riferimento per il flacone Mylan: foglio illustrativo EMA in italiano, usare entro 90 giorni dalla prima apertura: https://www.ema.europa.eu/it/documents/product-information/emtricitabine-tenofovir-disoproxil-mylan-epar-product-information_it.pdf.

## Versione 1.9

Configurazione: pillola SVG nel benvenuto, scelta quotidiano/on demand, scatola nuova o già aperta prima della prima dose. Per una scatola già aperta si inseriscono data di apertura e compresse disponibili prima della dose; il conteggio sottrae le registrazioni successive, anche doppie. Quantità iniziale conservata nei backup e nelle modifiche di apertura.

Corretto il promemoria a -2 ore anche per la continuazione facoltativa on demand, senza aggiungere dosi necessarie nello Storico o prolungare il piano dopo una dose non registrata. Nessun recupero retroattivo per avvisi già trascorsi. Il service worker legge la preferenza discreta dal diario locale prima di mostrare il push e sostituisce titolo e testo identificativi anche in payload vecchi. Nome e icona del mittente iOS restano quelli dell’app installata e non possono essere nascosti dal contenuto del singolo avviso. Non è stata cambiata l’identità installata per evitare rischi ai dati locali esistenti.

## Versione 1.10

Icona installabile allineata alla pillola del benvenuto: fondo rosa chiaro, pillola rossa, senza cerchio esterno. SVG e PNG 192/512; identità, scope e archivio invariati. iOS può conservare in cache l’icona dell’installazione esistente.

IgG/IgM è un unico valore; i vecchi valori separati restano conservati e visibili come precedenti, senza sommarli né reinterpretarli. In Salute il titolo dell’esame apre una scheda di sola lettura con soli esiti analizzati, valori compilati e note. La matita e il pulsante Modifica aprono l’editor.

Sincronizzazione: messaggi distinti per rete, piano rifiutato e attivazione non autorizzata; due tentativi limitati durante la conferma push riducono la corsa tra registrazione e conferma. Nei log del servizio sono state osservate risposte 401 durante attivazioni, non errori 400 del piano scatola. Nessun dato esistente viene azzerato o ricreato per risolvere un errore notifiche.

Ripetizioni: anche la continuazione facoltativa segue la preferenza Ripeti, con massimo quattro avvisi a +15/+30/+45/+60 minuti dal primo, entro l’ora di margine; nessun nuovo giorno di avvisi senza una dose reale. Il test transazionale server controlla i cinque record e la cancellazione del vecchio piano, con rollback dei dati sintetici. La consegna effettiva su iPhone resta soggetta a connessione, autorizzazioni e impostazioni Focus, e non è stata misurata con un’attesa reale di 60 minuti.

## Versione 1.11

Configurazione retroattiva atomica: lo schema iniziale si salva insieme alla prima dose e all’eventuale scatola, con decorrenza non successiva alla loro prima data. Nessuna data odierna aggiunta solo perché la configurazione avviene oggi. A parità di orario l’ordine cronologico è schema, scatola, dose; nello Storico discendente viene visualizzato dal basso verso l’alto. L’apertura già avvenuta dopo la dose viene rifiutata invece di anticiparla silenziosamente. Possibile omettere la scatola. Gli schemi già presenti sono modificabili nella data e nella modalità senza cancellare altre registrazioni; nessuna migrazione automatica di cambi schema clinici preesistenti.

Attivazione notifiche: HTTP 429 ora indica il limite di tentativi e l’orario di riprova restituito dal server. Applicare enrollment-status.sql e pubblicare reminders.ts prima del frontend. Limiti di frequenza, prova di possesso e autorizzazioni invariati. I problemi del database di attivazione rispondono 503 invece di essere classificati tutti come 429. La richiesta in attesa non crea nuovi tentativi per dieci minuti. L’interfaccia non dichiara riuscita l’attivazione prima della sincronizzazione. Il service worker salva il token solo dopo conferma valida, recuperando anche un’attivazione la cui richiesta in primo piano sia stata interrotta.

Diagnosi del 20/11: risposte 429 alle 11:21; tre attivazioni confermate nella stessa finestra di rete, primo slot nuovamente libero alle 11:52:43 Europe/Rome. Nessun limite rimosso e nessun diario modificato durante la diagnosi.

## Versione 1.12

Salute → Vaccini: catalogo istituzionale, archivio locale con data, numero progressivo correggibile, richiamo e note. Date delle vaccinazioni dall'anno 1900, senza modificare la cronologia PrEP. La numerazione propone il massimo già registrato +1 per lo stesso vaccino; gli inserimenti retroattivi sono correggibili e non rinumerano silenziosamente i dati precedenti. Il catalogo non prescrive un piano vaccinale personale. Fonti consultate 20/11/2026: Ministero della Salute, calendario vaccinale e condizioni di rischio; ISS, Mpox. Collegamenti disponibili nella schermata.

Esiti analisi → Routine, sotto Altri esami: metabolismo/reni/lipidi, AST/ALT, emocromo, formula relativa e assoluta, urine, campi aggiuntivi personalizzati. Risultati numerici o testuali, unità e riferimenti del laboratorio. Nessun risultato del referto viene inserito automaticamente nel diario. Nella lettura degli esiti, ogni campo mostra lo storico delle registrazioni corrispondenti. Nuovi dati inclusi nel backup v2; i backup precedenti restano compatibili.

Appuntamenti visite e analisi: due avvisi, a -24 ore (stessa ora del giorno precedente) e -1 ora, anche per eventi oltre sette giorni. Nessun recupero degli avvisi già trascorsi. Modifica/cancellazione sostituisce il piano alla sincronizzazione; discrezione invariata. Solo identificativi e orari vengono trasmessi al servizio; titoli, esiti, vaccini e note rimangono locali. Il backend accetta fino a 256 promemoria e programmazioni appuntamenti fino al limite del diario (2100), mantenendo invariata l'autorizzazione. Pubblicare reminders.ts prima del frontend; non servono migrazioni SQL aggiuntive. Push su iPhone soggette a connessione, autorizzazioni e cron ogni minuto; non verificato l'arrivo reale di avvisi a distanza di 24 ore.

## Versione 1.13

Catalogo vaccini: Polio/Poliomielite esplicita e separata dal combinato dTpa-IPV, aggiunto COVID-19 con fonte ministeriale. Le registrazioni precedenti conservano nomi e dosi senza conversioni. Vaccini → Malattie già avute: morbillo, varicella, parotite, rosolia e COVID-19, con Sì / No / Non so, anno facoltativo e note. Informazioni riferite, senza certificazione di immunità né eliminazione di vaccini o dosi. Dati solo locali, compresi nel backup; reset e ripristino dei backup precedenti gestiti senza mantenere annotazioni residue. Nessuna modifica aggiuntiva al servizio notifiche.

## Versione 1.14 · pulsanti Riepilogo

Sei pulsanti HTML indipendenti, testi e piccole icone SVG, superfici glass in CSS, illustrazioni originali ritagliate dal riferimento approvato (nessuna nuova illustrazione generata). Ordine fisso a due colonne: Rapporto/PrEP, Appuntamento Analisi/Appuntamento Visita, Analisi/Flacone. Azioni delegate originali sex/manual/analysis/visit/screening/box invariate. CSS confinato al Riepilogo, risorse disponibili offline, focus tastiera e preferenze movimento/trasparenza rispettati. Su iPhone le card hanno proporzioni più alte per mantenere i testi leggibili: il Riepilogo può scorrere verticalmente sui display piccoli. Dati, moduli, database e notifiche invariati. Verificati sintassi, 61 test e presenza delle risorse; anteprima browser locale bloccata dall'ambiente, quindi non verificata visivamente su desktop/iPhone.

## Versione 1.15 · rifinitura pulsanti

Corretta la vecchia regola che fissava il body del Riepilogo: contenuto ora disposto nel flusso, con spazio inferiore misurato sulla barra flottante reale e altezza delle tre righe adattata allo spazio disponibile. Nei viewport molto bassi rimane lo scorrimento per non sacrificare leggibilità né nascondere pulsanti. Moduli, dati e notifiche invariati. Il padding inline del Riepilogo viene rimosso passando alle altre sezioni.

Card chiare/scure secondo il tema già attivo dell'app, con palette, riflessi, aloni e descrizioni dedicati. Ripulite le sei illustrazioni tramite separazione dello sfondo e trasparenza, sostituendo le maschere manuali difettose della 1.14; mantenuti soggetti, colori e impostazione del riferimento. Tutti gli oggetti rientrano nelle card con margine. Cache offline aggiornata.

Verifica: test logici di fitting su viewport 375×812, 390×844, 430×932, finestra corta 320×568, invariabilità del fitting con scroll, regressioni e backup esistenti; controllo dei canali alpha e dei ritagli su sfondo trasparente. L'anteprima locale disponibile è una vecchia versione e l'ambiente impedisce di avviare il nuovo server; non è stata verificata visivamente questa versione nel browser Safari reale.

## Versione 1.15.2 · aggiornamento app installata

Le due descrizioni su due righe erano già presenti nel repository. Questa versione corregge l'aggiornamento dell'app installata: attivazione del nuovo service worker ricarica una volta le finestre sul Riepilogo con URL versionato; le altre sezioni restano aperte. Registrazione con updateViaCache none e controllo esplicito del worker; navigazioni con cache HTTP no-store, cache offline mantenuta. Nessuna cancellazione IndexedDB, token, sottoscrizioni push o dati sanitari. Pulsanti, CSS, immagini e testi della 1.15.1 identici.
