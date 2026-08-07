# Streamquest roadmap (current)

Aligned with the four-wedge plan: demand board, map/IRL, journalism+travel niches, platform enrichment.

**Live:** https://streamquest-green.vercel.app  
**Philosophy:** Request board first — discovery and fulfillment around viewer demand, not creator clout.

## Shipped

- Multi-fulfill go-live (`open` → `live_now` → `completed`), any authenticated user
- Categories, tags, similar-request hints, trending score
- Email + web push notifications (author + upvoters + followers)
- World map (live, request pins, home bases) + Nominatim geocode
- End stream API/UI, `/live` page, request search, mobile nav
- Comments, request follows, report stub
- Niche landings (`/explore/investigative-journalism`, `/explore/travel`) + templates
- Twitch Helix live verification + EventSub offline auto-end (when configured)
- YouTube live verification (when `YOUTUBE_API_KEY` set)
- Platform channel link on profile, embeddable badge
- Sitemap/robots, maintenance + weekly digest crons
- Completed request 12h browse decay; cron trending refresh

## Next / later

- Full Twitch/YouTube OAuth (vs URL link)
- Admin moderation queue UI for reports
- Discord bot / deeper streamer intake
- Onstream rebrand + custom domain
- Payments — still explicitly out of scope

## Explicit non-goals

Payments, built-in streaming, chat hosting, auto-importing all live Twitch into a directory.
