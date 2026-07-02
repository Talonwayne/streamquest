-- Streamquest dev/staging seed (local: supabase db reset | remote: npm run seed -- --confirm)
-- Password for all test accounts: StreamquestDev123! (override via SEED_TEST_PASSWORD in seed.mjs)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Auth users (fixed UUIDs for idempotent re-seed)
-- ---------------------------------------------------------------------------

do $$
declare
  pwd text := crypt('StreamquestDev123!', gen_salt('bf'));
  u record;
begin
  for u in
    select *
    from (
      values
        ('a0000000-0000-4000-8000-000000000001'::uuid, 'streamer1@streamquest.test', 'PixelPatriot'),
        ('a0000000-0000-4000-8000-000000000002'::uuid, 'streamer2@streamquest.test', 'GameGlitchQueen'),
        ('a0000000-0000-4000-8000-000000000003'::uuid, 'streamer3@streamquest.test', 'KickCommentaryKing'),
        ('a0000000-0000-4000-8000-000000000004'::uuid, 'streamer4@streamquest.test', 'IRLExplorer'),
        ('a0000000-0000-4000-8000-000000000005'::uuid, 'streamer5@streamquest.test', 'TechTalkTess'),
        ('a0000000-0000-4000-8000-000000000101'::uuid, 'viewer1@streamquest.test', 'CuriousCat'),
        ('a0000000-0000-4000-8000-000000000102'::uuid, 'viewer2@streamquest.test', 'HypeViewer'),
        ('a0000000-0000-4000-8000-000000000103'::uuid, 'viewer3@streamquest.test', 'QuietLurker')
    ) as t(id, email, display_name)
  loop
    if not exists (select 1 from auth.users where id = u.id) then
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
        u.id,
        'authenticated',
        'authenticated',
        u.email,
        pwd,
        now(),
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('display_name', u.display_name),
        now(),
        now()
      );

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
        u.id,
        u.id,
        jsonb_build_object('sub', u.id::text, 'email', u.email),
        'email',
        u.id::text,
        now(),
        now(),
        now()
      );
    end if;
  end loop;
end $$;

-- Profiles (trigger may have created rows; upsert roles + names)
insert into public.profiles (id, display_name, role)
values
  ('a0000000-0000-4000-8000-000000000001', 'PixelPatriot', 'streamer'),
  ('a0000000-0000-4000-8000-000000000002', 'GameGlitchQueen', 'streamer'),
  ('a0000000-0000-4000-8000-000000000003', 'KickCommentaryKing', 'both'),
  ('a0000000-0000-4000-8000-000000000004', 'IRLExplorer', 'streamer'),
  ('a0000000-0000-4000-8000-000000000005', 'TechTalkTess', 'streamer'),
  ('a0000000-0000-4000-8000-000000000101', 'CuriousCat', 'viewer'),
  ('a0000000-0000-4000-8000-000000000102', 'HypeViewer', 'viewer'),
  ('a0000000-0000-4000-8000-000000000103', 'QuietLurker', 'viewer')
on conflict (id) do update set
  display_name = excluded.display_name,
  role = excluded.role;

insert into public.streamer_profiles (user_id, bio, platform_links)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    'Investigative streams and deep dives into local stories.',
    '{"twitch":"https://twitch.tv/pixelpatriot","youtube":"https://youtube.com/@PixelPatriot"}'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'Challenge runs, speedruns, and chaotic gaming energy.',
    '{"youtube":"https://youtube.com/@GameGlitchQueen","kick":"https://kick.com/gameglitchqueen"}'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'Live commentary, react streams, and community watch parties.',
    '{"kick":"https://kick.com/kickcommentaryking","twitch":"https://twitch.tv/kickcommentaryking"}'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'Walking tours, food crawls, and real-world adventures.',
    '{"twitch":"https://twitch.tv/irl_explorer","instagram":"https://instagram.com/irl_explorer"}'::jsonb
  ),
  (
    'a0000000-0000-4000-8000-000000000005',
    'Tech tutorials, homelab builds, and live coding.',
    '{"youtube":"https://youtube.com/@TechTalkTess","twitch":"https://twitch.tv/techtalktess"}'::jsonb
  )
on conflict (user_id) do update set
  bio = excluded.bio,
  platform_links = excluded.platform_links;

