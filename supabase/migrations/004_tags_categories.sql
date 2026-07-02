-- Tags and categories on requests (PR 3: discoverability + duplicate prep)

do $$ begin
  create type request_category as enum (
    'investigative_journalism',
    'game_challenge',
    'commentary',
    'gaming',
    'irl',
    'sports',
    'learning',
    'travel',
    'food',
    'music',
    'challenges',
    'events',
    'tech',
    'fitness',
    'creative',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.requests
  add column if not exists category request_category not null default 'other',
  add column if not exists tags text[] not null default '{}';

create index if not exists requests_category_status_idx
  on public.requests (category, status);

create index if not exists requests_tags_gin_idx
  on public.requests using gin (tags);

-- Normalized tag catalog for future autocomplete (populated later)
create table if not exists public.tag_catalog (
  name text primary key check (char_length(name) between 1 and 50),
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.tag_catalog enable row level security;

drop policy if exists "Tag catalog is viewable by everyone" on public.tag_catalog;

create policy "Tag catalog is viewable by everyone"
  on public.tag_catalog for select using (true);

grant select on public.tag_catalog to anon, authenticated;
