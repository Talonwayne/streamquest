import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LiveMapClient } from "@/components/live-map-client";
import type { MapMarker, StreamPlatform } from "@/types/database";

export const metadata: Metadata = {
  title: "Live map",
  description: "See where in the world people are streaming on Streamquest.",
};

export const dynamic = "force-dynamic";

async function fetchMapMarkers(): Promise<{
  markers: MapMarker[];
  liveCount: number;
  profileCount: number;
}> {
  const supabase = await createClient();

  const { data: liveSessions } = await supabase
    .from("live_sessions")
    .select(
      `
      id,
      request_id,
      streamer_id,
      stream_url,
      platform,
      latitude,
      longitude,
      location_label,
      requests ( title ),
      profiles!live_sessions_streamer_id_fkey ( display_name )
    `
    )
    .is("ended_at", null)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const liveStreamerIds = new Set<string>();
  const liveMarkers: MapMarker[] = [];

  for (const session of liveSessions ?? []) {
    if (session.latitude == null || session.longitude == null) continue;
    liveStreamerIds.add(session.streamer_id);

    const request = session.requests as { title: string } | { title: string }[] | null;
    const profile = session.profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;

    liveMarkers.push({
      id: `live-${session.id}`,
      kind: "live",
      latitude: session.latitude,
      longitude: session.longitude,
      location_label: session.location_label,
      streamer_id: session.streamer_id,
      display_name: Array.isArray(profile)
        ? (profile[0]?.display_name ?? null)
        : (profile?.display_name ?? null),
      request_id: session.request_id,
      request_title: Array.isArray(request) ? request[0]?.title : request?.title,
      stream_url: session.stream_url,
      platform: session.platform as StreamPlatform,
    });
  }

  const { data: profiles } = await supabase
    .from("streamer_profiles")
    .select(
      `
      user_id,
      latitude,
      longitude,
      location_label,
      profiles ( display_name )
    `
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  const profileMarkers: MapMarker[] = [];

  for (const sp of profiles ?? []) {
    if (sp.latitude == null || sp.longitude == null) continue;
    if (liveStreamerIds.has(sp.user_id)) continue;

    const profile = sp.profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;

    profileMarkers.push({
      id: `profile-${sp.user_id}`,
      kind: "profile",
      latitude: sp.latitude,
      longitude: sp.longitude,
      location_label: sp.location_label,
      streamer_id: sp.user_id,
      display_name: Array.isArray(profile)
        ? (profile[0]?.display_name ?? null)
        : (profile?.display_name ?? null),
    });
  }

  return {
    markers: [...liveMarkers, ...profileMarkers],
    liveCount: liveMarkers.length,
    profileCount: profileMarkers.length,
  };
}

export default async function MapPage() {
  const { markers, liveCount, profileCount } = await fetchMapMarkers();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-800 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Live map</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Where streamers are sharing from — live sessions first, home bases
              when idle.
            </p>
          </div>
          <div className="flex gap-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
              Live ({liveCount})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" />
              Home base ({profileCount})
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full flex-1 md:mx-auto md:max-w-6xl md:px-4 md:py-4">
        <div className="h-[calc(100vh-14rem)] min-h-[60vh] w-full overflow-hidden border-y border-zinc-800 md:rounded-xl md:border">
          <LiveMapClient markers={markers} />
        </div>
      </div>
    </div>
  );
}
