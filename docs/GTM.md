# Streamquest GTM ops pack

Pre-marketing checklist for the investigative journalism + travel launch wedges.

## Before any outreach

1. Apply migration `007_engagement_search_platforms.sql` (`npm run db:migrate`).
2. Set production env: Resend, VAPID, `NEXT_PUBLIC_APP_URL`, optional Twitch/YouTube keys.
3. Confirm `/live`, `/map`, end-stream, and go-live work on production.
4. Seed niche density: `npm run seed -- --confirm` (includes journalism + travel asks with map pins).

## Metrics gate (do not scale ads until)

- ≥30 open journalism + travel requests with ≥3 upvotes each
- ≥10 verified fulfillments / week
- Median open → first live &lt; 72h in niches
- No zombie map pins older than ~1h (EventSub or cron maintenance)
- Go-live email/push open rate &gt; 20% when configured

## Streamer outreach (manual)

Target micro-creators (&lt;5k followers) who already do journalism explainers or travel IRL.

Message template:

> We’re building Streamquest — viewers post what they want streamed (investigations / travel), you fulfill with your Twitch/YouTube link, and everyone who cared gets notified. There’s already open demand here: [niche explore URL]. Want an early streamer badge + a request ready for you this week?

Keep a simple spreadsheet: name, platform, URL, niche, contacted, fulfilled.

## Viewer demand

1. Share individual request OG links (each `/requests/[id]` has metadata).
2. Weekly digest cron (`/api/cron/digest`) → set `DIGEST_TO_EMAIL` (expand to a list later).
3. Niche landings: `/explore/investigative-journalism`, `/explore/travel`.

## Streamer invite loop

- Profile page shows an embeddable badge (`/api/badge`).
- Ask streamers to put it in panels / Discord with a link to `/requests` or a specific request.

## Public APIs to configure

| Var | Purpose |
|-----|---------|
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Live verify + channel link |
| `TWITCH_EVENTSUB_SECRET` | Auto end-stream on `stream.offline` |
| `YOUTUBE_API_KEY` | Live verify YouTube URLs |
| `CRON_SECRET` | Protect `/api/cron/*` on Vercel |
| `DIGEST_TO_EMAIL` | Weekly niche digest recipient |

## Do not

- Auto-import random live Twitch directories into the product
- Run broad ads into an empty or stale live board
- Promise payments / hosting streams yet
