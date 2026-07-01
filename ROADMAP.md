# Onstream Roadmap (from Streamquest)

Gap analysis and build order for aligning the deployed app with the Onstream product spec.

**Live:** https://streamquest-green.vercel.app  
**Stack:** Next.js 16 + Supabase  
**Philosophy:** Request board first — discovery and fulfillment around viewer demand, not creator clout.

---

## Current baseline (what ships today)

| Area | State |
|------|--------|
| Auth | Supabase email/OAuth; profiles with `viewer` / `streamer` / `both` roles |
| Requests | Create, browse, detail; title + description only |
| Upvotes | One per user per request; count synced via trigger |
| Fulfillment | **One claim per request** (`claims.request_id` unique); streamer role required |
| Go live | Claim owner pastes stream URL → status `fulfilled`; notifies author + upvoters |
| Statuses | `open` → `claimed` → `fulfilled` |
| Trending | Client-side `upvote_count / (ageHours + 2)^1.5` — upvotes only |
| Notifications | Email (Resend) + web push on go-live |
| Pages | Home, `/requests`, `/requests/new`, `/requests/[id]`, `/streamers/dashboard`, profile |
| Missing | Comments, categories, search, follows, Live Now page, reporting, completed decay |

---

## Gap analysis

| Spec feature | Current state | Gap | Sprint priority |
|--------------|---------------|-----|-----------------|
| **Rebrand: Onstream** | Streamquest everywhere (UI, metadata, emails) | Copy + assets + domain | P1 (parallel, low risk) |
| **Statuses: Open → Live Now → Completed** | `open` / `claimed` / `fulfilled`; claim is separate step | Rename + collapse claim into go-live flow | **P0** |
| **Any user can post stream link** | Streamer role + claim required | Remove role gate; direct go-live on request | **P0** |
| **Multiple fulfillers per request** | `claims.request_id` UNIQUE | Allow N live sessions per request | **P0** |
| **Categories** | None | `category` on requests (enum or FK) | **P0** |
| **Search / browse filters** | All requests, sort by basic trending | Full-text search + category + status filters | **P0** |
| **Comments** | None | `comments` table + UI on detail page | **P0** |
| **Follow requests** | None (notify only on upvote/go-live) | `request_follows` + notify followers on live | **P1** |
| **Live Now page** | No dedicated view; live shown on detail only | `/live` — active sessions across requests | **P1** |
| **Trending (velocity + decay)** | Upvotes-only decay formula | Include comments, follows, live events; DB-backed score | **P1** |
| **Completed decay (12h)** | Fulfilled requests stay forever | `ended_at` + filter/hide after 12h | **P1** |
| **Guest browse, login for actions** | ✅ Already works (RLS public read) | Minor: gate create/upvote UI with login prompts | P2 (polish) |
| **Basic reporting / moderation** | None | `reports` table + admin review queue | **P1** |
| **For Streamers page** | `/streamers/dashboard` (role-gated) | Reposition as guide + open browse, not role gate | P1 |
| **Planned status** | N/A | Defer post-MVP | P3 |
| **AI moderation** | N/A | Defer post-MVP | P3 |
| **Payments, built-in stream, chat, app** | N/A | Explicitly out of scope | — |

---

## Recommended schema changes

### 1. Status enum (migration)

```sql
-- Replace request_status enum
-- open      → unchanged
-- claimed   → drop (or map to planned later)
-- fulfilled → live_now (active) + completed (ended)

CREATE TYPE request_status AS ENUM ('open', 'live_now', 'completed');
-- Planned: add 'planned' later
```

Request-level status reflects **highest activity**: `open` (no active streams), `live_now` (≥1 active session), `completed` (author or last streamer marked done, or all sessions ended).

### 2. Multi-fulfillment (replace claim-centric model)

**Option A (recommended):** Deprecate `claims` as the fulfillment gate.

```sql
CREATE TABLE live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  streamer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stream_url text NOT NULL,
  platform stream_platform NOT NULL DEFAULT 'other',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  -- optional: completed_at for 12h decay window
  UNIQUE (request_id, streamer_id) -- one active fulfillment per user per request
);

-- Remove UNIQUE on claims.request_id; migrate data; drop claims when safe
```

### 3. Categories

```sql
CREATE TYPE request_category AS ENUM (
  'gaming', 'irl', 'sports', 'music', 'creative', 'education',
  'talk', 'cooking', 'fitness', 'other'
);

ALTER TABLE requests ADD COLUMN category request_category NOT NULL DEFAULT 'other';
CREATE INDEX requests_category_status_idx ON requests (category, status);
```

### 4. Comments

```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_request_created_idx ON comments (request_id, created_at);
```

### 5. Follows

```sql
CREATE TABLE request_follows (
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);
```

### 6. Trending score (materialized)

