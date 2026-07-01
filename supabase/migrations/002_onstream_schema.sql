-- Onstream schema: multi-fulfillment + status model (open / live_now / completed)
-- Idempotent where possible for safe re-run after partial failure

-- 1. Restructure live_sessions: link directly to request + streamer
alter table public.live_sessions
  add column if not exists request_id uuid references public.requests(id) on delete cascade,
  add column if not exists streamer_id uuid references public.profiles(id) on delete cascade;

update public.live_sessions ls
set
  request_id = c.request_id,
  streamer_id = c.streamer_id
from public.claims c
where ls.claim_id = c.id
  and (ls.request_id is null or ls.streamer_id is null);

alter table public.live_sessions
  alter column request_id set not null,
  alter column streamer_id set not null;

-- Drop old RLS policy before removing claim_id (policy references claim_id)
drop policy if exists "Streamers can create live sessions for own claims" on public.live_sessions;

alter table public.live_sessions drop constraint if exists live_sessions_claim_id_fkey;
alter table public.live_sessions drop constraint if exists live_sessions_claim_id_key;
alter table public.live_sessions drop column if exists claim_id;

create index if not exists live_sessions_request_id_idx on public.live_sessions (request_id);
create index if not exists live_sessions_streamer_id_idx on public.live_sessions (streamer_id);
create index if not exists live_sessions_active_idx on public.live_sessions (request_id, started_at desc)
  where ended_at is null;

-- One active session per user per request
create unique index if not exists live_sessions_request_streamer_active_idx
  on public.live_sessions (request_id, streamer_id)
  where ended_at is null;

-- 2. Deprecate claims as fulfillment gate
drop trigger if exists on_claim_created on public.claims;
drop function if exists public.handle_claim_insert();

alter table public.claims drop constraint if exists claims_request_id_key;

-- 3. Replace request_status enum (skip if already migrated)
do $$
begin
  if exists (
    select 1 from pg_type t
    join pg_enum e on t.oid = e.enumtypid
    where t.typname = 'request_status' and e.enumlabel = 'claimed'
  ) then
    create type request_status_new as enum ('open', 'live_now', 'completed');

    alter table public.requests add column status_new request_status_new;

    update public.requests r
    set status_new = case r.status::text
      when 'open' then 'open'::request_status_new
      when 'claimed' then
        case
          when exists (
            select 1 from public.live_sessions ls
            where ls.request_id = r.id and ls.ended_at is null
          ) then 'live_now'::request_status_new
          else 'open'::request_status_new
        end
      when 'fulfilled' then
        case
          when exists (
            select 1 from public.live_sessions ls
            where ls.request_id = r.id and ls.ended_at is null
          ) then 'live_now'::request_status_new
          else 'completed'::request_status_new
        end
    end;

    alter table public.requests drop column status;
    alter table public.requests rename column status_new to status;
    alter table public.requests alter column status set not null;
    alter table public.requests alter column status set default 'open'::request_status_new;

    drop type request_status;
    alter type request_status_new rename to request_status;
  end if;
end $$;

-- 4. Status triggers on live_sessions
drop trigger if exists on_live_session_created on public.live_sessions;
drop function if exists public.handle_live_session_insert();

create or replace function public.handle_live_session_insert()
returns trigger as $$
begin
  update public.requests
  set status = 'live_now'
  where id = new.request_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_live_session_end()
returns trigger as $$
begin
  if new.ended_at is not null
     and (old.ended_at is null or old.ended_at is distinct from new.ended_at) then
    if not exists (
      select 1 from public.live_sessions
      where request_id = new.request_id and ended_at is null
    ) then
      update public.requests
      set status = 'completed'
      where id = new.request_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_live_session_created
  after insert on public.live_sessions
  for each row execute function public.handle_live_session_insert();

drop trigger if exists on_live_session_ended on public.live_sessions;
create trigger on_live_session_ended
  after update of ended_at on public.live_sessions
  for each row execute function public.handle_live_session_end();

-- 5. RLS: live_sessions insert by streamer (role gate removed in PR 2)
drop policy if exists "Streamers can create live sessions" on public.live_sessions;

create policy "Streamers can create live sessions"
  on public.live_sessions for insert
  with check (
    auth.uid() = streamer_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('streamer', 'both')
    )
  );

drop policy if exists "Streamers can update own live sessions" on public.live_sessions;

create policy "Streamers can update own live sessions"
  on public.live_sessions for update
  using (auth.uid() = streamer_id);

grant update on public.live_sessions to authenticated;
