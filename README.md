# Streamquest

Request-driven stream discovery. Viewers post and upvote stream ideas; streamers claim requests and go live; everyone who cared gets notified with a link to Twitch, YouTube, Kick, or wherever.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (Postgres, Auth, RLS)
- **Resend** (transactional email)
- **Web Push** (browser notifications)

## Local development

### 1. Clone and install

```bash
npm install
```

### 2. Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (for notification fan-out) |
| `RESEND_API_KEY` | Optional — email notifications |
| `RESEND_FROM_EMAIL` | Sender address for Resend |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Optional — web push |
| `VAPID_PRIVATE_KEY` | Web push private key |
| `VAPID_SUBJECT` | e.g. `mailto:you@example.com` |
| `NEXT_PUBLIC_APP_URL` | e.g. `http://localhost:3000` |

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

### 3. Seed test data (optional)

```bash
npm run seed -- --confirm
```

See [SETUP.md](./SETUP.md#5-seed-test-data-local--staging-only) for test account credentials (`streamer1@streamquest.test` / `StreamquestDev123!`, etc.).

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Core flows

1. **Viewer** — Sign up → post a request → upvote others → get email/push when someone goes live
2. **Streamer** — Set role to Streamer on profile → browse dashboard → claim request → paste stream URL → notify all upvoters

## Deploy (production)

**Basic prod (~15 min):** Vercel + your existing Supabase project. Full step-by-step guide: **[DEPLOY.md](./DEPLOY.md)**.

Quick outline:

1. Push to [github.com/Talonwayne/streamquest](https://github.com/Talonwayne/streamquest)
2. Import repo in [Vercel](https://vercel.com) and set env vars (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`)
3. Add your Vercel URL to Supabase **Site URL** and **Redirect URLs** (`/auth/callback`)
4. Migrations apply via linked Supabase ↔ GitHub (or `npm run db:migrate`)

Optional: Resend (email) and VAPID keys (push) — see DEPLOY.md.

## Project structure

```
app/
  requests/          # Request feed, detail, create
  streamers/         # Dashboard, public profiles
  auth/              # Login, callback, signout
  api/               # REST endpoints
components/          # UI and feature components
lib/                 # Supabase clients, auth, notifications
supabase/migrations/ # Database schema + RLS
types/               # TypeScript types
```

## PR roadmap (implemented)

1. Foundation — Next.js + Supabase scaffold
2. Auth and profiles
3. Request forum and upvotes
4. Streamer dashboard and claims
5. Go live and notifications
6. Landing page and polish

## License

Private — all rights reserved.
