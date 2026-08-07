/**
 * Twitch Helix helpers. Gracefully no-ops when credentials are missing.
 */

export interface TwitchLiveInfo {
  userId: string;
  login: string;
  displayName: string;
  title: string;
  gameName: string;
  viewerCount: number;
  thumbnailUrl: string;
  isLive: boolean;
}

let cachedAppToken: { token: string; expiresAt: number } | null = null;

function twitchConfigured(): boolean {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

export function isTwitchConfigured(): boolean {
  return twitchConfigured();
}

async function getAppAccessToken(): Promise<string | null> {
  if (!twitchConfigured()) return null;

  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60_000) {
    return cachedAppToken.token;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    console.warn("Twitch app token failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedAppToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function helixGet(
  path: string,
  params: Record<string, string>
): Promise<Response | null> {
  const token = await getAppAccessToken();
  if (!token) return null;

  const url = new URL(`https://api.twitch.tv/helix${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  return fetch(url.toString(), {
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });
}

/** Extract Twitch login from a channel URL. */
export function parseTwitchLogin(streamUrl: string): string | null {
  try {
    const url = new URL(streamUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "twitch.tv") return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    const skip = new Set(["directory", "videos", "clips", "settings", "inventory", "subscriptions", "wallet", "drops", "prime"]);
    if (skip.has(parts[0].toLowerCase())) return null;
    return parts[0].toLowerCase();
  } catch {
    return null;
  }
}

export async function getTwitchUserByLogin(
  login: string
): Promise<{ id: string; login: string; displayName: string; profileImageUrl: string } | null> {
  const res = await helixGet("/users", { login });
  if (!res?.ok) return null;
  const data = (await res.json()) as {
    data: Array<{
      id: string;
      login: string;
      display_name: string;
      profile_image_url: string;
    }>;
  };
  const user = data.data?.[0];
  if (!user) return null;
  return {
    id: user.id,
    login: user.login,
    displayName: user.display_name,
    profileImageUrl: user.profile_image_url,
  };
}

export async function getTwitchLiveByLogin(
  login: string
): Promise<TwitchLiveInfo | null> {
  const user = await getTwitchUserByLogin(login);
  if (!user) return null;

  const res = await helixGet("/streams", { user_id: user.id });
  if (!res?.ok) {
    return {
      userId: user.id,
      login: user.login,
      displayName: user.displayName,
      title: "",
      gameName: "",
      viewerCount: 0,
      thumbnailUrl: "",
      isLive: false,
    };
  }

  const data = (await res.json()) as {
    data: Array<{
      title: string;
      game_name: string;
      viewer_count: number;
      thumbnail_url: string;
      type: string;
    }>;
  };

  const stream = data.data?.[0];
  if (!stream || stream.type !== "live") {
    return {
      userId: user.id,
      login: user.login,
      displayName: user.displayName,
      title: "",
      gameName: "",
      viewerCount: 0,
      thumbnailUrl: "",
      isLive: false,
    };
  }

  return {
    userId: user.id,
    login: user.login,
    displayName: user.displayName,
    title: stream.title,
    gameName: stream.game_name,
    viewerCount: stream.viewer_count,
    thumbnailUrl: stream.thumbnail_url
      .replace("{width}", "440")
      .replace("{height}", "248"),
    isLive: true,
  };
}

export async function searchTwitchChannels(query: string, liveOnly = false) {
  const res = await helixGet("/search/channels", {
    query,
    first: "5",
    live_only: liveOnly ? "true" : "false",
  });
  if (!res?.ok) return [];
  const data = (await res.json()) as {
    data: Array<{
      id: string;
      broadcaster_login: string;
      display_name: string;
      is_live: boolean;
      title: string;
      thumbnail_url: string;
    }>;
  };
  return data.data ?? [];
}

/** Subscribe to stream.offline for a broadcaster (EventSub webhook). */
export async function subscribeStreamOffline(broadcasterUserId: string): Promise<boolean> {
  const token = await getAppAccessToken();
  const callback = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/twitch/eventsub`
    : null;
  const secret = process.env.TWITCH_EVENTSUB_SECRET;

  if (!token || !callback || !secret || !twitchConfigured()) return false;

  const res = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
    method: "POST",
    headers: {
      "Client-Id": process.env.TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "stream.offline",
      version: "1",
      condition: { broadcaster_user_id: broadcasterUserId },
      transport: {
        method: "webhook",
        callback,
        secret,
      },
    }),
  });

  // 409 = already subscribed — treat as success
  if (res.ok || res.status === 409) return true;
  console.warn("EventSub subscribe failed:", await res.text());
  return false;
}
