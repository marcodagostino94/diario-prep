begin;
do $$
declare test_ip text:=gen_random_uuid()::text; wait_seconds integer;
begin
 if public.prep_enrollment_retry_after(test_ip)<>0 then raise exception 'Fresh enrollment incorrectly limited'; end if;
 insert into public.prep_enrollments(token_hash,proof_hash,ip_hash,subscription,created_at,expires_at,confirmed)
 select gen_random_uuid()::text,gen_random_uuid()::text,test_ip,'{}',now()-interval '20 minutes',now()-interval '10 minutes',true from generate_series(1,3);
 wait_seconds:=public.prep_enrollment_retry_after(test_ip);
 if wait_seconds<2399 or wait_seconds>2401 then raise exception 'Incorrect enrollment retry time: %',wait_seconds; end if;
end $$;
rollback;
