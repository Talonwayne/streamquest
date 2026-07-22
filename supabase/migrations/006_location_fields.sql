-- Location fields for streamer profiles (default home base) and live sessions (who's live where)

-- 1. Streamer profile default location
alter table public.streamer_profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_label text,
  add column if not exists location_updated_at timestamptz;

alter table public.streamer_profiles
  drop constraint if exists streamer_profiles_latitude_range;
alter table public.streamer_profiles
  add constraint streamer_profiles_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.streamer_profiles
  drop constraint if exists streamer_profiles_longitude_range;
alter table public.streamer_profiles
  add constraint streamer_profiles_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.streamer_profiles
  drop constraint if exists streamer_profiles_lat_lng_pair;
alter table public.streamer_profiles
  add constraint streamer_profiles_lat_lng_pair
  check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  );

-- 2. Live session location (optional, set when going live)
alter table public.live_sessions
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_label text;

alter table public.live_sessions
  drop constraint if exists live_sessions_latitude_range;
alter table public.live_sessions
  add constraint live_sessions_latitude_range
  check (latitude is null or (latitude >= -90 and latitude <= 90));

alter table public.live_sessions
  drop constraint if exists live_sessions_longitude_range;
alter table public.live_sessions
  add constraint live_sessions_longitude_range
  check (longitude is null or (longitude >= -180 and longitude <= 180));

alter table public.live_sessions
  drop constraint if exists live_sessions_lat_lng_pair;
alter table public.live_sessions
  add constraint live_sessions_lat_lng_pair
  check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  );

-- 3. Indexes for map queries
create index if not exists streamer_profiles_location_idx
  on public.streamer_profiles (latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists live_sessions_active_location_idx
  on public.live_sessions (latitude, longitude)
  where ended_at is null and latitude is not null and longitude is not null;

-- RLS already allows:
-- - public SELECT on streamer_profiles and live_sessions
-- - users UPDATE own streamer_profiles
-- - streamers INSERT/UPDATE own live_sessions
-- Location columns inherit those policies (public read when shared; own write only).
