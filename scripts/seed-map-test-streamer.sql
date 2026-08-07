-- Idempotent dummy streamer for map/location testing
-- Email: maptest@streamquest.test
-- Password: StreamquestDev123!

create extension if not exists pgcrypto;

do $$
declare
  uid uuid := 'a0000000-0000-4000-8000-000000000901'::uuid;
  pwd text := crypt('StreamquestDev123!', gen_salt('bf'));
begin
  if not exists (select 1 from auth.users where id = uid) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      'maptest@streamquest.test',
      pwd,
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"display_name":"MapTestStreamer"}'::jsonb,
      now(),
      now()
    );
  else
    update auth.users
    set
      encrypted_password = pwd,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      raw_user_meta_data =
        coalesce(raw_user_meta_data, '{}'::jsonb)
        || '{"display_name":"MapTestStreamer"}'::jsonb,
      updated_at = now()
    where id = uid;
  end if;

  if not exists (
    select 1 from auth.identities where user_id = uid and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      uid,
      uid,
      jsonb_build_object(
        'sub', uid::text,
        'email', 'maptest@streamquest.test',
        'email_verified', true
      ),
      'email',
      uid::text,
      now(),
      now(),
      now()
    );
  end if;
end $$;

insert into public.profiles (id, display_name, role)
values (
  'a0000000-0000-4000-8000-000000000901',
  'MapTestStreamer',
  'streamer'
)
on conflict (id) do update set
  display_name = excluded.display_name,
  role = excluded.role;

insert into public.streamer_profiles (
  user_id,
  bio,
  platform_links,
  latitude,
  longitude,
  location_label,
  location_updated_at
)
values (
  'a0000000-0000-4000-8000-000000000901',
  'Dummy streamer for testing the world map home-base marker.',
  '{"twitch":"https://twitch.tv/mapteststreamer","youtube":"https://youtube.com/@MapTestStreamer"}'::jsonb,
  34.0522,
  -118.2437,
  'Los Angeles, CA',
  now()
)
on conflict (user_id) do update set
  bio = excluded.bio,
  platform_links = excluded.platform_links,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  location_label = excluded.location_label,
  location_updated_at = excluded.location_updated_at;

select
  p.id,
  p.display_name,
  p.role,
  sp.latitude,
  sp.longitude,
  sp.location_label
from public.profiles p
join public.streamer_profiles sp on sp.user_id = p.id
where p.id = 'a0000000-0000-4000-8000-000000000901';
