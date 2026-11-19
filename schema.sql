-- Only notification metadata. No dose or sexual-event history is stored here.
create schema if not exists prep_private;
revoke all on schema prep_private from public, anon, authenticated;
create table if not exists public.prep_devices (
 id uuid primary key default gen_random_uuid(),
 token_hash text unique not null,
 subscription jsonb not null,
 discreet boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.prep_devices enable row level security;
revoke all on public.prep_devices from anon, authenticated;
create table if not exists public.prep_reminders (
 device_id uuid not null references public.prep_devices(id) on delete cascade,
 key text not null,
 due_at timestamptz not null,
 sent_at timestamptz,
 claimed_at timestamptz,
 attempts int not null default 0,
 primary key(device_id,key)
);
alter table public.prep_reminders enable row level security;
revoke all on public.prep_reminders from anon, authenticated;
create index if not exists prep_reminders_due on public.prep_reminders(due_at) where sent_at is null;
grant all on public.prep_devices,public.prep_reminders to service_role;
create or replace function public.prep_replace_plan(p_device uuid,p_plan jsonb,p_discreet boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.prep_devices where id=p_device for update;
 if not found then raise exception 'Unknown device'; end if;
 update public.prep_devices set discreet=p_discreet,updated_at=now() where id=p_device;
 delete from public.prep_reminders where device_id=p_device and sent_at is null and key not in (select e->>'key' from jsonb_array_elements(p_plan) e);
 insert into public.prep_reminders(device_id,key,due_at)
 select p_device,e->>'key',to_timestamp((e->>'at')::double precision/1000) from jsonb_array_elements(p_plan) e
 on conflict(device_id,key) do nothing;
end $$;
create or replace function public.prep_claim_due()
returns table(device_id uuid,key text,subscription jsonb,discreet boolean)
language sql security definer set search_path='' as $$
 with picked as (
 select r.device_id,r.key from public.prep_reminders r
 where r.sent_at is null and r.due_at<=now() and r.due_at>now()-interval '2 hours'
 and (r.claimed_at is null or r.claimed_at<now()-interval '5 minutes') and r.attempts<3
 order by r.due_at limit 50 for update skip locked
 ), claimed as (
 update public.prep_reminders r set claimed_at=now(),attempts=r.attempts+1
 from picked p where r.device_id=p.device_id and r.key=p.key returning r.device_id,r.key
 ) select c.device_id,c.key,d.subscription,d.discreet from claimed c join public.prep_devices d on d.id=c.device_id;
$$;
revoke all on function public.prep_replace_plan(uuid,jsonb,boolean),public.prep_claim_due() from public,anon,authenticated;
grant execute on function public.prep_replace_plan(uuid,jsonb,boolean),public.prep_claim_due() to service_role;
