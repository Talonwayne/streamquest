# Deploy Streamquest (basic production)

**Stack:** Vercel (Next.js app + API routes) + Supabase (already linked).  
**Time:** ~15 minutes. **Cost:** Vercel Hobby + Supabase Free tier.

---

## 1. Push to GitHub

From the project root:

```bash
git remote -v   # confirm origin points at your repo
git push -u origin main
```

Repo: [github.com/Talonwayne/streamquest](https://github.com/Talonwayne/streamquest)

If you haven't connected a remote yet:

```bash
git remote add origin https://github.com/Talonwayne/streamquest.git
git push -u origin main
```

---

## 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. **Import** `Talonwayne/streamquest`.
3. Framework preset should auto-detect **Next.js** — leave build settings as default:
   - Build command: `npm run build`
   - Output: Next.js default
4. **Do not deploy yet** — add environment variables first (step 3).

After the first deploy, note your production URL (e.g. `https://streamquest.vercel.app`).

---

## 3. Environment variables (Vercel dashboard)

**Project → Settings → Environment Variables**

Add these for **Production** (and Preview if you want preview deploys to work):

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase → Settings → API → `anon` / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase → Settings → API → `service_role` (secret) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your Vercel URL, e.g. `https://streamquest.vercel.app` (no trailing slash) |

**Optional — email notifications (Resend):**

| Variable | Notes |
|----------|-------|
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Streamquest <notifications@yourdomain.com>` |

Without Resend, go-live emails are skipped; the app still works.

**Optional — browser push notifications:**

Generate keys once:

```bash
npx web-push generate-vapid-keys
```

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public key (client subscribes to push) |
| `VAPID_PUBLIC_KEY` | Same public key (server sends push) |
| `VAPID_PRIVATE_KEY` | Private key |
| `VAPID_SUBJECT` | e.g. `mailto:you@example.com` |

> The client reads `NEXT_PUBLIC_VAPID_PUBLIC_KEY`; the server reads `VAPID_PUBLIC_KEY`. Set both to the same public key value.

Redeploy after changing env vars: **Deployments → … → Redeploy**.

---

## 4. Supabase Auth URLs

In [Supabase Dashboard](https://supabase.com/dashboard/project/cvserjeckynlshuntzpk/auth/url-configuration):

1. **Site URL** → your Vercel production URL (e.g. `https://streamquest.vercel.app`).
2. **Redirect URLs** — add:
   - `https://streamquest.vercel.app/auth/callback`
   - `https://*.vercel.app/auth/callback` (optional, for preview deploys)

Also confirm **Authentication → Providers → Email** is enabled.

Auth flow: login/signup redirects to `/auth/callback` on your Vercel domain, which exchanges the Supabase code for a session.

---

## 5. Database migrations

If you already linked Supabase to GitHub (see [SETUP.md](./SETUP.md) §4), migrations in `supabase/migrations/` deploy automatically on push to `main`.

**Verify:**

- Supabase → **Database → Migrations** — latest migration applied.
- Or locally (with `DATABASE_URL` in `.env.local`):

```bash
npm run db:migrate
```

**Manual fallback** (SQL Editor): run `supabase/migrations/001_initial_schema.sql`.

---

## 6. Deploy and smoke test

1. Trigger deploy (push to `main` or **Redeploy** in Vercel).
2. Open your Vercel URL.
3. Quick checks:
   - Sign up / sign in
   - Post a request
   - Upvote (logged in)
   - Streamer: claim request → go live (if you have a streamer profile)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth redirect loop or "invalid redirect" | Site URL + `/auth/callback` in Supabase redirect URLs must match Vercel URL exactly |
| "NEXT_PUBLIC_SUPABASE_URL is not configured" | Env vars missing or deploy happened before vars were set — redeploy |
| Notifications not sending | Add Resend keys; for push, set all four VAPID vars |
| RLS / permission errors | Confirm `SUPABASE_SERVICE_ROLE_KEY` is set on Vercel (used for notification fan-out) |

---

## What you don't need

- **No `vercel.json`** — Next.js 16 App Router deploys as-is on Vercel.
- **No separate API host** — `app/api/*` routes run on the same Vercel deployment.
- **No Docker / VPS** for this basic setup.

For local dev and Supabase CLI setup, see [SETUP.md](./SETUP.md).
