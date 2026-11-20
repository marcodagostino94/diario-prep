-- Code-free enrollment: encrypted push proves ownership of the subscription.
create table if not exists public.prep_enrollments (
 id uuid primary key default gen_random_uuid(), token_hash text not null unique,
 proof_hash text not null, ip_hash text not null, subscription jsonb not null,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '10 minutes',
 confirmed boolean not null default false
);
alter table public.prep_enrollments enable row level security;
revoke all on public.prep_enrollments from anon, authenticated;
grant all on public.prep_enrollments to service_role;
create or replace function public.prep_begin_enrollment(p_token text,p_proof text,p_ip text,p_subscription jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
 perform pg_advisory_xact_lock(87261931);
 delete from prep_enrollments where created_at<now()-interval '1 day';
 if (select count(*) from prep_enrollments)>=30 or
 (select count(*) from prep_enrollments where ip_hash=p_ip and created_at>now()-interval '1 hour')>=3 then
 raise exception 'Enrollment rate limit'; end if;
 insert into prep_enrollments(token_hash,proof_hash,ip_hash,subscription) values(p_token,p_proof,p_ip,p_subscription);
end $$;
create or replace function public.prep_confirm_enrollment(p_token text,p_proof text)
returns void language plpgsql security definer set search_path=public as $$
declare r prep_enrollments%rowtype;
begin
 perform pg_advisory_xact_lock(87261931);
 select * into r from prep_enrollments where token_hash=p_token and proof_hash=p_proof and expires_at>now() and not confirmed for update;
 if not found then raise exception 'Invalid enrollment'; end if;
 -- Recovery requires the same proof as a new device. Existing device tokens keep working otherwise.
 delete from prep_devices where subscription->>'endpoint'=r.subscription->>'endpoint';
 if (select count(*) from prep_devices)>=10 then raise exception 'Device limit'; end if;
 insert into prep_devices(token_hash,subscription) values(p_token,r.subscription);
 update prep_enrollments set confirmed=true,subscription='{}'::jsonb where id=r.id;
end $$;
revoke all on function public.prep_begin_enrollment(text,text,text,jsonb) from public;
revoke all on function public.prep_confirm_enrollment(text,text) from public;
grant execute on function public.prep_begin_enrollment(text,text,text,jsonb) to service_role;
grant execute on function public.prep_confirm_enrollment(text,text) to service_role;
