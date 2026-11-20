-- Only opaque scheduling metadata; stock counts and health records remain local.
create or replace function public.prep_finish_reminder(p_device uuid,p_key text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_key like 'expire-%' then
  update public.prep_reminders set due_at=greatest(due_at+interval '1 day',now()+interval '1 day'),sent_at=null,claimed_at=null,attempts=0 where device_id=p_device and key=p_key;
 else
  update public.prep_reminders set sent_at=now() where device_id=p_device and key=p_key;
 end if;
end $$;
create or replace function public.prep_claim_due()
returns table(device_id uuid,key text,subscription jsonb,discreet boolean)
language sql security definer set search_path='' as $$
 with picked as (
 select r.device_id,r.key from public.prep_reminders r
 where r.sent_at is null and r.due_at<=now() and (r.due_at>now()-interval '2 hours' or r.key like 'expire-%' or r.key like 'stock-%')
 and (r.claimed_at is null or r.claimed_at<now()-interval '5 minutes') and r.attempts<3
 order by r.due_at limit 50 for update skip locked
 ), claimed as (
 update public.prep_reminders r set claimed_at=now(),attempts=r.attempts+1
 from picked p where r.device_id=p.device_id and r.key=p.key returning r.device_id,r.key
 ) select c.device_id,c.key,d.subscription,d.discreet from claimed c join public.prep_devices d on d.id=c.device_id;
$$;
revoke all on function public.prep_finish_reminder(uuid,text),public.prep_claim_due() from public,anon,authenticated;
grant execute on function public.prep_finish_reminder(uuid,text),public.prep_claim_due() to service_role;
