-- Service-only diagnostics. Existing attempt limits and proof checks stay unchanged.
create or replace function public.prep_enrollment_retry_after(p_ip text)
returns integer language plpgsql security definer set search_path='' as $$
declare ip_wait integer:=0; global_wait integer:=0;
begin
 if (select count(*) from public.prep_enrollments where ip_hash=p_ip and created_at>now()-interval '1 hour')>=3 then
  select greatest(1,ceil(extract(epoch from(min(created_at)+interval '1 hour'-now())))::integer) into ip_wait from public.prep_enrollments where ip_hash=p_ip and created_at>now()-interval '1 hour';
 end if;
 if (select count(*) from public.prep_enrollments where created_at>now()-interval '1 day')>=30 then
  select greatest(1,ceil(extract(epoch from(min(created_at)+interval '1 day'-now())))::integer) into global_wait from public.prep_enrollments where created_at>now()-interval '1 day';
 end if;
 return greatest(ip_wait,global_wait);
end $$;
revoke all on function public.prep_enrollment_retry_after(text) from public,anon,authenticated;
grant execute on function public.prep_enrollment_retry_after(text) to service_role;
