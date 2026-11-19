# Diario PrEP

PWA in italiano ispirata alle schermate My PrEP fornite: configurazione, Riepilogo, Storico, Statistiche, Impostazioni. Il diario è conservato in IndexedDB sul dispositivo. Nessun dato sanitario viene incluso nel codice o nelle richieste al backend notifiche.

## Avvio e verifiche

`npm start` apre un server locale su http://127.0.0.1:4173. `npm test` verifica conteggi temporali, cicli continuativi, backup e promemoria. Non ci sono dipendenze frontend o richieste di telemetria.

Pubblicazione: GitHub Pages, ramo main, cartella root. Aggiungere alla schermata Home da Safari per abilitare Web Push su iPhone.

## Notifiche

Schema e funzione sono in `schema.sql`, `reminders.ts`, `config.toml` e `schedule.sql`. Il servizio riceve soltanto sottoscrizione push, token dispositivo hashato, preferenza testo discreto, orari e identificativi degli avvisi. Dati protetti da RLS senza policy pubbliche: accesso solo tramite Edge Function con autorizzazione per dispositivo. La registrazione richiede un codice privato di abbinamento. Nessuna chiave service-role o VAPID privata va nel frontend, nel repository o nei backup.

Configurare lato server VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET, PAIRING_CODE, ALLOWED_ORIGINS. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono forniti dal runtime. La funzione usa autenticazione personalizzata; il gateway JWT resta attivo con chiave anon pubblica e autorizzazione privata nel campo x-device-token. Creare `prep_cron_secret` in Vault con valore uguale a CRON_SECRET e `prep_anon_key` con la chiave anon pubblica e applicare schedule.sql una sola volta. Verificare invio e cancellazione su un dispositivo reale.

L'app accoda le modifiche offline e riprova all'apertura o al ritorno della connessione. Un aggiornamento offline non annulla avvisi già programmati sul server fino alla sincronizzazione. Sono previste quattro ripetizioni ogni 15 minuti; il mancato tocco non registra automaticamente una dose. Il cron controlla ogni minuto: non è una sveglia al secondo. Le push richiedono Internet e risentono delle impostazioni del sistema operativo.

## Conteggi clinici e limiti

Il diario registra le assunzioni reali di FTC/TDF 200/245 mg. Lo schema base configurato è on demand 2-1-1 per rapporti anali: dose iniziale doppia 2–24 ore prima, una dose ogni 24 ore fino a due dosi dopo l'ultimo rapporto. Fonte: https://www.hse.ie/conditions/hiv/how-to-take-prep/ .

I colori mostrano previsioni condizionate al completamento delle dosi, non garanzie di protezione. Ritardi, lacune, rapporti troppo precoci e registrazioni incoerenti richiedono verifica; non viene suggerito automaticamente un recupero o un raddoppio dopo 24 ore. La tolleranza tecnica ±2 ore segnala scostamenti e non certifica una finestra clinica. La ripartenza viene registrata come nuova dose iniziale solo su azione esplicita; non è un consiglio terapeutico. In presenza di esposizioni e dosi mancanti rivolgersi tempestivamente al centro PrEP per valutazione PEP.

Backup JSON non cifrato: contiene dati personali e va custodito. Il backup non include il token del servizio notifiche. L'importazione sostituisce gli eventi dopo validazione e conferma. Il reset prima annulla gli avvisi e richiede conferma scritta; se il server non risponde conserva il diario.

## Versione 1.2

Attesa iniziale celeste; lo Storico mostra un evento derivato con scudo a +2 ore e le sole dosi pianificate a seguito di rapporti registrati, in ordine cronologico e con linea tratteggiata blu. Questi elementi non vengono salvati come assunzioni e non entrano nei conteggi o nei backup. Senza rapporti registrati non si generano dosi post-rapporto né promemoria di assunzione; rimane l’avviso iniziale a +2 ore. L’app segnala esplicitamente che nessun rapporto registrato non equivale ad assenza di rapporti. Fonte per il caso senza rapporti e senza ulteriori rapporti previsti: UK guide to PrEP, novembre 2025, pagina 19, https://icash.nhs.uk/media/yo0a5oyq/prep-guide-uk-november-2025.pdf .
