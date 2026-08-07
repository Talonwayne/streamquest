import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTwitchUserByLogin, parseTwitchLogin, isTwitchConfigured } from "@/lib/twitch";
import { parseYouTubeUrl, isYouTubeConfigured } from "@/lib/youtube";

/**
 * Link Twitch/YouTube identity on streamer profile from a channel URL.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    platform?: "twitch" | "youtube";
    channelUrl?: string;
  };

  if (!body.platform || !body.channelUrl?.trim()) {
    return NextResponse.json(
      { error: "platform and channelUrl required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("streamer_profiles")
    .select("platform_links, bio")
    .eq("user_id", user.id)
    .maybeSingle();

  const existingLinks = (existing?.platform_links ?? {}) as Record<string, string>;

  if (body.platform === "twitch") {
    if (!isTwitchConfigured()) {
      return NextResponse.json(
        { error: "Twitch API is not configured on this server" },
        { status: 503 }
      );
    }
    const login = parseTwitchLogin(body.channelUrl);
    if (!login) {
      return NextResponse.json({ error: "Invalid Twitch channel URL" }, { status: 400 });
    }
    const twitchUser = await getTwitchUserByLogin(login);
    if (!twitchUser) {
      return NextResponse.json({ error: "Twitch user not found" }, { status: 404 });
    }

    const links = {
      ...existingLinks,
      twitch: `https://twitch.tv/${twitchUser.login}`,
    };

    const { error } = await supabase.from("streamer_profiles").upsert(
      {
        user_id: user.id,
        twitch_user_id: twitchUser.id,
        platform_links: links,
        bio: existing?.bio ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase
      .from("profiles")
      .update({
        avatar_url: twitchUser.profileImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .is("avatar_url", null);

    return NextResponse.json({
      ok: true,
      platform: "twitch",
      twitchUserId: twitchUser.id,
      login: twitchUser.login,
      displayName: twitchUser.displayName,
    });
  }

  if (body.platform === "youtube") {
    if (!isYouTubeConfigured()) {
      return NextResponse.json(
        { error: "YouTube API is not configured on this server" },
        { status: 503 }
      );
    }
    const parsed = parseYouTubeUrl(body.channelUrl);
    const channelId = parsed?.channelId;
    if (!channelId) {
      return NextResponse.json(
        {
          error:
            "Use a youtube.com/channel/UC… URL for now (handles need OAuth or extra lookup).",
        },
        { status: 400 }
      );
    }

    const links = {
      ...existingLinks,
      youtube: `https://youtube.com/channel/${channelId}`,
    };

    const { error } = await supabase.from("streamer_profiles").upsert(
      {
        user_id: user.id,
        youtube_channel_id: channelId,
        platform_links: links,
        bio: existing?.bio ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      platform: "youtube",
      youtubeChannelId: channelId,
    });
  }

  return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
}
