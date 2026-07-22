import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import { parseLocationInput } from "@/lib/location";

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName, role, bio, platformLinks } = body as {
    displayName: string;
    role: UserRole;
    bio?: string;
    platformLinks?: { twitch?: string; youtube?: string; kick?: string };
    latitude?: number | null;
    longitude?: number | null;
    locationLabel?: string | null;
    clearLocation?: boolean;
  };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: displayName, role })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (role === "streamer" || role === "both") {
    const locationResult = parseLocationInput({
      latitude: body.latitude,
      longitude: body.longitude,
      locationLabel: body.locationLabel,
      clearLocation: body.clearLocation,
    });

    if (!locationResult.ok) {
      return NextResponse.json({ error: locationResult.error }, { status: 400 });
    }

    const upsertPayload: Record<string, unknown> = {
      user_id: user.id,
      bio: bio ?? null,
      platform_links: platformLinks ?? {},
    };

    if (locationResult.location) {
      upsertPayload.latitude = locationResult.location.latitude;
      upsertPayload.longitude = locationResult.location.longitude;
      upsertPayload.location_label = locationResult.location.location_label;
      upsertPayload.location_updated_at =
        locationResult.location.location_updated_at;
    }

    const { error: streamerError } = await supabase
      .from("streamer_profiles")
      .upsert(upsertPayload);

    if (streamerError) {
      return NextResponse.json({ error: streamerError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
