-- Transactional integration check. No real-device rows are read or changed.
begin;
do $$
declare d uuid:=gen_random_uuid();
begin
 insert into public.prep_devices(id,token_hash,subscription) values(d,gen_random_uuid()::text,'{}');
 insert into public.prep_reminders(device_id,key,due_at,attempts) values(d,'expire-test',now()-interval '5 minutes',1),(d,'stock-test-10',now(),1);
 perform public.prep_finish_reminder(d,'expire-test');
 if not exists(select 1 from public.prep_reminders where device_id=d and key='expire-test' and due_at>now()+interval '23 hours' and sent_at is null and attempts=0) then raise exception 'Daily expiry recurrence failed'; end if;
 perform public.prep_finish_reminder(d,'stock-test-10');
 if not exists(select 1 from public.prep_reminders where device_id=d and key='stock-test-10' and sent_at is not null) then raise exception 'One-shot stock completion failed'; end if;
 perform public.prep_replace_plan(d,'[]',true);
 if exists(select 1 from public.prep_reminders where device_id=d and key='expire-test') then raise exception 'Expiry cancellation failed'; end if;
end $$;
rollback;
