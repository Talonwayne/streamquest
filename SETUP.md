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

## 5. Verify

```bash
npm run dev
npm run test:features
```

## 6. Deploy to production

See **[DEPLOY.md](./DEPLOY.md)** for the full Vercel + Supabase production guide (env vars, auth redirect URLs, migrations, optional Resend/VAPID).
