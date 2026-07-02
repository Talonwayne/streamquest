-- Extend stream_platform enum + allow any authenticated user to post stream links

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'stream_platform' and e.enumlabel = 'tiktok'
  ) then
    alter type stream_platform add value 'tiktok';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'stream_platform' and e.enumlabel = 'instagram'
  ) then
    alter type stream_platform add value 'instagram';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on e.enumtypid = t.oid
    where t.typname = 'stream_platform' and e.enumlabel = 'facebook'
  ) then
    alter type stream_platform add value 'facebook';
  end if;
end $$;

-- Remove streamer role gate: any authenticated user can fulfill a request
drop policy if exists "Streamers can create live sessions" on public.live_sessions;

create policy "Authenticated users can create live sessions"
  on public.live_sessions for insert
  with check (auth.uid() = streamer_id);
