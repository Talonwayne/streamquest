# Streamquest

Request-driven stream discovery. Viewers post and upvote stream ideas; anyone can fulfill by posting an allowlisted live URL; everyone who cared gets notified. Launch niches: **investigative journalism** and **travel**.

**Live:** https://streamquest-green.vercel.app

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Postgres, Auth, RLS)
- **Resend** (transactional email + weekly digest)
- **Web Push** (browser notifications)
- **Twitch Helix / EventSub** + **YouTube Data API** (optional live verification)
- **Leaflet + Nominatim** (map + geocoding)

## Local development

### 1. Clone and install

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in `supabase/migrations/` (or `npm run db:migrate` with `DATABASE_URL`)
3. Copy `.env.example` to `.env.local` and fill in keys

Required:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (notifications, cron) |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` |

Optional: Resend, VAPID, Twitch, YouTube, `CRON_SECRET`, `DIGEST_TO_EMAIL` — see `.env.example`.

### 3. Seed test data

```bash
npm run seed -- --confirm
```

See [SETUP.md](./SETUP.md) for test accounts.

### 4. Run

```bash
npm run dev
```

## Core flows

1. **Viewer** — Sign up → post/upvote/follow/comment on a request → get notified on go-live
2. **Fulfiller** — Paste Twitch/YouTube/Kick/… link on a request → optional map pin → end stream when done
3. **Discovery** — `/requests` search, `/trending`, `/live`, `/map`, niche pages under `/explore/*`

## Deploy

See [DEPLOY.md](./DEPLOY.md). Apply migration `007_engagement_search_platforms.sql` in production.

GTM / outreach checklist: [docs/GTM.md](./docs/GTM.md).

## License

Private — all rights reserved.
