import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { MapMarker, StreamPlatform } from "@/types/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const liveOnly = searchParams.get("liveOnly") === "1";
    const includeRequests = searchParams.get("requests") !== "0";

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
      requests ( title, category ),
      profiles!live_sessions_streamer_id_fkey ( display_name )
    `
      )
      .is("ended_at", null)
      .not("latitude", "is", null)
      .not("longitude", "is", null);

    if (liveError) {
      return NextResponse.json({
        markers: [],
        liveCount: 0,
        profileCount: 0,
        requestCount: 0,
        error: liveError.message,
      });
    }

    const liveStreamerIds = new Set<string>();
    const liveMarkers: MapMarker[] = [];

    for (const session of liveSessions ?? []) {
      if (session.latitude == null || session.longitude == null) continue;

      const requestRel = session.requests as
        | { title: string; category: string }
        | { title: string; category: string }[]
        | null;
      const requestObj = Array.isArray(requestRel) ? requestRel[0] : requestRel;

      if (category && requestObj?.category !== category) continue;

      liveStreamerIds.add(session.streamer_id);

      const profile = session.profiles as
        | { display_name: string | null }
        | { display_name: string | null }[]
        | null;
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
        request_title: requestObj?.title,
        stream_url: session.stream_url,
        platform: session.platform as StreamPlatform,
        category: requestObj?.category,
      });
    }

    const profileMarkers: MapMarker[] = [];
    const requestMarkers: MapMarker[] = [];

    if (!liveOnly) {
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

      if (!profileError) {
        for (const sp of profiles ?? []) {
          if (sp.latitude == null || sp.longitude == null) continue;
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
      }

      if (includeRequests) {
        let reqQuery = supabase
          .from("requests")
          .select("id, title, category, latitude, longitude, location_label, status")
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .in("status", ["open", "live_now"]);

        if (category) {
          reqQuery = reqQuery.eq("category", category);
        }

        const { data: requestRows } = await reqQuery;
        for (const req of requestRows ?? []) {
          if (req.latitude == null || req.longitude == null) continue;
          requestMarkers.push({
            id: `request-${req.id}`,
            kind: "request",
            latitude: req.latitude,
            longitude: req.longitude,
            location_label: req.location_label,
            display_name: req.title,
            request_id: req.id,
            request_title: req.title,
            category: req.category,
          });
        }
      }
    }

    return NextResponse.json({
      markers: [...liveMarkers, ...profileMarkers, ...requestMarkers],
      liveCount: liveMarkers.length,
      profileCount: profileMarkers.length,
      requestCount: requestMarkers.length,
    });
  } catch (error) {
    return NextResponse.json({
      markers: [],
      liveCount: 0,
      profileCount: 0,
      requestCount: 0,
      error: error instanceof Error ? error.message : "Map data unavailable",
    });
  }
}
