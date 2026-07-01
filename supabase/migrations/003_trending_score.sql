-- Trending v2: velocity-based score with exponential decay
-- Signals: recent upvotes, live session starts, active streams
-- Extensible for comments (weight 2) and follows (weight 2) when tables exist

alter table public.requests
  add column if not exists trending_score double precision not null default 0,
  add column if not exists active_streamer_count integer not null default 0;

create or replace function public.compute_trending_score(p_request_id uuid)
returns double precision as $$
declare
  score double precision := 0;
  ln2 constant double precision := 0.6931471805599453;
begin
  -- Recent upvotes: weight 3, half-life 12h, window 48h
  select coalesce(
    sum(3.0 * exp(-ln2 * extract(epoch from (now() - u.created_at)) / 43200.0)),
    0
  )
  into score
  from public.upvotes u
  where u.request_id = p_request_id
    and u.created_at > now() - interval '48 hours';

  -- Live session starts: weight 5, half-life 6h, window 48h
  score := score + coalesce((
    select sum(5.0 * exp(-ln2 * extract(epoch from (now() - ls.started_at)) / 21600.0))
    from public.live_sessions ls
    where ls.request_id = p_request_id
      and ls.started_at > now() - interval '48 hours'
  ), 0);

  -- Active live sessions: weight 8 each (no decay while live)
  score := score + coalesce((
    select count(*)::double precision * 8.0
    from public.live_sessions ls
    where ls.request_id = p_request_id
      and ls.ended_at is null
  ), 0);

  -- Comments placeholder (uncomment when comments table exists):
  -- score := score + coalesce((
  --   select sum(2.0 * exp(-ln2 * extract(epoch from (now() - c.created_at)) / 43200.0))
  --   from public.comments c
  --   where c.request_id = p_request_id
  --     and c.created_at > now() - interval '48 hours'
  -- ), 0);

  -- Follows placeholder (uncomment when request_follows table exists):
  -- score := score + coalesce((
  --   select sum(2.0 * exp(-ln2 * extract(epoch from (now() - f.created_at)) / 43200.0))
  --   from public.request_follows f
  --   where f.request_id = p_request_id
  --     and f.created_at > now() - interval '48 hours'
  -- ), 0);

  -- Small recency boost for brand-new requests
  score := score + coalesce((
    select 0.5 * exp(-ln2 * extract(epoch from (now() - r.created_at)) / 86400.0)
    from public.requests r
    where r.id = p_request_id
  ), 0);

  return score;
end;
$$ language plpgsql stable;

create or replace function public.refresh_request_trending(p_request_id uuid)
returns void as $$
begin
  update public.requests
  set
    trending_score = public.compute_trending_score(p_request_id),
    active_streamer_count = (
      select count(distinct ls.streamer_id)::integer
      from public.live_sessions ls
      where ls.request_id = p_request_id
        and ls.ended_at is null
    )
  where id = p_request_id;
end;
$$ language plpgsql security definer;

create or replace function public.handle_upvote_trending()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_request_trending(new.request_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_request_trending(old.request_id);
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists upvotes_trending_insert on public.upvotes;
create trigger upvotes_trending_insert
  after insert on public.upvotes
  for each row execute function public.handle_upvote_trending();

drop trigger if exists upvotes_trending_delete on public.upvotes;
create trigger upvotes_trending_delete
  after delete on public.upvotes
  for each row execute function public.handle_upvote_trending();

create or replace function public.handle_live_session_trending()
returns trigger as $$
declare
  rid uuid;
begin
  rid := coalesce(new.request_id, old.request_id);
  perform public.refresh_request_trending(rid);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists live_sessions_trending_insert on public.live_sessions;
create trigger live_sessions_trending_insert
  after insert on public.live_sessions
  for each row execute function public.handle_live_session_trending();

drop trigger if exists live_sessions_trending_update on public.live_sessions;
create trigger live_sessions_trending_update
  after update of ended_at on public.live_sessions
  for each row execute function public.handle_live_session_trending();

drop trigger if exists live_sessions_trending_delete on public.live_sessions;
create trigger live_sessions_trending_delete
  after delete on public.live_sessions
  for each row execute function public.handle_live_session_trending();

-- Backfill existing rows
update public.requests r
set
  trending_score = public.compute_trending_score(r.id),
  active_streamer_count = (
    select count(distinct ls.streamer_id)::integer
    from public.live_sessions ls
    where ls.request_id = r.id
      and ls.ended_at is null
  );

create index if not exists requests_trending_score_idx
  on public.requests (trending_score desc);
