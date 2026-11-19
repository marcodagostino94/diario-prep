-- First configure the matching random CRON_SECRET in Edge Function secrets and Vault.
-- Do not commit the secret or paste it in a chat.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('prep-dispatch','* * * * *',$job$
 select net.http_post(
 url:='https://tzgiywfhrxjdfgrhfwyb.supabase.co/functions/v1/reminders',
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='prep_anon_key' limit 1),'x-device-token',(select decrypted_secret from vault.decrypted_secrets where name='prep_cron_secret' limit 1)),
 body:='{"action":"dispatch"}'::jsonb
 );
$job$);
