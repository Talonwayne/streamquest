# Streamquest Setup Checklist

## 1. GitHub (required for repo + Supabase integration)

```bash
gh auth login
gh repo create streamquest --public --source=. --remote=origin --push
```

If the repo already exists under your account:

```bash
git remote add origin https://github.com/YOUR_USERNAME/streamquest.git
git push -u origin main
```

## 2. Supabase CLI (required for link + db push)

```bash
supabase login
supabase link --project-ref cvserjeckynlshuntzpk
supabase db push
```

Or apply migration manually:

```bash
# Add DATABASE_URL to .env.local (Dashboard → Settings → Database → URI)
npm run db:migrate
```

## 3. Environment variables (`.env.local`)

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard → Settings → API Keys |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API Keys (secret) |
| `DATABASE_URL` | Dashboard → Settings → Database → Connection string |
| `RESEND_API_KEY` | resend.com (optional, for email) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` (optional) |

## 4. Connect Supabase ↔ GitHub (Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/cvserjeckynlshuntzpk/settings/integrations)
2. Go to **Project Settings → Integrations → GitHub**
3. Click **Authorize GitHub** and install the Supabase GitHub App
4. Select repository: `YOUR_USERNAME/streamquest`
5. Enable **Automatic migrations** (deploys `supabase/migrations/` on push to `main`)

Alternative path: **Database → Migrations → Connect GitHub**

## 5. Seed test data (local / staging only)

Populate test users, requests, upvotes, and live sessions:

```bash
# Remote Supabase project — requires explicit confirmation
npm run seed -- --confirm

# Re-apply after changes
npm run seed -- --confirm --force
```

Local Supabase CLI (runs `supabase/seed.sql` on `supabase db reset`):

```bash
supabase db reset
```

**Test accounts** (dev/staging only — never use in production):

| Email | Role | Password |
|-------|------|----------|
| `streamer1@streamquest.test` | Streamer (PixelPatriot) | `StreamquestDev123!` |
| `streamer2@streamquest.test` | Streamer (GameGlitchQueen) | same |
| `streamer3@streamquest.test` | Streamer + viewer (KickCommentaryKing) | same |
| `streamer4@streamquest.test` | Streamer (IRLExplorer) | same |
| `streamer5@streamquest.test` | Streamer (TechTalkTess) | same |
| `viewer1@streamquest.test` | Viewer (CuriousCat) | same |
| `viewer2@streamquest.test` | Viewer (HypeViewer) | same |
| `viewer3@streamquest.test` | Viewer (QuietLurker) | same |

Override the password with `SEED_TEST_PASSWORD` in `.env.local`. The seed script refuses to run against production (`NODE_ENV=production`) or remote projects without `--confirm`.

Sample seeded content: 20 requests across categories (investigative journalism, game challenge, commentary, gaming, IRL, etc.), varied upvotes, 2 live-now sessions with allowlisted Twitch/YouTube URLs, and 2 completed sessions.

## 6. Verify

```bash
npm run dev
npm run test:features
```

## 7. Deploy to production

See **[DEPLOY.md](./DEPLOY.md)** for the full Vercel + Supabase production guide (env vars, auth redirect URLs, migrations, optional Resend/VAPID).
