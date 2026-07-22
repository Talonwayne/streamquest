import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MapMarker, StreamPlatform } from "@/types/database";

export async function GET() {
  const supabase = await createClient();

  const { data: liveSessions, error: liveError } = await supabase
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

  if (liveError) {
    return NextResponse.json({ error: liveError.message }, { status: 500 });
  }

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

    const requestTitle = Array.isArray(request)
      ? request[0]?.title
      : request?.title;
    const displayName = Array.isArray(profile)
      ? profile[0]?.display_name
      : profile?.display_name;

    liveMarkers.push({
      id: `live-${session.id}`,
      kind: "live",
      latitude: session.latitude,
      longitude: session.longitude,
      location_label: session.location_label,
      streamer_id: session.streamer_id,
      display_name: displayName ?? null,
      request_id: session.request_id,
      request_title: requestTitle,
      stream_url: session.stream_url,
      platform: session.platform as StreamPlatform,
    });
  }

  const { data: profiles, error: profileError } = await supabase
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

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileMarkers: MapMarker[] = [];

  for (const sp of profiles ?? []) {
    if (sp.latitude == null || sp.longitude == null) continue;
    // Prefer live marker when the streamer is already on the map as live
    if (liveStreamerIds.has(sp.user_id)) continue;

    const profile = sp.profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    const displayName = Array.isArray(profile)
      ? profile[0]?.display_name
      : profile?.display_name;

    profileMarkers.push({
      id: `profile-${sp.user_id}`,
      kind: "profile",
      latitude: sp.latitude,
      longitude: sp.longitude,
      location_label: sp.location_label,
      streamer_id: sp.user_id,
      display_name: displayName ?? null,
    });
  }

  return NextResponse.json({
    markers: [...liveMarkers, ...profileMarkers],
    liveCount: liveMarkers.length,
    profileCount: profileMarkers.length,
  });
}
