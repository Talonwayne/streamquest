-- Engagement (comments, follows, reports), request locations, search, platform enrichment fields

-- 1. Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_request_created_idx
  on public.comments (request_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments"
  on public.comments for select using (true);

drop policy if exists "Authenticated users can create comments" on public.comments;
create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors can delete own comments" on public.comments;
create policy "Authors can delete own comments"
  on public.comments for delete
  using (auth.uid() = author_id);

grant select on public.comments to anon, authenticated;
grant insert, delete on public.comments to authenticated;

-- 2. Request follows
create table if not exists public.request_follows (
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create index if not exists request_follows_user_idx
  on public.request_follows (user_id);

alter table public.request_follows enable row level security;

drop policy if exists "Anyone can read follows" on public.request_follows;
create policy "Anyone can read follows"
  on public.request_follows for select using (true);

drop policy if exists "Users can follow requests" on public.request_follows;
create policy "Users can follow requests"
  on public.request_follows for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can unfollow requests" on public.request_follows;
create policy "Users can unfollow requests"
  on public.request_follows for delete
  using (auth.uid() = user_id);

grant select on public.request_follows to anon, authenticated;
grant insert, delete on public.request_follows to authenticated;

-- 3. Reports
do $$ begin
  create type public.report_status as enum ('pending', 'reviewed', 'actioned', 'dismissed');
exception when duplicate_object then null;
end $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.requests(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status public.report_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (request_id is not null or comment_id is not null)
);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "Users can create reports" on public.reports;
create policy "Users can create reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users can read own reports" on public.reports;
create policy "Users can read own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

grant insert, select on public.reports to authenticated;

-- 4. Optional location on requests (travel / IRL demand pins)
alter table public.requests
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_label text;

create index if not exists requests_location_idx
  on public.requests (latitude, longitude)
  where latitude is not null and longitude is not null;

-- 5. Full-text search
alter table public.requests
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists requests_search_vector_idx
  on public.requests using gin (search_vector);

-- 6. Platform enrichment on live sessions
alter table public.live_sessions
  add column if not exists platform_title text,
  add column if not exists platform_game text,
  add column if not exists platform_viewer_count integer,
  add column if not exists platform_thumbnail_url text,
  add column if not exists live_verified boolean not null default false,
  add column if not exists platform_user_id text;

-- 7. Streamer platform identity + location precision
do $$ begin
  create type public.location_precision as enum ('city', 'precise');
exception when duplicate_object then null;
end $$;

alter table public.streamer_profiles
  add column if not exists twitch_user_id text,
  add column if not exists youtube_channel_id text,
  add column if not exists location_precision public.location_precision not null default 'city';

create unique index if not exists streamer_profiles_twitch_user_id_idx
  on public.streamer_profiles (twitch_user_id)
  where twitch_user_id is not null;

create unique index if not exists streamer_profiles_youtube_channel_id_idx
  on public.streamer_profiles (youtube_channel_id)
  where youtube_channel_id is not null;

-- 8. Trending refresh helper (call via cron / API)
create or replace function public.refresh_all_trending_scores()
returns void
language plpgsql
security definer
as $$
declare
  r record;
  age_hours double precision;
  upvote_signal double precision;
  live_signal double precision;
  active_boost double precision;
  recency_boost double precision;
  ln2 constant double precision := 0.6931471805599453;
begin
  for r in
    select
      req.id,
      req.upvote_count,
      req.created_at,
      req.active_streamer_count,
      coalesce(
        (select count(*)::int from public.live_sessions ls
         where ls.request_id = req.id
           and ls.started_at > now() - interval '48 hours'),
        0
      ) as recent_lives,
      coalesce(
        (select count(*)::int from public.comments c
         where c.request_id = req.id
           and c.created_at > now() - interval '48 hours'),
        0
      ) as recent_comments,
      coalesce(
        (select count(*)::int from public.request_follows rf
         where rf.request_id = req.id),
        0
      ) as follow_count
    from public.requests req
  loop
    age_hours := extract(epoch from (now() - r.created_at)) / 3600.0;
    upvote_signal := r.upvote_count * 3 * exp(-ln2 * (age_hours / 12.0));
    live_signal := r.recent_lives * 8 * exp(-ln2 * (age_hours / 6.0));
    active_boost := coalesce(r.active_streamer_count, 0) * 15;
    recency_boost := 0.5 * exp(-ln2 * (age_hours / 24.0));
    update public.requests
    set trending_score =
      upvote_signal
      + live_signal
      + active_boost
      + recency_boost
      + (r.recent_comments * 1.5)
      + (r.follow_count * 2)
    where id = r.id;
  end loop;
end;
$$;

-- 9. Ensure authenticated can update own live sessions (end stream)
drop policy if exists "Streamers can update own live sessions" on public.live_sessions;
drop policy if exists "Users can update own live sessions" on public.live_sessions;

create policy "Users can update own live sessions"
  on public.live_sessions for update
  using (auth.uid() = streamer_id)
  with check (auth.uid() = streamer_id);

grant update on public.live_sessions to authenticated;