-- Requests (insert as open; live session triggers adjust status afterward)
insert into public.requests (id, author_id, title, description, category, tags, status)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000101', 'Investigate local water quality reports', 'Stream a deep dive into recent municipal water testing data. Interview residents, compare EPA standards, and show how to read public records.', 'investigative_journalism', array['investigation','local','environment'], 'open'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000102', 'Deep dive into city council spending', 'Walk through the latest city budget PDFs live. Highlight unusual line items and explain where tax dollars actually go.', 'investigative_journalism', array['investigation','politics','local'], 'open'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000103', 'Beat Elden Ring blindfolded', 'Take on a blindfolded boss rush challenge with chat choosing the route. No map, no HUD — just chaos and commentary.', 'game_challenge', array['challenge','soulslike','hardcore'], 'open'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000101', 'Speedrun Mario 64 120 stars', 'Attempt a sub-2-hour 120-star run with live splits and chat-triggered handicap rules every time I miss a jump.', 'game_challenge', array['speedrun','retro','challenge'], 'open'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000102', 'React to this week''s gaming news', 'Hot takes on the biggest gaming headlines of the week. Bring your spicy opinions — I''ll read the best ones on stream.', 'commentary', array['react','news','gaming'], 'open'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000103', 'Watch party: State of Play', 'Sync up for Sony''s next showcase. Live reactions, bingo cards, and immediate impressions after each trailer drop.', 'commentary', array['watchparty','sony','gaming'], 'open'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000101', 'Cozy Stardew Valley farm build', 'Design a pixel-perfect farm layout from scratch. Chat votes on crops, decor, and which villager to romance.', 'gaming', array['cozy','farming','chill'], 'open'),
  ('b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000102', 'Ranked Valorant grind to Immortal', 'Climbing the ranked ladder with viewer coaching moments. Review VODs between games and fix bad habits live.', 'gaming', array['fps','ranked','competitive'], 'open'),
  ('b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000103', 'Walking tour of downtown Austin', 'IRL stream through live music spots, food trucks, and hidden murals. Stop for chat-suggested detours along the way.', 'irl', array['walking','city','travel'], 'open'),
  ('b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000101', '24-hour diner food crawl', 'Hit every late-night diner in a 10-mile radius. Rate burgers, milkshakes, and vibes. Survive until sunrise.', 'irl', array['food','irl','challenge'], 'open'),
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000102', 'Watch Lakers game with chat', 'Sync-watch the next Lakers game with live chat reactions, stat breakdowns, and halftime hot takes.', 'sports', array['nba','watchparty','sports'], 'open'),
  ('b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000103', 'Learn Rust basics live', 'Zero-to-hero Rust tutorial for beginners. Build a CLI tool together while explaining ownership and borrowing.', 'learning', array['programming','rust','tutorial'], 'open'),
  ('b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000101', 'Virtual tour of Tokyo neighborhoods', 'Use Street View and travel docs to explore Shibuya, Shimokitazawa, and Yanaka. Share tips for first-time visitors.', 'travel', array['japan','travel','culture'], 'open'),
  ('b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000102', 'Cook the perfect ramen broth', '12-hour tonkotsu broth attempt from scratch. Show technique, troubleshoot live, and taste-test with chat.', 'food', array['cooking','japanese','food'], 'open'),
  ('b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000103', 'Live acoustic covers by request', 'Take song requests from chat and play acoustic covers live. Chill vibes, bad jokes, and occasional harmonies.', 'music', array['music','acoustic','requests'], 'open'),
  ('b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000101', 'Hot sauce tier list blind taste test', 'Blind-rank 15 hot sauces from mild to volcanic. Chat picks the order; I guess the brand without looking.', 'challenges', array['challenge','food','spicy'], 'open'),
  ('b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000102', 'E3 retrospective live discussion', 'Rewatch classic E3 moments and debate which era had the best announcements. Nostalgia overload guaranteed.', 'events', array['events','gaming','nostalgia'], 'open'),
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000103', 'Build a Raspberry Pi media server', 'Step-by-step homelab stream: install Jellyfin on a Pi 5, configure storage, and stream to every device at home.', 'tech', array['tech','diy','homelab'], 'open'),
  ('b0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000101', 'Morning yoga flow for streamers', 'Gentle 45-minute yoga routine aimed at desk and stream posture. Stretches, breathing, and wellness Q&A.', 'fitness', array['fitness','yoga','wellness'], 'open'),
  ('b0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000102', 'Digital art speedpaint commission', 'Live speedpaint of a chat-submitted character concept. Explain layers, lighting, and brush choices as we go.', 'creative', array['art','creative','commission'], 'open'),
  ('00000000-0000-4000-8000-000000000099', 'a0000000-0000-4000-8000-000000000101', '[seed] Streamquest test data marker', 'Internal marker row — do not delete. Indicates seed data was applied.', 'other', array['seed','internal'], 'open')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  tags = excluded.tags;

-- Upvotes (triggers sync upvote_count)
insert into public.upvotes (request_id, user_id)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000102'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000103'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000101'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000103'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000101'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000102'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000103'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000101'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000102'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000103'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000101'),
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000102'),
  ('b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000103'),
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000102'),
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000005'),
  ('b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000103')
on conflict (request_id, user_id) do nothing;

-- Live sessions (allowlisted URLs — see lib/stream-links.ts)
insert into public.live_sessions (id, request_id, streamer_id, stream_url, platform, started_at, ended_at)
values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'https://twitch.tv/pixelpatriot', 'twitch', now(), null),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', now(), null),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'https://youtube.com/@GameGlitchQueen', 'youtube', now() - interval '4 hours', null),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'https://twitch.tv/irl_explorer', 'twitch', now() - interval '5 hours', null)
on conflict (id) do update set
  stream_url = excluded.stream_url,
  platform = excluded.platform;

update public.live_sessions
set ended_at = now() - interval '2 hours'
where id in (
  'c0000000-0000-4000-8000-000000000003',
  'c0000000-0000-4000-8000-000000000004'
);

update public.requests set status = 'live_now'
where id in (
  'b0000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000007'
);

update public.requests set status = 'completed'
where id in (
  'b0000000-0000-4000-8000-000000000003',
  'b0000000-0000-4000-8000-000000000009'
);

-- Refresh trending for seeded requests
do $$
declare
  rid uuid;
begin
  for rid in
    select id from public.requests
    where id::text like 'b0000000-0000-4000-8000-%'
  loop
    perform public.refresh_request_trending(rid);
  end loop;
end $$;
