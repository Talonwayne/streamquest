import type { StreamPlatform } from "@/types/database";
import {
  getTwitchLiveByLogin,
  parseTwitchLogin,
  subscribeStreamOffline,
  isTwitchConfigured,
} from "@/lib/twitch";
import { getYouTubeLiveByUrl, isYouTubeConfigured } from "@/lib/youtube";

export interface PlatformEnrichment {
  live_verified: boolean;
  platform_title: string | null;
  platform_game: string | null;
  platform_viewer_count: number | null;
  platform_thumbnail_url: string | null;
  platform_user_id: string | null;
  /** Soft warning when configured APIs say channel is not live */
  warning?: string;
}

export async function enrichLiveSession(
  platform: StreamPlatform,
  streamUrl: string
): Promise<PlatformEnrichment> {
  const empty: PlatformEnrichment = {
    live_verified: false,
    platform_title: null,
    platform_game: null,
    platform_viewer_count: null,
    platform_thumbnail_url: null,
    platform_user_id: null,
  };

  try {
    if (platform === "twitch" && isTwitchConfigured()) {
      const login = parseTwitchLogin(streamUrl);
      if (!login) return empty;
      const live = await getTwitchLiveByLogin(login);
      if (!live) return empty;

      if (live.isLive) {
        void subscribeStreamOffline(live.userId);
        return {
          live_verified: true,
          platform_title: live.title || null,
          platform_game: live.gameName || null,
          platform_viewer_count: live.viewerCount,
          platform_thumbnail_url: live.thumbnailUrl || null,
          platform_user_id: live.userId,
        };
      }

      return {
        ...empty,
        platform_user_id: live.userId,
        warning:
          "Twitch does not show this channel as live right now. You can still post the link.",
      };
    }

    if (platform === "youtube" && isYouTubeConfigured()) {
      const live = await getYouTubeLiveByUrl(streamUrl);
      if (!live) return empty;

      if (live.isLive) {
        return {
          live_verified: true,
          platform_title: live.title || null,
          platform_game: null,
          platform_viewer_count: live.viewerCount,
          platform_thumbnail_url: live.thumbnailUrl || null,
          platform_user_id: live.channelId || null,
        };
      }

      return {
        ...empty,
        platform_user_id: live.channelId || null,
        platform_title: live.title || null,
        warning:
          "YouTube does not show this URL as a live broadcast right now. You can still post the link.",
      };
    }
  } catch (error) {
    console.warn("Platform enrichment failed:", error);
  }

  return empty;
}
