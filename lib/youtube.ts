/**
 * YouTube Data API helpers. Gracefully no-ops when YOUTUBE_API_KEY is missing.
 */

export interface YouTubeLiveInfo {
  videoId: string;
  channelId: string;
  title: string;
  viewerCount: number | null;
  thumbnailUrl: string;
  isLive: boolean;
}

export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

/** Parse video ID or channel handle/ID from a YouTube URL. */
export function parseYouTubeUrl(streamUrl: string): {
  videoId?: string;
  channelHandle?: string;
  channelId?: string;
} | null {
  try {
    const url = new URL(streamUrl);
    const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? { videoId: id } : null;
    }

    if (host !== "youtube.com") return null;

    const v = url.searchParams.get("v");
    if (v) return { videoId: v };

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "live" && parts[1]) return { videoId: parts[1] };
    if (parts[0] === "watch" && v) return { videoId: v };
    if (parts[0] === "channel" && parts[1]) return { channelId: parts[1] };
    if (parts[0] === "c" && parts[1]) return { channelHandle: parts[1] };
    if (parts[0] === "user" && parts[1]) return { channelHandle: parts[1] };
    if (parts[0]?.startsWith("@")) return { channelHandle: parts[0].slice(1) };
    if (parts[0] === "embed" && parts[1]) return { videoId: parts[1] };

    return null;
  } catch {
    return null;
  }
}

async function youtubeGet(
  path: string,
  params: Record<string, string>
): Promise<Response | null> {
  if (!isYouTubeConfigured()) return null;
  const url = new URL(`https://www.googleapis.com/youtube/v3${path}`);
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return fetch(url.toString(), { next: { revalidate: 0 } });
}

export async function getYouTubeLiveByUrl(
  streamUrl: string
): Promise<YouTubeLiveInfo | null> {
  const parsed = parseYouTubeUrl(streamUrl);
  if (!parsed) return null;

  let videoId = parsed.videoId;

  if (!videoId && (parsed.channelId || parsed.channelHandle)) {
    // Resolve channel → search for live broadcast (expensive; best-effort)
    const channelId = parsed.channelId;
    if (channelId) {
      const search = await youtubeGet("/search", {
        part: "snippet",
        channelId,
        eventType: "live",
        type: "video",
        maxResults: "1",
      });
      if (search?.ok) {
        const data = (await search.json()) as {
          items?: Array<{ id?: { videoId?: string } }>;
        };
        videoId = data.items?.[0]?.id?.videoId;
      }
    }
  }

  if (!videoId) return null;

  const res = await youtubeGet("/videos", {
    part: "snippet,liveStreamingDetails,statistics",
    id: videoId,
  });
  if (!res?.ok) return null;

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      snippet?: {
        title?: string;
        channelId?: string;
        liveBroadcastContent?: string;
        thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
      };
      liveStreamingDetails?: {
        concurrentViewers?: string;
        actualStartTime?: string;
        actualEndTime?: string;
      };
    }>;
  };

  const item = data.items?.[0];
  if (!item) return null;

  const isLive =
    item.snippet?.liveBroadcastContent === "live" ||
    Boolean(
      item.liveStreamingDetails?.actualStartTime &&
        !item.liveStreamingDetails?.actualEndTime
    );

  return {
    videoId: item.id,
    channelId: item.snippet?.channelId ?? "",
    title: item.snippet?.title ?? "",
    viewerCount: item.liveStreamingDetails?.concurrentViewers
      ? Number(item.liveStreamingDetails.concurrentViewers)
      : null,
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.medium?.url ??
      "",
    isLive,
  };
}