```sql
ALTER TABLE requests ADD COLUMN trending_score double precision NOT NULL DEFAULT 0;
-- Update via trigger on upvotes/comments/follows/live_sessions or pg_cron every 5–15 min
-- Formula sketch: weighted sum of events in last 24–48h with exponential decay
```

### 7. Reporting

```sql
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  comment_id uuid REFERENCES comments(id),
  reason text NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 8. Notifications

Extend fan-out: `author + upvoters + followers` on new `live_session`. Add `mark completed` notification optional (lower priority).

### 9. Role simplification

Keep `profiles.role` for now (streamer profile/bio) but **stop gating** go-live on role. Long-term: optional `streamer_profiles` for anyone who fills bio/links.

---

## Phased roadmap

### Phase 1 — MVP alignment (next 2–3 sprints)

1. Schema: multi-fulfillment + status rename + categories column
2. Remove streamer-role gate; "Go live" on any open/live request
3. Categories on create + filter chips on browse
4. Search (Postgres `ilike` or `tsvector` on title/description)
5. Comments on request detail
6. Basic report button (stores report, no admin UI yet)
7. Rebrand copy pass (Onstream) — can ship in parallel

### Phase 2 — Discovery & retention

1. Follow requests + follower notifications
2. `/live` page (active `live_sessions` where `ended_at IS NULL`)
3. Trending v2 (DB score with velocity decay)
4. Mark completed + 12-hour visibility decay for completed streams
5. Reposition "For Streamers" as onboarding/guide (not role wall)

### Phase 3 — Scale & trust

1. `planned` status + scheduling hints
2. Admin moderation queue for reports
3. AI duplicate detection / spam (embeddings or fuzzy title match)
4. Domain migration (`onstream.app` or similar), repo rename optional

---

## Product decisions (recommendations)

| Question | Recommendation |
|----------|----------------|
| Keep "claim" step? | **No.** Spec: post stream link directly. Claim adds friction and blocks multi-fulfillment. |
| When does request become Live Now? | On first `live_session` insert. Stays `live_now` while any session has `ended_at IS NULL`. |
| When Completed? | Streamer clicks "End stream" → sets `ended_at`. Request → `completed` when no active sessions (or author marks done). |
| Multiple streams same request? | **Yes.** Each user one active session per request; list all on detail page. |
| Who gets notified? | Author + upvoters + followers (dedupe). Streamer excluded. |
| Upvote after live? | Allow on `open` and `live_now`; optional lock on `completed`. |
| Streamer role? | Soft preference for profile richness only; not a permission gate. |
| Trending on home? | Top N by `trending_score`, not raw upvotes. |
| Guest experience? | Browse all; CTA to sign in for upvote/comment/follow/go-live. |

---

## Next 5 PRs (build order)

| # | PR | Scope | Why first |
|---|-----|-------|-----------|
| **1** | `feat(schema): multi-fulfillment and status model` | Migration: `live_sessions.request_id`, drop claim uniqueness, status enum `open/live_now/completed`, data migration | Unblocks everything else in spec |
| **2** | `feat: go-live without streamer role` | API + UI: any authed user adds stream link; remove claim flow; update triggers | Core spec behavior |
| **3** | `feat: categories and browse filters` | Category enum, create form select, filter chips, `?category=` query | MVP discoverability |
| **4** | `feat: comments on requests` | `comments` table, RLS, API, detail UI thread | MVP engagement |
| **5** | `feat: search and Live Now page` | `ilike`/FTS search on browse; `/live` route for active sessions | MVP pages from spec |

**Parallel (low conflict):** `chore: rebrand Streamquest → Onstream` (metadata, header, emails, landing copy).

**Immediately after PR 5:** Follow requests + trending v2 + report moderation UI.

---

## Rebrand checklist (Onstream)

- [ ] `app/layout.tsx` metadata + footer
- [ ] `components/site-header.tsx` logo text
- [ ] Landing page hero copy (less "claim", more "go live")
- [ ] `lib/notifications.ts` email from/name and body
- [ ] `README.md`, `DEPLOY.md`, env examples
- [ ] Vercel project name / `NEXT_PUBLIC_APP_URL` / custom domain
- [ ] Supabase email templates (Site URL)
- [ ] GitHub repo rename (optional; redirects work)
- [ ] Terminology: Claim → Go live / Fulfill; Fulfilled → Completed; add Live Now badge

---

## Files most affected by Phase 1

- `supabase/migrations/002_onstream_mvp.sql` (new)
- `types/database.ts`
- `app/api/go-live/route.ts`, `app/api/claims/route.ts` (deprecate claims)
- `app/requests/[id]/page.tsx`, `components/go-live-form.tsx`, `components/claim-button.tsx`
- `app/requests/page.tsx`, `components/new-request-form.tsx`
- `app/streamers/dashboard/page.tsx` → evolve to `/for-streamers`
- `lib/utils.ts` (`trendingScore` → DB field later)
