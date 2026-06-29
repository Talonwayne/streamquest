-- Streamquest initial schema

create extension if not exists "pgcrypto";

create type user_role as enum ('viewer', 'streamer', 'both');
create type request_status as enum ('open', 'claimed', 'fulfilled');
create type stream_platform as enum ('twitch', 'youtube', 'kick', 'other');
create type notification_channel as enum ('email', 'push');
create type notification_status as enum ('pending', 'sent', 'failed');

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'viewer',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.streamer_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  platform_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 2000),
  status request_status not null default 'open',
  upvote_count integer not null default 0 check (upvote_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.upvotes (
  request_id uuid not null references public.requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests(id) on delete cascade,
  streamer_id uuid not null references public.profiles(id) on delete cascade,
  claimed_at timestamptz not null default now()
);

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique references public.claims(id) on delete cascade,
  stream_url text not null,
  platform stream_platform not null default 'other',
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  channel notification_channel not null,
  status notification_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

-- Indexes
create index requests_status_created_idx on public.requests (status, created_at desc);
create index requests_upvote_count_idx on public.requests (upvote_count desc);
create index upvotes_user_id_idx on public.upvotes (user_id);
create index claims_streamer_id_idx on public.claims (streamer_id);
create index notifications_user_id_idx on public.notifications (user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger streamer_profiles_updated_at
  before update on public.streamer_profiles
  for each row execute function public.set_updated_at();

create trigger requests_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

-- Upvote count sync
create or replace function public.sync_upvote_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.requests set upvote_count = upvote_count + 1 where id = new.request_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.requests set upvote_count = upvote_count - 1 where id = old.request_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger upvotes_count_insert
  after insert on public.upvotes
  for each row execute function public.sync_upvote_count();

create trigger upvotes_count_delete
  after delete on public.upvotes
  for each row execute function public.sync_upvote_count();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Request status on claim / go-live
create or replace function public.handle_claim_insert()
returns trigger as $$
begin
  update public.requests set status = 'claimed' where id = new.request_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function public.handle_live_session_insert()
returns trigger as $$
begin
  update public.requests set status = 'fulfilled'
  where id = (select request_id from public.claims where id = new.claim_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_claim_created
  after insert on public.claims
  for each row execute function public.handle_claim_insert();

create trigger on_live_session_created
  after insert on public.live_sessions
  for each row execute function public.handle_live_session_insert();

-- RLS
alter table public.profiles enable row level security;
alter table public.streamer_profiles enable row level security;
alter table public.requests enable row level security;
alter table public.upvotes enable row level security;
alter table public.claims enable row level security;
alter table public.live_sessions enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

-- Profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Streamer profiles
create policy "Streamer profiles are viewable by everyone"
  on public.streamer_profiles for select using (true);

create policy "Streamers can insert own profile"
  on public.streamer_profiles for insert
  with check (auth.uid() = user_id);

create policy "Streamers can update own profile"
  on public.streamer_profiles for update using (auth.uid() = user_id);

-- Requests
create policy "Requests are viewable by everyone"
  on public.requests for select using (true);

create policy "Authenticated users can create requests"
  on public.requests for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own requests"
  on public.requests for update using (auth.uid() = author_id);

-- Upvotes
create policy "Upvotes are viewable by everyone"
  on public.upvotes for select using (true);

create policy "Users can upvote"
  on public.upvotes for insert with check (auth.uid() = user_id);

create policy "Users can remove own upvote"
  on public.upvotes for delete using (auth.uid() = user_id);

-- Claims
create policy "Claims are viewable by everyone"
  on public.claims for select using (true);

create policy "Streamers can claim requests"
  on public.claims for insert
  with check (
    auth.uid() = streamer_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('streamer', 'both')
    )
  );

-- Live sessions
create policy "Live sessions are viewable by everyone"
  on public.live_sessions for select using (true);

create policy "Streamers can create live sessions for own claims"
  on public.live_sessions for insert
  with check (
    exists (
      select 1 from public.claims
      where id = claim_id and streamer_id = auth.uid()
    )
  );

-- Notifications
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

-- Push subscriptions
create policy "Users can view own push subscriptions"
  on public.push_subscriptions for select using (auth.uid() = user_id);

create policy "Users can create push subscriptions"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

-- Expose tables via PostgREST (required on newer Supabase projects)
grant usage on schema public to anon, authenticated, service_role;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select on public.streamer_profiles to anon, authenticated;
grant insert, update on public.streamer_profiles to authenticated;

grant select on public.requests to anon, authenticated;
grant insert, update on public.requests to authenticated;

grant select on public.upvotes to anon, authenticated;
grant insert, delete on public.upvotes to authenticated;

grant select on public.claims to anon, authenticated;
grant insert on public.claims to authenticated;

grant select on public.live_sessions to anon, authenticated;
grant insert on public.live_sessions to authenticated;

grant select on public.notifications to authenticated;
grant select, insert, delete on public.push_subscriptions to authenticated;
